import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from '../../components/ui/Modal';
import { User, UserRole } from '../../types';
import { Users, Plus, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';

export const AdminStaffPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('order_manager');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/staff');
      setStaff(res.staff || []);
    } catch (err) {
      console.warn('Failed to load staff accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/staff', {
        name,
        email,
        phone,
        password,
        role,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Staff Account Created',
          message: `${name} has been provisioned as ${role.toUpperCase()}`,
        })
      );

      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Provisioning Error',
          message: err?.message || 'Only Super Admins can manage staff accounts.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Staff Accounts & RBAC Permissions
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Role-Based Access Control for Super Admin, Order Managers, Inventory Staff, and Customer Care.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setRole('order_manager');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-stone-50/70 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned RBAC Role</th>
                <th className="py-3 px-4">Operational Privileges</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {staff.map((u) => (
                <tr key={u._id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 px-4 font-semibold text-stone-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#133E32]" />
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 font-mono">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 uppercase">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-stone-500">
                    {u.role === 'super_admin'
                      ? 'Full System Authority & Financials'
                      : u.role === 'order_manager'
                      ? 'Fulfillment, Shipments & Couriers'
                      : u.role === 'inventory_manager'
                      ? 'Stock Adjustments & Warehouse'
                      : 'Customer Tickets & Inquiries'}
                  </td>
                  <td className="py-3.5 px-4 text-stone-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision Staff Member"
        description="Assign authorized role and credentials for backend administrative modules."
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Corporate Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">RBAC Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            >
              <option value="order_manager">Order Manager (Dispatch, Invoices)</option>
              <option value="inventory_manager">Inventory Manager (Stock Levels)</option>
              <option value="catalog_manager">Catalog Manager (SKUs, Categories)</option>
              <option value="customer_support">Customer Support (Reviews, Inquiries)</option>
              <option value="admin">Operations Admin</option>
              <option value="super_admin">Super Administrator (Full Privileges)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
            >
              {submitting ? 'Provisioning...' : 'Provision Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
