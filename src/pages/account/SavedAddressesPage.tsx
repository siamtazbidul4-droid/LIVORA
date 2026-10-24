import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useBangladeshLocations } from '../../app/useBangladeshLocations';
import { updateUserProfile } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { api } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Address } from '../../types';
import {
  resolveBangladeshLocation,
} from '../../lib/bangladeshLocations';
import type { BangladeshLocationSelection } from '../../lib/bangladeshLocations';
import { BangladeshAddressFields } from '../../components/ui/BangladeshAddressFields';
import { MapPin, Plus, Trash2, CheckCircle2, Home } from 'lucide-react';

export const SavedAddressesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading: locationsLoading, error: locationsError } = useBangladeshLocations();
  const user = useAppSelector((state) => state.auth.user);
  const addresses = user?.addresses || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [locationSelection, setLocationSelection] = useState<BangladeshLocationSelection>({
    divisionId: null,
    districtId: null,
    upazilaId: null,
    unionId: null,
  });
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedLocation = resolveBangladeshLocation(locationSelection, true);
    if (!normalizedLocation) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Incomplete Delivery Location',
          message: 'Select a valid Division, District, Upazila, and an available Union.',
        })
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: Address = {
        recipientName,
        phone,
        ...normalizedLocation,
        streetAddress,
        landmark,
        isDefault,
      };

      const res = await api.post('/users/addresses', payload);
      dispatch(updateUserProfile(res.user));
      dispatch(
        addToast({
          type: 'success',
          title: 'Address Saved',
          message: 'Your delivery address has been saved.',
        })
      );
      setModalOpen(false);
      setStreetAddress('');
      setLandmark('');
      setLocationSelection({
        divisionId: null,
        districtId: null,
        upazilaId: null,
        unionId: null,
      });
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Error Saving Address',
          message: err?.message || 'Failed to update address records.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId?: string) => {
    if (!addressId) return;
    try {
      const res = await api.delete(`/users/addresses/${addressId}`);
      dispatch(updateUserProfile(res.user));
      dispatch(
        addToast({
          type: 'info',
          title: 'Address Removed',
          message: 'Saved address deleted.',
        })
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Error',
          message: err?.message || 'Could not delete address.',
        })
      );
    }
  };

  const handleSetDefault = async (addressId?: string) => {
    if (!addressId) return;
    try {
      const res = await api.put(`/users/addresses/${addressId}/default`);
      dispatch(updateUserProfile(res.user));
      dispatch(
        addToast({
          type: 'success',
          title: 'Default Address Updated',
          message: 'This address is now set as your primary shipping destination.',
        })
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">
              Saved Delivery Addresses
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Manage your residential and business delivery addresses in Bangladesh.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#133E32] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-100 shadow-2xs">
            <Home className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-serif font-semibold text-stone-800">
              No saved addresses
            </h3>
            <p className="text-xs text-stone-500 mb-6 max-w-sm mx-auto">
              Add your home or office address to save time during checkout.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-[#133E32] px-5 py-2 text-xs font-semibold text-white"
            >
              Add First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs flex flex-col justify-between ${
                  addr.isDefault ? 'border-[#133E32] ring-1 ring-[#133E32]' : 'border-stone-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-stone-900">
                      {addr.recipientName}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-[#133E32] bg-emerald-50 px-2 py-0.5 rounded-full">
                        Default Destination
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">{addr.phone}</p>
                  <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                    {addr.streetAddress}, {addr.upazila}, {addr.district}, {addr.division}
                  </p>
                  {addr.landmark && (
                    <p className="text-[11px] text-stone-400 mt-1 italic">
                      Near: {addr.landmark}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-50 text-xs">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-stone-500 hover:text-[#133E32] font-medium"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Primary
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Modal for Adding Address */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add New Delivery Address"
          description="Enter recipient details and select the matching Bangladesh administrative areas."
          maxWidth="md"
        >
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <BangladeshAddressFields
              value={locationSelection}
              onChange={setLocationSelection}
              isLoading={locationsLoading}
              error={locationsError}
            />

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                House & Street Details *
              </label>
              <textarea
                required
                rows={2}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="House 24, Road 11, Block D..."
                className="w-full rounded-lg border border-stone-200 p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near landmark..."
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded text-[#133E32]"
              />
              <span>Set as default delivery address</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
