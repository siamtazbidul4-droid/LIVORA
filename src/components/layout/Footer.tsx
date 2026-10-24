import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Shield,
} from 'lucide-react';
import { AdminAuthModal } from '../../features/auth/AdminAuthModal';

export const Footer: React.FC = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  return (
    <footer className="bg-[#0D2E24] text-stone-300 text-xs pt-16 pb-8 border-t border-[#133E32]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand & Slogan */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-3xl font-serif font-bold tracking-wider text-white">
                LIVORA
              </span>
              <span className="block text-[10px] tracking-[0.25em] font-medium text-stone-400 uppercase mt-0.5">
                Live a Better Home
              </span>
            </Link>

            <p className="text-stone-300 text-xs leading-relaxed max-w-sm">
              Homes for today. A brighter tomorrow. Curating timeless furniture, artisanal lighting, and thoughtful home decor crafted for modern living across Bangladesh.
            </p>

            <div className="flex items-center gap-3 pt-2 text-stone-400">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#133E32] flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#133E32] flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#133E32] flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-2 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gulshan-2, Dhaka 1212, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+880 1700-000000 / 09612-LIVORA</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>care@livora.com.bd</span>
              </div>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-4">
              Shop Collections
            </h3>
            <ul className="space-y-2.5 text-stone-400">
              <li>
                <Link to="/products?category=furniture" className="hover:text-white transition-colors">
                  Furniture & Sofas
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-decor" className="hover:text-white transition-colors">
                  Home Decor & Art
                </Link>
              </li>
              <li>
                <Link to="/products?category=lighting" className="hover:text-white transition-colors">
                  Lamps & Lighting
                </Link>
              </li>
              <li>
                <Link to="/products?category=bedding" className="hover:text-white transition-colors">
                  Bedding & Linens
                </Link>
              </li>
              <li>
                <Link to="/products?category=kitchen" className="hover:text-white transition-colors">
                  Kitchen & Dining
                </Link>
              </li>
              <li>
                <Link to="/products?sale=true" className="text-amber-300 hover:text-amber-200 transition-colors font-medium">
                  Seasonal Sale (Up to 40% Off)
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-4">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-stone-400">
              <li>
                <Link to="/account/orders" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/support#returns" className="hover:text-white transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link to="/support#shipping" className="hover:text-white transition-colors">
                  Nationwide Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/support#warranty" className="hover:text-white transition-colors">
                  Authenticity & Warranty
                </Link>
              </li>
              <li>
                <Link to="/support#faqs" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Contact Support Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Download App & Trust */}
          <div>
            <h3 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-4">
              Livora App
            </h3>
            <p className="text-stone-400 text-xs leading-relaxed mb-4">
              A more beautiful home, anywhere you go. Exclusive app discounts and AR room preview.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-black/40 border border-stone-700/60 rounded-lg px-3 py-2 cursor-pointer hover:border-emerald-500 transition-colors">
                <span className="text-lg"></span>
                <div>
                  <div className="text-[9px] text-stone-400 uppercase leading-none">Download on the</div>
                  <div className="text-xs font-semibold text-white leading-tight">App Store</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-black/40 border border-stone-700/60 rounded-lg px-3 py-2 cursor-pointer hover:border-emerald-500 transition-colors">
                <span className="text-sm">▶</span>
                <div>
                  <div className="text-[9px] text-stone-400 uppercase leading-none">Get it on</div>
                  <div className="text-xs font-semibold text-white leading-tight">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-400 text-[11px] gap-4">
          <p>© 2026 Livora / NOVARA Commerce. All rights reserved. Built for Bangladesh.</p>
          <div className="flex items-center gap-4">
            <Link to="/support#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to="/support#terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>·</span>
            <Link to="/sitemap.xml" className="hover:text-white transition-colors">
              Sitemap
            </Link>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="text-stone-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Merchant & Staff Portal</span>
            </button>
          </div>
        </div>
      </div>

      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </footer>
  );
};
