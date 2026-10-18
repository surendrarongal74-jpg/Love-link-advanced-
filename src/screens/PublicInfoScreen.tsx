import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, Heart, Sparkles, FileText, Lock, Globe, CheckCircle2, Scale } from 'lucide-react';
import { sound } from '../lib/sound';
import { DPDPPrivacyNotice } from '../components/legal/DPDPPrivacyNotice';
import { DataRightsRequestModal } from '../components/legal/DataRightsRequestModal';
import { GrievanceContactCard } from '../components/legal/GrievanceContactCard';

export function PublicInfoScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const [showRightsModal, setShowRightsModal] = useState(false);

  let title = 'About Love Link';
  let badge = 'Our Mission';
  let content: React.ReactNode = null;

  if (path === '/privacy' || path === '/privacy-notice') {
    title = 'Privacy Notice & Policy';
    badge = 'DPDP Act, 2023 Compliant';
    content = (
      <DPDPPrivacyNotice onOpenDataRightsModal={() => setShowRightsModal(true)} />
    );
  } else if (path === '/data-rights') {
    title = 'Data Principal Rights';
    badge = 'Statutory Rights (DPDP Act)';
    content = (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-1.5">
          <strong className="font-bold text-sm block">Exercise Your Rights Under India DPDP Act, 2023</strong>
          <p>
            As a Data Principal, you possess statutory rights under Chapter III to access, correct, erase, nominate, or withdraw consent for personal data processed by Love Link.
          </p>
          <button
            onClick={() => {
              sound.tap();
              setShowRightsModal(true);
            }}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            Open Interactive Request Form
          </button>
        </div>
        <GrievanceContactCard onOpenDataRightsModal={() => setShowRightsModal(true)} />
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
        <section className="space-y-2 pt-2 border-t border-rose-100">
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-[10px] text-amber-900 font-mono">
            <strong>[LEGAL REVIEW REQUIRED - STATUTORY DATA PROTECTION CLAUSE UNDER DIGITAL PERSONAL DATA PROTECTION ACT, 2023]</strong>
          </div>
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-600" /> 3. Data Protection Clause (India DPDP Act, 2023)
          </h2>
          <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
            <p>
              <strong>3.1 Relationship of Parties:</strong> You acknowledge that you are a <em>Data Principal</em> and Love Link Digital Sanctuary (India) Private Limited is the <em>Data Fiduciary</em> under Section 2 of the Digital Personal Data Protection Act, 2023.
            </p>
            <p>
              <strong>3.2 Purpose Limitation:</strong> Your personal data is processed solely for providing the private couple sanctuary service pursuant to affirmative, specific, and unambiguous consent obtained at signup and feature activation.
            </p>
            <p>
              <strong>3.3 Security & Breach Notification:</strong> Love Link maintains technical safeguards (AES-GCM encryption, access controls) under Section 8(5). In the event of a personal data breach, Love Link will notify the Data Protection Board of India and affected Data Principals within 72 hours as required by Section 8(6).
            </p>
            <p>
              <strong>3.4 Grievance Redressal:</strong> Inquiries, disputes, or complaints may be addressed to our Data Protection Grievance Officer at <code>grievance-dpdp@love-link.app</code> with guaranteed acknowledgment in 48 hours and resolution within 30 calendar days. Escalation is available to the Data Protection Board of India (DPBI) under Section 13(3).
            </p>
          </div>
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
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-rose-500">
          <button onClick={() => navigate('/')} className="hover:underline">Home</button>
          <span>•</span>
          <button onClick={() => navigate('/features')} className="hover:underline">Features</button>
          <span>•</span>
          <button onClick={() => navigate('/about')} className="hover:underline">About</button>
          <span>•</span>
          <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy Notice</button>
          <span>•</span>
          <button onClick={() => navigate('/terms')} className="hover:underline">Terms</button>
          <span>•</span>
          <button onClick={() => setShowRightsModal(true)} className="hover:underline text-indigo-600">Data Rights Form</button>
        </div>

        <DataRightsRequestModal
          isOpen={showRightsModal}
          onClose={() => setShowRightsModal(false)}
        />
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
