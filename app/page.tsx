'use client';

import { ActiveBoard } from '@/components/active-board';
import { JobDescriptionSaver } from '@/components/job-description-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { FileText, Settings, Upload, RotateCcw, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import DemoBanner from '@/components/demo-banner';
import UseDemoData from '@/components/use-demo-data';

export default function Home() {
  const [showJobSaver, setShowJobSaver] = useState(false);
  const [activeBoardRefreshTrigger, setActiveBoardRefreshTrigger] = useState(0);

  const handleJobSaved = () => {
    // Trigger ActiveBoard refresh when a job is saved via JobDescriptionSaver
    setActiveBoardRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Demo Banner */}
        <DemoBanner />
        
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Application Tracker</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Track your active applications and manage your job search progress
          </p>
        </div>

        {/* Demo Data Section */}
        <UseDemoData />
        
        {/* Main Active Board */}
        <ActiveBoard className="mb-6" refreshTrigger={activeBoardRefreshTrigger} />

        {/* Quick Actions - Compact Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Button 
            onClick={() => setShowJobSaver(!showJobSaver)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>

          <Link href="/resume-manager">
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Resumes
            </Button>
          </Link>

          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          <Link href="/settings">
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>

          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo
          </Button>
        </div>

        {/* Collapsible Job Description Saver */}
        {showJobSaver && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <JobDescriptionSaver onJobSaved={handleJobSaved} />
          </div>
        )}
      </div>
      
      <Toaster />
    </main>
  );
}