import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { logout } from '../lib/firebase';
import { Package, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CampusLocker</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Portal</Link>
              {isAdmin && (
                <Link to="/admin" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                    <span className="text-xs text-slate-500 capitalize">{isAdmin ? 'Administrator' : 'Student'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2026 Campus Parcel Locker System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
