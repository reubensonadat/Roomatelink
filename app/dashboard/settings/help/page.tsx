"use client";

import { ChevronRight, MessageCircle, UserMinus, Flag, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Language = 'EN' | 'TWI';

interface ManualSection {
  id: string;
  icon: React.ElementType;
  title: { EN: string; TWI: string };
  content: { EN: string; TWI: string };
}

const CustomGlobe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.0004 17V22H16.0004V17C16.0004 12.5487 18.6444 8.71498 22.4475 6.98352L23.2753 8.8047C20.1637 10.2213 18.0004 13.3581 18.0004 17ZM8.00045 17V22H6.00045V17C6.00045 13.3581 3.83723 10.2213 0.725586 8.8047L1.55339 6.98352C5.35651 8.71498 8.00045 12.5487 8.00045 17ZM12.0004 12C9.23902 12 7.00045 9.76142 7.00045 7C7.00045 4.23858 9.23902 2 12.0004 2C14.7619 2 17.0004 4.23858 17.0004 7C17.0004 9.76142 14.7619 12 12.0004 12ZM12.0004 10C13.6573 10 15.0004 8.65685 15.0004 7C15.0004 5.34315 13.6573 4 12.0004 4C10.3436 4 9.00045 5.34315 9.00045 7C9.00045 8.65685 10.3436 10 12.0004 10Z"></path>
  </svg>
);

const CustomMatch = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.3135 20.8994L20.8994 22.3134L18.0713 19.4853L19.4854 18.0712L22.3135 20.8994ZM11 1.99995C11.2639 1.99995 11.525 2.01379 11.7832 2.03608C11.4424 2.63463 11.202 3.2974 11.084 4.0019C11.056 4.00158 11.028 3.99995 11 3.99995C7.13256 3.99995 4.00011 7.13254 4 11C4 14.8675 7.1325 18 11 18C14.8675 18 18 14.8675 18 11C18 10.9716 17.9974 10.9432 17.9971 10.915C18.7018 10.7971 19.3642 10.5566 19.9629 10.2158C19.9852 10.4742 20 10.7357 20 11C20 15.968 15.968 20 11 20C6.032 20 2 15.968 2 11C2.00011 6.03204 6.03206 1.99995 11 1.99995ZM16.5293 1.31929C16.7058 0.893246 17.2943 0.893246 17.4707 1.31929L17.7236 1.93061C18.1556 2.97343 18.9615 3.80614 19.9746 4.25679L20.6924 4.57612C21.1026 4.75903 21.1027 5.35623 20.6924 5.53901L19.9326 5.8769C18.9448 6.31622 18.1534 7.11927 17.7139 8.12788L17.4668 8.69331C17.2864 9.10744 16.7137 9.10744 16.5332 8.69331L16.2871 8.12788C15.8476 7.11924 15.0552 6.31623 14.0674 5.8769L13.3076 5.53901C12.8974 5.35624 12.8975 4.75902 13.3076 4.57612L14.0254 4.25679C15.0385 3.80614 15.8445 2.97346 16.2764 1.93061L16.5293 1.31929Z"></path>
  </svg>
);

