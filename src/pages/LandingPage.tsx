import { Link } from 'react-router-dom'
import { ChevronRight, VolumeX, MessageCircleOff, Coffee, Menu, X, CheckCircle2, Tag } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Social media icons as SVG components since lucide-react doesn't export them
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
)

const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
)

const LinkedinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <div className="w-9 h-9 bg-card rounded-xl flex items-center justify-center shadow-sm border border-border/50 overflow-hidden p-1.5">
                            <img src="/logo.png" alt="Roommate Link" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-[18px] tracking-tight text-foreground">Roommate Link</span>
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

            <main className="pt-[72px] overflow-x-hidden">

                {/* 2. CENTERED AIRY HERO SECTION WITH MOVEMENT */}
                <motion.section
                    id="hero"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="w-full max-w-5xl mx-auto px-6 pt-24 pb-12 sm:pt-32 sm:pb-20 flex flex-col items-center text-center relative z-10"
                >


                    <motion.h1 variants={fadeUp} className="text-5xl sm:text-[6rem] leading-[1.05] font-extrabold tracking-tight mb-8 text-foreground transition-colors duration-300">
                        Don&apos;t leave your living situation to chance.
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-lg sm:text-xl font-medium text-muted-foreground max-w-2xl mb-12 leading-relaxed transition-colors duration-300">
                        Connect with highly compatible students using our proprietary behavioral matching engine. Secure a peaceful semester before classes even begin.
                    </motion.p>

                    <motion.div variants={fadeUp}>
                        <Link to="/auth" className="w-full sm:w-auto px-12 py-6 rounded-[22px] bg-foreground text-background font-black text-[16px] transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl flex justify-center items-center gap-3 uppercase tracking-widest">
                            Get Started Now <ChevronRight className="w-5 h-5 ml-1" />
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-[14px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free vibe check included</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Student email verification available</span>
                    </motion.div>

                </motion.section>

                {/* HERO ANCHOR IMAGE */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32"
                >
                    <div className="w-full rounded-[2rem] md:rounded-[3rem] shadow-xl border border-border overflow-hidden relative group bg-card">
                        <img
                            src={`/homeimage.jpg?v=${Date.now()}`}
                            alt="Roommate Link Platform Preview"
                            className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out hover:scale-[1.03] mix-blend-multiply dark:mix-blend-normal"
                        />
                    </div>
                </motion.section>

                {/* 3. THE PROBLEM SECTION */}
                <motion.section
                    id="problem"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="w-full py-24 sm:py-32 relative"
                >
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div variants={fadeUp} className="text-center mb-20 max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight mb-6 text-foreground">You deserve a peaceful room.</h2>
                            <p className="text-muted-foreground text-[17px] font-medium leading-relaxed">University brings enough stress. Your living space shouldn't be core of your problems. We eliminate guesswork completely.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
                            <motion.div variants={fadeUp} className="p-10 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8">
                                    <VolumeX className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-xl mb-4 text-foreground">No more 2 AM noise.</h3>
                                <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">
                                    We proactively filter out fundamental lifestyle clashes so you never have to argue about quiet hours or sleep schedules again.
                                </p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="p-10 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8">
                                    <MessageCircleOff className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-xl mb-4 text-foreground">No passive aggression.</h3>
                                <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">
                                    By strictly aligning your communication and dispute resolution styles, minor annoyances never escalate into massive fights.
                                </p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="p-10 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8">
                                    <Coffee className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-xl mb-4 text-foreground">No awkward tension.</h3>
                                <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">
                                    Walk into your room feeling completely relaxed, knowing you share a fundamental baseline of respect and personal boundaries.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

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
                            <div className="flex items-center gap-4 mb-8">
                                <motion.h2 variants={fadeUp} className="text-3xl sm:text-[2.5rem] font-bold tracking-tight text-foreground leading-[1.1] mb-0">
                                    {howItWorksLang === 'EN' ? 'How it feels mathematically.' : 'Sɛnea akontaabu no si yɛ adwuma.'}
                                </motion.h2>
                                <div className="flex bg-muted p-1 rounded-xl border border-border/50 shrink-0">
                                    <button
                                        onClick={() => setHowItWorksLang('EN')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${howItWorksLang === 'EN' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        EN 🇬🇧
                                    </button>
                                    <button
                                        onClick={() => setHowItWorksLang('TWI')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${howItWorksLang === 'TWI' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        TWI 🇬🇭
                                    </button>
                                </div>
                            </div>
                            <motion.p variants={fadeUp} className="text-lg font-medium text-muted-foreground leading-relaxed mb-16 max-w-lg">
                                {howItWorksLang === 'EN'
                                    ? "We don't just ask if you're clean—we ask what you do when trash is full. Our system securely evaluates your core habits against our campus database."
                                    : "Yɛmfisa wo sɛ wopɛ ahotiee kɛkɛ—yɛfisa wo nea woyɛ sɛ nwura hyɛ ayɛyɛdeɛ mu ma. Yɛn kwan yi hwehwɛ wo suban ankasa ne campus database no kɔ."
                                }
                            </motion.p>

                            <div className="relative border-l border-border ml-4 space-y-14">
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col">
                                    <span className="absolute -left-[17px] top-1 w-8 h-8 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-[11px] font-bold text-primary">1</span>
                                    <h3 className="font-bold text-xl text-foreground mb-2">
                                        {howItWorksLang === 'EN' ? 'Take Vibe Check' : 'Yɛ Vibe Check no'}
                                    </h3>
                                    <p className="font-medium text-muted-foreground text-[15px] leading-relaxed">
                                        {howItWorksLang === 'EN'
                                            ? 'A highly curated lifestyle questionnaire mapping out how you genuinely prefer to live.'
                                            : 'Lifestyle questionnaire a yɛayɛ no paawa a ɛhwehwɛ sɛnea wopɛ sɛ wotena.'
                                        }
                                    </p>
                                </motion.div>
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col">
                                    <span className="absolute -left-[17px] top-1 w-8 h-8 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-[11px] font-bold text-primary">2</span>
                                    <h3 className="font-bold text-xl text-foreground mb-2">
                                        {howItWorksLang === 'EN' ? 'Match Scoring' : 'Nya wo Matches'}
                                    </h3>
                                    <p className="font-medium text-muted-foreground text-[15px] leading-relaxed">
                                        {howItWorksLang === 'EN'
                                            ? 'Our engine instantly calculates behavioral compatibility across 40+ distinct pressure points.'
                                            : 'Yɛn kwan no hwehwɛ wo suban ne afoforo deɛ kɔ point 40 a ɛho hia paa.'
                                        }
                                    </p>
                                </motion.div>
                                <motion.div variants={fadeUp} className="relative pl-12 flex flex-col">
                                    <span className="absolute -left-[17px] top-1 w-8 h-8 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center text-[11px] font-bold text-primary">3</span>
                                    <h3 className="font-bold text-xl text-foreground mb-2">
                                        {howItWorksLang === 'EN' ? 'Secure Connect' : 'Hyɛ aseɛ kasa'}
                                    </h3>
                                    <p className="font-medium text-muted-foreground text-[15px] leading-relaxed">
                                        {howItWorksLang === 'EN'
                                            ? 'Unlock profiles and message matches who share your lifestyle benchmarks for a peaceful room.'
                                            : 'Message obi a ne suban yɛ pɛ tɛ wo deɛ na mo mmienu anya kwan a asomdwoeɛ wɔ mu.'
                                        }
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* 5. PRICING SECTION */}
                <motion.section
                    id="pricing"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="w-full py-24 sm:py-32 relative border-t border-border"
                >
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div variants={fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight mb-6 text-foreground">Simple, transparent Verification Fee.</h2>
                            <p className="text-muted-foreground text-[17px] font-medium leading-relaxed">To keep platform organically free of bots, ghosts, and intrusive ads, we charge a microscopic verification fee. No subscriptions. No hidden costs.</p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Savings Image */}
                            <div className="relative order-2 lg:order-1">
                                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-border bg-card">
                                    <img
                                        src="/Savings.png"
                                        alt="Student Savings"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
                                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            </div>

                            {/* Pricing Card */}
                            <div className="bg-card rounded-[2.5rem] shadow-xl border border-border p-8 sm:p-12 flex flex-col order-1 lg:order-2">
                                <span className="px-4 py-1.5 rounded-2xl bg-primary/10 text-primary text-[12px] font-bold mb-6 tracking-wide w-fit">ONE-TIME FEE</span>

                                <div className="flex items-start justify-center gap-1 mb-4">
                                    <span className="text-xl font-bold text-muted-foreground mt-2">GHS</span>
                                    <span className="text-[5rem] font-extrabold text-foreground leading-none tracking-tight">25</span>
                                </div>

                                <p className="text-muted-foreground font-medium text-[15px] mb-8 pb-8 border-b border-border">It gives you access to system and you will find your roommates within 60 days.</p>

                                {/* Enhanced Discount Code Banner */}
                                <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 rounded-2xl p-5 mb-8 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="flex items-center justify-center gap-3 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[15px] font-bold text-foreground">Use any discount code you can find for GHS 10 off!</p>
                                        </div>
                                    </div>
                                </div>

                                <ul className="w-full space-y-4 mb-10 text-left">
                                    <li className="flex items-center gap-3 text-[15px] font-medium text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        Full database compatibility matching
                                    </li>
                                    <li className="flex items-center gap-3 text-[15px] font-medium text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        Unlimited safe matchmaking blocks
                                    </li>
                                    <li className="flex items-center gap-3 text-[15px] font-medium text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        Zero ads. Zero recurring charges.
                                    </li>
                                </ul>

                                <Link to="/auth" className="w-full py-6 rounded-[22px] bg-foreground text-background font-black text-[16px] transition-transform hover:scale-[1.02] active:scale-95 shadow-xl flex justify-center items-center uppercase tracking-widest">
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* 6. FAQ SECTION */}
                <motion.section
                    id="faq"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="w-full max-w-7xl mx-auto px-6 py-24 sm:py-32"
                >
                    <motion.div variants={fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-[2.5rem] font-bold tracking-tight mb-6 text-foreground">Answers to your questions.</h2>
                        <p className="text-muted-foreground text-[17px] font-medium leading-relaxed">Everything you need to know about product and how we keep our ecosystem incredibly safe.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl mx-auto text-left">
                        <motion.div variants={fadeUp}>
                            <h4 className="text-lg font-bold text-foreground mb-3">Is it really a one-time fee?</h4>
                            <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">Yes. We absolutely hate predatory SaaS subscriptions as much as you do. You pay once for academic year and unlock total matching access.</p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-lg font-bold text-foreground mb-3">How are profiles verified?</h4>
                            <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">We verify users who sign up with valid student email addresses. While anyone can join, having a verified badge builds massive trust in ecosystem.</p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-lg font-bold text-foreground mb-3">How does 40+ point algorithm work?</h4>
                            <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">Inside app, you take a highly specific "vibe check". We calculate your daily cadence, cleanliness tolerance, and boundaries, mapping them securely against potential matches.</p>
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <h4 className="text-lg font-bold text-foreground mb-3">What universities do you support?</h4>
                            <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">We are rapidly expanding globally. As long as you have a valid Campus email to prove you are a student, our algorithmic matching engine works for you.</p>
                        </motion.div>
                    </div>
                </motion.section>

            </main>

            {/* 6. CLEAN MINIMAL FOOTER */}
            <footer className="w-full bg-card border border-border pt-20 pb-12 rounded-[2.5rem] mx-auto max-w-[calc(100%-2rem)] mb-4 shadow-xl">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-1 sm:col-span-2">
                            <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => scrollTo('hero')}>
                                <span className="font-bold text-xl tracking-tight text-foreground">Roommate Link</span>
                            </div>
                            <p className="text-[15px] font-medium text-muted-foreground max-w-sm leading-relaxed mb-8">
                                A revolutionary algorithm designed exclusively for university students. Eradicating terrible living situations, one perfectly matched dorm at a time.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-12 h-12 flex items-center justify-center bg-muted rounded-[22px] hover:bg-foreground hover:text-background transition-all text-foreground shadow-sm"><InstagramIcon /></a>
                                <a href="#" className="w-12 h-12 flex items-center justify-center bg-muted rounded-[22px] hover:bg-foreground hover:text-background transition-all text-foreground shadow-sm"><TwitterIcon /></a>
                                <a href="#" className="w-12 h-12 flex items-center justify-center bg-muted rounded-[22px] hover:bg-foreground hover:text-background transition-all text-foreground shadow-sm"><LinkedinIcon /></a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-foreground font-bold text-[15px] mb-6 tracking-wide">Product</h4>
                            <ul className="space-y-4 text-[14px] font-medium">
                                <li><button onClick={() => scrollTo('how-it-works')} className="text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent p-0 text-left">Algorithm</button></li>
                                <li><button onClick={() => scrollTo('pricing')} className="text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent p-0 text-left">Pricing</button></li>
                                <li><button onClick={() => scrollTo('problem')} className="text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent p-0 text-left">The Problem</button></li>
                                <li><Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">Get Started</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-foreground font-bold text-[15px] mb-6 tracking-wide">Legal</h4>
                            <ul className="space-y-4 text-[14px] font-medium">
                                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                                <li><Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Contact Support</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="w-full border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground">
                        <p>© 2026 Roommate Link. All rights reserved.</p>
                        <p>Proudly built for University students worldwide.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
