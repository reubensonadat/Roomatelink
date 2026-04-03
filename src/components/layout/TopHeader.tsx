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
    <div className="bg-background px-4 py-4 flex flex-col sticky top-0 z-50 border-b border-border shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center w-full">
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-muted rounded-2xl text-foreground hover:bg-accent transition-colors group active:scale-95 absolute left-4"
          >
            <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform text-foreground" />
          </button>
        )}
        <h1 className="flex-1 text-center text-lg font-bold text-foreground mx-auto">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="w-full text-center text-[13px] font-medium text-muted-foreground mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
