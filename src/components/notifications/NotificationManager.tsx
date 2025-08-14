import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BreakSchedule {
  id: string;
  break_time: string;
  is_active: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
  label?: string;
}

interface NotificationSettings {
  notifications_enabled: boolean;
  break_reminders: boolean;
  daily_rewards: boolean;
  activity_suggestions: boolean;
}

export function useNotificationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<BreakSchedule[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    notifications_enabled: true,
    break_reminders: true,
    daily_rewards: true,
    activity_suggestions: true
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (user) {
      fetchSchedules();
      fetchSettings();
      checkNotificationPermission();
      setupBreakReminders();
    }
  }, [user]);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      
      if (currentPermission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
      }
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('break_schedules')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('break_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notifications_enabled')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          notifications_enabled: data.notifications_enabled,
          break_reminders: data.notifications_enabled,
          daily_rewards: data.notifications_enabled,
          activity_suggestions: data.notifications_enabled
        }));
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const isInDoNotDisturbTime = (schedule: BreakSchedule): boolean => {
    if (!schedule.do_not_disturb_start || !schedule.do_not_disturb_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = schedule.do_not_disturb_start.split(':').map(Number);
    const [endHour, endMin] = schedule.do_not_disturb_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight DND periods
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (permission === 'granted' && settings.notifications_enabled) {
      if ('serviceWorker' in navigator) {
        // Use service worker for better notification handling
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'mindscape-break',
            requireInteraction: false,
            silent: false,
            ...options
          });
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          ...options
        });
      }
    }
    
    // Always show in-app toast as backup
    toast({
      title,
      description: body,
    });
  };

  const setupBreakReminders = () => {
    if (!settings.break_reminders) return;

    const checkBreakTimes = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      schedules.forEach(schedule => {
        if (schedule.is_active && schedule.break_time === currentTime && !isInDoNotDisturbTime(schedule)) {
          const messages = [
            "Time for a mindful break! 🧘‍♀️ Your magical city awaits.",
            "Take a moment to breathe and grow your city! ✨",
            "Your scheduled break is here - let's build something beautiful! 🏰",
            "Mindful moment time! Complete an activity to earn city rewards! 🎁",
            "Break time! Step into your magical world for a few minutes. 🌟"
          ];
          
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          
          sendNotification(
            schedule.label || 'Mindful Break Time',
            randomMessage,
            {
              tag: `break-${schedule.id}`,
              actions: [
                { action: 'open', title: 'Start Activity' },
                { action: 'snooze', title: 'Remind in 5 min' }
              ]
            }
          );
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkBreakTimes, 60000);
    
    // Initial check
    checkBreakTimes();

    return () => clearInterval(interval);
  };

  const sendDailyRewardReminder = () => {
    if (!settings.daily_rewards) return;

    const now = new Date();
    const hour = now.getHours();
    
    // Send daily reward reminder at 9 AM if not claimed
    if (hour === 9) {
      sendNotification(
        "Daily Reward Available! 🎁",
        "Claim your daily city item and keep your streak alive!",
        {
          tag: 'daily-reward',
          actions: [
            { action: 'claim', title: 'Claim Reward' },
            { action: 'later', title: 'Remind Later' }
          ]
        }
      );
    }
  };

  const sendActivitySuggestion = (activityName: string, season: string) => {
    if (!settings.activity_suggestions) return;

    const seasonalEmojis = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️'
    };

    sendNotification(
      `New ${season} Activity Available!`,
      `Try "${activityName}" ${seasonalEmojis[season as keyof typeof seasonalEmojis]} - Limited time seasonal variant!`,
      {
        tag: 'activity-suggestion',
        actions: [
          { action: 'play', title: 'Play Now' },
          { action: 'dismiss', title: 'Maybe Later' }
        ]
      }
    );
  };

  const sendStreakReminder = (streakCount: number) => {
    if (streakCount > 0 && streakCount % 7 === 0) {
      sendNotification(
        `${streakCount} Day Streak! 🔥`,
        "Amazing dedication! Your city is flourishing with your consistent mindful breaks.",
        {
          tag: 'streak-celebration'
        }
      );
    }
  };

  const sendOfflineEncouragement = () => {
    const messages = [
      "Take a walk outside and observe 3 beautiful things! 🌳",
      "Try some gentle stretches away from the screen! 🧘‍♂️",
      "Write down one thing you're grateful for today! ✍️",
      "Take 5 deep breaths and feel the present moment! 🌬️",
      "Step outside and feel the fresh air! 🌤️"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    sendNotification(
      "Offline Mindful Moment",
      randomMessage,
      {
        tag: 'offline-encouragement'
      }
    );
  };

  // Service worker message handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          const { action, tag } = event.data;
          
          switch (action) {
            case 'open':
            case 'play':
              // Navigate to activities page
              window.location.href = '/activities';
              break;
            case 'claim':
              // Navigate to stats page for daily reward
              window.location.href = '/stats';
              break;
            case 'snooze':
              // Set a 5-minute reminder
              setTimeout(() => {
                sendNotification(
                  "Snooze Reminder",
                  "Your mindful break is still waiting! 🌟"
                );
              }, 5 * 60 * 1000);
              break;
          }
        }
      });
    }
  }, []);

  return {
    permission,
    settings,
    schedules,
    sendNotification,
    sendDailyRewardReminder,
    sendActivitySuggestion,
    sendStreakReminder,
    sendOfflineEncouragement,
    updateSettings: (newSettings: Partial<NotificationSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };
}

// Service Worker Registration
export const registerNotificationServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};