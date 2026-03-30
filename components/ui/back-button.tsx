"use client";
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()} 
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold text-[15px] mb-8 transition-colors group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Go Back
    </button>
  );
}
