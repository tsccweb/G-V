import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Zap, Star, ChevronLeft, Loader2, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getPendingRequest, requestUpgrade } from '../services/subscriptionService';

const plans = [
  {
    name: 'FREE',
    price: '₱0',
    period: 'forever',
    icon: Zap,
    color: 'bg-zinc-800 text-zinc-400',
    features: ['Up to 7 songs only', 'Basic Chords & Lyrics', 'Mobile Access', 'All advanced modules locked'],
  },
  {
    name: 'STANDARD',
    price: '₱200',
    period: 'one-time',
    icon: Star,
    color: 'bg-emerald-500/10 text-emerald-400',
    popular: true,
    features: ['Unlimited songs', 'Services & Planning', 'Team Lineup & Roles', 'Worship Flow Planner', 'Live Worship Mode', 'Song Import (File/Web)'],
  },
];

export default function Pricing() {
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [requestLoading, setRequestLoading] = useState(null);

  const { data: pendingReq, isLoading: pendingLoading } = useQuery({
    queryKey: ['subscription', 'pending'],
    queryFn: getPendingRequest,
    enabled: !!user
  });

  const handleSelectPlan = async (plan) => {
    if (plan === 'FREE') {
      try {
        setRequestLoading('FREE');
        await requestUpgrade('FREE');
        await checkAuth();
        navigate('/settings');
      } catch (err) {
        alert('Failed to update plan');
      } finally {
        setRequestLoading(null);
      }
      return;
    }

    try {
      setRequestLoading(plan);
      await requestUpgrade(plan);
      alert('Subscription request submitted! An admin will review it soon.');
      navigate('/settings');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setRequestLoading(null);
    }
  };

  if (pendingLoading) return <div className="flex items-center justify-center h-screen text-zinc-500">Checking subscription status...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 pb-32">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
        <ChevronLeft size={20} /> <span className="text-sm font-bold">Back</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white tracking-tight italic">Level Up Your Ministry</h1>
        <p className="text-zinc-500 mt-3 max-w-md mx-auto text-sm">
          Simple pricing. All features unlocked with a one-time payment of ₱200.
        </p>
      </div>

      {pendingReq && (
        <div className="mb-12 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black">
              <Loader2 className="animate-spin" size={20} />
            </div>
            <div>
              <p className="text-emerald-400 font-black text-sm uppercase tracking-wider">Request Pending Approval</p>
              <p className="text-zinc-400 text-xs mt-0.5">Upgrade to <span className="text-white font-bold">{pendingReq.plan}</span> is being processed.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = user?.plan === plan.name;
          const isRequested = pendingReq?.plan === plan.name;
          const isLoading = requestLoading === plan.name;

          return (
            <div key={plan.name}
              className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${plan.popular
                  ? 'bg-zinc-900 border-emerald-500/50 shadow-2xl shadow-emerald-500/5 z-10'
                  : 'bg-zinc-950/50 border-zinc-800'
                }`}>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.color} mb-6 shadow-xl`}>
                <Icon size={28} />
              </div>

              <h2 className="text-2xl font-black text-white italic tracking-tighter">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mt-1 mb-8">
                <span className="text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest opacity-60 ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-4 flex-1 mb-10">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-3 text-sm leading-relaxed font-medium ${plan.name === 'FREE' && f.includes('locked') ? 'text-zinc-600 italic' : 'text-zinc-400'}`}>
                    <div className={`p-0.5 rounded-full mt-1 ${plan.name === 'FREE' && f.includes('locked') ? 'bg-zinc-800 text-zinc-600' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {plan.name === 'FREE' && f.includes('locked') ? <Lock size={10} /> : <Check size={12} />}
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                disabled={isCurrent || isRequested || isLoading}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 ${isCurrent
                    ? 'bg-zinc-800 text-zinc-500 cursor-default'
                    : isRequested
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                      : plan.popular
                        ? 'bg-white text-black hover:bg-zinc-200'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> :
                  isCurrent ? 'Current Plan' :
                    isRequested ? 'Requested' :
                      `Get ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-12 text-center text-[11px] text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
        One-time payment verified manually by ministry admins. After requesting Standard, please contact your ministry head for payment details.
      </p>
    </div>
  );
}
