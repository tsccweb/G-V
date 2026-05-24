import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { UserPlus, Eye, EyeOff, Mail, Phone, User, Shield, ArrowRight, Chrome, AlertCircle, Gift } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: '',
    role: 'MEMBER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const { user, register, googleLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      toast.success('🎉 Welcome! You have 1 month FREE access to Standard plan!', {
        duration: 6000,
        icon: <Gift size={20} className="text-yellow-400" />
      });
      setTimeout(() => navigate('/'), 1500);
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return alert('Passwords do not match');
    }
    await register(formData);
  };

  const gLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      googleLogin({ accessToken: codeResponse.access_token });
    },
    onError: (error) => console.log('Registration Failed:', error)
  });

  const roles = [
    { value: 'MEMBER', label: 'Regular Member' },
    { value: 'MUSICIAN', label: 'Musician' },
    { value: 'WORSHIP_LEADER', label: 'Worship Leader' },
    { value: 'PASTOR', label: 'Pastor' },
  ];

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6 bg-black text-white selection:bg-white selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-900/40 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative"
      >
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent inline-block"
          >
            {'G>/\\V'}
          </motion.h2>
          <p className="text-zinc-500 font-medium tracking-tight mt-2 uppercase text-[10px] tracking-[0.3em]">Join the Worship Ministry</p>
        </div>

        <div className="p-8 md:p-12 bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">Create Account</h3>
            <p className="text-zinc-500 text-sm">Join the group and start managing your worship flows.</p>
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Ministry Role</label>
                <select name="role" value={formData.role} onChange={handleChange}
                  className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all appearance-none">
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 overflow-hidden">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                    className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                    required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                    required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-5 bg-white text-black font-black rounded-[2rem] hover:bg-zinc-200 shadow-xl shadow-white/5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-zinc-900/40 px-6 text-zinc-600 font-black">Or Join Instantly</span>
            </div>
          </div>

          <button
            onClick={() => gLogin()}
            className="w-full py-5 bg-zinc-950 border border-zinc-800 rounded-[2rem] text-sm font-bold text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all flex items-center justify-center gap-3 group relative overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Chrome size={22} />
            <span>Sign up with Google</span>
          </button>
        </div>

        <p className="text-center mt-12 text-sm text-zinc-500 font-medium">
          Already a group member?{' '}
          <Link to="/login" className="text-white font-black hover:underline underline-offset-4 decoration-2">
            {'Sign In'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
