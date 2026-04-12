import { useNavigate } from 'react-router-dom';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSyncButton?: boolean;
}

export function TopHeader({ title, subtitle, showBackButton = false, showSyncButton = false }: TopHeaderProps) {
  const navigate = useNavigate();
  const { triggerGlobalSync, isHydrated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!isHydrated) return;

    setIsSyncing(true);
    const loadingId = toast.loading('Syncing...');
    
    try {
      const isSuccess = await triggerGlobalSync();
      
      if (isSuccess) {
        toast.success('Sync complete', { id: loadingId, duration: 2000 });
      } else {
        toast.error('Sync failed. Check your connection.', { id: loadingId, duration: 4000 });
      }
    } catch (error) {
      toast.error('Sync failed', { id: loadingId, duration: 4000 });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-4 flex flex-col sticky top-0 z-50 border-b border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center w-full relative min-h-[44px]">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-muted rounded-2xl text-foreground hover:bg-accent transition-colors group active:scale-[0.98] absolute left-0 z-10"
          >
            <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform text-foreground" />
          </button>
        )}
        <h1 className="flex-1 text-center text-lg font-black text-foreground px-12 truncate">
          {title}
        </h1>
        {isHydrated && showSyncButton && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2.5 bg-muted rounded-2xl text-foreground hover:bg-accent transition-colors active:scale-[0.98] absolute right-0 z-10 ${
              isSyncing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Sync data"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      {subtitle && (
        <p className="w-full text-center text-[12px] sm:text-[13px] font-black text-muted-foreground/60 mt-1 truncate px-4 uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  );
}
