import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  public render() {
    if (this.state.hasError) {
       return (
         <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-red-500/30 font-sans">
           <div className="w-full max-w-[420px] flex flex-col items-center text-center">
             <div className="relative mb-10 w-28 h-28 flex items-center justify-center">
               <div className="absolute inset-0 bg-red-500/10 rounded-[2.5rem] animate-ping opacity-70" />
               <div className="w-24 h-24 bg-card border border-red-500/30 rounded-[2.5rem] shadow-2xl flex items-center justify-center relative z-10 backdrop-blur-md">
                 <AlertOctagon className="w-10 h-10 text-red-500 drop-shadow-md" />
               </div>
             </div>
             
             <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight mb-4">
               System Interruption
             </h1>
             <p className="text-[15px] font-bold text-muted-foreground leading-relaxed mb-10 max-w-[300px]">
               A critical navigation error occurred. We have contained the exception to protect your session data.
             </p>
             
             <button
               onClick={this.handleReset}
               className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-foreground text-background font-black text-[15px] rounded-[22px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group border border-white/10 uppercase tracking-widest"
             >
               <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform duration-500" />
               System Reboot
             </button>
             
             <div className="mt-8 px-5 py-4 rounded-2xl bg-muted/30 border border-border/50 max-w-full overflow-hidden text-left w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Diagnostic Log</span>
                <p className="text-[12px] font-mono text-muted-foreground truncate opacity-80">
                  {this.state.error?.message || 'Unknown runtime exception'}
                </p>
             </div>
           </div>
         </div>
       )
    }

    return this.props.children;
  }
}
