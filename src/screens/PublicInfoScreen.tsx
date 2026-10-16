import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, Heart, Sparkles, FileText, Lock, Globe, CheckCircle2 } from 'lucide-react';
import { sound } from '../lib/sound';

export function PublicInfoScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let title = 'About Love Link';
  let badge = 'Our Mission';
  let content: React.ReactNode = null;

  if (path === '/privacy') {
    title = 'Privacy Policy';
    badge = 'Your Privacy Matters';
    content = (
      <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
        <p className="font-semibold text-rose-700 bg-rose-50/80 p-3 rounded-2xl border border-rose-100">
          Love Link is built on absolute intimacy. We never sell your personal moments, sell ads, or share private couple communications with third parties.
        </p>
        <section className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-rose-500" /> 1. Couple Space Confidentiality
          </h2>
          <p>
            Each couple space is an isolated enclave. Only you and your paired partner possess access to your shared messages, memories, voice notes, and milestone dates.
          </p>
        </section>
        <section className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" /> 2. Data Encryption & Storage
          </h2>
          <p>
            All media, love notes, and chats transmitted across Love Link are encrypted in transit via industry-standard TLS 1.3 and stored in secure, access-controlled cloud repositories.
          </p>
        </section>
        <section className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-500" /> 3. Search Engine Boundary
          </h2>
          <p>
            Private couple spaces, individual chat messages, memories, and personal profiles are strictly blocked from search engine indexing via robots.txt and server protection headers.
          </p>
        </section>
      </div>
    );
  } else if (path === '/terms') {
    title = 'Terms of Service';
    badge = 'Guidelines & Agreement';
    content = (
      <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
        <p>
          Welcome to Love Link. By using our relationship platform, you agree to these terms designed to preserve a positive, trusting environment.
        </p>
        <section className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" /> 1. Respect & Mutual Consent
          </h2>
          <p>
            Love Link is designed for two consenting partners. You agree to use the service in good faith and not for harassment, impersonation, or unauthorized access to another couple's space.
          </p>
        </section>
        <section className="space-y-1.5">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> 2. Loveverse Coins & Virtual Gifts
          </h2>
          <p>
            Love Coins and virtual market gifts are digital in-app enhancements intended for couples to express affection and celebrate milestones.
          </p>
        </section>
      </div>
    );
  } else if (path === '/features') {
    title = 'Features & Capabilities';
    badge = 'Built for Connection';
    content = (
      <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              title: 'Private Couple Spaces',
              desc: 'An intimate, shared sanctuary just for the two of you with synchronized themes and custom widgets.',
              icon: <Heart className="w-4 h-4 text-rose-500" />
            },
            {
              title: 'Interactive Memory Timeline',
              desc: 'Relive anniversaries, first dates, trips, and milestone photos in an emotional, chronological scrapbook.',
              icon: <Sparkles className="w-4 h-4 text-purple-500" />
            },
            {
              title: 'Love Streaks & Daily Sync',
              desc: 'Nurture your daily connection with romantic check-ins, love streaks, and daily trivia.',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            },
            {
              title: 'Loveverse Market & 3D Gifts',
              desc: 'Send animated 3D surprises like Starlight Boxes, Shooting Stars, and romantic themes using Love Coins.',
              icon: <GiftIcon className="w-4 h-4 text-amber-500" />
            }
          ].map((f, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                {f.icon}
                <span>{f.title}</span>
              </div>
              <p className="text-[11px] text-gray-600 pl-6 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // About
    title = 'About Love Link';
    badge = 'Our Story';
    content = (
      <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
        <p>
          Love Link was created to help couples stay deeply connected regardless of physical distance, busy schedules, or routine.
        </p>
        <p>
          Unlike public social networks saturated with endless feeds and advertisements, Love Link is a private two-person world. It is crafted with gentle aesthetics, playful mini-games, shared scrapbooks, and interactive romantic gestures.
        </p>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 text-center space-y-2">
          <Heart className="w-8 h-8 text-rose-500 mx-auto fill-rose-100" />
          <h3 className="font-bold text-gray-900 text-sm">Two Hearts. One Link.</h3>
          <p className="text-[11px] text-gray-600">Built with care for couples around the world.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF6F9] via-pink-50/40 to-white text-gray-900 p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              sound.tap();
              navigate(-1);
            }}
            className="w-10 h-10 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center justify-center text-gray-700 hover:text-rose-600 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 px-3 py-1 bg-rose-50 rounded-full border border-rose-200/50">
            {badge}
          </span>
          <div className="w-10" />
        </div>

        {/* Title Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-rose-100 shadow-md shadow-rose-100/50 space-y-2">
          <h1 className="text-2xl font-serif font-black text-gray-900 leading-tight">
            {title}
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full" />
        </div>

        {/* Main Content Body */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-rose-100 shadow-md shadow-rose-100/40">
          {content}
        </div>

        {/* Quick Footer Links */}
        <div className="pt-4 flex items-center justify-center gap-4 text-[11px] font-semibold text-rose-500">
          <button onClick={() => navigate('/')} className="hover:underline">Home</button>
          <span>•</span>
          <button onClick={() => navigate('/features')} className="hover:underline">Features</button>
          <span>•</span>
          <button onClick={() => navigate('/about')} className="hover:underline">About</button>
          <span>•</span>
          <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy</button>
          <span>•</span>
          <button onClick={() => navigate('/terms')} className="hover:underline">Terms</button>
        </div>
      </div>
    </div>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
