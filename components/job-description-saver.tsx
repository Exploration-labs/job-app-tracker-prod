'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { JobDescription, JobDescriptionPreview, DuplicateGroup, ResumeManifestEntry } from '@/lib/types';
import { parseJobDescription } from '@/lib/job-parser';
import { RecentCaptures } from '@/components/recent-captures';
import { ResumeUpload } from '@/components/resume-upload';
import { JobStorageDialog, JobStorageOptions } from '@/components/job-storage-dialog';
import { ExternalLink, AlertTriangle, GitMerge, HardDrive } from 'lucide-react';
import Link from 'next/link';

interface JobDescriptionSaverProps {}

export function JobDescriptionSaver({}: JobDescriptionSaverProps) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<JobDescriptionPreview | null>(null);
  const [editableCompany, setEditableCompany] = useState('');
  const [editableRole, setEditableRole] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [refreshKey, setRefreshKey] = useState(0);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [savedJobUuid, setSavedJobUuid] = useState<string | null>(null);
  const [uploadedResumes, setUploadedResumes] = useState<ResumeManifestEntry[]>([]);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [jobToSave, setJobToSave] = useState<JobDescription | null>(null);
  const { toast } = useToast();

  const handleAnalyzeText = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some job description text to analyze.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseJobDescription(text);
    setPreview(parsed);
    setEditableCompany(parsed.company || '');
    setEditableRole(parsed.role || '');
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to fetch.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Error fetching URL",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setText(data.text);
      const parsed = parseJobDescription(data.text);
      setPreview(parsed);
      setEditableCompany(parsed.company || '');
      setEditableRole(parsed.role || '');
      
      toast({
        title: "Success",
        description: "Job description fetched and analyzed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "No job description text to save.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has storage configured and might want to use it
    const storageConfig = localStorage.getItem('jobStorageConfig');
    let shouldShowStorageDialog = false;

    if (storageConfig) {
      try {
        const config = JSON.parse(storageConfig);
        shouldShowStorageDialog = config.rootPath && !config.autoSaveEnabled;
      } catch (error) {
        console.warn('Failed to parse storage config:', error);
      }
    }

    // Create job object for storage dialog
    const jobToSave: JobDescription = {
      uuid: '', // Will be set by API
      company: editableCompany.trim() || null,
      role: editableRole.trim() || null,
      jd_text: text,
      source_url: url.trim() || null,
      fetched_at_iso: new Date().toISOString(),
      content_hash: '',
      capture_method: url ? 'url_fetch' : 'manual',
      captured_at: new Date().toISOString(),
    };

    if (shouldShowStorageDialog) {
      setJobToSave(jobToSave);
      setShowStorageDialog(true);
    } else {
      // Save directly without storage dialog
      await performSave(jobToSave, null);
    }
  };

  const performSave = async (job: JobDescription, storageOptions: JobStorageOptions | null) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/save-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: job.jd_text,
          url: job.source_url,
          company: job.company,
          role: job.role,
          storageOptions: storageOptions ? {
            saveToDisk: storageOptions.saveToDisk,
            rootPath: storageOptions.saveToDisk ? 
              JSON.parse(localStorage.getItem('jobStorageConfig') || '{}').rootPath : null,
            attachmentMode: storageOptions.attachmentMode,
            generateSnapshot: storageOptions.generateSnapshot,
          } : null,
          attachments: [], // TODO: Add actual attachments if available
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Set saved job UUID for resume upload
      setSavedJobUuid(data.uuid);
      
      if (data.hasDuplicates && data.duplicateGroups.length > 0) {
        setDuplicateGroups(data.duplicateGroups);
        toast({
          title: "Job Description Saved - Duplicates Found!",
          description: `Saved successfully, but found ${data.duplicateGroups.length} potential duplicate group(s). Check the deduplication manager.`,
          variant: "destructive",
        });
      } else {
        let description = `Files saved: ${data.jsonPath} and ${data.txtPath}.`;
        if (data.storage) {
          description += ` Also saved to structured folder: ${data.storage.folderPath}`;
        }
        description += ` You can now upload a resume for this job.`;
        
        toast({
          title: "Job Description Saved!",
          description,
        });
      }

      setText('');
      setUrl('');
      setPreview(null);
      // Keep editableCompany and editableRole for resume upload
      
      // Trigger refresh of recent captures
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save job description",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUploadComplete = (resume: ResumeManifestEntry) => {
    setUploadedResumes(prev => [...prev, resume]);
    toast({
      title: "Resume Upload Complete!",
      description: `Resume linked to job: ${resume.filename_components.company} - ${resume.filename_components.role}`,
    });
  };

  const resetForm = () => {
    setSavedJobUuid(null);
    setEditableCompany('');
    setEditableRole('');
    setUploadedResumes([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Job Description Saver
            <div className="flex gap-2">
              <Link href="/deduplication">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <GitMerge className="h-4 w-4" />
                  Deduplication
                </Button>
              </Link>
              <Link href="/browser-helper">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Browser Helper
                </Button>
              </Link>
            </div>
          </CardTitle>
          <CardDescription>
            Save job descriptions by pasting text, providing a URL, or using the browser helper for one-click capturing from any job site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2 border-b">
            <Button
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('text')}
              className="rounded-b-none"
            >
              Paste Text
            </Button>
            <Button
              variant={activeTab === 'url' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('url')}
              className="rounded-b-none"
            >
              Fetch URL
            </Button>
          </div>

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Description Text
                </label>
                <Textarea
                  placeholder="Paste the job description text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <Button onClick={handleAnalyzeText} disabled={isLoading}>
                Analyze Text
              </Button>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Posting URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleFetchUrl} disabled={isLoading}>
                {isLoading ? 'Fetching...' : 'Fetch Job Description'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Edit Metadata</CardTitle>
            <CardDescription>
              Review the extracted information and edit if needed before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company
                </label>
                <Input
                  value={editableCompany}
                  onChange={(e) => setEditableCompany(e.target.value)}
                  placeholder="Company name (detected or manual entry)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Role
                </label>
                <Input
                  value={editableRole}
                  onChange={(e) => setEditableRole(e.target.value)}
                  placeholder="Job role/title (detected or manual entry)"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Preview (first 300 characters)
              </label>
              <div className="p-3 border rounded-md bg-muted text-sm">
                {preview.preview}...
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Job Description'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (text.trim()) {
                    const jobToSave: JobDescription = {
                      uuid: '',
                      company: editableCompany.trim() || null,
                      role: editableRole.trim() || null,
                      jd_text: text,
                      source_url: url.trim() || null,
                      fetched_at_iso: new Date().toISOString(),
                      content_hash: '',
                      capture_method: url ? 'url_fetch' : 'manual',
                      captured_at: new Date().toISOString(),
                    };
                    setJobToSave(jobToSave);
                    setShowStorageDialog(true);
                  }
                }}
                disabled={isLoading || !text.trim()}
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Save to Disk...
              </Button>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {duplicateGroups.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Potential Duplicates Detected
            </CardTitle>
            <CardDescription className="text-orange-700">
              The job description you just saved may be similar to existing ones. Consider reviewing and merging duplicates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {duplicateGroups.map((group, index) => (
                <div key={group.id} className="text-sm">
                  <div className="font-medium">
                    Group {index + 1}: {group.duplicates.length} similar job(s) found
                  </div>
                  <div className="text-orange-600">
                    Max similarity: {(group.max_similarity * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Link href="/deduplication">
                <Button size="sm">
                  <GitMerge className="h-4 w-4 mr-2" />
                  Review Duplicates
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDuplicateGroups([])}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resume Upload Section */}
      {savedJobUuid && editableCompany && editableRole && (
        <div className="space-y-4">
          <ResumeUpload
            jobUuid={savedJobUuid}
            company={editableCompany}
            role={editableRole}
            onUploadComplete={handleResumeUploadComplete}
          />
          
          {/* Show uploaded resumes */}
          {uploadedResumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Resumes</CardTitle>
                <CardDescription>Resumes uploaded for this job</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedResumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">
                          {resume.base_filename}{resume.file_extension}
                        </p>
                        <p className="text-sm text-gray-500">
                          Versions: {resume.versions.length} • 
                          Last Updated: {new Date(resume.last_updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetForm}
                  className="mt-4"
                >
                  Start New Job Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Job Storage Dialog */}
      {jobToSave && (
        <JobStorageDialog
          isOpen={showStorageDialog}
          onClose={() => {
            setShowStorageDialog(false);
            setJobToSave(null);
          }}
          job={jobToSave}
          attachments={[]} // TODO: Add actual attachments
          onSave={async (options) => {
            await performSave(jobToSave, options);
            setShowStorageDialog(false);
            setJobToSave(null);
          }}
        />
      )}
      
      <RecentCaptures refreshTrigger={refreshKey} />
    </div>
  );
}