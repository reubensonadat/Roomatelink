"use client";

export const runtime = 'edge';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Flag, ArrowLeft } from 'lucide-react';
import { ReportModal } from '@/components/ui/report-modal';

// Simplified mock chat
import { createClient } from '@/utils/supabase/client';
import { sendMessageAction } from '@/lib/auth-actions';
import { useParams } from 'next/navigation';

export default function ChatScreen() {
  const router = useRouter();
  const params = useParams();
  const receiverId = params.id as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const setupChat = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // 1. Get profiles
        const { data: me } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single();
        const { data: them } = await supabase.from('users').select('*').eq('id', receiverId).single();
        
        setCurrentUser(me);
        setOtherUser(them);

        // 2. Fetch history
        const { data: history } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${me.id},receiver_id.eq.${them.id}),and(sender_id.eq.${them.id},receiver_id.eq.${me.id})`)
          .order('created_at', { ascending: true });

        if (history) setMessages(history.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === me.id ? 'me' : 'them',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));

        // 3. Mark as read
        await supabase.from('messages').update({ status: 'READ' }).eq('receiver_id', me.id).eq('sender_id', them.id);

        // 4. Realtime Subscription
        const channel = supabase
          .channel(`chat:${me.id}:${them.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${me.id}`
          }, (payload) => {
            if (payload.new.sender_id === them.id) {
              setMessages(prev => [...prev, {
                id: payload.new.id,
                text: payload.new.content,
                sender: 'them',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
            }
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };

    setupChat();
  }, [receiverId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !receiverId) return;

    const text = input;
    setInput("");

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    const result = await sendMessageAction(receiverId, text);
    if (result.error) toast.error(result.error);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background w-full max-w-[480px] mx-auto relative">

      {/* Chat Header */}
      <header className="shrink-0 bg-background/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-3 h-[64px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/dashboard/messages')}
            className="p-3 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors group active:scale-95 shadow-sm"
          >
             <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-3xl bg-muted border border-border overflow-hidden relative shadow-sm">
              <Image src={otherUser?.avatar_url || '/avatars/male/The Gamer (Tech)_M.png'} alt="User" fill className="object-cover" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-[15px] text-foreground leading-tight">{otherUser?.full_name || 'Loading...'}</span>
              <span className="text-[11px] font-medium text-muted-foreground">Chatting Now</span>
            </div>
          </div>
        </div>

        {/* Report Button */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="p-2 text-red-500 active:opacity-60 transition-opacity"
          title="Report this user"
        >
          <Flag className="w-5 h-5" />
        </button>
      </header>

      {/* WhatsApp Banner */}
      <div className="shrink-0 bg-primary/5 border-b border-primary/10 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">Continue on WhatsApp for calls & photos</span>
        <button className="bg-[#25D366] text-white text-[11px] font-bold px-3 py-1 rounded-full active:scale-95 transition-transform">
          WhatsApp
        </button>
      </div>

      {/* Messages Feed — fills all remaining space */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        <div className="flex justify-center mb-1">
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Today 10:42 AM</span>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'me';
          const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].sender !== msg.sender;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[78%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div
                className={`px-3.5 py-2 text-[15px] font-medium leading-relaxed
                  ${isMe
                    ? 'bg-primary text-primary-foreground rounded-[18px] rounded-br-[4px]'
                    : 'bg-muted text-foreground rounded-[18px] rounded-bl-[4px]'}
                `}
              >
                {msg.text}
              </div>
              {isLastInGroup && (
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5 mx-1">
                  {msg.time}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar — pinned to bottom */}
      <div className="shrink-0 border-t border-border p-2.5 bg-background">
        <form onSubmit={handleSend} className="flex items-center gap-2 border border-border rounded-full px-1.5 py-1 bg-card">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser?.full_name?.split(' ')[0] || 'Roommate'}...`}
            className="flex-1 bg-transparent border-none outline-none px-3 py-1.5 text-[15px] text-foreground placeholder:text-muted-foreground/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
              ${input.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground/40'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
          </button>
        </form>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedName={otherUser?.full_name || ''}
        reportedId={receiverId}
      />
    </div>
  );
}
