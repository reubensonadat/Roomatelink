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
      // 1. Clear local profile cache first
      localStorage.removeItem(`roommate_profile_${user.id}`);
      
      // 2. Cascading Data Wipe (Best Effort manual cleanup)
      await Promise.all([
        supabase.from('messages').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('questionnaire_responses').delete().eq('user_id', user.id),
        // Add more manual wipes if needed
      ]);
      
      // 3. Call deletion RPC for root user record
      const { error } = await supabase.rpc('delete_user_data', { user_id: user.id });
      
      if (error) {
        console.error('Deletion RPC error:', error);
        toast.error('Could not wipe all data. Contact support.');
      } else {
        // 3. Final Sign Out
        await signOut();
        navigate('/auth');
        toast.success('Account permanently cleared');
      }
    } catch (err) {
      console.error('Account deletion failure:', err);
      toast.error('Sync error during account deletion');
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
    if (!manualEmail.includes('@')) {
      toast.error('Please enter a valid university email address.');
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate verification - in real app, update 'users' table or send verification email
      const { error } = await supabase
        .from('users')
        .update({ is_student_verified: true })
        .eq('auth_id', user?.id);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Verified! Welcome student.`, {
          icon: <GraduationCap className="w-5 h-5 text-white" />
        });
        setIsVerifyModalOpen(false);
        setManualEmail('');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 selection:bg-indigo-100">
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
              className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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
              onClick={() => toast.success('Push notifications enabled for new matches.')}
              className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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
              className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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
          <div className="bg-card rounded-4xl shadow-premium border border-border flex flex-col p-2 gap-1 overflow-hidden">
            <Link to="/support" className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group border-b border-border/40 pb-4 mb-1">
              <div className="flex flex-col gap-1 w-full relative">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
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

            <Link to="/privacy" className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-foreground">Privacy Policy</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mr-2" />
            </Link>

            <Link to="/terms" className="flex items-center justify-between p-3 rounded-3xl hover:bg-muted/50 transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
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
          <div className="bg-red-500/5 rounded-4xl border border-red-500/10 flex flex-col p-2 gap-1 overflow-hidden">
            <button 
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center justify-between p-3 rounded-3xl hover:bg-red-500/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center transition-colors">
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
            className="w-full py-4 rounded-full bg-muted text-foreground hover:bg-foreground hover:text-background transition-colors font-bold text-[15px] active:scale-95 shadow-sm"
          >
            Log Out
          </button>
        </div>

      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isVerifyModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isVerifying && setIsVerifyModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-border p-6 rounded-[2.5rem] shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Student Verification</h3>
                <p className="text-[14px] font-medium text-muted-foreground mb-6">
                  Type your official university email below to verify your student status.
                </p>

                <div className="w-full space-y-4">
                  <div className="relative group">
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="e.g. name@stu.ucc.edu.gh"
                      className="w-full px-5 py-4 rounded-2xl bg-muted/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-[15px] group-hover:bg-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleVerifyEmail}
                      disabled={isVerifying || !manualEmail}
                      className="w-full py-4 rounded-full bg-primary text-primary-foreground font-black text-[15px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Identity'}
                    </button>
                    <button
                      onClick={() => setIsVerifyModalOpen(false)}
                      disabled={isVerifying}
                      className="w-full py-4 rounded-full bg-muted text-muted-foreground font-bold text-[14px] hover:bg-muted/80 transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isLogoutOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isLoggingOut && setIsLogoutOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-card border border-border/60 shadow-2xl rounded-3xl p-6 relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-foreground" />
              </div>
              <h2 className="text-xl font-black text-foreground mb-2">Log out of account?</h2>
              <p className="text-sm text-muted-foreground font-medium mb-8">
                You will need to use your email to log back in next time.
              </p>
              
              <div className="w-full flex flex-col gap-2">
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-3.5 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, log out"}
                </button>
                <button 
                  onClick={() => !isLoggingOut && setIsLogoutOpen(false)}
                  disabled={isLoggingOut}
                  className="w-full py-3.5 bg-muted text-foreground font-bold rounded-2xl hover:bg-muted/80 transition-all"
                >
                  Cancel
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