const CustomVerification = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10.0072 2.10365C8.60556 1.64993 7.08193 2.28104 6.41168 3.59294L5.6059 5.17011C5.51016 5.35751 5.35775 5.50992 5.17036 5.60566L3.59318 6.41144C2.28128 7.08169 1.65018 8.60532 2.10389 10.0069L2.64935 11.6919C2.71416 11.8921 2.71416 12.1077 2.64935 12.3079L2.10389 13.9929C1.65018 15.3945 2.28129 16.9181 3.59318 17.5883L5.17036 18.3941C5.35775 18.4899 5.51016 18.6423 5.6059 18.8297L6.41169 20.4068C7.08194 21.7187 8.60556 22.3498 10.0072 21.8961L11.6922 21.3507C11.8924 21.2859 12.1079 21.2859 12.3081 21.3507L13.9931 21.8961C15.3947 22.3498 16.9183 21.7187 17.5886 20.4068L18.3944 18.8297C18.4901 18.6423 18.6425 18.4899 18.8299 18.3941L20.4071 17.5883C21.719 16.9181 22.3501 15.3945 21.8964 13.9929L21.3509 12.3079C21.2861 12.1077 21.2861 11.8921 21.3509 11.6919L21.8964 10.0069C22.3501 8.60531 21.719 7.08169 20.4071 6.41144L18.8299 5.60566C18.6425 5.50992 18.4901 5.3575 18.3944 5.17011L17.5886 3.59294C16.9183 2.28104 15.3947 1.64993 13.9931 2.10365L12.3081 2.6491C12.1079 2.71391 11.8924 2.71391 11.6922 2.6491L10.0072 2.10365ZM8.19271 4.50286C8.41612 4.06556 8.924 3.8552 9.39119 4.00643L11.0762 4.55189C11.6768 4.74632 12.3235 4.74632 12.9241 4.55189L14.6091 4.00643C15.0763 3.8552 15.5841 4.06556 15.8076 4.50286L16.6133 6.08004C16.9006 6.64222 17.3578 7.09946 17.92 7.38668L19.4972 8.19246C19.9345 8.41588 20.1448 8.92375 19.9936 9.39095L19.4481 11.076C19.2537 11.6766 19.2537 12.3232 19.4481 12.9238L19.9936 14.6088C20.1448 15.076 19.9345 15.5839 19.4972 15.8073L17.92 16.6131C17.3578 16.9003 16.9006 17.3576 16.6133 17.9197L15.8076 19.4969C15.5841 19.9342 15.0763 20.1446 14.6091 19.9933L12.9241 19.4479C12.3235 19.2535 11.6768 19.2535 11.0762 19.4479L9.3912 19.9933C8.924 20.1446 8.41612 19.9342 8.19271 19.4969L7.38692 17.9197C7.09971 17.3576 6.64246 16.9003 6.08028 16.6131L4.50311 15.8073C4.06581 15.5839 3.85544 15.076 4.00668 14.6088L4.55213 12.9238C4.74656 12.3232 4.74656 11.6766 4.55213 11.076L4.00668 9.39095C3.85544 8.92375 4.06581 8.41588 4.50311 8.19246L6.08028 7.38668C6.64246 7.09946 7.09971 6.64222 7.38692 6.08004L8.19271 4.50286ZM6.75972 11.7573L11.0023 15.9999L18.0734 8.92885L16.6592 7.51464L11.0023 13.1715L8.17394 10.343L6.75972 11.7573Z"></path>
  </svg>
);


const SECTIONS: ManualSection[] = [
  {
    id: "intro",
    icon: CustomGlobe,
    title: {
      EN: "Welcome to Roommate Link",
      TWI: "Akwaaba kɔ Roommate Link"
    },
    content: {
      EN: "Finding a roommate on campus shouldn't be a headache. Here is a simple guide to getting the best out of the app. We do the hard work so you can focus on your studies.",
      TWI: "Roommate a wobɛhwehwɛ wɔ campus nyɛ adeɛ a ɛsɛ sɛ ɛha w'adwene. Yɛayɛ guide yi dɛ wubetumi ahu nyinaa mu yie. Yɛbɛyɛ adwuma den no ama wo na woatumi de w'adwene asi wo sukuu so."
    }
  },
  {
    id: "finding",
    icon: CustomMatch,
    title: {
      EN: "Finding Your Match",
      TWI: "Sɛnea wobɛnya wo roomie"
    },
    content: {
      EN: "When you complete the questionnaire, our system goes to work. We don't just match you randomly; we link you with students whose lifestyle, sleep schedule, and cleanliness match yours so there's peace in the room.",
      TWI: "Sɛ wowie questions no a, yɛn system no bɛhwehwɛ obi a wo ne no bɛtumi atena asomdwoeɛ mu. Yɛmfa wo mmɔ obiara ho kwa; yɛhwehwɛ obi a ne suban ne ne nna kwan yɛ pɛ kɔ wo deɛ no ho."
    }
  },
  {
    id: "chatting",
    icon: MessageCircle,
    title: {
      EN: "Chatting with Matches",
      TWI: "Nea woyɛ ne w'adamfo foforo no kasa"
    },
    content: {
      EN: "When you see someone you vibe with in your dashboard, click their profile and hit \"Message.\" Introduce yourself! A simple 'Hi, I see we both like studying late' is a great start.",
      TWI: "Sɛ wohu obi a w'ani gye ne ho wɔ wo dashboard mu a, click ne profile no so na fa message kɔma no. Fa wo ho kyerɛ no! Kasa kɛkɛ tɛ sɛ 'Hi, mahu sɛ yɛn mmienu nyinaa pɛ adesua anadwo'."
    }
  },
  {
    id: "fee",
    icon: CustomVerification,
    title: {
      EN: "Why is there a Verification Fee?",
      TWI: "Adɛn nti na yɛgye sika kakra?"
    },
    content: {
      EN: "We want to keep this platform 100% safe and free from scammers. To ensure every user is a real student, we require a small fee. We've discounted it heavily for students so it's as affordable as a plate of food, but just enough to keep unserious people out of your DMs!",
      TWI: "Yɛpɛ sɛ platform yi yɛ safe na scammers nso ntumi mma ha. Nea ɛbɛyɛ na yɛbɛhu sɛ obiara yɛ student ampa no, yɛgye sika kakra te sɛ waakye plate baako. Ɛno bɛbɔ wo ho ban afiri nnipa a wɔnnyɛ serious no ho!"
    }
  },
  {
    id: "found",
    icon: UserMinus,
    title: {
      EN: "The \"Found a Roommate\" Button",
      TWI: "Manya Roommate Button"
    },
    content: {
      EN: "Have you met your perfect roommate here? By toggling the \"I have found a roommate\" button in your settings, your profile will be safely hidden. Nobody else will message you, letting you secure your room in peace.",
      TWI: "Sɛ wanya wo roommate wɔ ha ampa a, nnya nkyɛ! Twa \"I have found a roommate\" button no so wɔ settings mu na yɛde wo profile bɛsie. Obiara ntumi mmessage wo bio, na w'ahome."
    }
  },
  {
    id: "cycle",
    icon: Clock,
    title: {
      EN: "The 60-Day Match Cycle",
      TWI: "Nna 60 (60 Days) Mmere"
    },
    content: {
      EN: "To keep the app fresh, your profile stops searching for new matches after 60 days. Don't worry—your data is fully secure! You can still log in anytime to read your past messages and chat with the people you already matched with.",
      TWI: "Sɛ woba platform yi so di nnafua 60 a, yɛn system no bɛgyae match foforo hwehwɛ ama wo. Nanso nsuro! Wo data nyinaa yɛ safe. Wubetumi a-login berɛ biara ne nnipa a wunyaa wɔn match dada no bɛkasa."
    }
  },
  {
    id: "report",
    icon: Flag,
    title: {
      EN: "Need Help or Reporting?",
      TWI: "Wohia mmoa anaa wopɛ sɛ woreport obi?"
    },
    content: {
      EN: "If someone is bothering you or breaking our community rules, please use the red \"Report\" flag on their profile. We actively monitor these to keep the space entirely safe for you.",
      TWI: "Sɛ obi yɛ wo basabasa anaa ɔnni yɛn rules no so a, tu flag kɔkɔɔ no so a ɛwɔ ne profile so no. Yɛn ani wɔ platform yi so paa na ayɛ safe ama obiara."
    }
  }
];

