import React, { useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Parcel, Locker } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { KeyRound, Package, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const StudentPortal: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [collectedParcel, setCollectedParcel] = useState<Parcel | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    try {
      const q = query(
        collection(db, 'parcels'), 
        where('otp', '==', otp), 
        where('status', '==', 'Pending')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Invalid OTP or parcel already collected");
        setVerifying(false);
        return;
      }

      const parcelDoc = snapshot.docs[0];
      const parcelData = parcelDoc.data() as Parcel;

      // Update parcel status
      await updateDoc(doc(db, 'parcels', parcelDoc.id), {
        status: 'Collected',
        collectedAt: serverTimestamp(),
      });

      // Update locker status
      const lockerQuery = query(collection(db, 'lockers'), where('number', '==', parcelData.lockerNumber));
      const lockerSnapshot = await getDocs(lockerQuery);
      if (!lockerSnapshot.empty) {
        await updateDoc(doc(db, 'lockers', lockerSnapshot.docs[0].id), {
          status: 'Empty',
          lastUpdated: serverTimestamp(),
        });
      }

      setCollectedParcel({ ...parcelData, id: parcelDoc.id });
      toast.success("Parcel collected successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'parcels/verify');
      toast.error("An error occurred during verification");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <AnimatePresence mode="wait">
        {!collectedParcel ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-indigo-600 p-10 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="inline-flex p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-6">
                  <KeyRound className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2 tracking-tight">Collect Your Parcel</h1>
                <p className="text-indigo-100">Enter the 6-digit OTP sent to your email to unlock your assigned locker.</p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest text-center">
                  Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full max-w-[280px] text-center text-4xl font-mono font-bold tracking-[0.5em] py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-200"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98]",
                  otp.length === 6 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Unlock Locker
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>

              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Security Note:</strong> Never share your OTP with anyone. The locker will automatically close after collection.
                </p>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center"
          >
            <div className="inline-flex p-6 bg-emerald-50 text-emerald-600 rounded-full mb-8">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Locker Unlocked!</h2>
            <p className="text-slate-500 text-lg mb-8">
              Please collect your parcel from <span className="font-bold text-slate-900 underline decoration-indigo-500 decoration-2 underline-offset-4">Locker #{collectedParcel.lockerNumber}</span>.
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{collectedParcel.studentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Collection Time</span>
                <span className="font-semibold text-slate-900">{format(new Date(), 'HH:mm:ss')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Locker Status</span>
                <span className="font-semibold text-emerald-600">Opened</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCollectedParcel(null);
                setOtp('');
              }}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
