'use client';

import { DragDropBulkImport } from './drag-drop-bulk-import';

export function BulkImport() {
  // Use the new drag-and-drop component instead of the old folder-based approach
  // This provides a better user experience that works in web browsers without
  // requiring local file system access
  return <DragDropBulkImport />;
}