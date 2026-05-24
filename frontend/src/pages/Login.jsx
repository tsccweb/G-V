import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ArrowRight, Chrome, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const gLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      googleLogin({ accessToken: codeResponse.access_token });
    },
    onError: () => toast.error('Login failed. Please try again.')
  });

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6 bg-black text-white selection:bg-white selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-900/40 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent inline-block"
          >
            {'G>/\\V'}
          </motion.h2>
          <p className="text-zinc-500 font-medium tracking-tight mt-2 uppercase text-[10px] tracking-[0.3em]">Psalms Worship PWA</p>
        </div>

        <div className="p-8 md:p-10 bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">Welcome Back</h3>
            <p className="text-zinc-500 text-sm">Access your worship library and flows.</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end px-1">
                <Link to="/forgot-password" core="sm" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest cursor-pointer">Forgot Password?</Link>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 shadow-xl shadow-white/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-zinc-900/40 px-4 text-zinc-600 font-bold">Secure Social Access</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => gLogin()}
              className="w-full py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all flex items-center justify-center gap-3 group relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Chrome size={20} className="text-white" />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-10 text-sm text-zinc-500 font-medium">
          New to the ministry?{' '}
          <Link to="/register" className="text-white font-black hover:underline underline-offset-4 decoration-2">
            {'Join G>/\\V'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
