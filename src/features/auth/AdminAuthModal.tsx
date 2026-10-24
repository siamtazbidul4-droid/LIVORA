import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { api, ApiError } from '../../services/api';
import { setCredentials } from './authSlice';
import { addToast } from '../toast/toastSlice';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/admin-login', { email, password });

      // Enforce strict staff/admin role check
      const staffRoles = [
        'super_admin',
        'admin',
        'order_manager',
        'inventory_manager',
        'catalog_manager',
        'customer_support',
        'finance',
      ];

      if (!staffRoles.includes(res.user.role)) {
        setError('Access Denied: This portal requires staff or administrator credentials.');
        setLoading(false);
        return;
      }

      dispatch(setCredentials({ user: res.user, token: res.token }));
      dispatch(
        addToast({
          type: 'success',
          title: 'Staff Access Granted',
          message: `Authenticated as ${res.user.role.toUpperCase()}: ${res.user.name}`,
        })
      );

      handleClose();
      navigate('/admin');
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Invalid credentials or administrative privileges required.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Staff & Merchant Operations Portal"
      description="Authorized personnel only. Enter your organizational credentials to access catalog management, order fulfillment, and retail settings."
      maxWidth="md"
    >
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
        <span>
          Access restricted to Novara Commerce retail administrators and staff.
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          <span className="font-semibold">Security Alert:</span> {error}
        </div>
      )}

      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Staff Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@novara.com"
              className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-2 text-sm focus:border-[#133E32] focus:outline-none focus:ring-1 focus:ring-[#133E32]"
            />
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Master Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stone-200 pl-9 pr-10 py-2 text-sm focus:border-[#133E32] focus:outline-none focus:ring-1 focus:ring-[#133E32]"
            />
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#133E32] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d2e24] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Verifying Credentials...' : 'Authenticate & Enter Portal'}
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>
    </Modal>
  );
};