export default function HelpManualPage() {
  const [lang, setLang] = useState<Language>('EN');

  return (
    <div className="flex flex-col flex-1 w-full relative pb-32">
      {/* Absolute Header Area (Fixed Toggle) */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 py-4 px-5 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/settings" className="p-3 -ml-3 rounded-2xl bg-transparent hover:bg-muted text-foreground transition-colors group active:scale-95">
            <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </Link>

          {/* Language Toggle */}
          <div className="flex bg-muted p-1 rounded-2xl shadow-inner border border-border/50">
            <button 
              onClick={() => setLang('EN')}
              className={`px-4 py-1.5 text-[13px] font-black tracking-widest rounded-xl transition-all duration-300 ${lang === 'EN' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
            >
              EN 🇬🇧
            </button>
            <button 
              onClick={() => setLang('TWI')}
              className={`px-4 py-1.5 text-[13px] font-black tracking-widest rounded-xl transition-all duration-300 ${lang === 'TWI' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'}`}
            >
              TWI 🇬🇭
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-5 pt-8 w-full md:max-w-3xl mx-auto overflow-hidden">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <CustomGlobe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-[32px] md:text-[38px] font-black tracking-tight text-foreground leading-tight mb-4">
            {lang === 'EN' ? 'How to use Roommate Link' : 'Kwan a yɛfa so de Roommate Link yɛ adwuma'}
          </h1>
          <p className="text-[16px] font-medium text-muted-foreground max-w-sm mx-auto">
            {lang === 'EN' ? 'Your complete guide to finding the perfect roommate.' : 'Guide a ɛbɛboa wo ama woanya roommate papabi.'}
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-muted-foreground/10 hidden md:block" />

          {SECTIONS.map((sec, index) => (
            <motion.div 
              key={sec.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              className="bg-card rounded-[2rem] border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 relative z-10 flex flex-col md:flex-row gap-5 md:gap-6 overflow-hidden group hover:border-primary/40 transition-colors hover:shadow-md"
            >
              {/* Icon Container (Unified Styling) */}
              <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-3xl bg-muted border border-border/60 flex items-center justify-center text-foreground transition-transform duration-500 group-hover:scale-110 shadow-sm">
                <sec.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>

              {/* Content Area */}
              <div className="flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={lang + sec.id + 'title'}
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }}
                    className="text-[19px] md:text-[21px] font-black text-foreground mb-2 leading-tight tracking-tight"
                  >
                    {sec.title[lang]}
                  </motion.h2>
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={lang + sec.id + 'content'}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[15px] md:text-[16px] font-medium text-muted-foreground leading-relaxed"
                  >
                    {sec.content[lang]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
