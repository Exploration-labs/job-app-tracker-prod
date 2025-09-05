'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function BrowserHelperPage() {
  const [authToken, setAuthToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthToken();
  }, []);

  const fetchAuthToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth-token');
      if (!response.ok) {
        throw new Error(`Failed to get auth token: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAuthToken(data.token);
    } catch (error) {
      console.error('Error fetching auth token:', error);
      setError(error instanceof Error ? error.message : 'Failed to load auth token');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${description} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const bookmarkletCode = `javascript:(function(){
    const DESKTOP_APP_URL = 'http://localhost:3001';
    const AUTH_TOKEN = '${authToken}';
    
    // Create UI overlay
    const overlay = document.createElement('div');
    overlay.id = 'job-tracker-overlay';
    overlay.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 400px; max-width: 90vw;';
    
    overlay.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"><h3 style="margin: 0; color: #1f2937;">Job App Tracker</h3><button id="close-btn" style="background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button></div><div id="status" style="padding: 8px; border-radius: 4px; margin-bottom: 12px; display: none;"></div><div style="margin-bottom: 12px;"><strong>URL:</strong><br><div style="font-size: 12px; color: #6b7280; word-break: break-all;">' + window.location.href + '</div></div><button id="capture-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 14px;">Capture Job Description</button>';
    
    document.body.appendChild(overlay);
    
    function showStatus(message, type = 'success') {
      const statusDiv = document.getElementById('status');
      statusDiv.textContent = message;
      statusDiv.style.cssText = 'padding: 8px; border-radius: 4px; margin-bottom: 12px; display: block; background: ' + (type === 'error' ? '#fef2f2' : type === 'warning' ? '#fefbeb' : '#dcfce7') + '; color: ' + (type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#166534') + '; font-size: 12px;';
    }
    
    function extractJobDescription() {
      const selectors = ['.job-description', '.job-details', '.description', '[class*="job"][class*="description"]', '[class*="description"][class*="content"]', 'main', 'article'];
      
      let bestText = '';
      let bestHtml = '';
      let maxLength = 0;
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.innerText || element.textContent || '';
            if (text.length > maxLength && text.length > 100) {
              maxLength = text.length;
              bestText = text;
              bestHtml = element.outerHTML;
            }
          }
        } catch (e) {}
      }
      
      if (!bestText || bestText.length < 200) {
        bestText = document.body.innerText || document.body.textContent || '';
        bestHtml = document.documentElement.outerHTML;
      }
      
      return { text: bestText.replace(/\\s+/g, ' ').trim(), html: bestHtml };
    }
    
    async function captureJob() {
      const captureBtn = document.getElementById('capture-btn');
      captureBtn.textContent = 'Capturing...';
      captureBtn.disabled = true;
      
      try {
        const { text, html } = extractJobDescription();
        
        if (!text || text.length < 100) {
          throw new Error('Could not find job description text on this page');
        }
        
        const response = await fetch(DESKTOP_APP_URL + '/api/browser-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            url: window.location.href,
            html: html,
            auth_token: AUTH_TOKEN
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'HTTP ' + response.status);
        }
        
        const data = await response.json();
        showStatus('✓ Job captured! UUID: ' + data.uuid.slice(0, 8) + '...', 'success');
        
        setTimeout(() => { overlay.remove(); }, 2000);
        
      } catch (error) {
        showStatus('✗ Capture failed: ' + error.message, 'error');
      } finally {
        captureBtn.textContent = 'Capture Job Description';
        captureBtn.disabled = false;
      }
    }
    
    document.getElementById('close-btn').onclick = () => overlay.remove();
    document.getElementById('capture-btn').onclick = captureJob;
    
    overlay.onclick = (e) => e.stopPropagation();
    document.onclick = () => overlay.remove();
  })();`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browser Helper Setup</CardTitle>
          <CardDescription>
            Set up the browser helper to capture job descriptions directly from your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Desktop app is running and ready to receive captures
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Error: {error}
              </span>
              <Button onClick={fetchAuthToken} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Option 1: Browser Extension (Recommended)</CardTitle>
          <CardDescription>
            Install the browser extension for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              1. Download the extension files and install them in your browser
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Extension Files
              </Button>
              <Badge variant="secondary">Chrome, Firefox, Edge</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Extension files are located in the browser-extension folder of this project
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              2. Installation instructions:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Open Chrome and go to chrome://extensions/</li>
              <li>Enable "Developer mode" in the top right</li>
              <li>Click "Load unpacked" and select the browser-extension folder</li>
              <li>The Job App Tracker icon will appear in your browser toolbar</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Option 2: Bookmarklet (Quick Setup)</CardTitle>
          <CardDescription>
            Create a bookmark that captures job descriptions with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              1. Copy the bookmarklet code below
            </p>
            <div className="relative">
              <textarea
                readOnly
                value={bookmarkletCode}
                className="w-full h-32 p-3 text-xs font-mono border rounded-md bg-gray-50"
                placeholder={isLoading ? "Loading..." : "Bookmarklet code will appear here"}
              />
              <Button
                onClick={() => copyToClipboard(bookmarkletCode, "Bookmarklet code")}
                className="absolute top-2 right-2"
                size="sm"
                variant="outline"
                disabled={!authToken}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              2. Create a new bookmark in your browser:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Right-click your bookmarks bar and select "Add bookmark"</li>
              <li>Name it "Capture Job Description"</li>
              <li>Paste the code above as the URL</li>
              <li>Save the bookmark</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              3. Usage:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Navigate to any job posting page</li>
              <li>Click the "Capture Job Description" bookmark</li>
              <li>The job description will be automatically captured and saved</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Token</CardTitle>
          <CardDescription>
            Your current authentication token (automatically refreshed every 24 hours)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <input
              readOnly
              value={authToken || 'Loading...'}
              className="w-full p-3 font-mono text-sm border rounded-md bg-gray-50"
            />
            <Button
              onClick={() => copyToClipboard(authToken, "Auth token")}
              className="absolute top-2 right-2"
              size="sm"
              variant="outline"
              disabled={!authToken}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            This token authenticates browser helpers with your desktop app. It refreshes automatically.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing</CardTitle>
          <CardDescription>
            Test your browser helper setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Visit any job posting website (like LinkedIn, Indeed, Glassdoor) and use your browser helper to capture a job description. 
              The captured job will appear in the Recent Captures section of the main page.
            </p>
            <Button variant="outline" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <a href="/" className="no-underline">
                Go to Main Page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}