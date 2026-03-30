# Manga Watchlist — Export/Import Backup

## Current State
The app has a full manga watchlist with entries stored in the IC backend. Covers are stored as ExternalBlob objects accessible via `getDirectURL()`. There is no backup/restore functionality.

## Requested Changes (Diff)

### Add
- `ExportBackupDialog` component: modal that handles the full export flow
- `ImportBackupDialog` component: modal that handles the full import flow
- `useExportBackup` hook: orchestrates data fetching, image downloading, chunking, and file download
- `useImportBackup` hook: orchestrates reading backup JSON, matching images from folder, and restoring entries
- Export/Import buttons in FloatingControlsPanel (accessible from the controls bar)

### Modify
- `FloatingControlsPanel`: add Export and Import buttons alongside the existing Add Manga button

### Remove
- Nothing

## Implementation Plan

### Export Flow
1. Fetch all manga entries via `actor.getAllEntries()`
2. For each entry, attempt to fetch cover image bytes via `fetch(getDirectURL())` and convert to base64 data URL
   - Images get filenames: `manga-{stableId}-cover-{index}.jpg`
3. Serialize all entries as plain JSON objects (replace ExternalBlob objects with filename references, preserve all other fields including bigint converted to string)
4. Build export payload:
   ```json
   {
     "backupId": "20260330-143022",
     "version": 1,
     "exportDate": "...",
     "totalEntries": 42,
     "entries": [...],
     "images": { "manga-5-cover-0.jpg": "data:image/jpeg;base64,..." }
   }
   ```
5. Chunk the JSON payload string at ≤40MB boundaries (split `images` across chunks, entries always go with chunk 1+)
6. Download each chunk as a separate file triggered via `<a download>` with a delay between downloads
   - Naming: `manga-backup-{backupId}-part001of003.json`, `manga-backup-{backupId}-part002of003.json`, etc.
   - If only one chunk: `manga-backup-{backupId}.json`
7. Show progress dialog with chunk-by-chunk status

### Import Flow
1. User picks a JSON backup file (`<input type="file" accept=".json">`)
2. User picks an optional images folder (`<input type="file" webkitdirectory multiple>`) — folder where image files are stored
3. Parse JSON file, validate it has the backup schema
4. Build an image map:
   - First from `images` key in the JSON (base64 data URLs)
   - Then supplement/override with files from the selected folder (matched by filename)
5. For each entry in the backup:
   - Reconstruct `MangaEntry` with `ExternalBlob.fromURL()` for images (using base64 data URL via `ExternalBlob.fromBytes()` if bytes available, else fall back to original URL string)
   - Call `actor.addEntry(entry)` for each
6. Show progress dialog: X/Y entries restored, skip/overwrite options
7. On completion, invalidate react-query cache to refresh the list

### UI Placement
- Add two small icon buttons in FloatingControlsPanel header row: Upload icon (Import) and Download icon (Export)
- Both open their respective dialogs
- Dialogs styled in black/gold theme matching the rest of the app

### Notes
- bigint stableId must be serialized as string in JSON (JSON.stringify doesn't handle bigint natively)
- Image fetch errors are non-fatal: skip image with a warning, still include the entry
- Show per-chunk download progress ("Downloading chunk 1 of 3...")
- Import should warn if a stableId already exists and offer skip/overwrite choice
- Use `ExternalBlob.fromBytes()` to reconstruct images from base64 during import
