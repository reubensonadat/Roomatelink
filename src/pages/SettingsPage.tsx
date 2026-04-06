import { Shield, FileText, Bell, Lock, UserX, Moon, Sun, GraduationCap, ChevronRight, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TopHeader } from '../components/layout/TopHeader';

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  // Modals state
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStep, setVerificationStep] = useState<'email' | 'code'>('email');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to sign out fully');
    } finally {
      setIsLoggingOut(false);
      setIsLogoutOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE' || !user) return;
    setIsDeleting(true);
    try {
      // 1. Call Secure Edge Function with a strict 15s timeout
      const invokePromise = supabase.functions.invoke('delete-account', { body: {} });
      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("TimeoutError")), 15000)
      );

      const { error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) {
        console.error('Edge Function Deletion error:', error);
        toast.error('Could not wipe all data. Contact support.');
      } else {
        // 2. Clear ALL local caches
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('roommate_') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }

        // 3. Final Sign Out
        await signOut();
        navigate('/auth');
        toast.success('Account permanently cleared');
      }
    } catch (err: any) {
      console.error('Account deletion failure:', err);
      if (err?.name === 'AbortError') {
        toast.error('Deletion timed out. Please try again or contact support.');
      } else {
        toast.error('Sync error during account deletion');
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Reset link sent! Check your email.');
      }
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyEmail = async () => {
    // Step 1: UCC Domain Validation & Send Code
    if (verificationStep === 'email') {
      if (!manualEmail.endsWith('stu.ucc.edu.gh')) {
        toast.error('Only @stu.ucc.edu.gh emails are supported for this launch phase.');
        return;
      }
      setIsVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke('verify-student', {
          body: { action: 'SEND_CODE', email: manualEmail, userId: user?.id }
        });

        if (error) throw error;

        if (data?.error === 'SERVICE_BUSY') {
          toast.error(data.message, { duration: 6000 });
          return;
        }

        setVerificationStep('code');
        toast.info('Verification token sent to your student mail.');
      } catch (err: any) {
        toast.error(err.message || 'Verification service unreachable.');
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    // Step 2: Code Validation
    if (verificationCode.length < 6) {
      toast.error('Please enter the 6-digit token.');
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-student', {
        body: { action: 'CONFIRM_CODE', email: manualEmail, code: verificationCode, userId: user?.id }
      });

      if (error) throw error;

      if (data?.error === 'INVALID_CODE') {
        toast.error(data.message);
        return;
      }

      toast.success(`Identity Confirmed! UCC Badge active.`, {
        icon: <GraduationCap className="w-5 h-5 text-white" />
      });
      setIsVerifyModalOpen(false);
      setManualEmail('');
      setVerificationCode('');
      setVerificationStep('email');

      // Refresh to show the badge
      window.location.reload();
    } catch (err: any) {
      toast.error('Verification failed: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
      <TopHeader title="Settings" showBackButton />

      <div className="flex-1 overflow-y-auto w-full md:max-w-2xl lg:max-w-3xl mx-auto px-4 pt-8 pb-32">

        <div className="flex flex-col gap-10">

          {/* Account Settings */}
          <section>
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-3">Account</h2>
            <div className="bg-card rounded-4xl shadow-premium border border-border flex flex-col p-2 gap-1 overflow-hidden">

              <button
                onClick={toggleTheme}
                className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Theme</span>
                    <span className="text-[13px] font-medium text-muted-foreground">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </button>

              <button
                onClick={() => setIsVerifyModalOpen(true)}
                className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <GraduationCap className="w-5 h-5 text-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Student Email</span>
                    <span className="text-[13px] font-medium text-primary">Verify & whitebox identity</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </button>

              <button
                onClick={() => toast.info('Push notifications are coming soon!')}
                className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Notifications</span>
                    <span className="text-[13px] font-medium text-muted-foreground">Manage alerts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </button>

              <button
                onClick={handlePasswordReset}
                disabled={isResetting}
                className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 text-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Security</span>
                    <span className="text-[13px] font-medium text-muted-foreground">Change Password</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </button>

            </div>
          </section>


          {/* Support & Legal */}
          <section>
            <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-3">Support & Legal</h2>
            <div className="bg-card rounded-[22px] shadow-premium border border-border flex flex-col p-2 gap-1 overflow-hidden">
              <Link to="/support" className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group border-b border-border/40 pb-4 mb-1">
                <div className="flex flex-col gap-1 w-full relative">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[16px] bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-foreground">How to Use Roommate Link</span>
                      <span className="text-[12px] font-medium text-muted-foreground">App guide & documentation</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 ml-auto mr-2" />
                  </div>
                </div>
              </Link>

              <Link to="/privacy" className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Shield className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Privacy Policy</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </Link>

              <Link to="/terms" className="flex items-center justify-between p-3 rounded-[18px] hover:bg-muted/50 transition-colors text-left group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <FileText className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-foreground">Terms of Service</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
              </Link>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-[12px] font-bold text-red-500/70 uppercase tracking-widest pl-1 mb-3">Danger Zone</h2>
            <div className="bg-red-500/5 rounded-[22px] border border-red-500/10 flex flex-col p-2 gap-1 overflow-hidden">
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center justify-between p-3 rounded-[18px] hover:bg-red-500/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-red-500/10 flex items-center justify-center transition-colors">
                    <UserX className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-red-500">Delete Account</span>
                    <span className="text-[13px] font-medium text-red-500/70">Wipe all data and vectors</span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Log Out */}
          <div className="mt-4 mb-8 text-center w-full">
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="w-full h-[60px] bg-card border border-border/40 rounded-[22px] shadow-sm text-[15px] font-bold text-foreground active:scale-[0.98] transition-all flex items-center justify-center hover:bg-muted/50"
            >
              Log Out
            </button>
          </div>

        </div>

        {/* --- MODALS --- */}
        <AnimatePresence>
          {isVerifyModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-xl"
                onClick={() => !isVerifying && setIsVerifyModalOpen(false)}
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                className="relative w-full max-w-lg bg-card border-t sm:border border-border/80 rounded-[22px] shadow-premium p-8 md:p-12 mb-0 sm:mb-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[22px] bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                    <GraduationCap className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight uppercase">Student ID Hub</h3>
                  <p className="text-[14px] font-bold text-muted-foreground/70 mb-10 leading-relaxed uppercase tracking-wide">
                    Type your official university email below to synchronize your student status.
                  </p>

                  <div className="w-full space-y-6">
                    <AnimatePresence mode="wait">
                      {verificationStep === 'email' ? (
                        <motion.div
                          key="email"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            placeholder="E.G. NAME@STU.UCC.EDU.GH"
                            className="w-full px-8 py-6 rounded-[22px] bg-muted/40 border border-border focus:border-primary/50 outline-none transition-all font-black text-[15px] uppercase tracking-widest placeholder:text-muted-foreground/30 shadow-inner"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="code"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="0 0 0 0 0 0"
                            className="w-full px-8 py-6 rounded-[22px] bg-muted/40 border border-border focus:border-primary/50 outline-none transition-all font-black text-center text-2xl tracking-[0.6em] shadow-inner"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-4 pt-4">
                      <button
                        onClick={handleVerifyEmail}
                        disabled={isVerifying || (verificationStep === 'email' ? !manualEmail : verificationCode.length < 6)}
                        className="w-full py-6 rounded-[22px] bg-primary text-white font-black text-[15px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                      >
                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : verificationStep === 'email' ? 'Generate Handshake' : 'Finalize Identity'}
                      </button>
                      <button
                        onClick={() => {
                          if (verificationStep === 'code') setVerificationStep('email');
                          else setIsVerifyModalOpen(false);
                        }}
                        disabled={isVerifying}
                        className="w-full py-5 rounded-[22px] bg-muted/40 text-muted-foreground font-black text-[12px] hover:text-foreground transition-all active:scale-[0.98] uppercase tracking-[0.3em]"
                      >
                        {verificationStep === 'code' ? 'Reverse' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {isLogoutOpen && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-xl"
                onClick={() => !isLoggingOut && setIsLogoutOpen(false)}
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full max-w-sm bg-card border-t sm:border border-border/80 shadow-premium rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-muted/40 rounded-[22px] flex items-center justify-center mb-6">
                  <LogOut className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2 tracking-tight uppercase">Terminate Session</h3>
                <p className="text-[13px] font-bold text-muted-foreground/60 mb-8 uppercase tracking-widest">Are you sure you want to exit?</p>
                
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full py-5 rounded-[22px] bg-red-500 text-white font-black text-[14px] shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Log Out Now'}
                  </button>
                  <button
                    onClick={() => setIsLogoutOpen(false)}
                    disabled={isLoggingOut}
                    className="w-full py-4 rounded-[22px] text-muted-foreground font-black text-[12px] hover:text-foreground transition-all uppercase tracking-[0.2em]"
                  >
                    Hold on
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isDeleteOpen && (
            <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => !isDeleting && setIsDeleteOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-card border border-border/60 shadow-2xl rounded-3xl p-6 relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">Delete Account?</h2>
                <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
                  This action is <span className="text-red-500 font-bold">permanent</span>. All your matches, messages, and algorithm vectors will be wiped from our database.
                </p>

                <div className="w-full text-left mb-6">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider pl-1 mb-2 block">Type "DELETE" to confirm</label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteInput !== 'DELETE'}
                    className="w-full py-3.5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center disabled:opacity-40"
                  >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Permanently Delete"}
                  </button>
                  <button
                    onClick={() => !isDeleting && setIsDeleteOpen(false)}
                    disabled={isDeleting}
                    className="w-full py-3.5 bg-muted text-foreground font-bold rounded-2xl hover:bg-muted/80 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
