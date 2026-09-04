import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bell, CheckCircle2, Clock, MailOpen } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch {
      // Mark read fallback
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Bell className="w-3.5 h-3.5" />
          <span>Notification Center</span>
        </div>
        <h1 className="text-2xl font-black font-heading">System Notifications</h1>
        <p className="text-xs text-slate-300">
          Real-time event updates for problem validation, partner acceptances, proposal approvals, and milestone updates.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Yet"
          description="You will be notified when your submitted problems or project collaborations undergo status changes."
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {n.notification_type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                {n.created_at && (
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                )}
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-3 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
