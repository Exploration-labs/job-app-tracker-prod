import { config } from '@/lib/config';

interface DemoNoticeProps {
  message: string;
}

/**
 * Conditional demo notice that only shows in demo mode
 * Provides contextual guidance about demo limitations
 */
export function DemoNotice({ message }: DemoNoticeProps) {
  if (!config.demo.client) return null;
  
  return (
    <p className="mt-2 text-xs text-muted-foreground italic">
      {message}
    </p>
  );
}