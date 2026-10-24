import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import { CMSConfig } from '../../types';
import { AdminImageUploader } from '../../components/ui/AdminImageUploader';
import { FileText, Image as ImageIcon, Save, CheckCircle2, Eye, ExternalLink } from 'lucide-react';

export const AdminCMSPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [cms, setCms] = useState<CMSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const res = await api.get('/cms');
        setCms(res);
      } catch (err) {
        console.warn('Failed to load CMS', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCMS();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cms) return;

    setSaving(true);
    try {
      await api.put('/cms', cms);
      dispatch(
        addToast({
          type: 'success',
          title: 'CMS Updated',
          message: 'Homepage content & promotional placements refreshed.',
        })
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: err?.message || 'Failed to update CMS configuration.',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cms) {
    return <div className="py-20 text-center text-xs text-stone-500">Loading CMS...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Homepage CMS & Promotional Ads
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Dynamic control over announcement notices, hero campaign imagery, and optional promotional ad placements.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#133E32] text-xs font-semibold text-white hover:bg-[#0d2e24] shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing...' : 'Publish Changes'}</span>
        </button>
      </div>

      {/* 1. Dedicated Promotional Ad Placement (Mandatory Section 10) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Promotional Artwork / Sponsored Placement
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              First-party promotional placement. When disabled, it is cleanly omitted from the homepage without blank spaces.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cms.promotionalAd.enabled}
              onChange={(e) =>
                setCms({
                  ...cms,
                  promotionalAd: { ...cms.promotionalAd, enabled: e.target.checked },
                })
              }
              className="rounded text-[#133E32] focus:ring-[#133E32] w-4 h-4"
            />
            <span className="text-xs font-semibold text-stone-800">
              {cms.promotionalAd.enabled ? 'Placement Enabled' : 'Disabled (Hidden)'}
            </span>
          </label>
        </div>

        {cms.promotionalAd.enabled && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Ad Campaign Headline
                </label>
                <input
                  type="text"
                  value={cms.promotionalAd.title}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      promotionalAd: { ...cms.promotionalAd, title: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Badge Label (e.g. SPECIAL OFFER)
                </label>
                <input
                  type="text"
                  value={cms.promotionalAd.badgeText || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      promotionalAd: { ...cms.promotionalAd, badgeText: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs uppercase"
                />
              </div>

              <AdminImageUploader
                label="Promotional artwork"
                value={cms.promotionalAd.imageUrl}
                onChange={(imageUrl) =>
                  setCms({
                    ...cms,
                    promotionalAd: { ...cms.promotionalAd, imageUrl },
                  })
                }
              />

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={cms.promotionalAd.destinationUrl}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      promotionalAd: { ...cms.promotionalAd, destinationUrl: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Ad Preview */}
            {cms.promotionalAd.imageUrl && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Live Preview:
                </span>
                <div className="relative rounded-xl overflow-hidden h-28 border border-stone-200">
                  <img
                    src={cms.promotionalAd.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center px-4 text-white">
                    <div>
                      <span className="text-[9px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded-xs">
                        {cms.promotionalAd.badgeText || 'PROMO'}
                      </span>
                      <p className="font-serif font-bold text-sm mt-0.5">{cms.promotionalAd.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Announcement Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 pb-2 border-b border-stone-100">
          Top Announcement Bar Notice
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Banner Text Notice
            </label>
            <input
              type="text"
              value={cms.announcementBar.text}
              onChange={(e) =>
                setCms({
                  ...cms,
                  announcementBar: { ...cms.announcementBar, text: e.target.value },
                })
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Hero Campaign Section */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 pb-2 border-b border-stone-100">
          Hero Campaign Section
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Tagline Pill</label>
            <input
              type="text"
              value={cms.heroCampaign.tagline}
              onChange={(e) =>
                setCms({
                  ...cms,
                  heroCampaign: { ...cms.heroCampaign, tagline: e.target.value },
                })
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Main Heading</label>
            <input
              type="text"
              value={cms.heroCampaign.title}
              onChange={(e) =>
                setCms({
                  ...cms,
                  heroCampaign: { ...cms.heroCampaign, title: e.target.value },
                })
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={cms.heroCampaign.subtitle}
              onChange={(e) =>
                setCms({
                  ...cms,
                  heroCampaign: { ...cms.heroCampaign, subtitle: e.target.value },
                })
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            />
          </div>

          <AdminImageUploader
            label="Hero background image"
            value={cms.heroCampaign.imageUrl}
            onChange={(imageUrl) =>
              setCms({
                ...cms,
                heroCampaign: { ...cms.heroCampaign, imageUrl },
              })
            }
          />

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Button Text</label>
            <input
              type="text"
              value={cms.heroCampaign.ctaText}
              onChange={(e) =>
                setCms({
                  ...cms,
                  heroCampaign: { ...cms.heroCampaign, ctaText: e.target.value },
                })
              }
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
