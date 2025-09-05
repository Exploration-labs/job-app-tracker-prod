import { promises as fs } from 'fs';
import { join } from 'path';
import { parseJobDescription } from './job-parser';
import { saveJobDescription } from './storage';
import { JobDescription } from './types';



const STORAGE_DIR = join(process.cwd(), 'job-descriptions');

export async function saveJobDescriptionFromBrowser(
  text: string,
  sourceUrl: string,
  sourceHtml?: string
): Promise<{ jsonPath: string; txtPath: string; uuid: string }> {
  // Parse job description to extract company and role
  const parsed = parseJobDescription(text);
  
  // Use the unified storage function with browser_helper capture method
  return await saveJobDescription(
    text,
    sourceUrl,
    parsed.company,
    parsed.role,
    sourceHtml,
    'browser_helper'
  );
}

export async function getRecentCaptures(limit: number = 20): Promise<JobDescription[]> {
  
  try {
    const files = await fs.readdir(STORAGE_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json')).slice(0, limit);
    
    const captures: JobDescription[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = join(STORAGE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as JobDescription;
        captures.push(data);
      } catch (error) {
        console.error(`Error reading capture file ${file}:`, error);
      }
    }
    
    // Sort by captured_at or fetched_at_iso timestamp (most recent first)
    captures.sort((a, b) => {
      const aTime = a.captured_at || a.fetched_at_iso;
      const bTime = b.captured_at || b.fetched_at_iso;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    return captures;
  } catch (error) {
    console.error('Error getting recent captures:', error);
    return [];
  }
}