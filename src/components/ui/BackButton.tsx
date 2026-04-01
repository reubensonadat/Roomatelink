import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BackButton() {
  const navigate = useNavigate()
  
  return (
    <button 
      onClick={() => navigate(-1)} 
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold text-[15px] mb-8 transition-colors group"
    >
      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Go Back
    </button>
  )
}
