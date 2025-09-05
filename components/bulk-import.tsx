'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BulkImportOperation, BulkImportPreview, JobDescription } from '@/lib/types';
import { 
  FolderOpen, 
  Upload, 
  Eye, 
  Play, 
  X, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Edit3
} from 'lucide-react';

export function BulkImport() {
  const [currentOperation, setCurrentOperation] = useState<BulkImportOperation | null>(null);
  const [availableJobs, setAvailableJobs] = useState<JobDescription[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
    current?: string;
  }>({ processed: 0, total: 0 });
  const [showMappingDialog, setShowMappingDialog] = useState<BulkImportPreview | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState<{
    successful: string[];
    failed: { filename: string; error: string }[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableJobs();
    loadExistingPreview();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setAvailableJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadExistingPreview = async () => {
    try {
      const response = await fetch('/api/resume/bulk-import/preview');
      if (response.ok) {
        const data = await response.json();
        if (data.operation) {
          setCurrentOperation(data.operation);
        }
      }
    } catch (error) {
      console.error('Failed to load existing preview:', error);
    }
  };

  const handleSelectFolder = async () => {
    const folderPath = prompt('Enter the full path to the folder containing resumes:');
    if (folderPath) {
      setSelectedFolder(folderPath);
    }
  };

  const handleScanFolder = async () => {
    if (!selectedFolder) {
      toast({
        title: "No Folder Selected",
        description: "Please select a folder to scan",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch('/api/resume/bulk-import/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath: selectedFolder }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentOperation(data.operation);
        toast({
          title: "Folder Scanned",
          description: `Found ${data.operation.preview_items.length} resume files`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan folder');
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan folder",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateMapping = async (itemId: string, updates: Partial<BulkImportPreview>) => {
    try {
      const response = await fetch('/api/resume/bulk-import/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, updates }),
      });

      if (response.ok) {
        // Reload the preview to get updated data
        loadExistingPreview();
        setShowMappingDialog(null);
        toast({
          title: "Mapping Updated",
          description: "File mapping has been updated successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update mapping');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update mapping",
        variant: "destructive",
      });
    }
  };

  const handleExecuteImport = async () => {
    if (!currentOperation) return;

    const mappedItems = currentOperation.preview_items.filter(item => item.status === 'mapped');
    if (mappedItems.length === 0) {
      toast({
        title: "No Files Mapped",
        description: "Please map at least one file before importing",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ processed: 0, total: mappedItems.length });

    try {
      const response = await fetch('/api/resume/bulk-import/execute', {
        method: 'POST',
      });

      if (response.ok) {
        const results = await response.json();
        setShowResultsDialog(results);
        setCurrentOperation(null);
        toast({
          title: "Import Complete",
          description: `${results.successful.length} files imported successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import files",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress({ processed: 0, total: 0 });
    }
  };

  const handleCancelOperation = async () => {
    try {
      const response = await fetch('/api/resume/bulk-import/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        setCurrentOperation(null);
        setSelectedFolder('');
        toast({
          title: "Operation Cancelled",
          description: "Bulk import operation has been cancelled",
        });
      }
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel operation",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: BulkImportPreview['status']) => {
    switch (status) {
      case 'mapped':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: BulkImportPreview['status']) => {
    switch (status) {
      case 'mapped':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return 'Needs Mapping';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Resumes
          </CardTitle>
          <CardDescription>
            Import multiple resume files from a folder and map them to your job applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentOperation ? (
            <>
              {/* Folder Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Folder</label>
                <div className="flex gap-2">
                  <Input
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    placeholder="/path/to/resume/folder"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectFolder}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Select a folder containing resume files (PDF, DOC, DOCX, RTF)
                </p>
              </div>

              {/* Scan Button */}
              <Button
                onClick={handleScanFolder}
                disabled={!selectedFolder || isScanning}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {isScanning ? 'Scanning...' : 'Scan Folder'}
              </Button>
            </>
          ) : (
            <>
              {/* Preview Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Import Preview ({currentOperation.preview_items.length} files found)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExecuteImport}
                      disabled={isImporting || !currentOperation.preview_items.some(item => item.status === 'mapped')}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isImporting ? 'Importing...' : 'Execute Import'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelOperation}
                      disabled={isImporting}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>

                {/* Import Progress */}
                {isImporting && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Importing files...</span>
                      <span className="text-sm">{importProgress.processed}/{importProgress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                      />
                    </div>
                    {importProgress.current && (
                      <p className="text-xs text-gray-600 mt-2">Current: {importProgress.current}</p>
                    )}
                  </div>
                )}

                {/* Preview Items */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentOperation.preview_items.map((item) => (
                    <Card key={item.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{item.original_filename}</span>
                              {getStatusIcon(item.status)}
                              <span className="text-xs text-gray-500">{getStatusText(item.status)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              → {item.proposed_filename}
                            </p>
                            {item.job_mapping && (
                              <p className="text-xs text-blue-600 mt-1">
                                {item.job_mapping.company} - {item.job_mapping.role}
                              </p>
                            )}
                            {item.error_message && (
                              <p className="text-xs text-red-600 mt-1">{item.error_message}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMappingDialog(item)}
                            disabled={isImporting}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            {item.status === 'mapped' ? 'Edit' : 'Map'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {currentOperation.preview_items.filter(item => item.status === 'mapped').length}
                      </p>
                      <p className="text-sm text-gray-600">Ready to Import</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {currentOperation.preview_items.filter(item => item.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">Need Mapping</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {currentOperation.preview_items.filter(item => item.status === 'error').length}
                      </p>
                      <p className="text-sm text-gray-600">Errors</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mapping Dialog */}
      {showMappingDialog && (
        <Dialog open={!!showMappingDialog} onOpenChange={() => setShowMappingDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Map Resume File</DialogTitle>
              <DialogDescription>
                Map {showMappingDialog.original_filename} to a job application
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Job Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Job</label>
                <select
                  value={showMappingDialog.job_mapping?.uuid || ''}
                  onChange={(e) => {
                    const selectedJob = availableJobs.find(job => job.uuid === e.target.value);
                    if (selectedJob) {
                      handleUpdateMapping(showMappingDialog.id, {
                        job_mapping: selectedJob,
                        manual_company: '',
                        manual_role: ''
                      });
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a job...</option>
                  {availableJobs.map((job) => (
                    <option key={job.uuid} value={job.uuid}>
                      {job.company} - {job.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-sm text-gray-500">OR</div>

              {/* Manual Entry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={showMappingDialog.manual_company || ''}
                    onChange={(e) => {
                      const updatedDialog = { ...showMappingDialog, manual_company: e.target.value };
                      setShowMappingDialog(updatedDialog);
                    }}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input
                    value={showMappingDialog.manual_role || ''}
                    onChange={(e) => {
                      const updatedDialog = { ...showMappingDialog, manual_role: e.target.value };
                      setShowMappingDialog(updatedDialog);
                    }}
                    placeholder="Job role"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowMappingDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const hasJobMapping = !!showMappingDialog.job_mapping;
                    const hasManualMapping = showMappingDialog.manual_company && showMappingDialog.manual_role;
                    
                    if (hasJobMapping || hasManualMapping) {
                      handleUpdateMapping(showMappingDialog.id, {
                        ...(!hasJobMapping && {
                          job_mapping: undefined,
                          manual_company: showMappingDialog.manual_company,
                          manual_role: showMappingDialog.manual_role
                        })
                      });
                    }
                  }}
                  disabled={!showMappingDialog.job_mapping && (!showMappingDialog.manual_company || !showMappingDialog.manual_role)}
                >
                  Save Mapping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Results Dialog */}
      {showResultsDialog && (
        <Dialog open={!!showResultsDialog} onOpenChange={() => setShowResultsDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Results</DialogTitle>
              <DialogDescription>
                Summary of the bulk import operation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {showResultsDialog.successful.length}
                    </p>
                    <p className="text-sm text-green-800">Files Imported</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {showResultsDialog.failed.length}
                    </p>
                    <p className="text-sm text-red-800">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {showResultsDialog.successful.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Successfully Imported:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {showResultsDialog.successful.map((filename, index) => (
                      <p key={index} className="text-sm text-green-700">✓ {filename}</p>
                    ))}
                  </div>
                </div>
              )}

              {showResultsDialog.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Failed to Import:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {showResultsDialog.failed.map((failure, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-red-700">✗ {failure.filename}</p>
                        <p className="text-red-600 text-xs ml-4">{failure.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowResultsDialog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}