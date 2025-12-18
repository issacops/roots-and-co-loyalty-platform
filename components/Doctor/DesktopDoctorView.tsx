import React, { useState, useMemo } from 'react';
import { User, Wallet, Transaction, Tier, TransactionCategory, TransactionType, FamilyGroup } from '../../types';
import { MockBackendService } from '../../services/mockBackend';
import { Search, CreditCard, PieChart, Users, ChevronRight, CheckCircle, AlertCircle, Sparkles, UserPlus, TrendingUp, Lock, ArrowUpRight, ArrowDownRight, Activity, Smile, Droplet, MapPin, Clock, X, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
   currentUser: User;
   allUsers: User[];
   wallets: Wallet[];
   transactions: Transaction[];
   familyGroups: FamilyGroup[];
   onProcessTransaction: (patientId: string, amount: number, category: TransactionCategory, type: TransactionType) => any;
   onLinkFamily: (headUserId: string, memberMobile: string) => any;
   onAddPatient: (name: string, mobile: string) => { success: boolean; message: string; user?: User };
   backendService: MockBackendService;
}

const ToothIllustration = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 10C20 10 10 20 10 35C10 45 15 50 15 60C15 75 5 80 5 95C5 98 15 100 25 90C30 92 35 95 50 95C65 95 70 92 75 90C85 100 95 98 95 95C95 80 85 75 85 60C85 50 90 45 90 35C90 20 80 10 70 10C60 10 55 15 50 20C45 15 40 10 30 10Z" />
   </svg>
);

