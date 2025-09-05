'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { ResumeManifestEntry } from '@/lib/types';

interface ResumeViewerProps {
  resume: ResumeManifestEntry;
  className?: string;
}

export function ResumeViewer({ resume, className }: ResumeViewerProps) {
  const [activeTab, setActiveTab] = useState('original');
  const [localResume, setLocalResume] = useState(resume);
  const activeVersion = localResume.versions?.find(v => v.is_active);

  // Sync with prop changes
  useEffect(() => {
    setLocalResume(resume);
  }, [resume]);

  // Poll for extraction updates if extraction is pending
  useEffect(() => {
    if (activeVersion?.extraction_status === 'pending') {
      const checkExtraction = async () => {
        try {
          const response = await fetch(`/api/resume/manifest?resumeId=${localResume.id}`);
          if (response.ok) {
            const updatedResume = await response.json();
            setLocalResume(updatedResume);
          }
        } catch (error) {
          console.warn('Failed to check extraction status:', error);
        }
      };

      const interval = setInterval(checkExtraction, 2000);
      return () => clearInterval(interval);
    }
  }, [localResume.id, activeVersion?.extraction_status]);
  
  if (!activeVersion) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>No active resume version found</p>
        </CardContent>
      </Card>
    );
  }

  const hasExtractedText = activeVersion.extracted_text && activeVersion.extraction_status === 'success';
  const extractionFailed = activeVersion.extraction_status === 'failed';
  const isPdf = localResume.file_extension.toLowerCase() === '.pdf';

  const handleDownload = () => {
    if (activeVersion.managed_path) {
      window.open(`/api/resume/download?path=${encodeURIComponent(activeVersion.managed_path)}`, '_blank');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" disabled={!hasExtractedText && !extractionFailed}>
              Preview {!hasExtractedText && !extractionFailed && '(Loading...)'}
            </TabsTrigger>
            <TabsTrigger value="original">
              Original File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            {hasExtractedText ? (
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {activeVersion.extracted_text}
                </pre>
              </ScrollArea>
            ) : extractionFailed ? (
              <div className="p-6 text-center border rounded-md bg-red-50">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-red-700 font-medium mb-2">Text Extraction Failed</p>
                <p className="text-sm text-red-600 mb-4">
                  {activeVersion.extraction_error || 'Could not extract text from this file.'}
                </p>
                <Button onClick={() => setActiveTab('original')} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Original File
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center border rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Extracting text...</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="original" className="mt-4">
            <div className="space-y-4">
              {isPdf ? (
                <div className="border rounded-md">
                  <embed
                    src={`/api/resume/view?path=${encodeURIComponent(activeVersion.managed_path)}`}
                    type="application/pdf"
                    width="100%"
                    height="500px"
                    className="rounded-md"
                  />
                </div>
              ) : (
                <div className="p-6 text-center border rounded-md">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    {localResume.base_filename}{localResume.file_extension}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                <span>
                  Version: {activeVersion.version_suffix || 'Original'} • 
                  Uploaded: {new Date(activeVersion.upload_timestamp).toLocaleDateString()}
                </span>
                <Button onClick={handleDownload} variant="ghost" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}