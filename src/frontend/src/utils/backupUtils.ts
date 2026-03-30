import JSZip from "jszip";
import { ExternalBlob, type MangaEntry } from "../backend";

export const MAX_CHUNK_BYTES = 40 * 1024 * 1024; // 40 MB

export interface SerializedEntry {
  stableId: string;
  title: string;
  availableChapters: number;
  chaptersRead: number;
  completed: boolean;
  bookmarks: string[];
  synopsis: string;
  genres: string[];
  notes: string;
  coverImages: string[]; // filenames (no path prefix)
  rating: number;
  alternateTitles: string[];
  isBookmarked: boolean;
}

export interface BackupManifest {
  backupId: string;
  version: number;
  exportDate: string;
  totalEntries: number;
  chunkIndex: number;
  totalChunks: number;
  entries: SerializedEntry[];
}

// Legacy format for backward-compat import
export interface BackupChunk extends BackupManifest {
  images?: Record<string, string>;
}

export function makeBackupId(): string {
  const now = new Date();
  const pad = (n: number, d = 2) => String(n).padStart(d, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

export function serializeEntry(entry: MangaEntry): SerializedEntry {
  return {
    stableId: entry.stableId.toString(),
    title: entry.title,
    availableChapters: entry.availableChapters,
    chaptersRead: entry.chaptersRead,
    completed: entry.completed,
    bookmarks: entry.bookmarks.map((b) => b.toString()),
    synopsis: entry.synopsis,
    genres: entry.genres,
    notes: entry.notes,
    coverImages: entry.coverImages.map(
      (_, idx) => `manga-${entry.stableId}-cover-${idx}.jpg`,
    ),
    rating: entry.rating,
    alternateTitles: entry.alternateTitles,
    isBookmarked: entry.isBookmarked,
  };
}

export function base64ToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function fetchImageAsBase64(
  blob: ExternalBlob,
): Promise<string | null> {
  try {
    const url = blob.getDirectURL();
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    for (const b of uint8) {
      binary += String.fromCharCode(b);
    }
    const base64 = btoa(binary);
    const mime = response.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Build ZIP blobs: one ZIP per chunk, each containing:
 *   - manifest.json  (metadata + entry list, no images)
 *   - covers/<filename>.jpg  (raw image files)
 */
export async function buildZipChunks(
  backupId: string,
  entries: SerializedEntry[],
  imageMap: Record<string, string>, // filename -> data URL
  onProgress?: (msg: string) => void,
): Promise<{ filename: string; blob: Blob }[]> {
  const exportDate = new Date().toISOString();
  const totalEntries = entries.length;

  // Convert images to raw byte arrays once
  const imageBytes: Record<string, Uint8Array> = {};
  let imgCount = 0;
  for (const [filename, dataUrl] of Object.entries(imageMap)) {
    imageBytes[filename] = base64ToBytes(dataUrl);
    imgCount++;
    if (onProgress)
      onProgress(
        `Preparing image ${imgCount} of ${Object.keys(imageMap).length}...`,
      );
  }

  // Group images into chunks of max 40 MB
  const imageFilenames = Object.keys(imageBytes);
  const chunkGroups: string[][] = [[]];
  let currentSize = 0;

  // Reserve ~2MB for the JSON manifest overhead
  const reservedForManifest = 2 * 1024 * 1024;
  const imageLimit = MAX_CHUNK_BYTES - reservedForManifest;

  for (const filename of imageFilenames) {
    const size = imageBytes[filename].length;
    if (
      currentSize + size > imageLimit &&
      chunkGroups[chunkGroups.length - 1].length > 0
    ) {
      chunkGroups.push([]);
      currentSize = 0;
    }
    chunkGroups[chunkGroups.length - 1].push(filename);
    currentSize += size;
  }

  if (chunkGroups[0].length === 0 && imageFilenames.length === 0) {
    // No images — single chunk
    chunkGroups[0] = [];
  }

  const totalChunks = chunkGroups.length;
  const results: { filename: string; blob: Blob }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    if (onProgress) onProgress(`Building ZIP ${i + 1} of ${totalChunks}...`);
    const zip = new JSZip();

    // Add manifest JSON (metadata only, no images embedded)
    const manifest: BackupManifest = {
      backupId,
      version: 2,
      exportDate,
      totalEntries,
      chunkIndex: i + 1,
      totalChunks,
      entries,
    };
    const manifestJson = JSON.stringify(
      manifest,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
    zip.file("manifest.json", manifestJson);

    // Add images to covers/ folder
    const coversFolder = zip.folder("covers");
    if (coversFolder) {
      for (const filename of chunkGroups[i]) {
        coversFolder.file(filename, imageBytes[filename]);
      }
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const chunkFilename = buildZipFilename(backupId, i + 1, totalChunks);
    results.push({ filename: chunkFilename, blob });
  }

  return results;
}

export function buildZipFilename(
  backupId: string,
  chunkIndex: number,
  totalChunks: number,
): string {
  if (totalChunks === 1) return `manga-backup-${backupId}.zip`;
  const ci = String(chunkIndex).padStart(3, "0");
  const ct = String(totalChunks).padStart(3, "0");
  return `manga-backup-${backupId}-part${ci}of${ct}.zip`;
}

/**
 * Parse a ZIP backup file. Returns the manifest and an image map.
 */
export async function parseZipBackup(
  file: File,
): Promise<{ manifest: BackupManifest; imageMap: Record<string, string> }> {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new Error("No manifest.json found in ZIP.");

  const manifestText = await manifestFile.async("text");
  const manifest = JSON.parse(manifestText) as BackupManifest;
  if (!manifest.entries || !Array.isArray(manifest.entries)) {
    throw new Error("Invalid manifest.json format.");
  }

  // Extract images from covers/ folder
  const imageMap: Record<string, string> = {};
  const coversFolder = zip.folder("covers");
  if (coversFolder) {
    const promises: Promise<void>[] = [];
    coversFolder.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async("base64").then((b64) => {
            // Determine mime type from extension
            const ext = relativePath.split(".").pop()?.toLowerCase() || "jpg";
            const mime =
              ext === "png"
                ? "image/png"
                : ext === "webp"
                  ? "image/webp"
                  : "image/jpeg";
            imageMap[relativePath] = `data:${mime};base64,${b64}`;
          }),
        );
      }
    });
    await Promise.all(promises);
  }

  return { manifest, imageMap };
}

// Legacy JSON format support
export function parseLegacyJsonBackup(text: string): BackupChunk {
  const data = JSON.parse(text) as BackupChunk;
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error("Invalid backup file format.");
  }
  return data;
}

export function reconstructEntry(
  s: SerializedEntry,
  imageMap: Record<string, string>,
): MangaEntry {
  const coverImages: ExternalBlob[] = s.coverImages.map((filename) => {
    const data = imageMap[filename];
    if (data) {
      return ExternalBlob.fromBytes(base64ToBytes(data));
    }
    return ExternalBlob.fromURL("");
  });

  return {
    stableId: BigInt(s.stableId),
    title: s.title,
    availableChapters: s.availableChapters,
    chaptersRead: s.chaptersRead,
    completed: s.completed,
    bookmarks: s.bookmarks.map((b) => BigInt(b)),
    synopsis: s.synopsis,
    genres: s.genres,
    notes: s.notes,
    coverImages,
    rating: s.rating,
    alternateTitles: s.alternateTitles,
    isBookmarked: s.isBookmarked,
  };
}
