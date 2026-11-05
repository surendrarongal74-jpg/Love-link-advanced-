import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Images, HelpCircle, Sparkles, ShieldCheck, MapPinOff, Download, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Private chat & voice notes',
    body: 'Text, photos and voice notes in a space only you and your partner are invited to.',
  },
  {
    icon: Images,
    title: 'Memories & diary',
    body: 'Keep your photos, milestones and a shared diary together in one timeline.',
  },
  {
    icon: HelpCircle,
    title: 'Daily question & games',
    body: 'One small question a day, plus quick games to play together, near or far.',
  },
  {
    icon: Sparkles,
    title: 'AIRA, an optional AI helper',
    body: 'Ideas for dates, sweet messages and games. Off until you turn it on.',
  },
];

const PRIVACY_POINTS = [
  {
    icon: Sparkles,
    title: 'AIRA only sees what you choose',
    body: 'AI features are off by default. Once you turn them on, only what you type or attach for AIRA is sent to Google Gemini. Your partner’s messages and your location are never sent.',
  },
  {
    icon: MapPinOff,
    title: 'Location is off by default',
    body: 'Love Link never asks for your location on its own. You can share it with your partner from Love Map, and switch it off any time.',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted before it’s stored',
    body: 'Messages and media are encrypted in your browser and then stored in our cloud database (Google Firebase) so they sync between you two. This is not end-to-end encryption yet.',
  },
  {
    icon: Download,
    title: 'Export or erase your data',
    body: 'You can download your data or ask us to delete it at any time from the Data Rights page.',
  },
];

/**
 * Public intro shown to signed-out visitors before the consent / sign-in step.
 */
export function LandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-50 text-rose-950">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-28 sm:pb-16">
        {/* Hero */}
        <header className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white shadow-lg shadow-rose-200/60 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-rose-700 tracking-wide">Love Link</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-serif font-bold text-rose-950 leading-tight">
            A private space for the two of you
          </h1>
          <p className="mt-3 text-base text-rose-900/80 max-w-xl mx-auto leading-relaxed">
            Chat, share photos and voice notes, answer a daily question together and keep your memories in one place.
            Made for couples, including long-distance ones.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto min-h-12 px-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-base font-bold shadow-lg shadow-rose-300/50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <Link
              to="/auth"
              className="min-h-12 px-4 flex items-center text-sm font-semibold text-rose-800 underline underline-offset-4 hover:text-rose-950"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-2 text-sm text-rose-900/75">You can also look around in a demo space on the next screen.</p>
        </header>

        {/* Features */}
        <section aria-labelledby="features-heading" className="mt-12">
          <h2 id="features-heading" className="text-lg font-bold text-rose-950 mb-4 text-center sm:text-left">
            What you can do together
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="bg-white/90 border border-rose-100 rounded-3xl p-5 shadow-sm">
                <span className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-rose-600" aria-hidden="true" />
                </span>
                <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy explainer */}
        <section aria-labelledby="privacy-heading" className="mt-12 bg-white/90 border border-rose-100 rounded-3xl p-5 sm:p-7 shadow-sm">
          <h2 id="privacy-heading" className="text-lg font-bold text-rose-950">
            Your privacy, in plain words
          </h2>
          <ul className="mt-4 space-y-4">
            {PRIVACY_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-gray-700">
            Read the full{' '}
            <Link to="/privacy" className="font-semibold text-rose-700 underline underline-offset-2">Privacy Notice</Link>
            {' '}or go to{' '}
            <Link to="/data-rights" className="font-semibold text-rose-700 underline underline-offset-2">Data Rights</Link>.
          </p>
        </section>

        {/* Closing CTA */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="min-h-12 px-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-base font-bold shadow-lg shadow-rose-300/50 inline-flex items-center gap-2 transition active:scale-[0.98]"
          >
            Get started
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-1 text-sm text-rose-900/80">
          <Link to="/features" className="min-h-11 px-3 inline-flex items-center hover:underline">Features</Link>
          <Link to="/privacy" className="min-h-11 px-3 inline-flex items-center hover:underline">Privacy</Link>
          <Link to="/terms" className="min-h-11 px-3 inline-flex items-center hover:underline">Terms</Link>
          <Link to="/data-rights" className="min-h-11 px-3 inline-flex items-center hover:underline">Data rights</Link>
          <Link to="/install" className="min-h-11 px-3 inline-flex items-center hover:underline">Install the app</Link>
        </footer>
      </div>
    </div>
  );
}
