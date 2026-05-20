import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: '',
    role: 'MEMBER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuthStore();

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

  const roles = [
    { value: 'MEMBER', label: 'Regular Member' },
    { value: 'MUSICIAN', label: 'Musician' },
    { value: 'VOCALIST', label: 'Vocalist' },
    { value: 'WORSHIP_LEADER', label: 'Worship Leader' },
    { value: 'PASTOR', label: 'Pastor' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-black text-white">
      <div className="w-full max-w-lg p-8 space-y-6 bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">{'Join G>/\\V'}</h2>
          <p className="text-zinc-500 mt-1 text-sm">Create your worship team account</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-white bg-red-900/20 border border-red-900/50 rounded-xl">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Middle Name</label>
              <input type="text" name="middleName" value={formData.middleName} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                placeholder="+63..." />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
              required />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Role</label>
            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all">
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Password *</label>
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all pr-10"
                required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-zinc-600 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Confirm *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                required minLength={6} />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-xl shadow-white/5 mt-2">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
