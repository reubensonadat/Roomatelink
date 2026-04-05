import { Link } from 'react-router-dom'
import { ChevronRight, VolumeX, MessageCircleOff, Coffee, Menu, X, CheckCircle2, Phone, Mail } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Social media icons as hand-built SVG components
const InstagramIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
)

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
)

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
)

const fadeUp: any = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
}

const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
}

export function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [howItWorksLang, setHowItWorksLang] = useState<'EN' | 'TWI'>('EN')

    const scrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
        setIsMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden overflow-y-auto transition-colors duration-300">

            {/* 1. ULTRA CLEAN TOP NAVIGATION */}
            <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">

                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
                        <img src="/logo.png" alt="Roommate Link" className="w-10 h-10 object-contain border border-border/50 rounded-xl" />
                        <span className="font-extrabold text-[18px] tracking-tighter text-foreground uppercase">Roommate Link</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollTo('problem')} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">The Problem</button>
                        <button onClick={() => scrollTo('how-it-works')} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</button>
                        <button onClick={() => scrollTo('pricing')} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/auth" className="px-8 py-4 rounded-[22px] bg-primary text-primary-foreground font-bold text-[14px] hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                            Get Started
                        </Link>
                    </div>

                    <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* 2/3 Nav Drawer Overlay & Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                            />
                            {/* Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 w-[66%] h-screen bg-background z-50 border-l border-border shadow-2xl flex flex-col pt-32 px-6 gap-4 md:hidden"
                            >
                                <div className="flex justify-end absolute top-6 right-6">
                                    <button className="p-2 text-muted-foreground bg-muted rounded-2xl" onClick={() => setIsMenuOpen(false)}>
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-[12px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-2 mt-4">Menu</h3>

                                <button onClick={() => scrollTo('problem')} className="text-left py-3 font-semibold text-[16px] text-foreground hover:text-primary transition-colors border-none bg-transparent">The Problem</button>
                                <button onClick={() => scrollTo('how-it-works')} className="text-left py-3 font-semibold text-[16px] text-foreground hover:text-primary transition-colors border-none bg-transparent">How it Works</button>
                                <button onClick={() => scrollTo('pricing')} className="text-left py-3 font-semibold text-[16px] text-foreground hover:text-primary transition-colors border-none bg-transparent">Pricing</button>

                                <div className="mt-auto pb-10">
                                    <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] w-full shadow-lg active:scale-95 transition-transform">
                                        Get Started
                                    </Link>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </header>

            <main className="overflow-x-hidden">
                {/* 2. CENTERED AIRY HERO */}
                <section id="hero" className="relative pt-24 pb-20 sm:pt-40 sm:pb-32 flex flex-col items-center text-center overflow-hidden">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="w-full max-w-5xl mx-auto px-6 relative z-10"
                    >
                        <motion.h1 
                            variants={fadeUp} 
                            className="text-5xl sm:text-[6.5rem] leading-[0.98] font-black tracking-[-0.04em] mb-10 text-foreground transition-colors duration-300"
                        >
                            Don&apos;t leave your <br className="hidden sm:block" /> living situation to chance.
                        </motion.h1>

                        <motion.p 
                            variants={fadeUp} 
                            className="text-lg sm:text-xl font-bold text-muted-foreground max-w-2xl mx-auto mb-14 leading-tight transition-colors duration-300 opacity-70"
                        >
                            Connect with highly compatible students using a behavioral matching engine designed for university life.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link to="/auth" className="group w-full sm:w-auto px-12 py-6 rounded-boutique bg-foreground text-background font-black text-[16px] transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex justify-center items-center gap-3 uppercase tracking-widest leading-none">
                                Enter Portal <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            
                            <button 
                                onClick={() => scrollTo('how-it-works')}
                                className="w-full sm:w-auto px-12 py-6 rounded-boutique bg-card border border-border font-black text-[15px] transition-all hover:bg-muted active:scale-95 uppercase tracking-widest text-muted-foreground hover:text-foreground leading-none"
                            >
                                How it works
                            </button>
                        </motion.div>

                        {/* Specialized Match Simulator (Same-Gender Student Pairs) */}
                        <motion.div 
                            variants={fadeUp}
                            className="mt-24 flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20"
                        >
                             {/* Pair 1: Female-Female */}
                             <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                     <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-white dark:border-slate-900 shadow-lg overflow-hidden flex items-center justify-center">
                                        <img src="/avatars/female/The Socialite_F.png" className="w-full h-full object-cover" alt="Student A" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 border-2 border-white dark:border-slate-900 shadow-lg overflow-hidden flex items-center justify-center">
                                         <img src="/avatars/female/The Creative_F.png" className="w-full h-full object-cover" alt="Student B" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                     <span className="text-[11px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md mb-1">98% Match</span>
                                      <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
                                </div>
                             </div>

                             {/* Specialized Separation */}
                             <div className="hidden sm:block w-px h-8 bg-border/40" />

                             {/* Pair 2: Male-Male */}
                             <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                     <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-white dark:border-slate-900 shadow-lg overflow-hidden flex items-center justify-center">
                                        <img src="/avatars/male/The Academic_M.png" className="w-full h-full object-cover" alt="Student C" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white dark:border-slate-900 shadow-lg overflow-hidden flex items-center justify-center">
                                         <img src="/avatars/male/The Minimalist_M.png" className="w-full h-full object-cover" alt="Student D" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start">
                                     <span className="text-[11px] font-black text-slate-500 uppercase bg-slate-500/5 px-2 py-0.5 rounded-md mb-1">94% Match</span>
                                      <div className="h-[2px] w-12 bg-slate-500/20 rounded-full" />
                                </div>
                             </div>
                        </motion.div>
                    </motion.div>
                </section>

                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32"
                >
                    <div className="w-full rounded-boutique shadow-2xl border-4 border-white dark:border-border overflow-hidden relative group bg-card">
                        <img
                            src={`/homeimage.jpg?v=${Date.now()}`}
                            alt="Roommate Link Platform Preview"
                            className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out hover:scale-[1.03] mix-blend-multiply dark:mix-blend-normal"
                        />
                    </div>
                </motion.section>

                {/* 3. THE PROBLEM SECTION */}
                <section id="problem" className="w-full py-24 sm:py-32 relative border-t border-border/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp} 
                            className="text-center mb-24 max-w-3xl mx-auto"
                        >
                            <h2 className="text-4xl sm:text-[4.5rem] font-black tracking-[-0.04em] mb-8 text-foreground leading-[0.9]">You deserve <br className="hidden sm:block" /> asomdwoeɛ (peace).</h2>
                            <p className="text-muted-foreground text-[18px] sm:text-[22px] font-bold leading-tight">University is stressful enough. Your living space should be the solution, not the problem.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Card 1 */}
                            <motion.div variants={fadeUp} className="group p-12 rounded-boutique bg-card/40 backdrop-blur-md border border-border shadow-xl flex flex-col hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-10 group-hover:scale-110 child-transition">
                                    <VolumeX className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-black text-[22px] mb-5 text-foreground uppercase tracking-tight">Silent Nights</h3>
                                <p className="text-[16px] font-bold text-muted-foreground leading-relaxed">
                                    We filter fundamental lifestyle clashes so you never have to argue about quiet hours again.
                                </p>
                            </motion.div>
                            
                            {/* Card 2 */}
                            <motion.div variants={fadeUp} className="group p-12 rounded-boutique bg-card/40 backdrop-blur-md border border-border shadow-xl flex flex-col hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-10 group-hover:scale-110 child-transition">
                                    <MessageCircleOff className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="font-black text-[22px] mb-5 text-foreground uppercase tracking-tight">Zero Friction</h3>
                                <p className="text-[16px] font-bold text-muted-foreground leading-relaxed">
                                    Aligning communication styles ensures minor annoyances never escalate into massive fights.
                                </p>
                            </motion.div>

                            {/* Card 3 */}
                            <motion.div variants={fadeUp} className="group p-12 rounded-boutique bg-card/40 backdrop-blur-md border border-border shadow-xl flex flex-col hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-10 group-hover:scale-110 child-transition">
                                    <Coffee className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="font-black text-[22px] mb-5 text-foreground uppercase tracking-tight">True Comfort</h3>
                                <p className="text-[16px] font-bold text-muted-foreground leading-relaxed">
                                    Walk into your room feeling relaxed, knowing you share a baseline of mutual respect.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 4. HOW IT WORKS */}
                <motion.section
                    id="how-it-works"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="w-full max-w-7xl mx-auto px-6 py-24 sm:py-32 border-t border-border"
                >
                    <div className="flex flex-col md:flex-row gap-24 items-center">
                        <motion.div variants={fadeUp} className="w-full md:w-[45%] flex justify-center order-2 md:order-1 relative">
                            <div className="w-full max-w-[360px] aspect-[4/5] bg-card border border-border rounded-[2.5rem] shadow-lg flex flex-col items-center justify-center p-12 text-center relative z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 text-primary mb-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <h3 className="text-2xl font-bold text-foreground mb-4">Algorithm Secured</h3>
                                <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">40+ crucial living habits mapped securely and anonymously to find your highest compatibility score.</p>
                            </div>
                        </motion.div>

                        <div className="w-full md:w-[55%] order-1 md:order-2">
                            <div className="flex items-center gap-4 mb-10">
                                <motion.h2 variants={fadeUp} className="text-3xl sm:text-[3.5rem] font-black tracking-[-0.03em] text-foreground leading-[1] mb-0">
                                    {howItWorksLang === 'EN' ? 'Clinical Precision.' : 'Sɛnea akontaabu no teɛ.'}
                                </motion.h2>
                                <div className="flex bg-muted p-1 rounded-xl border border-border/50 shrink-0">
                                    <button
                                        onClick={() => setHowItWorksLang('EN')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${howItWorksLang === 'EN' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        EN
                                    </button>
                                    <button
                                        onClick={() => setHowItWorksLang('TWI')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${howItWorksLang === 'TWI' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        TWI
                                    </button>
                                </div>
                            </div>
                            <motion.p variants={fadeUp} className="text-lg font-bold text-muted-foreground leading-tight mb-16 max-w-lg opacity-80">
                                {howItWorksLang === 'EN'
                                    ? "We don't just ask if you're clean—we map the exact behavioral pressure points of campus life."
                                    : "Yɛmfisa wo sɛ wopɛ ahotiee kɛkɛ—yɛhwehwɛ suban ankasa a ɛhia wɔ campus amammerɛ mu."
                                }
                            </motion.p>

                            <div className="relative border-l-2 border-border/30 ml-4 space-y-20">
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col group">
                                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-background border-2 border-border shadow-sm flex items-center justify-center text-[11px] font-black group-hover:border-primary group-hover:text-primary transition-colors">1</div>
                                    <h3 className="font-black text-2xl text-foreground mb-3 uppercase tracking-tight">
                                        {howItWorksLang === 'EN' ? 'Lifestyle DNA Mapping' : 'Lifestyle Mapping'}
                                    </h3>
                                    <p className="font-bold text-muted-foreground text-[16px] leading-relaxed max-w-md">
                                        {howItWorksLang === 'EN'
                                            ? 'A curated 40-point behavioral test mapping out your genuine living preferences.'
                                            : 'Sɛnea wopɛ sɛ wotena asetena mu no, yɛhwehwɛ point 40 a ɛho hia paa.'
                                        }
                                    </p>
                                </motion.div>
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col group">
                                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-background border-2 border-border shadow-sm flex items-center justify-center text-[11px] font-black group-hover:border-primary group-hover:text-primary transition-colors">2</div>
                                    <h3 className="font-black text-2xl text-foreground mb-3 uppercase tracking-tight">
                                        {howItWorksLang === 'EN' ? 'The Matching Engine' : 'Matching Engine No'}
                                    </h3>
                                    <p className="font-bold text-muted-foreground text-[16px] leading-relaxed max-w-md">
                                        {howItWorksLang === 'EN'
                                            ? 'Our proprietary algorithm calculates compatibility based on hundreds of shared student data points.'
                                            : 'Yɛn kwan no hwehwɛ wo suban ne afoforo deɛ kɔ mmea pii a ɛhia paa.'
                                        }
                                    </p>
                                </motion.div>
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col group">
                                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-background border-2 border-border shadow-sm flex items-center justify-center text-[11px] font-black group-hover:border-primary group-hover:text-primary transition-colors">3</div>
                                    <h3 className="font-black text-2xl text-foreground mb-3 uppercase tracking-tight">
                                        {howItWorksLang === 'EN' ? 'Secure Node Connect' : 'Hyɛ aseɛ kasa'}
                                    </h3>
                                    <p className="font-bold text-muted-foreground text-[16px] leading-relaxed max-w-md">
                                        {howItWorksLang === 'EN'
                                            ? 'Unlock vetted profiles and begin high-probability conversations with verified institutional peers.'
                                            : 'Message obi a ne suban yɛ pɛ tɛ wo deɛ na mo mmienu anya kwan a asomdwoeɛ wɔ mu.'
                                        }
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 5. PRICING SECTION */}
                <section id="pricing" className="w-full py-24 sm:py-40 relative border-t border-border/50">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.div variants={fadeUp} className="mb-20">
                            <h2 className="text-4xl sm:text-[5rem] font-black tracking-[-0.04em] mb-8 text-foreground leading-[0.95]">Institutionally <br className="hidden sm:block" /> Secure.</h2>
                            <p className="text-muted-foreground text-[18px] sm:text-[22px] font-bold max-w-2xl mx-auto leading-tight opacity-70">To maintain zero-bot integrity, we charge a one-time verification fee. No subscriptions. Ever.</p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="max-w-2xl mx-auto p-12 sm:p-16 rounded-boutique bg-card border border-border shadow-2xl relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-12 sm:gap-20 mb-16">
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-[7rem] font-black text-foreground leading-none tracking-tighter">25</span>
                                    <span className="text-3xl font-black text-muted-foreground">GHS</span>
                                </div>
                                <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                                     <img src="/Savings.png" alt="Savings" className="w-full h-full object-contain drop-shadow-2xl" />
                                </div>
                             </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mb-16 text-left">
                                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[15px] font-bold text-foreground">Lifetime Entry</span>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[15px] font-bold text-foreground">Unlimited Matches</span>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[15px] font-bold text-foreground">Secure Identity</span>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[15px] font-bold text-foreground">Campus Portal Access</span>
                                </div>
                            </div>

                            <Link to="/auth" className="w-full py-6 rounded-xl bg-foreground text-background font-black text-[16px] transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex justify-center items-center uppercase tracking-[0.2em] relative z-10">
                                Start Mapping
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* 6. FAQ SECTION - TOTAL RESTORATION */}
                <section id="faq" className="w-full max-w-4xl mx-auto px-6 py-24 sm:py-32 border-t border-border/50">
                    <motion.div variants={fadeUp} className="text-center mb-20">
                        <h2 className="text-4xl sm:text-[4rem] font-black tracking-tighter mb-6 text-foreground uppercase">Common Inquiries</h2>
                        <p className="text-muted-foreground text-[18px] font-bold">Definitive answers for university students.</p>
                    </motion.div>

                    <div className="space-y-12">
                        <motion.div variants={fadeUp}>
                            <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-tight">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                Why is there a one-time verification fee?
                            </h4>
                            <p className="text-muted-foreground font-bold text-[16px] leading-relaxed opacity-80">
                                To definitively restrict bots, scammers, and actors who aren't serious about finding a roommate. This fee sustains our optimized matching system and student verification process.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-tight">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                Can my matches see my phone number?
                            </h4>
                            <p className="text-muted-foreground font-bold text-[16px] leading-relaxed opacity-80">
                                No. Your phone number is strictly for internal updates, security alerts, and reward notifications. It is never displayed to other users on the platform.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-tight">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                What if I don't find a roommate?
                            </h4>
                            <p className="text-muted-foreground font-bold text-[16px] leading-relaxed opacity-80">
                                Our algorithm continuously reruns matches as new students join. We recommend checking your 'Vibe Check' settings if you aren't seeing compatible options.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-tight">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                How do I report a user?
                            </h4>
                            <p className="text-muted-foreground font-bold text-[16px] leading-relaxed opacity-80">
                                Navigate to the user's profile and use the Report icon. Our team manually reviews every report within 24 hours to ensure community safety.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-xl font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-tight">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                How are profiles verified?
                            </h4>
                            <p className="text-muted-foreground font-bold text-[16px] leading-relaxed opacity-80">
                                We verify users who sign up with valid student institutional emails.
                            </p>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* 7. CLEAN PREMIUM FOOTER - TOTAL RESTORATION */}
            <footer className="w-full bg-card border-t-4 border-white dark:border-border pt-32 pb-16 mt-20">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
                        <div className="md:col-span-5">
                            <div className="flex items-center gap-4 mb-10">
                                <img src="/logo.png" alt="Roommate Link" className="w-12 h-12 object-contain border border-border/50 rounded-xl" />
                                <span className="font-black text-2xl tracking-tighter uppercase text-foreground">Roommate Link</span>
                            </div>
                            <p className="text-[18px] font-bold text-muted-foreground max-w-sm leading-tight opacity-70 mb-12">
                                Engineering university housing security through precise behavioral synchronization.
                            </p>
                            
                            {/* Restored Social Channels */}
                            <div className="flex gap-6">
                                <a href="https://instagram.com/roommatelink" target="_blank" className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                    <InstagramIcon />
                                </a>
                                <a href="https://linkedin.com/company/roommatelink" target="_blank" className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                    <LinkedinIcon />
                                </a>
                                <a href="https://twitter.com/roommatelink" target="_blank" className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                    <TwitterIcon />
                                </a>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <h4 className="text-[13px] font-black uppercase tracking-widest text-foreground mb-8">Navigation</h4>
                            <ul className="space-y-4 text-[15px] font-bold text-muted-foreground">
                                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-primary transition-colors flex items-center gap-2">Algorithm <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></button></li>
                                <li><button onClick={() => scrollTo('problem')} className="hover:text-primary transition-colors flex items-center gap-2">Behavioral Hub <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></button></li>
                                <li><button onClick={() => scrollTo('pricing')} className="hover:text-primary transition-colors flex items-center gap-2">Verification <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></button></li>
                            </ul>
                        </div>

                        <div className="md:col-span-2">
                             <h4 className="text-[13px] font-black uppercase tracking-widest text-foreground mb-8">Resource</h4>
                             <ul className="space-y-4 text-[15px] font-bold text-muted-foreground">
                                <li><Link to="/terms" className="hover:text-primary transition-colors flex items-center gap-2">Privacy Policy <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></Link></li>
                                <li><Link to="/terms" className="hover:text-primary transition-colors flex items-center gap-2">Terms of Service <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></Link></li>
                                <li><Link to="/terms" className="hover:text-primary transition-colors flex items-center gap-2">Safety Community <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" /></Link></li>
                            </ul>
                        </div>

                        <div className="md:col-span-3">
                             <h4 className="text-[13px] font-black uppercase tracking-widest text-foreground mb-8">Support</h4>
                             <div className="p-8 rounded-3xl bg-muted/40 border border-border/50">
                                <p className="text-[14px] font-bold text-muted-foreground leading-tight mb-6">Need technical help or academic coordination?</p>
                                <button 
                                    onClick={() => window.location.href = '/support'}
                                    className="w-full py-4 bg-foreground text-background rounded-2xl font-black text-[12px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                                >
                                    Contact Us
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-[15px] font-black text-foreground">© 2026 Roommate Link Engineering.</p>
                            <p className="text-[12px] font-black text-muted-foreground tracking-widest uppercase opacity-60">Hand-Built for Students Worldwide</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
