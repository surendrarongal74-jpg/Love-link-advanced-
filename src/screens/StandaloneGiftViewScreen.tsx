import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicDigitalGift, submitGiftResponse } from '../lib/digitalGiftsService';
import { DigitalGift, RecipientGiftResponse } from '../types/digitalGifts';
import { DigitalGiftExperienceRenderer } from '../components/digitalGifts/DigitalGiftExperienceRenderer';
import { Gift, Heart, ArrowLeft, AlertCircle } from 'lucide-react';
import { sound } from '../lib/sound';

export function StandaloneGiftViewScreen() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();

  const [gift, setGift] = useState<DigitalGift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError('Invalid digital gift link.');
      setLoading(false);
      return;
    }

    async function loadGift() {
      try {
        const found = await getPublicDigitalGift(shareToken!);
        if (found) {
          setGift(found);
        } else {
          setError('This digital gift experience was either moved, revoked by the creator, or is unavailable.');
        }
      } catch (err: any) {
        console.error('Error loading gift:', err);
        setError('Could not load digital gift experience.');
      } finally {
        setLoading(false);
      }
    }

    loadGift();
  }, [shareToken]);

  const handleRespond = async (response: RecipientGiftResponse) => {
    if (!gift || !shareToken) return;
    await submitGiftResponse(gift.coupleSpaceId || 'public', gift.id, response, shareToken);
    setGift(prev => prev ? { ...prev, recipientResponse: response } : null);
    sound.playHeartbeat();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF6F9] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
        <div className="space-y-1">
          <h2 className="font-serif font-black text-lg text-rose-950">
            Unwrapping your Loveverse gift...
          </h2>
          <p className="text-xs text-rose-600">Preparing high-fidelity atmospheric visuals</p>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-[#FFF6F9] flex flex-col items-center justify-center p-6 text-center space-y-4 text-rose-950">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-3xl shadow-md">
          💌
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="font-serif font-black text-xl text-rose-950">
            Gift Unavailable
          </h2>
          <p className="text-xs text-rose-700 leading-relaxed font-sans">
            {error || 'This digital gift could not be found or the link has expired.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Love Link Sanctuary
        </button>
      </div>
    );
  }

  return (
    <DigitalGiftExperienceRenderer
      gift={gift}
      isPreview={false}
      onRespond={handleRespond}
      onClose={() => navigate('/')}
    />
  );
}
