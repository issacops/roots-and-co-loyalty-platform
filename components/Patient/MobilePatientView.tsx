import React, { useState, useEffect } from 'react';
import { User, Wallet, Transaction, FamilyGroup, Tier, TransactionType } from '../../types';
import { TIER_THRESHOLDS, TIER_REWARDS } from '../../constants';
import { Home, Wallet as WalletIcon, User as UserIcon, Lock, Sparkles, TrendingUp, History, CreditCard, ChevronRight, ShieldCheck, Smile, Stethoscope, Calendar, CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

interface Props {
   currentUser: User;
   users: User[];
   wallets: Wallet[];
   transactions: Transaction[];
   familyGroups: FamilyGroup[];
}

const ToothIllustration = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 10C20 10 10 20 10 35C10 45 15 50 15 60C15 75 5 80 5 95C5 98 15 100 25 90C30 92 35 95 50 95C65 95 70 92 75 90C85 100 95 98 95 95C95 80 85 75 85 60C85 50 90 45 90 35C90 20 80 10 70 10C60 10 55 15 50 20C45 15 40 10 30 10Z" />
   </svg>
);

const MobilePatientView: React.FC<Props> = ({ currentUser, users, wallets, transactions, familyGroups }) => {
   const [activeTab, setActiveTab] = useState<'HOME' | 'WALLET' | 'CARE' | 'PROFILE'>('HOME');

   // Helper Logic
   const family = currentUser.familyGroupId
      ? familyGroups.find(f => f.id === currentUser.familyGroupId)
      : null;

   const headUserId = family ? family.headUserId : currentUser.id;
   const headUser = users.find(u => u.id === headUserId) || currentUser;
   const wallet = wallets.find(w => w.userId === headUserId);
   const familyMembers = family
      ? users.filter(u => u.familyGroupId === family.id)
      : [currentUser];

   // Tier Calculation
   const currentSpend = headUser.lifetimeSpend;
   const nextTier = headUser.currentTier === Tier.MEMBER ? Tier.GOLD : (headUser.currentTier === Tier.GOLD ? Tier.PLATINUM : Tier.PLATINUM);
   const nextThreshold = TIER_THRESHOLDS[nextTier];
   const progress = Math.min(100, (currentSpend / (headUser.currentTier === Tier.PLATINUM ? 100000 : nextThreshold)) * 100);
   const remaining = Math.max(0, nextThreshold - currentSpend);

   // Animation State
   const [animatedProgress, setAnimatedProgress] = useState(0);

   useEffect(() => {
      // Trigger animation after mount
      const timer = setTimeout(() => setAnimatedProgress(progress), 100);
      return () => clearTimeout(timer);
   }, [progress]);

   const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

   // Transaction Logic: Filter & Sort Descending by Date
   const patientTransactions = transactions
      .filter(t => t.walletId === wallet?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   // --- MOCK CARE DATA ---
   // In a real app, this would come from the backend linked to the patient's ID
   const activeTreatment = {
      title: "Invisalign® Journey",
      provider: "Dr. Alda Davis",
      startDate: "2023-10-01",
      totalSets: 24,
      currentSet: 4,
      daysPerSet: 14,
      daysInCurrentSet: 12, // 2 days left
      nextAppointment: "2023-11-15T10:00:00",
   };

   const aftercareCards = [
      {
         id: 1,
         type: 'ACTION',
         title: 'Switch to Set #5',
         desc: 'You are due to change your aligners in 2 days. Make sure to use your chewies to seat them properly.',
         icon: <TrendingUp size={18} className="text-white" />,
         color: 'bg-blue-600'
      },
      {
         id: 2,
         type: 'INFO',
         title: 'Managing Soreness',
         desc: 'It is normal to feel pressure for 24-48 hours after a new set. If pain persists, take a mild analgesic.',
         icon: <AlertCircle size={18} className="text-white" />,
         color: 'bg-rose-500'
      },
      {
         id: 3,
         type: 'TIP',
         title: 'Hygiene Tip',
         desc: 'Always rinse your aligners with cold water. Hot water can warp the plastic.',
         icon: <Sparkles size={18} className="text-white" />,
         color: 'bg-amber-500'
      }
   ];

   // Visual Assets Helpers
   const getTierColor = () => {
      switch (headUser.currentTier) {
         case Tier.PLATINUM: return 'from-stone-100 via-white to-stone-200 text-stone-900';
         case Tier.GOLD: return 'from-[#fef3c7] via-[#fffbeb] to-[#fde68a] text-[#78350f]';
         default: return 'from-stone-400 to-stone-500 text-white';
      }
   };

   const getTierShadow = () => {
      switch (headUser.currentTier) {
         case Tier.PLATINUM: return 'shadow-stone-500/20';
         case Tier.GOLD: return 'shadow-amber-500/20';
         default: return 'shadow-stone-500/10';
      }
   };

   return (
      <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden font-sans">

         {/* BACKGROUND ELEMENTS - Premium Washi Texture feel */}
         <div className="absolute top-0 left-0 w-full h-full bg-[#fafaf9] pointer-events-none" />
         {/* BACKGROUND ELEMENTS - Premium Washi Texture feel */}
         <div className="absolute top-0 left-0 w-full h-full bg-[#fafaf9] pointer-events-none" />
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#e7e5e4] to-transparent pointer-events-none opacity-50" />

         {/* Creative Watermark */}
         <img src="/logo.jpg" alt="" className="absolute -right-24 -top-24 w-96 opacity-[0.07] rotate-12 mix-blend-multiply pointer-events-none blur-[1px]" />

         {/* HEADER - Glassmorphism */}
         <header className="px-6 pt-12 pb-4 glass shrink-0 z-20 sticky top-0 flex justify-between items-center transition-all duration-300 border-none bg-white/80 backdrop-blur-xl">
            <div className="flex-1">
               {/* HTML Logo Recreation */}
               <div className="flex items-center gap-1 -ml-1">
                  <span className="font-serif text-2xl font-semibold text-[#1c1917]">Roots</span>
                  <div className="relative h-6 w-6 text-[#1c1917]">
                     <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full">
                        <path d="M30 20C20 20 10 30 10 45C10 55 15 60 15 70C15 85 5 90 5 95C5 98 15 100 25 90C30 92 35 95 50 95C65 95 70 92 75 90C85 100 95 98 95 95C95 80 85 75 85 60C85 50 90 45 90 35C90 20 80 10 70 20C60 10 55 15 50 20C45 15 40 10 30 20Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M30 20C40 30 40 50 50 60C60 50 60 30 70 20" strokeWidth="4" className="opacity-50" />
                     </svg>
                  </div>
                  <span className="font-serif text-2xl font-semibold text-[#1c1917]">Co.</span>
               </div>
               <p className="text-[8px] font-bold text-[#78716c] tracking-[0.3em] uppercase ml-1 mt-0.5">Dentistry</p>

               <div className="flex items-center gap-2 mt-2 ml-1">
                  <h1 className="text-xl font-bold text-[#292524] tracking-tight font-sans">
                     Hi, {currentUser.name.split(' ')[0]}
                  </h1>
               </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#e7e5e4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-white/50 flex items-center justify-center overflow-hidden">
               <div className="h-full w-full flex items-center justify-center text-[#57534e] font-bold font-serif">
                  {currentUser.name.charAt(0)}
               </div>
            </div>
         </header>

         {/* SCROLLABLE CONTENT */}
         <main className="flex-1 overflow-y-auto px-5 pb-32 pt-4 scroll-smooth no-scrollbar">

            {activeTab === 'HOME' && (
               <div className="space-y-6 fade-in">

                  {/* 1. PREMIUM MEMBERSHIP CARD */}
                  <div className={`relative w-full aspect-[1.6/1] rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 group
                ${headUser.currentTier === Tier.PLATINUM ? 'bg-[#1c1917]' : 'bg-[#1c1917]'} 
                ${getTierShadow()}`}>

                     {/* Background Effects */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
                     {headUser.currentTier === Tier.GOLD && <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>}

                     {/* TOOTH ILLUSTRATION WATERMARK */}
                     <div className="absolute bottom-[-10px] right-[-10px] opacity-10 rotate-12 pointer-events-none">
                        <ToothIllustration className="w-48 h-48 text-white" />
                     </div>

                     {/* Card Top */}
                     <div className="relative z-10 flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <ShieldCheck size={14} className="text-white/60" />
                              <span className="text-xs font-medium text-white/60 tracking-wider uppercase">Smile Tier</span>
                           </div>
                           <h3 className={`text-2xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${getTierColor()}`}>
                              {headUser.currentTier}
                           </h3>
                        </div>
                        <Smile className="text-white/20" />
                     </div>

                     {/* Card Middle - Progress Ring (Subtle) */}
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 z-0 opacity-20 transform scale-150">
                        <svg className="w-24 h-24 transform -rotate-90">
                           <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                           <circle cx="48" cy="48" r="40" stroke="white" strokeWidth="8" fill="transparent"
                              strokeDasharray={251}
                              strokeDashoffset={251 - (251 * animatedProgress) / 100}
                              strokeLinecap="round" />
                        </svg>
                     </div>

                     {/* Card Bottom */}
                     <div className="relative z-10">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Current Reward Rate</p>
                              <p className="text-2xl font-bold text-white">{(TIER_REWARDS[headUser.currentTier] * 100).toFixed(0)}% <span className="text-sm font-medium text-white/50">on Treatments</span></p>
                           </div>
                           {headUser.currentTier !== Tier.PLATINUM && (
                              <div className="text-right">
                                 <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Next Status</p>
                                 <p className="text-sm font-bold text-white">{formatCurrency(remaining)} to <span className={nextTier === Tier.GOLD ? 'text-yellow-400' : 'text-slate-200'}>{nextTier}</span></p>
                              </div>
                           )}
                        </div>
                        {/* Progress Bar Line */}
                        <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${animatedProgress}%` }}></div>
                        </div>
                     </div>
                  </div>

                  {/* 2. BALANCE DISPLAY */}
                  <div className="bg-white rounded-3xl p-1 shadow-sm border border-stone-100">
                     <div className="bg-gradient-to-br from-[#fafaf9] via-white to-white rounded-[20px] p-5">
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-3 bg-[#f5f5f4] rounded-2xl text-[#57534e]">
                              <Smile size={20} />
                           </div>
                           <span className="bg-[#1c1917] text-[#d6d3d1] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                              Locked
                           </span>
                        </div>
                        <div>
                           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Smile Equity</p>
                           <h2 className="text-5xl font-bold text-slate-800 tracking-tighter">
                              {wallet ? Math.floor(wallet.balance) : 0}
                           </h2>
                           <p className="text-sm text-slate-500 mt-2 font-medium">Use for your perfect smile.</p>
                        </div>

                        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                           {['Aligners', 'Whitening', 'Veneers', 'Implants'].map(tag => (
                              <span key={tag} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* 3. FAMILY POOL */}
                  <div className="pt-2">
                     <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="font-bold text-slate-800 text-lg tracking-tight">Household Pool</h3>
                        <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                           {family?.familyName || 'Manage'}
                        </button>
                     </div>

                     <div className="bg-white border border-slate-100 rounded-3xl p-2 shadow-sm space-y-1">
                        {familyMembers.map((member, idx) => (
                           <div key={member.id} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${member.id === currentUser.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                              <div className="flex items-center gap-4">
                                 <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border-2 border-white
                              ${member.id === headUserId ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {member.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{member.name}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                                       {member.id === headUserId ? 'Head of Household' : 'Dependent'}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-bold text-slate-700">{formatCurrency(member.lifetimeSpend)}</p>
                                 <p className="text-[10px] text-slate-400">Total Care Value</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'WALLET' && (
               <div className="space-y-6 fade-in">
                  <div className="flex items-center justify-between">
                     <h3 className="font-bold text-slate-800 text-2xl tracking-tight">Care History</h3>
                     <div className="bg-white border border-slate-200 rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-slate-500">{patientTransactions.length} Visits</span>
                     </div>
                  </div>

                  <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-2">
                     {patientTransactions.map((t, idx) => (
                        <div key={t.id} className="relative pl-8 group">
                           {/* Timeline Dot */}
                           <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-110
                        ${t.type === TransactionType.EARN ? 'bg-green-500' : 'bg-rose-500'}`}></div>

                           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
                              <div className="flex justify-between items-start mb-2">
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                              ${t.type === TransactionType.EARN ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {t.type === TransactionType.EARN ? 'Treatment' : 'Redemption'}
                                 </span>
                                 <span className="text-xs font-medium text-slate-400">
                                    {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                 </span>
                              </div>

                              <div className="flex justify-between items-center">
                                 <h4 className="font-bold text-slate-800 text-sm">{t.description}</h4>
                                 <span className={`text-lg font-black tracking-tight ${t.type === TransactionType.EARN ? 'text-green-600' : 'text-slate-900'}`}>
                                    {t.type === TransactionType.EARN ? '+' : '-'}{Math.abs(t.pointsEarned)}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">Value {formatCurrency(t.amountPaid)}</p>
                           </div>
                        </div>
                     ))}

                     {patientTransactions.length === 0 && (
                        <div className="pl-8 text-slate-400 italic text-sm">No care history found.</div>
                     )}
                  </div>
               </div>
            )}

            {/* --- CARE JOURNEY TAB --- */}
            {activeTab === 'CARE' && (
               <div className="space-y-6 fade-in pt-4">
                  {/* 1. Header with Active Status */}
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-slate-800 text-2xl tracking-tight">My Journey</h3>
                        <p className="text-xs text-slate-500 font-medium">Tracking your active treatments</p>
                     </div>
                     <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                        <Stethoscope size={20} />
                     </div>
                  </div>

                  {/* 2. Active Treatment Card: Aligners */}
                  <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                     {/* Decorative BG */}
                     <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-30"></div>
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -ml-10 -mb-10 opacity-30"></div>

                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <span className="bg-blue-600/30 border border-blue-400/30 text-blue-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">In Progress</span>
                              <h2 className="text-2xl font-bold mt-2">{activeTreatment.title}</h2>
                              <p className="text-slate-400 text-xs">with {activeTreatment.provider}</p>
                           </div>
                           <Smile className="text-blue-400" size={24} />
                        </div>

                        {/* Progress Visual */}
                        <div className="mb-4">
                           <div className="flex justify-between text-xs font-semibold mb-2">
                              <span className="text-slate-300">Set {activeTreatment.currentSet} of {activeTreatment.totalSets}</span>
                              <span className="text-white">{Math.round((activeTreatment.currentSet / activeTreatment.totalSets) * 100)}% Complete</span>
                           </div>
                           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000"
                                 style={{ width: `${(activeTreatment.currentSet / activeTreatment.totalSets) * 100}%` }}
                              ></div>
                           </div>
                        </div>

                        {/* Current Stage Details */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center border border-white/5">
                           <div className="flex gap-3 items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 border border-blue-400/30">
                                 <Clock size={18} />
                              </div>
                              <div>
                                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Set</p>
                                 <p className="text-sm font-bold text-white">Day {activeTreatment.daysInCurrentSet} of {activeTreatment.daysPerSet}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Change In</p>
                              <p className="text-lg font-bold text-white">{activeTreatment.daysPerSet - activeTreatment.daysInCurrentSet} days</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* 3. Aftercare & Tasks Timeline */}
                  <div>
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Care Guidelines</h4>
                     <div className="space-y-4">
                        {aftercareCards.map(card => (
                           <div key={card.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                              {/* Sidebar Color */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.color}`}></div>

                              <div className="flex gap-4">
                                 <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${card.color}`}>
                                    {card.icon}
                                 </div>
                                 <div>
                                    <h5 className="font-bold text-slate-800 text-base mb-1">{card.title}</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                       {card.desc}
                                    </p>
                                    {card.type === 'ACTION' && (
                                       <button className="mt-3 text-xs bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-transform">
                                          Log Switch
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* 4. Upcoming Appointment */}
                  <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-4 border border-blue-100">
                     <div className="bg-white h-12 w-12 rounded-xl flex flex-col items-center justify-center shadow-sm text-blue-800 font-bold border border-blue-100">
                        <span className="text-[10px] uppercase text-blue-400">Nov</span>
                        <span className="text-lg leading-none">15</span>
                     </div>
                     <div>
                        <h5 className="font-bold text-blue-900">Next Check-up</h5>
                        <p className="text-xs text-blue-600/80">10:00 AM • Alignment Review</p>
                     </div>
                     <ChevronRight className="ml-auto text-blue-300" size={20} />
                  </div>
               </div>
            )}

            {activeTab === 'PROFILE' && (
               <div className="space-y-6 fade-in pt-4">
                  {/* Profile Header */}
                  <div className="bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-sm">
                     <div className="h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-lg">
                        {currentUser.name.charAt(0)}
                     </div>
                     <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
                     <p className="text-slate-400 font-medium text-sm mt-1">{currentUser.mobile}</p>
                     <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck size={12} /> {headUser.currentTier} Patient
                     </div>
                  </div>

                  {/* Benefits Grid */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100/50">
                        <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                           <Sparkles size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Smart Care</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                           Earn {Math.round(TIER_REWARDS[headUser.currentTier] * 100)}% back on every check-up and treatment.
                        </p>
                     </div>
                     <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100/50">
                        <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                           <Smile size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Dream Smile</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                           Unlock aesthetic treatments like Veneers & Aligners.
                        </p>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                     <span className="text-sm font-semibold text-slate-600">PracticePrime</span>
                     <span className="text-xs font-mono text-slate-400">v2.1.0</span>
                  </div>
               </div>
            )}

         </main>

         {/* FLOATING BOTTOM NAV */}
         <div className="absolute bottom-6 left-0 w-full px-6 z-50 pointer-events-none">
            <nav className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-2 py-2 flex justify-between items-center max-w-sm mx-auto pointer-events-auto">
               <button
                  onClick={() => setActiveTab('HOME')}
                  className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === 'HOME' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Home size={20} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
               </button>

               <button
                  onClick={() => setActiveTab('WALLET')}
                  className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === 'WALLET' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  <WalletIcon size={20} strokeWidth={activeTab === 'WALLET' ? 2.5 : 2} />
               </button>

               <button
                  onClick={() => setActiveTab('CARE')}
                  className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === 'CARE' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Stethoscope size={20} strokeWidth={activeTab === 'CARE' ? 2.5 : 2} />
               </button>

               <button
                  onClick={() => setActiveTab('PROFILE')}
                  className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all duration-300 ${activeTab === 'PROFILE' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  <UserIcon size={20} strokeWidth={activeTab === 'PROFILE' ? 2.5 : 2} />
               </button>
            </nav>
         </div>
      </div>
   );
};

export default MobilePatientView;