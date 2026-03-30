"use client";
import { Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/pull-to-refresh';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserCheck, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

export default function MessagesInbox() {
  const [profileStatus, setProfileStatus] = useState<{
    isProfileComplete: boolean;
    hasQuestionnaire: boolean;
  }>({
    isProfileComplete: true,
    hasQuestionnaire: true
  });
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Get current user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, course, level, phone_number')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          // 2. Check questionnaire
          const { data: q } = await supabase.from('questionnaire_responses').select('id').eq('user_id', profile.id).single();
          setProfileStatus({
            isProfileComplete: !!(profile.course && profile.level && profile.phone_number),
            hasQuestionnaire: !!q
          });

          // 3. Fetch messages involving the user
          const { data: msgs } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id (id, full_name, avatar_url),
              receiver:users!receiver_id (id, full_name, avatar_url)
            `)
            .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
            .order('created_at', { ascending: false });

          if (msgs) {
            // Group by conversation partner
            const threads: Record<string, any> = {};
            msgs.forEach(m => {
              const other = m.sender_id === profile.id ? m.receiver : m.sender;
              if (other && !threads[other.id]) {
                threads[other.id] = {
                  id: other.id,
                  name: other.full_name,
                  avatar: other.avatar_url,
                  lastMessage: m.content,
                  time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  unread: m.receiver_id === profile.id && m.status !== 'READ' ? 1 : 0
                };
              } else if (other && m.receiver_id === profile.id && m.status !== 'READ') {
                threads[other.id].unread++;
              }
            });
            setChats(Object.values(threads));
          }
        }
      }
      setIsLoading(false);
    };

    fetchChats();
  }, []);

  return (
    <PullToRefresh onRefresh={async () => { await new Promise(r => setTimeout(r, 1000)); toast.success('Messages updated!', { icon: <MessageCircle className="w-5 h-5 text-white" /> }); }}>
    <div className="flex flex-col w-full min-h-screen">
      
      {/* Header */}
      <div className="px-5 pt-8 md:pt-12 pb-4 w-full md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col sticky top-0 bg-background/90 backdrop-blur-md z-40 border-b border-border/40">
        <h1 className="text-[28px] md:text-[34px] font-extrabold tracking-tight text-foreground leading-tight mb-4">
          Messages
        </h1>
        
        {/* Search Bar */}
        <div className="w-full bg-muted/60 border border-border/50 rounded-2xl flex items-center px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="bg-transparent border-none outline-none flex-1 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex flex-col w-full md:max-w-3xl lg:max-w-4xl mx-auto pb-32">
        {/* Chat List */}
        <div className="flex flex-col mt-2 px-2 md:px-5 gap-1">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-16 h-16 rounded-3xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))
          ) : !profileStatus.isProfileComplete ? (
            // Case 1: Profile incomplete
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center mt-10"
            >
              <div className="w-24 h-24 mb-6 rounded-3xl bg-amber-500/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-3xl bg-amber-500/20 animate-pulse" />
                <UserCheck className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-[22px] font-extrabold text-foreground mb-3 tracking-tight">Setup Required</h2>
              <p className="text-[15px] font-medium text-muted-foreground max-w-[280px] leading-relaxed mb-8">
                You can't message roommates until your profile is complete. Add your course and phone number to start!
              </p>
              <Link 
                href="/dashboard/profile"
                className="px-8 py-3.5 bg-primary text-white font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Complete Profile <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : !profileStatus.hasQuestionnaire ? (
            // Case 2: Questionnaire incomplete
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center mt-10"
            >
              <div className="w-24 h-24 mb-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-pulse" />
                <Sparkles className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-[22px] font-extrabold text-foreground mb-3 tracking-tight">Unlock Messaging</h2>
              <p className="text-[15px] font-medium text-muted-foreground max-w-[280px] leading-relaxed mb-8">
                Finish the questionnaire so we can find your matches and unlock your private inbox.
              </p>
              <Link 
                href="/questionnaire"
                className="px-8 py-3.5 bg-foreground text-background font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Start Test <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : chats.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-20 px-6 text-center mt-10"
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-[22px] font-extrabold text-foreground mb-3 tracking-tight">Your inbox is quiet</h2>
              <p className="text-[15px] font-medium text-muted-foreground max-w-[280px] leading-relaxed mb-8">
                You haven't messaged anyone yet. Go check out your top matches and say hello!
              </p>
              <Link 
                href="/dashboard"
                className="px-8 py-3.5 bg-foreground text-background font-bold text-[15px] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                View My Matches
              </Link>
            </motion.div>
          ) : (
            chats.map((chat, i) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileTap={{ scale: 0.98 }}
              >
              <Link 
                href={`/dashboard/messages/${chat.id}`}
                className="flex items-center gap-4 p-3 md:p-4 rounded-[1.5rem] hover:bg-muted/50 active:bg-muted transition-colors group"
              >
                <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                  <div className="w-full h-full rounded-3xl bg-muted border border-border overflow-hidden relative shadow-inner">
                    <Image src={chat.avatar} alt={chat.name} fill className="object-cover" />
                  </div>
                  {chat.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-3xl border-2 border-background flex items-center justify-center text-[10px] font-black text-primary-foreground">
                      {chat.unread}
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-[16px] md:text-[17px] truncate ${chat.unread > 0 ? 'text-foreground' : 'text-foreground/90'}`}>{chat.name}</span>
                    <span className={`text-[12px] font-bold shrink-0 ${chat.unread > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-[14px] line-clamp-2 leading-snug ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                      {chat.lastMessage}
                    </p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30 rotate-180 shrink-0 hidden md:block group-hover:text-muted-foreground/60 transition-colors"><path d="m15 18-6-6 6-6"/></svg>
                  </div>
                </div>
              </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

    </div>
    </PullToRefresh>
  );
}
