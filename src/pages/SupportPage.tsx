import React, { useState } from 'react';
import { api } from '../services/api';
import { useAppDispatch } from '../app/hooks';
import { addToast } from '../features/toast/toastSlice';
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  HelpCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Order Tracking / Delivery Status');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/support/enquiry', {
        name,
        email,
        phone,
        subject,
        message,
      });

      dispatch(
        addToast({
          type: 'success',
          title: 'Ticket Submitted',
          message: 'Thank you. Our Dhaka customer support desk will reach out shortly.',
        })
      );

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Submission Failed',
          message: err?.message || 'Unable to submit enquiry at this time.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            Customer Support & Policies
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            We are dedicated to exceptional craftsmanship and hassle-free retail living. Reach our Bangladesh support team anytime.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-2xs space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#133E32] flex items-center justify-center mx-auto mb-2">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900">Phone & WhatsApp</h3>
            <p className="text-xs text-stone-500">Sun–Thu from 9:00 AM to 8:00 PM</p>
            <p className="text-sm font-bold text-[#133E32] pt-1">+880 1700-000000</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-2xs space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#133E32] flex items-center justify-center mx-auto mb-2">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900">Email Inquiries</h3>
            <p className="text-xs text-stone-500">Order verification and corporate quotes</p>
            <p className="text-sm font-bold text-[#133E32] pt-1">care@livora.com.bd</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-2xs space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#133E32] flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900">Flagship Experience Center</h3>
            <p className="text-xs text-stone-500">Gulshan-2 Avenue, Dhaka</p>
            <p className="text-xs font-semibold text-stone-700 pt-1">Plot 12, Road 45, Dhaka 1212</p>
          </div>
        </div>

        {/* Support Form & Policies Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Support Ticket Form */}
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-2xs space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Send an Inquiry Ticket
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Your ticket will be assigned directly to our customer care team.
              </p>
            </div>

            <form onSubmit={handleSubmitEnquiry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Name *
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    Inquiry Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none"
                  >
                    <option value="Order Tracking / Delivery Status">Order Tracking / Delivery Status</option>
                    <option value="Damaged Goods / Replacement Request">Damaged Goods / Replacement Request</option>
                    <option value="Custom Furniture Sizing">Custom Furniture Sizing</option>
                    <option value="Corporate / Bulk Hospitality Order">Corporate / Bulk Hospitality Order</option>
                    <option value="Payment / Refund Assistance">Payment / Refund Assistance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Message Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your question or order number..."
                  className="w-full rounded-xl border border-stone-200 p-3 text-xs focus:border-[#133E32] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#133E32] py-3 text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Send Inquiry Ticket'}</span>
              </button>
            </form>
          </div>

          {/* Business Policies FAQs */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-stone-900">
                <Truck className="w-5 h-5 text-[#133E32]" />
                Shipping & Delivery Policy
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Orders are dispatched from our central warehouse in Dhaka. Inside Dhaka deliveries take 24–48 hours (৳80), while outside Dhaka shipments across all 64 districts arrive within 3–5 working days (৳150). Orders above ৳5,000 enjoy complimentary zero delivery charges.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-stone-900">
                <RotateCcw className="w-5 h-5 text-[#133E32]" />
                Returns & 7-Day Replacement
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                We take full responsibility for goods transit safety. If an item arrives with transit damage or defective finishing, notify us within 7 days via your customer account order dashboard to coordinate an immediate replacement or full reimbursement.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-stone-900">
                <ShieldCheck className="w-5 h-5 text-[#133E32]" />
                Authenticity & Structural Warranty
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                All wood products are kiln-dried treated solid mahogany, teak, or engineered walnut with 1 Year structural integrity warranty against joint weakening and termite infiltration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
