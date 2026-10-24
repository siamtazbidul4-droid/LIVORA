import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCredentials, updateUserProfile } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { api } from '../../services/api';
import { User, Phone, Lock, ShieldCheck } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      const res = await api.put('/users/profile', { name, phone });
      dispatch(updateUserProfile(res.user));
      dispatch(
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your personal details have been saved.',
        })
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Update Error',
          message: err?.message || 'Failed to update profile details.',
        })
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Invalid Password',
          message: 'Use at least 8 characters and no more than 72 UTF-8 bytes.',
        })
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Password Mismatch',
          message: 'New password and confirmation do not match.',
        })
      );
      return;
    }

    setUpdatingPass(true);
    try {
      const response = await api.put<{ token: string }>('/users/change-password', {
        currentPassword,
        newPassword,
      });
      if (user) dispatch(setCredentials({ user, token: response.token }));
      dispatch(
        addToast({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been updated and other sessions have been signed out.',
        })
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Security Error',
          message: err?.message || 'Current password was incorrect.',
        })
      );
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Account Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your personal contact details and account security.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-2xs">
          <h2 className="text-base font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#133E32]" />
            Personal Details
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Account Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role.toUpperCase() || 'CUSTOMER'}
                  className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-emerald-800 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="rounded-xl bg-[#133E32] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
              >
                {updatingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Security Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-2xs">
          <h2 className="text-base font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#133E32]" />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full sm:w-80 rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8+ characters (72 UTF-8 bytes max)"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingPass}
                className="rounded-xl bg-[#133E32] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
              >
                {updatingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
