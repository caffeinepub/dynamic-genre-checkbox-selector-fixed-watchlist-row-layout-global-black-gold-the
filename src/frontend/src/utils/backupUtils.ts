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
  coverImages: string[]; // filenames
  rating: number;
  alternateTitles: string[];
  isBookmarked: boolean;
}

export interface BackupChunk {
  backupId: string;
  version: number;
  exportDate: string;
  totalEntries: number;
  chunkIndex: number;
  totalChunks: number;
  entries: SerializedEntry[];
  images: Record<string, string>;
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

export function buildChunks(
  backupId: string,
  entries: SerializedEntry[],
  imageMap: Record<string, string>,
): BackupChunk[] {
  const exportDate = new Date().toISOString();
  const totalEntries = entries.length;

  const imageEntries = Object.entries(imageMap);
  const chunks: BackupChunk[] = [];

  // Compute base overhead per chunk (entries + metadata, no images)
  const baseObj = {
    backupId,
    version: 1,
    exportDate,
    totalEntries,
    chunkIndex: 1,
    totalChunks: 1,
    entries,
    images: {} as Record<string, string>,
  };
  const baseJson = JSON.stringify(baseObj, (_, v) =>
    typeof v === "bigint" ? v.toString() : v,
  );
  const baseSize = new TextEncoder().encode(baseJson).length;

  // Group images into chunks
  const imageChunks: Array<Record<string, string>> = [];
  let currentChunkImages: Record<string, string> = {};
  let currentChunkSize = baseSize;

  for (const [filename, dataUrl] of imageEntries) {
    const entrySize =
      new TextEncoder().encode(JSON.stringify({ [filename]: dataUrl })).length +
      2;
    if (
      currentChunkSize + entrySize > MAX_CHUNK_BYTES &&
      Object.keys(currentChunkImages).length > 0
    ) {
      imageChunks.push(currentChunkImages);
      currentChunkImages = {};
      currentChunkSize = baseSize;
    }
    currentChunkImages[filename] = dataUrl;
    currentChunkSize += entrySize;
  }
  imageChunks.push(currentChunkImages);

  const totalChunks = imageChunks.length;
  for (let i = 0; i < imageChunks.length; i++) {
    chunks.push({
      backupId,
      version: 1,
      exportDate,
      totalEntries,
      chunkIndex: i + 1,
      totalChunks,
      entries,
      images: imageChunks[i],
    });
  }

  return chunks;
}

export function chunkFilename(
  backupId: string,
  chunkIndex: number,
  totalChunks: number,
): string {
  if (totalChunks === 1) return `manga-backup-${backupId}.json`;
  const ci = String(chunkIndex).padStart(3, "0");
  const ct = String(totalChunks).padStart(3, "0");
  return `manga-backup-${backupId}-part${ci}of${ct}.json`;
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
