export interface JobDescription {
  uuid: string;
  company: string | null;
  role: string | null;
  jd_text: string;
  source_url: string | null;
  fetched_at_iso: string;
  content_hash: string;
  source_html_path?: string;
  capture_method?: 'manual' | 'url_fetch' | 'browser_helper';
  captured_at?: string;
  // Application tracking
  application_status?: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn' | 'interested';
  next_reminder?: string; // ISO date string for next reminder
  applied_date?: string; // ISO date string for when application was submitted
  last_updated?: string; // ISO date string for last status update
  // Follow-up reminder settings
  auto_followup_enabled?: boolean; // Whether to automatically schedule follow-up reminders
  followup_reminder?: string; // ISO date string for follow-up reminder (7 days after applied_date)
  followup_reminder_id?: string; // ID for the follow-up reminder notification
  // Resume mapping
  resume_id?: string; // Reference to the resume used for this application
  resume_filename?: string; // Original filename of the resume used
  resume_path?: string; // Path to the resume file (if managed)
  // Resume text management
  resumeTextExtracted?: string; // Text extracted from resume file
  resumeTextManual?: string; // Manually input resume text
  resumeTextPath?: string; // Absolute path to the saved resume text file
  resumeTextSource?: 'extracted' | 'manual' | 'none'; // Current text source
  extractionMethod?: 'pdf-text' | 'docx' | 'plain' | 'failed'; // How text was extracted
  extractionStatus?: 'ok' | 'failed'; // Extraction success status
  extractionError?: string; // Error message if extraction failed
  // Deduplication metadata
  merged_from?: string[]; // Array of source UUIDs that were merged into this record
  merge_history?: MergeHistoryEntry[];
  archived_at?: string;
  is_archived?: boolean;
  // Import metadata
  imported_from?: string; // Original file path when imported
  imported_at?: string; // Import timestamp
}

export interface MergeHistoryEntry {
  timestamp: string;
  action: 'merge' | 'delete' | 'archive';
  source_uuids: string[];
  user_action?: string;
  original_file_paths?: string[];
}

export interface SaveJobDescriptionRequest {
  text?: string;
  url?: string;
}

export interface JobDescriptionPreview {
  company: string | null;
  role: string | null;
  preview: string;
}

export interface DuplicateMatch {
  uuid: string;
  similarity_score: number;
  job_description: JobDescription;
}

export interface DuplicateGroup {
  id: string;
  primary_job: JobDescription;
  duplicates: DuplicateMatch[];
  max_similarity: number;
  created_at: string;
}

export interface DeduplicationResult {
  duplicate_groups: DuplicateGroup[];
  total_duplicates_found: number;
  threshold_used: number;
  processed_at: string;
}

export interface DeduplicationConfig {
  similarity_threshold: number;
  auto_merge_threshold: number;
  schedule_enabled: boolean;
  schedule_interval: number; // minutes
  comparison_fields: ('jd_text' | 'company' | 'role')[];
}

export interface ResumeVersionEntry {
  version_id: string;
  version_suffix: string; // e.g., "", "_v1", "_v2"
  managed_path: string;
  file_checksum: string;
  upload_timestamp: string;
  original_path: string;
  original_filename: string;
  is_active: boolean;
}

export interface ResumeManifestEntry {
  id: string;
  job_uuid: string;
  base_filename: string; // e.g., "Company_Role_YYYY-MM-DD"
  filename_components: {
    company: string;
    role: string;
    date: string;
  };
  file_extension: string;
  keep_original: boolean;
  versions: ResumeVersionEntry[];
  created_at: string;
  last_updated: string;
}

export interface ResumeConfig {
  managed_folder_path: string;
  keep_original_default: boolean;
  supported_file_types: string[];
  naming_format: 'Company_Role_Date' | 'Company_Role_Date_Time';
}

export interface BulkImportPreview {
  id: string;
  original_filename: string;
  original_path: string;
  proposed_filename: string;
  job_mapping?: JobDescription;
  manual_company?: string;
  manual_role?: string;
  status: 'pending' | 'mapped' | 'error';
  error_message?: string;
}

export interface BulkImportOperation {
  id: string;
  source_folder: string;
  preview_items: BulkImportPreview[];
  created_at: string;
  status: 'preview' | 'completed' | 'cancelled';
}

export interface OperationLogEntry {
  id: string;
  operation_type: 'upload' | 'bulk_import' | 'delete' | 'restore' | 'rename' | 'rollback';
  timestamp: string;
  details: {
    affected_files?: string[];
    manifest_entries?: string[];
    source_paths?: string[];
    target_paths?: string[];
    job_uuid?: string;
    user_action?: string;
  };
  can_undo: boolean;
  session_id: string;
}