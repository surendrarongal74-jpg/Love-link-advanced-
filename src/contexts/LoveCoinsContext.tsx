import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { UserWallet, UserInventory, CoinTransaction, RomanticMission } from '../types/coins';
import { applyTheme, getStoredTheme } from '../lib/themeEngine';
import { sound } from '../lib/sound';

interface LoveCoinsContextType {
  wallet: UserWallet | null;
  inventory: UserInventory | null;
  transactions: CoinTransaction[];
  missions: (RomanticMission & { canSubmit: boolean; nextAvailableInHours: number })[];
  dailyRemainingQuota: number;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  submitMissionProof: (
    missionId: string,
    proofType: 'photo' | 'text',
    proofContent: string,
    reflection?: string
  ) => Promise<{ success: boolean; error?: string; coinsAwarded?: number; feedback?: string }>;
  spendCoins: (itemId: string, itemType: string, cost: number) => Promise<{ success: boolean; error?: string; newBalance?: number }>;
  sendGift: (
    giftId: string,
    giftName: string,
    cost: number,
    recipientId?: string,
    note?: string
  ) => Promise<{ success: boolean; error?: string; gift?: any }>;
  claimReferral: (referralCode: string) => Promise<{ success: boolean; error?: string; coinsAwarded?: number }>;
  claimDailyCheckIn: () => Promise<{ success: boolean; error?: string; coinsAwarded?: number; streakDays?: number }>;
  setActiveTheme: (themeId: string) => Promise<void>;
  setEquippedBadge: (badgeId: string) => Promise<void>;
}

const LoveCoinsContext = createContext<LoveCoinsContextType>({} as LoveCoinsContextType);

export function LoveCoinsProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [inventory, setInventory] = useState<UserInventory | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [missions, setMissions] = useState<(RomanticMission & { canSubmit: boolean; nextAvailableInHours: number })[]>([]);
  const [dailyRemainingQuota, setDailyRemainingQuota] = useState<number>(250);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize theme from storage immediately
  useEffect(() => {
    const saved = getStoredTheme();
    applyTheme(saved);
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/coins/wallet?userId=${encodeURIComponent(userData.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWallet(data.wallet);
          setInventory(data.inventory);
          setTransactions(data.transactions || []);
          setDailyRemainingQuota(data.dailyRemainingQuota ?? 250);
          setMissions(data.missions || []);

          if (data.inventory?.activeTheme) {
            applyTheme(data.inventory.activeTheme);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to refresh Love Coins wallet from server:', err);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const submitMissionProof = async (
    missionId: string,
    proofType: 'photo' | 'text',
    proofContent: string,
    reflection?: string
  ) => {
    if (!userData?.id) {
      return { success: false, error: 'User is not authenticated' };
    }

    try {
      const res = await fetch('/api/coins/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          coupleSpaceId: space?.id || '',
          missionId,
          proofType,
          proofContent,
          reflection: reflection || ''
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to verify mission proof. Please try again.'
        };
      }

      sound.playLoveAlert();
      await refreshWallet();

      return {
        success: true,
        coinsAwarded: data.coinsAwarded,
        feedback: data.evaluation?.feedback || 'Love Coins awarded!'
      };
    } catch (err: any) {
      console.error('Error submitting mission proof:', err);
      return { success: false, error: 'Network error submitting proof. Please check your connection.' };
    }
  };

  const spendCoins = async (itemId: string, itemType: string, cost: number) => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    try {
      const res = await fetch('/api/coins/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          itemId,
          itemType,
          cost
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Could not complete coin purchase.' };
      }

      sound.playSuccess();
      await refreshWallet();
      return { success: true, newBalance: data.newBalance };
    } catch (err: any) {
      console.error('Error spending coins:', err);
      return { success: false, error: 'Transaction failed. Please try again.' };
    }
  };

  const sendGift = async (
    giftId: string,
    giftName: string,
    cost: number,
    recipientId?: string,
    note?: string
  ) => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    const partnerUid = recipientId || partnerData?.id || '';

    try {
      const res = await fetch('/api/coins/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          coupleSpaceId: space?.id || '',
          giftId,
          giftName,
          cost,
          recipientId: partnerUid,
          note: note || ''
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send virtual gift.' };
      }

      // Also record in couple space Firestore so partner receives real-time listener update
      if (space?.id) {
        try {
          await addDoc(collection(db, `coupleSpaces/${space.id}/virtualGifts`), {
            id: data.gift.id,
            coupleSpaceId: space.id,
            senderId: userData.id,
            recipientId: partnerUid,
            giftId,
            giftName,
            cost,
            note: note || '',
            createdAt: Date.now()
          });
        } catch (fErr) {
          console.warn('Realtime Firestore gift broadcast note:', fErr);
        }
      }

      sound.playLoveAlert();
      await refreshWallet();
      return { success: true, gift: data.gift };
    } catch (err: any) {
      console.error('Error sending gift:', err);
      return { success: false, error: 'Failed to send gift. Please check connection.' };
    }
  };

  const claimReferral = async (referralCode: string) => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    try {
      const res = await fetch('/api/coins/verify-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          coupleSpaceId: space?.id || '',
          referralCode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Referral verification failed.' };
      }

      sound.playSuccess();
      await refreshWallet();
      return { success: true, coinsAwarded: data.coinsAwarded };
    } catch (err: any) {
      console.error('Error claiming referral:', err);
      return { success: false, error: 'Failed to verify referral code.' };
    }
  };

  const claimDailyCheckIn = async () => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    try {
      const res = await fetch('/api/coins/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to claim daily check-in.' };
      }

      sound.playSuccess();
      await refreshWallet();
      return {
        success: true,
        coinsAwarded: data.coinsAwarded,
        streakDays: data.streakDays
      };
    } catch (err: any) {
      console.error('Error claiming daily check-in:', err);
      return { success: false, error: 'Network error claiming daily check-in.' };
    }
  };

  const setActiveTheme = async (themeId: string) => {
    if (!userData?.id) return;
    applyTheme(themeId);

    try {
      await fetch('/api/coins/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          activeTheme: themeId
        })
      });
      await refreshWallet();
    } catch (err) {
      console.warn('Could not save active theme preference:', err);
    }
  };

  const setEquippedBadge = async (badgeId: string) => {
    if (!userData?.id) return;

    try {
      await fetch('/api/coins/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          equippedBadge: badgeId
        })
      });
      await refreshWallet();
    } catch (err) {
      console.warn('Could not save equipped badge preference:', err);
    }
  };

  return (
    <LoveCoinsContext.Provider
      value={{
        wallet,
        inventory,
        transactions,
        missions,
        dailyRemainingQuota,
        loading,
        refreshWallet,
        submitMissionProof,
        spendCoins,
        sendGift,
        claimReferral,
        claimDailyCheckIn,
        setActiveTheme,
        setEquippedBadge
      }}
    >
      {children}
    </LoveCoinsContext.Provider>
  );
}

export function useLoveCoins() {
  const context = useContext(LoveCoinsContext);
  if (!context) {
    throw new Error('useLoveCoins must be used within a LoveCoinsProvider');
  }
  return context;
}
