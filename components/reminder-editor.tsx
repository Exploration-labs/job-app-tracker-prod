'use client';

import { useState, useEffect } from 'react';
import { notificationManager } from '@/lib/notifications';
import { JobDescription } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Bell, X } from 'lucide-react';

interface ReminderEditorProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDescription;
  onReminderChange?: () => void;
}

export function ReminderEditor({ isOpen, onClose, job, onReminderChange }: ReminderEditorProps) {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderMessage, setReminderMessage] = useState('Follow up on this application');
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check notification permission status
    checkNotificationPermission();
    
    // Load existing reminder if any
    if (job.next_reminder) {
      const date = new Date(job.next_reminder);
      setReminderDate(date.toISOString().split('T')[0]);
      setReminderTime(date.toTimeString().slice(0, 5));
    } else {
      // Set default to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      setReminderDate(tomorrow.toISOString().split('T')[0]);
      setReminderTime('09:00');
    }
  }, [job.next_reminder]);

  const checkNotificationPermission = async () => {
    const permitted = await notificationManager.requestPermission();
    setHasPermission(permitted);
  };

  const handleSaveReminder = () => {
    if (!reminderDate) {
      toast({
        title: "Date required",
        description: "Please select a reminder date.",
        variant: "destructive",
      });
      return;
    }

    const reminderDateTime = new Date(`${reminderDate}T${reminderTime || '09:00'}`);
    
    if (reminderDateTime <= new Date()) {
      toast({
        title: "Invalid date",
        description: "Reminder time must be in the future.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage for the job
    const updatedJob = {
      ...job,
      next_reminder: reminderDateTime.toISOString(),
      last_updated: new Date().toISOString(),
    };

    const storageKey = `job_${job.uuid}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedJob));

    // Schedule the notification
    const reminderId = `reminder_${job.uuid}`;
    notificationManager.scheduleReminder(
      reminderId,
      job.uuid,
      job.company || 'Unknown Company',
      job.role || 'Unknown Role',
      reminderDateTime,
      reminderMessage
    );

    toast({
      title: "Reminder set",
      description: `Reminder scheduled for ${reminderDateTime.toLocaleString()}`,
    });

    onReminderChange?.();
    onClose();
  };

  const handleDeleteReminder = () => {
    // Remove from localStorage
    const updatedJob = {
      ...job,
      next_reminder: undefined,
      last_updated: new Date().toISOString(),
    };

    const storageKey = `job_${job.uuid}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedJob));

    // Cancel the notification
    const reminderId = `reminder_${job.uuid}`;
    notificationManager.cancelReminder(reminderId);

    toast({
      title: "Reminder deleted",
      description: "The reminder has been cancelled.",
    });

    onReminderChange?.();
    onClose();
  };

  const handleRequestPermission = async () => {
    const permitted = await notificationManager.requestPermission();
    setHasPermission(permitted);
    
    if (!permitted) {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings to receive reminders.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notifications enabled",
        description: "You'll now receive reminder notifications.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Reminder
          </DialogTitle>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{job.company || 'Unknown'}</span> - {job.role || 'Unknown Role'}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasPermission && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    Notifications are not enabled. Enable them to receive reminders.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestPermission}
                    className="mt-1 h-auto p-0 text-yellow-700 hover:text-yellow-900"
                  >
                    Enable Notifications
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reminder-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-message">Message</Label>
            <Textarea
              id="reminder-message"
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder="Follow up on this application"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {job.next_reminder && (
            <Button
              variant="ghost"
              onClick={handleDeleteReminder}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminder}>
              Save Reminder
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}