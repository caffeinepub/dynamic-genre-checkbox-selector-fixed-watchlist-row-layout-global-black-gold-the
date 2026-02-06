/**
 * Formats a chapter number for display.
 * Shows integers without decimal point (e.g., "12")
 * Shows decimals when present (e.g., "12.5")
 */
export function formatChapterNumber(value: number): string {
  // Check if the value is a whole number
  if (Number.isInteger(value)) {
    return value.toString();
  }
  // Return decimal representation
  return value.toString();
}
