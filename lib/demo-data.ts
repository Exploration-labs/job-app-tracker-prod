/**
 * Deterministic demo data generator
 * Creates consistent sample data for demos and testing
 */

import seedrandom from 'seedrandom';
import { config } from './config';

// Demo data pools (realistic but fake)
const COMPANIES = [
  'TechCorp', 'StartupInc', 'Analytics Co', 'Northline Systems', 
  'Brightway Digital', 'DataFlow Labs', 'CloudSync', 'InnovateTech',
  'Future Dynamics', 'Apex Solutions'
];

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Product Manager', 'Data Scientist', 'UX Designer',
  'QA Engineer', 'DevOps Engineer', 'Software Architect',
  'Technical Lead'
];

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Final Round', 'Offer', 'Rejected'] as const;

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
  'Boston, MA', 'Chicago, IL', 'Remote', 'Los Angeles, CA'
];

const DEMO_NOTES = [
  'Great company culture and growth opportunities',
  'Interesting technical challenges in the role',
  'Competitive salary and benefits package',
  'Strong team collaboration and remote flexibility',
  'Exciting product with real user impact'
];

export interface DemoJobApplication {
  id: string;
  company: string;
  role: string;
  status: typeof STATUSES[number];
  appliedAt: string;
  location: string;
  salary?: string;
  notes: string;
  jdLink: string;
  resumeUsed?: string;
  stage: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Generate deterministic demo job applications
 */
export function generateDemoApplications(count = 8, seed = config.demo.seed): DemoJobApplication[] {
  const rng = seedrandom(seed);
  
  // Helper to pick random item from array
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  
  // Helper to generate realistic dates in the past
  const generateDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(rng() * daysAgo));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  return Array.from({ length: count }, (_, index) => {
    const company = pick(COMPANIES);
    const role = pick(ROLES);
    const status = pick(STATUSES);
    const appliedDaysAgo = Math.floor(rng() * 30) + 1; // 1-30 days ago
    
    return {
      id: `demo-${index + 1}`,
      company,
      role,
      status,
      appliedAt: generateDate(appliedDaysAgo),
      location: pick(LOCATIONS),
      salary: rng() > 0.3 ? `$${Math.floor(rng() * 100 + 80)}k - $${Math.floor(rng() * 150 + 120)}k` : undefined,
      notes: `${pick(DEMO_NOTES)} (Demo application - not persistent)`,
      jdLink: `https://demo-jobs.example.com/${company.toLowerCase().replace(/\s+/g, '-')}/${role.toLowerCase().replace(/\s+/g, '-')}`,
      resumeUsed: rng() > 0.5 ? `${role.replace(/\s+/g, '_')}_Resume_${company}.pdf` : undefined,
      stage: status === 'Applied' ? 'Application' : status === 'Rejected' ? 'Closed' : 'Active',
      priority: pick(['high', 'medium', 'low'] as const),
    };
  });
}

/**
 * Generate demo resume data for bulk import simulation
 */
export interface DemoResumeData {
  filename: string;
  company: string;
  role: string;
  extractedText: string;
  wordCount: number;
  hasContactInfo: boolean;
}

export function generateDemoResumes(count = 5, seed = config.demo.seed): DemoResumeData[] {
  const rng = seedrandom(seed);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  
  return Array.from({ length: count }, (_, index) => {
    const company = pick(COMPANIES);
    const role = pick(ROLES);
    const wordCount = Math.floor(rng() * 300 + 200); // 200-500 words
    
    return {
      filename: `${role.replace(/\s+/g, '_')}_Resume_${company}.pdf`,
      company,
      role,
      extractedText: `[Demo Resume Content]\n\nTargeted resume for ${role} position at ${company}.\n\nThis is a demo resume with approximately ${wordCount} words of content.\nContains typical resume sections: contact info, experience, skills, education.\n\n[Content redacted in demo mode for privacy]`,
      wordCount,
      hasContactInfo: true,
    };
  });
}

/**
 * Generate demo company data
 */
export interface DemoCompany {
  name: string;
  industry: string;
  size: string;
  website: string;
  description: string;
}

export function generateDemoCompanies(seed = config.demo.seed): DemoCompany[] {
  const rng = seedrandom(seed);
  const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'SaaS'];
  const sizes = ['Startup (1-50)', 'Mid-size (51-500)', 'Large (501-5000)', 'Enterprise (5000+)'];
  
  return COMPANIES.map(company => ({
    name: company,
    industry: industries[Math.floor(rng() * industries.length)],
    size: sizes[Math.floor(rng() * sizes.length)],
    website: `https://${company.toLowerCase().replace(/\s+/g, '')}.com`,
    description: `${company} is a leading company in the ${industries[Math.floor(rng() * industries.length)].toLowerCase()} space. (Demo company - not real)`
  }));
}

/**
 * Reset demo data (session-scoped)
 */
export function createDemoSession(sessionId: string = 'default') {
  return {
    id: sessionId,
    createdAt: new Date().toISOString(),
    applications: generateDemoApplications(8, `${config.demo.seed}-${sessionId}`),
    companies: generateDemoCompanies(`${config.demo.seed}-${sessionId}`),
    resumes: generateDemoResumes(5, `${config.demo.seed}-${sessionId}`),
  };
}

// Export for testing and debugging
export const demoDataPools = {
  COMPANIES,
  ROLES,
  STATUSES,
  LOCATIONS,
  DEMO_NOTES,
} as const;