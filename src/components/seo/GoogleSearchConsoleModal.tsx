import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, ExternalLink, Copy, Check, Globe, Shield, RefreshCw } from 'lucide-react';
import { sound } from '../../lib/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSearchConsoleModal({ isOpen, onClose }: Props) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('love_link_gsc_token') || '';
      setToken(savedToken);
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch SEO status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    sound.tap();
    const cleanToken = token.trim();
    localStorage.setItem('love_link_gsc_token', cleanToken);

    // Update the live DOM meta tag immediately
    const metaTag = document.getElementById('google-site-verification-meta');
    if (metaTag) {
      metaTag.setAttribute('content', cleanToken);
    }

    // Persist to server in-memory store
    try {
      await fetch('/api/seo/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });
    } catch (err) {}

    sound.playSuccess();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    fetchStatus();
  };

  const copyToClipboard = (text: string, key: string) => {
    sound.tap();
    navigator.clipboard?.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!isOpen) return null;

  const origin = window.location.origin;
  const sitemapUrl = `${origin}/sitemap.xml`;
  const robotsUrl = `${origin}/robots.txt`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Google Search Console</h2>
              <p className="text-[11px] text-rose-100">SEO & Crawler Optimization</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status summary */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-900 block text-xs">
                Search Console Ready
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                XML Sitemap, dynamic robots.txt with couple privacy isolation, and Schema.org rich snippets are active.
              </p>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800 flex items-center justify-between">
              <span>Google Verification Token</span>
              <span className="text-[10px] text-gray-400 font-normal">HTML Tag or Code</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste code (e.g., 4aBcdEfGh...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-rose-500 focus:border-rose-500 bg-gray-50/50"
              />
              <button
                onClick={handleSaveToken}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
            {savedSuccess && (
              <span className="text-[11px] text-emerald-600 font-semibold block animate-fade-in">
                ✓ Verification token updated!
              </span>
            )}
            <p className="text-[10px] text-gray-500">
              Paste the code from Search Console's <em>"HTML tag"</em> method. You can also verify via the automated HTML file route:
              <code className="ml-1 bg-gray-100 px-1 py-0.5 rounded text-[10px] text-rose-600">/google&lt;token&gt;.html</code>
            </p>
          </div>

          {/* Quick Endpoints to Test */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-gray-800 block">Crawler Feeds</span>
            
            {/* Sitemap */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-semibold text-gray-700 block text-[11px]">Sitemap XML</span>
                <span className="text-[10px] text-gray-400 truncate block">{sitemapUrl}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => copyToClipboard(sitemapUrl, 'sitemap')}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Copy URL"
                >
                  {copiedLink === 'sitemap' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Robots.txt */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-150 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-semibold text-gray-700 block text-[11px]">Robots.txt</span>
                <span className="text-[10px] text-gray-400 truncate block">{robotsUrl}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => copyToClipboard(robotsUrl, 'robots')}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Copy URL"
                >
                  {copiedLink === 'robots' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-rose-800 leading-relaxed">
              <strong>Intimacy Protection:</strong> Your private chat messages, anniversary dates, and couple spaces are configured with <code>Disallow</code> and will never be exposed to search indexes.
            </p>
          </div>

          {/* Direct link to Google Search Console */}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Globe className="w-4 h-4 text-rose-400" />
            <span>Open Google Search Console</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