const DesktopDoctorView: React.FC<Props> = ({
   currentUser, allUsers, wallets, transactions, familyGroups,
   onProcessTransaction, onLinkFamily, onAddPatient, backendService
}) => {
   const [activeView, setActiveView] = useState<'CHECKIN' | 'ANALYTICS'>('CHECKIN');
   const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
   const [searchQuery, setSearchQuery] = useState('');

   // Check-In State: Map of UserID -> ISO Timestamp string
   const [checkedInPatients, setCheckedInPatients] = useState<Record<string, string>>({});

   // Add Patient Modal State
   const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
   const [newPatientName, setNewPatientName] = useState('');
   const [newPatientMobile, setNewPatientMobile] = useState('');
   const [addPatientError, setAddPatientError] = useState<string | null>(null);

   // Transaction State
   const [txAmount, setTxAmount] = useState('');
   const [txCategory, setTxCategory] = useState<TransactionCategory>(TransactionCategory.GENERAL);
   const [txMessage, setTxMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

   // Family Link State
   const [linkMobile, setLinkMobile] = useState('');
   const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

   const stats = backendService.getDashboardStats();

   // Search Logic
   const filteredPatients = allUsers.filter(u =>
      u.role === 'PATIENT' &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.mobile.includes(searchQuery))
   );

   const handlePatientSelect = (user: User) => {
      setSelectedPatient(user);
      setTxMessage(null);
      setLinkMessage(null);
      setTxAmount('');
      setLinkMobile('');
   };

   const toggleCheckIn = (patientId: string) => {
      setCheckedInPatients(prev => {
         const newState = { ...prev };
         if (newState[patientId]) {
            delete newState[patientId]; // Undo check-in
         } else {
            newState[patientId] = new Date().toISOString(); // Check in now
         }
         return newState;
      });
   };

   const handleCreatePatient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPatientName.trim() || !newPatientMobile.trim()) {
         setAddPatientError('Please fill in all fields.');
         return;
      }

      const result = onAddPatient(newPatientName, newPatientMobile);

      if (result.success && result.user) {
         // Success: Close modal, select patient, auto check-in
         setIsAddPatientModalOpen(false);
         setSelectedPatient(result.user);
         toggleCheckIn(result.user.id);

         // Reset Form
         setNewPatientName('');
         setNewPatientMobile('');
         setAddPatientError(null);
      } else {
         setAddPatientError(result.message);
      }
   };

   const submitTransaction = (type: TransactionType) => {
      if (!selectedPatient || !txAmount) return;

      const amount = parseFloat(txAmount);
      const result = onProcessTransaction(selectedPatient.id, amount, txCategory, type);

      setTxMessage({
         type: result.success ? 'success' : 'error',
         text: result.message
      });

      if (result.success) {
         setTxAmount('');
         setTimeout(() => setTxMessage(null), 3000);
      }
   };

   const submitLinkFamily = () => {
      if (!selectedPatient || !linkMobile) return;

      const result = onLinkFamily(selectedPatient.id, linkMobile);

      setLinkMessage({
         type: result.success ? 'success' : 'error',
         text: result.message
      });

      if (result.success) {
         setLinkMobile('');
         setTimeout(() => setLinkMessage(null), 4000);
      }
   };

   // Determine Family Info
   const userFamily = selectedPatient?.familyGroupId
      ? familyGroups.find(f => f.id === selectedPatient.familyGroupId)
      : null;

   const familyMembers = userFamily
      ? allUsers.filter(u => u.familyGroupId === userFamily.id)
      : (selectedPatient ? [selectedPatient] : []);

   // Determine Effective Wallet for Charts
   const effectiveWalletId = useMemo(() => {
      if (!selectedPatient) return null;
      let targetUserId = selectedPatient.id;
      if (selectedPatient.familyGroupId) {
         const group = familyGroups.find(g => g.id === selectedPatient.familyGroupId);
         if (group) targetUserId = group.headUserId;
      }
      return wallets.find(w => w.userId === targetUserId)?.id;
   }, [selectedPatient, familyGroups, wallets]);

   // Chart Data - Last 7 Days Revenue (Global Analytics)
   const chartData = transactions.slice(0, 10).map(t => ({
      name: new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
      amount: t.amountPaid,
      points: t.pointsEarned
   })).reverse();

   // Chart Data - Selected Patient History (7 Days)
   const patientHistoryChartData = useMemo(() => {
      if (!effectiveWalletId) return [];
      const data = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
         const d = new Date(today);
         d.setDate(d.getDate() - i);
         const dateStr = d.toISOString().split('T')[0];
         const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

         const dayTxs = transactions.filter(t => t.walletId === effectiveWalletId && t.date.startsWith(dateStr));

         data.push({
            day: dayName,
            earned: dayTxs.filter(t => t.type === TransactionType.EARN).reduce((acc, t) => acc + t.pointsEarned, 0),
            redeemed: dayTxs.filter(t => t.type === TransactionType.REDEEM).reduce((acc, t) => acc + Math.abs(t.pointsEarned), 0)
         });
      }
      return data;
   }, [transactions, effectiveWalletId]);

   return (
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 relative">

         {/* SIDEBAR NAVIGATION - WARM STONE THEME */}
         <aside className="w-72 bg-[#fafaf9] text-[#57534e] flex flex-col shadow-2xl z-30 relative overflow-hidden border-r border-[#e7e5e4]">
            {/* Decorative Blur - Subtle Warmth */}
            <div className="absolute top-0 left-0 w-full h-32 bg-[#fff7ed]/40 blur-3xl pointer-events-none"></div>

            {/* LOGO HEADER - Blended */}
            <div className="p-8 pb-6 relative z-10">
               <div className="flex flex-col gap-1 mb-1">
                  <div className="flex items-center gap-2">
                     <span className="font-serif text-3xl font-bold text-[#292524] tracking-tight">Roots</span>
                     <div className="relative h-7 w-7 text-[#292524]">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full">
                           <path d="M30 20C20 20 10 30 10 45C10 55 15 60 15 70C15 85 5 90 5 95C5 98 15 100 25 90C30 92 35 95 50 95C65 95 70 92 75 90C85 100 95 98 95 95C95 80 85 75 85 60C85 50 90 45 90 35C90 20 80 10 70 20C60 10 55 15 50 20C45 15 40 10 30 20Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                     </div>
                     <span className="font-serif text-3xl font-bold text-[#292524] tracking-tight">Co.</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#a8a29e] tracking-[0.3em] uppercase pl-1">Dentistry</p>
               </div>
               <div className="flex items-center gap-2 mt-4 ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-[#78716c] font-semibold uppercase tracking-wider">Clinic OS v2.4</p>
               </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 relative z-10">
               <div className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-widest px-4 mb-3 mt-2">Operations</div>

               <button
                  onClick={() => setActiveView('CHECKIN')}
                  className={`w-full text-left p-3.5 rounded-xl flex items-center gap-4 font-bold transition-all duration-200 group
              ${activeView === 'CHECKIN' ? 'bg-[#292524] text-[#fafaf9] shadow-lg shadow-stone-900/10' : 'hover:bg-[#e7e5e4] text-[#78716c] hover:text-[#292524]'}`}
               >
                  <Users size={20} className={activeView === 'CHECKIN' ? 'text-amber-500' : 'text-[#a8a29e] group-hover:text-[#57534e]'} />
                  <span>Patient Check-In</span>
                  {activeView === 'CHECKIN' && <ChevronRight size={16} className="ml-auto opacity-50" />}
               </button>

               <button
                  onClick={() => setActiveView('ANALYTICS')}
                  className={`w-full text-left p-3.5 rounded-xl flex items-center gap-4 font-bold transition-all duration-200 group
              ${activeView === 'ANALYTICS' ? 'bg-[#292524] text-[#fafaf9] shadow-lg shadow-stone-900/10' : 'hover:bg-[#e7e5e4] text-[#78716c] hover:text-[#292524]'}`}
               >
                  <PieChart size={20} className={activeView === 'ANALYTICS' ? 'text-amber-500' : 'text-[#a8a29e] group-hover:text-[#57534e]'} />
                  <span>Practice Analytics</span>
                  {activeView === 'ANALYTICS' && <ChevronRight size={16} className="ml-auto opacity-50" />}
               </button>
            </nav>

            {/* SIDEBAR WIDGET: QUICK STATS */}
            <div className="px-6 pb-8 relative z-10">
               <div className="bg-white rounded-2xl p-5 border border-[#e7e5e4] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                     <p className="text-[10px] text-[#a8a29e] uppercase tracking-widest font-bold">Outstanding</p>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-[#292524] font-bold text-2xl tracking-tight">{Math.floor(stats.totalLiability).toLocaleString()}</span>
                     <span className="text-xs text-[#a8a29e] mb-1">pts</span>
                  </div>
                  <div className="mt-3 h-1 w-full bg-[#f5f5f4] rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-rose-400 to-amber-400 w-[60%] rounded-full"></div>
                  </div>
               </div>

               <div className="mt-6 flex items-center gap-3 px-1">
                  <div className="h-10 w-10 bg-[#e7e5e4] rounded-full flex items-center justify-center text-[#57534e] font-bold border border-white">
                     BC
                  </div>
                  <div>
                     <p className="text-sm text-[#292524] font-bold">{currentUser.name}</p>
                     <p className="text-[10px] text-[#78716c]">Principal Dentist</p>
                  </div>
               </div>
            </div>
         </aside>

         {/* MAIN CONTENT AREA */}
         <main className="flex-1 flex overflow-hidden bg-[#f8fafc]">

            {activeView === 'ANALYTICS' ? (
               <div className="flex-1 p-10 overflow-y-auto">
                  <div className="max-w-6xl mx-auto space-y-8 fade-in">

                     {/* Header Section */}
                     <div className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                        <div>
                           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Practice Overview</h2>
                           <p className="text-slate-500 mt-1">Real-time treatment revenue and loyalty metrics.</p>
                        </div>
                        <div className="flex gap-3">
                           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">Export Report</button>
                           <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">View All</button>
                        </div>
                     </div>

                     {/* Metrics Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Revenue Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between h-40 group hover:border-blue-100 transition-colors">
                           <div className="flex justify-between items-start">
                              <div className="p-2.5 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                                 <CreditCard size={20} />
                              </div>
                              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% <ArrowUpRight size={12} className="ml-1" /></span>
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-500">Treatment Revenue (YTD)</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}</h3>
                           </div>
                        </div>

                        {/* Liability Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between h-40 group hover:border-rose-100 transition-colors">
                           <div className="flex justify-between items-start">
                              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-100 transition-colors">
                                 <Lock size={20} />
                              </div>
                              <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">High <Activity size={12} className="ml-1" /></span>
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-500">Total Smile Equity</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">{Math.floor(stats.totalLiability).toLocaleString()}</h3>
                           </div>
                        </div>

                        {/* Upgrades Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between h-40 group hover:border-amber-100 transition-colors">
                           <div className="flex justify-between items-start">
                              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                                 <Sparkles size={20} />
                              </div>
                              <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Next 7 Days</span>
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-500">Approaching Platinum Smile</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.upgradingSoon} <span className="text-base font-normal text-slate-400">patients</span></h3>
                           </div>
                        </div>
                     </div>

                     {/* Main Chart */}
                     <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                           <div>
                              <h4 className="text-lg font-bold text-slate-800">Revenue & Point Issuance</h4>
                              <p className="text-sm text-slate-500">Track treatment volume against smile points.</p>
                           </div>
                           <div className="flex gap-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                 <span className="h-3 w-3 rounded-full bg-blue-500"></span> Revenue
                              </div>
                           </div>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                              <Tooltip
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                 itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}
                                 formatter={(value) => [`₹${value}`, 'Amount']}
                              />
                              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            ) : (
               /* CHECK-IN VIEW (SPLIT SCREEN) */
               <>
                  {/* LEFT COLUMN: Patient Search List */}
                  <div className="w-[380px] border-r border-slate-200 bg-white flex flex-col z-20">
                     <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Patient Queue</h2>

                        {/* Add Patient Button */}
                        <button
                           onClick={() => setIsAddPatientModalOpen(true)}
                           className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors group"
                           title="Register New Patient"
                        >
                           <UserPlus size={18} />
                        </button>
                     </div>

                     {/* Search Bar */}
                     <div className="px-6 pt-4 pb-2">
                        <div className="relative group">
                           <Search className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                           <input
                              type="text"
                              placeholder="Search name or mobile..."
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {filteredPatients.map(user => (
                           <div
                              key={user.id}
                              onClick={() => handlePatientSelect(user)}
                              className={`p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden
                      ${selectedPatient?.id === user.id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                           >
                              <div className="flex justify-between items-start relative z-10">
                                 <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold relative
                            ${selectedPatient?.id === user.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                       {user.name.charAt(0)}
                                       {/* Checked In Queue Indicator */}
                                       {checkedInPatients[user.id] && (
                                          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h3 className={`font-bold text-sm ${selectedPatient?.id === user.id ? 'text-blue-900' : 'text-slate-700'}`}>{user.name}</h3>
                                          {checkedInPatients[user.id] && (
                                             <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Arrived</span>
                                          )}
                                       </div>
                                       <p className="text-xs text-slate-400 font-mono mt-0.5">{user.mobile}</p>
                                    </div>
                                 </div>
                                 <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border
                        ${user.currentTier === Tier.PLATINUM ? 'bg-slate-800 text-white border-slate-800' :
                                       user.currentTier === Tier.GOLD ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {user.currentTier}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* RIGHT COLUMN: POS Interface */}
                  <div className="flex-1 bg-slate-50/50 p-8 overflow-y-auto">
                     {selectedPatient ? (
                        <div className="max-w-4xl mx-auto space-y-6 fade-in">

                           {/* 1. Patient Profile Header Card */}
                           <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>

                              {/* TOOTH ILLUSTRATION WATERMARK - Vector instead of Image */}
                              <div className="absolute top-[-50px] right-[-20px] opacity-[0.03] rotate-12 pointer-events-none text-slate-900">
                                 <svg viewBox="0 0 100 100" fill="currentColor" className="w-96 h-96">
                                    <path d="M30 20C20 20 10 30 10 45C10 55 15 60 15 70C15 85 5 90 5 95C5 98 15 100 25 90C30 92 35 95 50 95C65 95 70 92 75 90C85 100 95 98 95 95C95 80 85 75 85 60C85 50 90 45 90 35C90 20 80 10 70 20C60 10 55 15 50 20C45 15 40 10 30 20Z" />
                                 </svg>
                              </div>

                              <div className="flex justify-between items-start relative z-10">
                                 <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-sm relative">
                                       {selectedPatient.name.charAt(0)}
                                       {/* Large Indicator for Checked In */}
                                       {checkedInPatients[selectedPatient.id] && (
                                          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white shadow-sm">
                                             <CheckCircle size={16} />
                                          </div>
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3">
                                          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedPatient.name}</h1>
                                          {/* Check In Action Button */}
                                          <button
                                             onClick={() => toggleCheckIn(selectedPatient.id)}
                                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border shadow-sm
                                    ${checkedInPatients[selectedPatient.id]
                                                   ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                   : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-blue-300'}`}
                                          >
                                             {checkedInPatients[selectedPatient.id] ? (
                                                <><Clock size={14} /> Arrived at {new Date(checkedInPatients[selectedPatient.id]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                             ) : (
                                                <><MapPin size={14} /> Mark Arrived</>
                                             )}
                                          </button>
                                       </div>

                                       <div className="flex items-center gap-4 mt-2">
                                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                             <Users size={12} /> ID: {selectedPatient.id}
                                          </span>
                                          <span className="text-sm text-slate-500 font-medium">
                                             Patient since {new Date().getFullYear()}
                                          </span>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="text-right">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Smile Equity</div>
                                    <div className="text-5xl font-bold text-blue-600 tracking-tighter">
                                       {wallets.find(w => w.userId === selectedPatient.id || (selectedPatient.familyGroupId && allUsers.find(u => u.id === selectedPatient.id && u.familyGroupId === selectedPatient.familyGroupId)))?.balance || 0}
                                    </div>
                                    <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded inline-block">
                                       Locked: Aesthetic Only
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                              {/* 2. Transaction POS Panel */}
                              <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
                                 <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                       <CreditCard className="text-slate-800" size={24} />
                                    </div>
                                    <div>
                                       <h3 className="text-lg font-bold text-slate-800">New Transaction</h3>
                                       <p className="text-xs text-slate-500">Record treatment value or redeem smile points</p>
                                    </div>
                                 </div>

                                 <div className="space-y-6">
                                    <div>
                                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amount Received</label>
                                       <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">₹</span>
                                          <input
                                             type="number"
                                             className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-4xl font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-slate-200"
                                             placeholder="0"
                                             value={txAmount}
                                             onChange={(e) => setTxAmount(e.target.value)}
                                          />
                                       </div>
                                    </div>

                                    <div>
                                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Treatment Category</label>
                                       <div className="grid grid-cols-3 gap-3">
                                          <button
                                             onClick={() => setTxCategory(TransactionCategory.GENERAL)}
                                             className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-2
                                       ${txCategory === TransactionCategory.GENERAL
                                                   ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                   : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                          >
                                             <Activity size={18} /> General
                                          </button>

                                          <button
                                             onClick={() => setTxCategory(TransactionCategory.COSMETIC)}
                                             className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-2
                                       ${txCategory === TransactionCategory.COSMETIC
                                                   ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                   : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                          >
                                             <Smile size={18} /> Aesthetic
                                          </button>

                                          <button
                                             onClick={() => setTxCategory(TransactionCategory.HYGIENE)}
                                             className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-2
                                       ${txCategory === TransactionCategory.HYGIENE
                                                   ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                   : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                          >
                                             <Droplet size={18} /> Hygiene
                                          </button>
                                       </div>
                                    </div>

                                    {txMessage && (
                                       <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2
                                 ${txMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                                          {txMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                          {txMessage.text}
                                       </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                       <button
                                          onClick={() => submitTransaction(TransactionType.EARN)}
                                          className="py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                       >
                                          Earn Points
                                       </button>
                                       <button
                                          onClick={() => submitTransaction(TransactionType.REDEEM)}
                                          className="py-4 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold text-lg transition-all active:scale-95"
                                       >
                                          Redeem Points
                                       </button>
                                    </div>
                                 </div>
                              </div>

                              {/* 3. Family & History Sidebar */}
                              <div className="space-y-6">

                                 {/* Family Pool Card */}
                                 <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                          <Users size={18} className="text-blue-500" /> Household Pool
                                       </h3>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                       {familyMembers.map(member => (
                                          <div key={member.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                             <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                                          ${member.id === (userFamily?.headUserId || selectedPatient.id) ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                                   {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                   <p className="text-xs font-bold text-slate-700">{member.name}</p>
                                                   <p className="text-[10px] text-slate-400">
                                                      {member.id === (userFamily?.headUserId || selectedPatient.id) ? 'HEAD' : 'MEMBER'}
                                                   </p>
                                                </div>
                                             </div>
                                             <span className="text-xs font-mono font-medium text-slate-500">₹{member.lifetimeSpend}</span>
                                          </div>
                                       ))}
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Link New Member</label>
                                       <div className="flex gap-2">
                                          <input
                                             type="text"
                                             placeholder="Mobile #"
                                             className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                             value={linkMobile}
                                             onChange={(e) => setLinkMobile(e.target.value)}
                                          />
                                          <button
                                             onClick={submitLinkFamily}
                                             className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5"
                                          >
                                             <UserPlus size={14} />
                                          </button>
                                       </div>
                                       {linkMessage && <p className="text-[10px] mt-1 text-green-600">{linkMessage.text}</p>}
                                    </div>
                                 </div>

                                 {/* Recent History Mini */}
                                 <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Care Activity</h4>
                                    <div className="space-y-4">
                                       {transactions
                                          .filter(t => t.walletId === (wallets.find(w => w.userId === selectedPatient.id)?.id))
                                          .slice(0, 3)
                                          .map(t => (
                                             <div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                <span className="text-slate-600 font-medium truncate w-32">{t.description}</span>
                                                <span className={`font-bold ${t.type === TransactionType.EARN ? 'text-green-500' : 'text-rose-500'}`}>
                                                   {t.type === TransactionType.EARN ? '+' : ''}{t.pointsEarned}
                                                </span>
                                             </div>
                                          ))}
                                       {transactions.filter(t => t.walletId === (wallets.find(w => w.userId === selectedPatient.id)?.id)).length === 0 && (
                                          <p className="text-xs text-slate-400 italic">No recent activity.</p>
                                       )}
                                    </div>
                                 </div>

                                 {/* Points Trend Chart */}
                                 <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Points Trend (7 Days)</h4>
                                    <div className="h-40 w-full">
                                       <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={patientHistoryChartData}>
                                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                             <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} dy={10} />
                                             <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px', fontSize: '12px' }}
                                             />
                                             <Bar dataKey="earned" name="Earned" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={8} />
                                             <Bar dataKey="redeemed" name="Redeemed" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
                                          </BarChart>
                                       </ResponsiveContainer>
                                    </div>
                                 </div>

                              </div>
                           </div>

                        </div>
                     ) : (
                        // EMPTY STATE
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                           <div className="w-48 h-48 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                              <ToothIllustration className="w-24 h-24 text-slate-300" />
                           </div>
                           <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Ready to Check-In</h3>
                           <p className="text-base mt-2 max-w-sm text-center text-slate-500">Search for a patient on the left sidebar to view their dental profile and process treatments.</p>
                        </div>
                     )}
                  </div>
               </>
            )}
         </main>

         {/* MODAL: ADD NEW PATIENT */}
         {isAddPatientModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md m-4 scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">New Patient Registration</h3>
                        <p className="text-xs text-slate-500 mt-1">Create a profile to begin treatment tracking.</p>
                     </div>
                     <button
                        onClick={() => {
                           setIsAddPatientModalOpen(false);
                           setAddPatientError(null);
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <form onSubmit={handleCreatePatient} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                           autoFocus
                           type="text"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold text-slate-800"
                           placeholder="e.g. Vikram Malhotra"
                           value={newPatientName}
                           onChange={(e) => setNewPatientName(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number</label>
                        <input
                           type="tel"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-semibold text-slate-800"
                           placeholder="e.g. 9876543210"
                           value={newPatientMobile}
                           onChange={(e) => setNewPatientMobile(e.target.value)}
                        />
                     </div>

                     {addPatientError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                           <AlertCircle size={16} /> {addPatientError}
                        </div>
                     )}

                     <div className="pt-4">
                        <button
                           type="submit"
                           className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                           <UserPlus size={18} /> Register & Check-In
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default DesktopDoctorView;