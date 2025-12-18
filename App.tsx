import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  User, Wallet, Transaction, FamilyGroup, Role, AppState, ViewMode 
} from './types';
import { INITIAL_USERS, INITIAL_WALLETS, INITIAL_TRANSACTIONS, INITIAL_FAMILIES } from './constants';
import { MockBackendService } from './services/mockBackend';
import MobilePatientView from './components/Patient/MobilePatientView';
import DesktopDoctorView from './components/Doctor/DesktopDoctorView';

// Icons
import { Smartphone, Monitor } from 'lucide-react';

const App = () => {
  // --- Global State Simulation ---
  const [data, setData] = useState<AppState>({
    users: INITIAL_USERS,
    wallets: INITIAL_WALLETS,
    transactions: INITIAL_TRANSACTIONS,
    familyGroups: INITIAL_FAMILIES,
    currentUser: INITIAL_USERS[0], // Default logged in as patient
  });

  const [viewMode, setViewMode] = useState<ViewMode>('MOBILE_PATIENT');
  const [isClient, setIsClient] = useState(false);

  // Initialize Service
  const backendService = useMemo(() => new MockBackendService(
    data.users, data.wallets, data.transactions, data.familyGroups
  ), [data.users, data.wallets, data.transactions, data.familyGroups]);

  useEffect(() => {
    setIsClient(true);
    
    // Basic Responsive Detection
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewMode('DESKTOP_KIOSK');
        // Auto-switch user for demo context if needed, but let's stick to manual role toggle for better demo control
        // If we switch to desktop, we likely want to be the doctor
        if (data.currentUser?.role === Role.PATIENT) {
           const doctor = data.users.find(u => u.role === Role.ADMIN);
           if (doctor) setData(prev => ({ ...prev, currentUser: doctor }));
        }
      } else {
        setViewMode('MOBILE_PATIENT');
        if (data.currentUser?.role === Role.ADMIN) {
           const patient = data.users.find(u => u.role === Role.PATIENT);
           if (patient) setData(prev => ({ ...prev, currentUser: patient }));
        }
      }
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run once on mount

  const handleTransaction = (patientId: string, amount: number, category: any, type: any) => {
    const result = backendService.processTransaction(patientId, amount, category, type);
    if (result.success && result.updatedData) {
      setData(prev => ({
        ...prev,
        users: result.updatedData.users,
        wallets: result.updatedData.wallets,
        transactions: result.updatedData.transactions,
      }));
      
      // Haptic Feedback for Mobile
      if (navigator.vibrate) navigator.vibrate(50);
    }
    return result;
  };

  const handleLinkFamily = (headUserId: string, memberMobile: string) => {
    const result = backendService.linkFamilyMember(headUserId, memberMobile);
    if (result.success && result.updatedData) {
      setData(prev => ({
        ...prev,
        users: result.updatedData.users,
        wallets: result.updatedData.wallets,
        transactions: result.updatedData.transactions,
        familyGroups: result.updatedData.familyGroups
      }));
    }
    return result;
  };

  const handleAddPatient = (name: string, mobile: string) => {
    const result = backendService.addPatient(name, mobile);
    if (result.success && result.updatedData) {
      setData(prev => ({
        ...prev,
        users: result.updatedData.users,
        wallets: result.updatedData.wallets
      }));
    }
    return result;
  };

  const toggleRole = () => {
    if (viewMode === 'MOBILE_PATIENT') {
      setViewMode('DESKTOP_KIOSK');
      const doc = data.users.find(u => u.role === Role.ADMIN);
      setData(prev => ({ ...prev, currentUser: doc || prev.currentUser }));
    } else {
      setViewMode('MOBILE_PATIENT');
      const pat = data.users.find(u => u.role === Role.PATIENT);
      setData(prev => ({ ...prev, currentUser: pat || prev.currentUser }));
    }
  };

  if (!isClient) return null;

  return (
    // FIX: Changed to h-screen overflow-hidden to act as a proper app shell
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden">
      {/* Dev Toggle for Demo */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={toggleRole}
          className="bg-black/80 hover:bg-black text-white px-3 py-2 rounded-full text-xs font-mono shadow-lg backdrop-blur-sm flex items-center gap-2 transition-all"
        >
          {viewMode === 'MOBILE_PATIENT' ? <Monitor size={14} /> : <Smartphone size={14} />}
          Switch to {viewMode === 'MOBILE_PATIENT' ? 'Doctor Kiosk' : 'Patient App'}
        </button>
      </div>

      {viewMode === 'MOBILE_PATIENT' ? (
        <MobilePatientView 
          currentUser={data.currentUser!} 
          users={data.users}
          wallets={data.wallets}
          transactions={data.transactions}
          familyGroups={data.familyGroups}
        />
      ) : (
        <DesktopDoctorView 
          currentUser={data.currentUser!}
          allUsers={data.users}
          wallets={data.wallets}
          transactions={data.transactions}
          familyGroups={data.familyGroups}
          onProcessTransaction={handleTransaction}
          onLinkFamily={handleLinkFamily}
          onAddPatient={handleAddPatient}
          backendService={backendService}
        />
      )}
    </div>
  );
};

export default App;