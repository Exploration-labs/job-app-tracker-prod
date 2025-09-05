'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { ResumeManifestEntry, ResumeConfig } from '@/lib/types';
import { Upload, File, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface ResumeUploadProps {
  jobUuid: string;
  company: string;
  role: string;
  onUploadComplete?: (resume: ResumeManifestEntry) => void;
}

export function ResumeUpload({ jobUuid, company, role, onUploadComplete }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [config, setConfig] = useState<ResumeConfig | null>(null);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/resume/config');
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
        setKeepOriginal(configData.keep_original_default);
      }
    } catch (error) {
      console.error('Failed to load resume config:', error);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!config) return 'Configuration not loaded';
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.supported_file_types.includes(fileExtension)) {
      return `Unsupported file type. Supported types: ${config.supported_file_types.join(', ')}`;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const uploadResume = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobUuid', jobUuid);
      formData.append('company', company);
      formData.append('role', role);
      formData.append('keepOriginal', keepOriginal.toString());

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const activeVersion = result.resume.versions?.find((v: any) => v.is_active);
      const versionSuffix = activeVersion?.version_suffix || '';
      const versionLabel = versionSuffix ? ` (${versionSuffix})` : '';
      const isNewVersion = result.resume.versions?.length > 1;
      
      toast({
        title: isNewVersion ? "New Resume Version Created!" : "Resume Uploaded Successfully!",
        description: `Resume${versionLabel} saved to managed folder: ${result.resume.base_filename}${versionSuffix}${activeVersion?.managed_path?.split('.').pop() ? '.' + activeVersion.managed_path.split('.').pop() : ''}`,
      });

      onUploadComplete?.(result.resume);

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    uploadResume(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Resume Upload
          </CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload a resume for {company} - {role}. File will be automatically copied to the managed folder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Keep Original Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="keep-original"
            checked={keepOriginal}
            onChange={(e) => setKeepOriginal(e.target.checked)}
            disabled={isUploading}
            className="h-4 w-4"
          />
          <label htmlFor="keep-original" className="text-sm font-medium">
            Keep original file
          </label>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={config.supported_file_types.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
          
          <div className="space-y-2">
            <File className="h-8 w-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Drop a resume file here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 underline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported: {config.supported_file_types.join(', ')} (max 10MB)
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            File will be named: {company.replace(/[^a-zA-Z0-9]/g, '_')}_{role.replace(/[^a-zA-Z0-9]/g, '_')}_{new Date().toISOString().split('T')[0]}
          </p>
          <p className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Managed folder: {config.managed_folder_path}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}