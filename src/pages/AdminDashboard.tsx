import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Parcel, Locker, ParcelStatus, LockerStatus } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Plus, Package, CheckCircle2, Clock, Search, Filter, Hash, User as UserIcon, Mail, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const AdminDashboard: React.FC = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ParcelStatus | 'All'>('All');

  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    lockerNumber: '',
  });

  useEffect(() => {
    const initializeLockers = async () => {
      const q = query(collection(db, 'lockers'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        // Create 10 default lockers
        for (let i = 1; i <= 10; i++) {
          await addDoc(collection(db, 'lockers'), {
            number: i,
            status: 'Empty',
            lastUpdated: serverTimestamp(),
          });
        }
      }
    };
    initializeLockers();

    const qParcels = query(collection(db, 'parcels'));
    const unsubscribeParcels = onSnapshot(qParcels, (snapshot) => {
      const parcelData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Parcel));
      setParcels(parcelData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'parcels');
      toast.error("Failed to load parcels");
    });

    const qLockers = query(collection(db, 'lockers'));
    const unsubscribeLockers = onSnapshot(qLockers, (snapshot) => {
      const lockerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Locker));
      setLockers(lockerData.sort((a, b) => a.number - b.number));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'lockers');
    });

    return () => {
      unsubscribeParcels();
      unsubscribeLockers();
    };
  }, []);

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleAddParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.studentEmail || !formData.lockerNumber) {
      toast.error("Please fill all fields");
      return;
    }

    const lockerNum = parseInt(formData.lockerNumber);
    const locker = lockers.find(l => l.number === lockerNum);

    if (!locker || locker.status === 'Occupied') {
      toast.error("Locker is not available");
      return;
    }

    try {
      const otp = generateOTP();
      const newParcel: Omit<Parcel, 'id'> = {
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        lockerNumber: lockerNum,
        otp,
        status: 'Pending',
        createdAt: serverTimestamp(),
        adminUid: auth.currentUser?.uid || '',
      };

      await addDoc(collection(db, 'parcels'), newParcel);
      
      // Update locker status
      const lockerDoc = doc(db, 'lockers', locker.id!);
      await updateDoc(lockerDoc, {
        status: 'Occupied',
        lastUpdated: serverTimestamp(),
      });

      toast.success(`Parcel assigned! OTP: ${otp}`);
      setIsAdding(false);
      setFormData({ studentName: '', studentEmail: '', lockerNumber: '' });
    } catch (error) {
      console.error("Error adding parcel:", error);
      toast.error("Failed to add parcel");
    }
  };

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const availableLockers = lockers.filter(l => l.status === 'Empty');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500">Manage campus parcels and lockers efficiently.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Assign New Parcel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Parcels</p>
              <h3 className="text-2xl font-bold text-slate-900">{parcels.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Collection</p>
              <h3 className="text-2xl font-bold text-slate-900">{parcels.filter(p => p.status === 'Pending').length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Available Lockers</p>
              <h3 className="text-2xl font-bold text-slate-900">{availableLockers.length} / {lockers.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Collected">Collected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Student</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Locker</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">OTP</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date Added</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcels.map((parcel) => (
                <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {parcel.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{parcel.studentName}</p>
                        <p className="text-xs text-slate-500">{parcel.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      Locker #{parcel.lockerNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 tracking-widest">
                    {parcel.otp}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      parcel.status === 'Pending' 
                        ? "bg-amber-50 text-amber-700 border border-amber-100" 
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {parcel.status === 'Pending' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {parcel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {parcel.createdAt ? format(parcel.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : '...'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredParcels.length === 0 && (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No parcels found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Parcel Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Assign New Parcel</h2>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddParcel} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter student's full name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    Student Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter student's email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    Locker Number
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.lockerNumber}
                    onChange={(e) => setFormData({ ...formData, lockerNumber: e.target.value })}
                  >
                    <option value="">Select an available locker</option>
                    {availableLockers.map(l => (
                      <option key={l.id} value={l.number}>Locker #{l.number}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                  >
                    Assign Parcel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
