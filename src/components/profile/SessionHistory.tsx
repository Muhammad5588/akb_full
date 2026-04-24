import { motion } from 'framer-motion';
import { History, Smartphone, LogOut, ShieldCheck, CalendarCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSessionHistory } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { type SessionLogItem } from '@/types/profile';

const getEventIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'event-login': return <Smartphone size={16} />;
    case 'event-logout': return <LogOut size={16} />;
    case 'event-relink': return <ShieldCheck size={16} />;
    default: return <History size={16} />;
  }
};

const getEventColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'event-login': return "text-[#15835b] bg-[#effbf5]";
    case 'event-logout': return "text-[#c44747] bg-[#fff1f1]";
    case 'event-relink': return "text-[#0b4edb] bg-[#eef6ff]";
    default: return "text-[#63758a] bg-[#f2f6fa]";
  }
};

const LogItem = memo(({ log, idx }: { log: SessionLogItem; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05, duration: 0.2 }}
    className="p-4 hover:bg-[#f8fbfe] transition-colors flex items-center gap-4"
  >
    <div className={cn("p-2.5 rounded-lg shrink-0", getEventColor(log.event_type))}>
      {getEventIcon(log.event_type)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[#07182f] truncate">
        {log.event_type}
      </p>
      <p className="text-xs text-[#63758a] flex items-center gap-1 mt-0.5">
        <CalendarCheck size={12} /> {log.date}
      </p>
    </div>
    <div className="text-right">
      <span className="text-xs font-mono text-[#63758a] bg-[#f2f6fa] border border-[#dbe8f4] px-2 py-1 rounded-lg">
        {log.client_code}
      </span>
    </div>
  </motion.div>
));
LogItem.displayName = 'LogItem';

export const SessionHistory = memo(() => {
  const { data, isLoading, isFetching } = useSessionHistory(1, 5);
  const { t } = useTranslation();
  const visibleLogs = data?.logs.slice(0, 5) ?? [];

  if (isLoading) return <SessionHistorySkeleton />;

  return (
    <div className="w-full max-w-md mx-auto pb-10 md:max-w-none md:mx-0 md:pb-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb] dark:text-[#fff1f1]">
            {t('profile.session.secureLabel', 'Faollik')}
          </p>
          <h3 className="text-lg font-semibold text-[#07182f] flex items-center gap-2 dark:text-[#f3f3f3]">
            {t('profile.session.title')}
          </h3>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb] dark:border-[#2B4166] dark:bg-[#f3f8ff] dark:text-[#0b4edb]">
          <History size={18} />
        </div>
        {isFetching && <span className="text-xs text-muted-foreground animate-pulse">{t('profile.session.loading')}</span>}
      </div>

      <div className="bg-white rounded-lg shadow-[0_8px_20px_rgba(10,35,70,0.05)] border border-[#dbe8f4] overflow-hidden">
        {visibleLogs.length === 0 ? (
          <div className="p-8 text-center text-[#63758a]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb]">
              <History size={20} />
            </div>
            {t('profile.session.empty')}
          </div>
        ) : (
          <div className="divide-y divide-[#eef3f8] md:divide-y-0 md:grid md:grid-cols-1 xl:grid-cols-2 md:gap-1">
            {visibleLogs.map((log, idx) => (
              <LogItem key={`${log.date}-${idx}`} log={log} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
SessionHistory.displayName = 'SessionHistory';

const SessionHistorySkeleton = () => (
  <div className="w-full max-w-md mx-auto pb-10 md:max-w-none md:mx-0 md:pb-0">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="bg-white rounded-lg p-4 space-y-4 border border-[#dbe8f4]">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);
