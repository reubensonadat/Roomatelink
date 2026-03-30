"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, GraduationCap, ChevronRight, Users, Check, ArrowLeft, Edit } from 'lucide-react';
import Image from 'next/image';

const STORAGE_KEY = 'roommate_profile_data';
const AVATAR_LABELS: Record<string, string> = {
    'academic-m': 'The Academic',
    'athlete-m': 'The Athlete',
    'creative-m': 'The Creative',
    'eco-m': 'The Eco-Conscious',
    'gamer-m': 'The Gamer',
    'minimalist-m': 'The Minimalist',
    'nightowl-m': 'The Night Owl',
    'socialite-m': 'The Socialite',
    'academic-f': 'The Academic',
    'athlete-f': 'The Athlete',
    'creative-f': 'The Creative',
    'eco-f': 'The Eco-Conscious',
    'gamer-f': 'The Gamer',
    'minimalist-f': 'The Minimalist',
    'nightowl-f': 'The Night Owl',
    'socialite-f': 'The Socialite',
};

export default function ProfileReviewPage() {
    const [profile, setProfile] = useState<any>(null);
    const [ready, setReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setProfile(data);
                setReady(true);
            } catch (e) {
                console.error('Error parsing profile data');
            }
        }
    }, []);

    const handleConfirm = () => {
        router.push('/questionnaire');
    };

    const handleEdit = () => {
        router.push('/dashboard/profile');
    };

    if (!ready || !profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const isComplete = profile.gender && profile.level && profile.matchPref && profile.displayName?.trim()?.length > 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-4 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors group active:scale-95 shadow-sm"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[20px] font-bold text-foreground">Review Your Profile</h1>
                        <span className="text-[12px] text-muted-foreground font-medium">
                            Confirm your details before starting the questionnaire
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 rounded-xl border border-border/50">
                        <Edit className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Edit</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-5 py-8 max-w-2xl mx-auto pb-32">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-card rounded-[2rem] shadow-lg border border-border overflow-hidden"
                >
                    {/* Avatar Section */}
                    <div className="bg-linear-to-br from-primary/5 to-violet-500/5 p-8 flex flex-col items-center border-b border-border/40">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-card border-4 border-background shadow-xl overflow-hidden relative">
                                {profile.selectedAvatar ? (
                                    profile.selectedAvatar.startsWith('data:') ? (
                                        <img src={profile.selectedAvatar} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <Image src={profile.selectedAvatar} alt="Avatar" fill className="object-cover" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                        <User className="w-10 h-10 text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>
                            {profile.selectedAvatar && (
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white px-3 py-1 rounded-2xl text-[10px] font-black shadow-lg z-10">
                                    Avatar
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-6 sm:p-8 flex flex-col gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Display Name</p>
                                    <p className="text-[15px] font-bold text-foreground">{profile.displayName || 'Not set'}</p>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Gender</p>
                                    <p className="text-[15px] font-bold text-foreground">{profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Not set'}</p>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                                <p className="text-[14px] text-foreground leading-relaxed">{profile.bio || 'No bio provided'}</p>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Academic Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Programme</p>
                                    <p className="text-[15px] font-bold text-foreground">{profile.course || 'Not set'}</p>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Level</p>
                                    <p className="text-[15px] font-bold text-foreground">{profile.level || 'Not set'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Matching Preferences */}
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                Matching Preferences
                            </h3>

                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Gender Preference</p>
                                <p className="text-[15px] font-bold text-foreground">
                                    {profile.matchPref === 'same'
                                        ? 'Same gender only'
                                        : profile.matchPref === 'any'
                                            ? 'Any gender'
                                            : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Confirmation Actions */}
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={!isComplete}
                        className={`w-full py-4 rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isComplete
                                ? 'bg-foreground text-background shadow-lg hover:scale-[1.02]'
                                : 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Check className="w-5 h-5" />
                        Confirm & Start Questionnaire
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-foreground">You can edit your profile later</span>
                        <span className="text-[12px] text-muted-foreground leading-relaxed">
                            Your profile information can be changed from the Settings page at any time. The questionnaire uses your current profile data to find compatible roommates.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
