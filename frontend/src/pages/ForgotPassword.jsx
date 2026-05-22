import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, ShieldCheck, MailCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, verifyOTP, resetPassword, forgotLoading, error } = useAuthStore();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    console.log('Sending OTP for:', email);
    setLocalError(null);
    try {
      const success = await forgotPassword(email);
      console.log('OTP Send Success:', success);
      if (success) {
        setStep(2);
      }
    } catch (err) {
      console.error('handleSendOTP Error:', err);
      setLocalError('An unexpected error occurred. Please try again.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const valid = await verifyOTP(email, otp);
    if (valid) setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    const success = await resetPassword(email, otp, newPassword);
    if (success) setStep(4);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6 bg-black text-white selection:bg-white selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-900/40 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-block">
            <h2 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              {'G>/\\V'}
            </h2>
          </Link>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Account Recovery</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-10">
          <AnimatePresence mode="wait">
            {(error || localError) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error || localError}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" {...containerVariants}>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Forgot Password?</h3>
                  <p className="text-zinc-500 text-sm mt-1">Enter your email and we'll send you an OTP code.</p>
                </div>
                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm transition-all focus:border-zinc-500 outline-none"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                  <button
                    disabled={forgotLoading}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {forgotLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send OTP Code'}
                    {!forgotLoading && <ArrowRight size={18} />}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...containerVariants}>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    <MailCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Check your Email</h3>
                  <p className="text-zinc-500 text-sm mt-1">We've sent a code to <span className="text-zinc-300">{email}</span></p>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 text-center block">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-5 py-5 bg-black border border-zinc-800 rounded-2xl text-2xl font-black text-center tracking-[0.5em] transition-all focus:border-emerald-500 outline-none"
                      placeholder="000000"
                      required
                    />
                  </div>
                  <button
                    disabled={forgotLoading}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {forgotLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Verify Code'}
                  </button>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={() => forgotPassword(email)}
                      className="w-full text-xs font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Didn't get the code? <span className="text-emerald-500">Resend OTP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Email
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" {...containerVariants}>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Protect Account</h3>
                  <p className="text-zinc-500 text-sm mt-1">Create a new secure password for your account.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm transition-all focus:border-zinc-500 outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm transition-all focus:border-zinc-500 outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    disabled={forgotLoading}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {forgotLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Reset Password'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" {...containerVariants} className="text-center py-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Password Reset!</h3>
                <p className="text-zinc-500 text-sm mt-2 mb-8 px-6">Your password has been updated securely. You can now sign in with your new credentials.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  Return to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-sm text-zinc-500 font-medium">
          Remember your password?{' '}
          <Link to="/login" className="text-white font-black hover:underline underline-offset-4 decoration-2">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
