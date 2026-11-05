import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { setAiConsent } from '../../lib/aiConsent';

interface AiConsentPromptProps {
  /** Called after the user turns AI features on. */
  onGranted?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

/**
 * Just-in-time consent for AI features. Plain-language explanation of what is sent to Google Gemini.
 */
export function AiConsentPrompt({ onGranted, onDismiss, compact = false }: AiConsentPromptProps) {
  return (
    <div
      role="region"
      aria-label="Turn on AI features"
      className={`rounded-3xl border border-rose-200 bg-white/95 text-left shadow-sm ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-rose-600" aria-hidden="true" />
        </span>
        <h3 className="font-bold text-gray-900 text-sm">Turn on AI features?</h3>
      </div>
      <ul className="text-[13px] leading-relaxed text-gray-700 space-y-1.5 mb-4 list-disc pl-5 marker:text-rose-400">
        <li>AIRA, reply ideas and the date planner use <strong>Google Gemini</strong>.</li>
        <li>Only what you type or attach for the AI (and your own recent messages, for reply ideas) is sent to Google to create a reply.</li>
        <li>Your partner&apos;s messages and your location are never sent.</li>
        <li>You can turn this off any time in Privacy settings.</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAiConsent(true);
            onGranted?.();
          }}
          className="min-h-11 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          Turn on AI features
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 px-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Not now
          </button>
        )}
      </div>
    </div>
  );
}
