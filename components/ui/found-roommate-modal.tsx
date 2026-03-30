"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Heart, Calendar, Users } from 'lucide-react';

interface FoundRoommateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    dayNumber: number;
}

export function FoundRoommateModal({ isOpen, onClose, onConfirm, dayNumber }: FoundRoommateModalProps) {
    const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);

    const getDayMessage = () => {
        switch (dayNumber) {
            case 7:
                return "It's been a week! Have you found a roommate yet?";
            case 30:
                return "A month has passed! Did you find your perfect match?";
            case 50:
                return "Day 50 - almost two months! Any luck finding a roommate?";
            default:
                return "Have you found a roommate yet?";
        }
    };

    const getDayTitle = () => {
        switch (dayNumber) {
            case 7:
                return "One Week Check-in";
            case 30:
                return "Monthly Update";
            case 50:
                return "50 Day Milestone";
            default:
                return "Roommate Status";
        }
    };

    const handleConfirm = () => {
        if (selectedOption === 'yes') {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
                    />

                    {/* Modal Sheet */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full md:w-[500px] max-w-full bg-card border-t md:border border-border rounded-t-4xl md:rounded-4xl shadow-2xl overflow-hidden pointer-events-auto max-h-[92vh] flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
                            <div className="w-12 h-1.5 rounded-full bg-muted/60" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-bold text-foreground leading-tight">{getDayTitle()}</h2>
                                    <p className="text-[12px] text-muted-foreground font-medium mt-0.5">Day {dayNumber} Check-in</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors active:scale-95"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 custom-scrollbar flex flex-col gap-6">
                            <p className="text-[15px] font-bold text-foreground leading-relaxed">
                                {getDayMessage()}
                            </p>

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setSelectedOption('yes')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedOption === 'yes'
                                        ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                                        : 'border-border/60 bg-card hover:border-emerald-500/30'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedOption === 'yes' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[15px] font-bold text-foreground block">Yes, I found a roommate!</span>
                                        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-tight">Great! We'll mark your profile as found.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedOption('no')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedOption === 'no'
                                        ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                                        : 'border-border/60 bg-card hover:border-amber-500/30'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedOption === 'no' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <X className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[15px] font-bold text-foreground block">Not yet</span>
                                        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-tight">No worries, keep looking! We're here to help.</p>
                                    </div>
                                </button>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selectedOption}
                                    className={`w-full py-4.5 rounded-full font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${!selectedOption
                                        ? 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background shadow-lg shadow-primary/20 active:scale-[0.98]'
                                        }`}
                                >
                                    {selectedOption === 'yes' ? (
                                        <>
                                            <Heart className="w-5 h-5 fill-current" />
                                            <span>Mark as Found</span>
                                        </>
                                    ) : (
                                        <span>Continue Searching</span>
                                    )}
                                </button>
                                <p className="text-[11px] text-muted-foreground text-center mt-4 font-medium px-4 leading-relaxed">
                                    Updating your status helps us keep the community accurate for everyone.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

}
