import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export function TopHeader({ title, subtitle, showBackButton = false }: TopHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-background px-4 sm:px-6 py-4 flex flex-col sticky top-0 z-50 border-b border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center w-full relative min-h-[40px]">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-muted rounded-2xl text-foreground hover:bg-accent transition-colors group active:scale-95 absolute left-0 z-10"
          >
            <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform text-foreground" />
          </button>
        )}
        <h1 className="flex-1 text-center text-lg font-black text-foreground px-12 truncate">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="w-full text-center text-[12px] sm:text-[13px] font-black text-muted-foreground/60 mt-1 truncate px-4 uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  );
}
