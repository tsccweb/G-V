import React from 'react';
import useAuthStore from '../store/authStore';
import { LogOut, User as UserIcon } from 'lucide-react';

function Settings() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500 pb-24 md:pb-12 h-screen">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 font-medium">Manage your profile and account preferences.</p>
      </header>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl space-y-8">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-8">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border border-zinc-700">
            <UserIcon size={32} className="text-zinc-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-zinc-400 font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6 text-zinc-400">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black rounded-2xl border border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Role</p>
              <p className="text-lg font-bold text-white">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="p-4 bg-black rounded-2xl border border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Plan</p>
              <p className="text-lg font-bold text-white">{user?.plan}</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-colors active:scale-95"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
