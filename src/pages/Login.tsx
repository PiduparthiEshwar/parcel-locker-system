import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Package, ShieldCheck, User as UserIcon, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export const Login: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const validateEmail = (email: string) => {
    if (!email.endsWith('@gmail.com')) {
      toast.error('Only @gmail.com accounts are allowed.');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    
    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      navigate('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password auth is not enabled. Please enable it in Firebase Console.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      const userEmail = result.user.email;
      
      if (userEmail && !userEmail.endsWith('@gmail.com')) {
        await auth.signOut();
        toast.error('Only @gmail.com accounts are allowed.');
        return;
      }
      
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 text-center bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-xl mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CampusLocker</h1>
            <p className="text-indigo-100 text-sm">Smart Parcel Management System</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              onClick={() => setMode('signin')}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                mode === 'signin' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                mode === 'signup' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5 text-indigo-600" />
            Google Account
          </button>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
