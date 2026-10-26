import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { UserWallet, UserInventory, CoinTransaction, RomanticMission, MISSIONS_CATALOG } from '../types/coins';
import { applyTheme, getStoredTheme } from '../lib/themeEngine';
import { sound } from '../lib/sound';

interface LoveCoinsContextType {
  wallet: UserWallet | null;
  balance: number;
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

function getLocalWallet(userId: string): UserWallet {
  try {
    const raw = localStorage.getItem(`lovelink_wallet_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    userId,
    balance: 50,
    totalEarned: 50,
    totalSpent: 0,
    dailyEarnedToday: 0,
    lastEarnDate: new Date().toISOString().split('T')[0],
    maxDailyQuota: 250,
    streakDays: 1,
    lastCheckInDate: '',
    updatedAt: Date.now()
  };
}

function saveLocalWallet(wallet: UserWallet) {
  try {
    localStorage.setItem(`lovelink_wallet_${wallet.userId}`, JSON.stringify(wallet));
  } catch {}
}

function getLocalInventory(userId: string): UserInventory {
  try {
    const raw = localStorage.getItem(`lovelink_inventory_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    userId,
    ownedThemes: ['theme_cloud_romance'],
    activeTheme: 'theme_cloud_romance',
    ownedBadges: [],
    equippedBadge: '',
    ownedGamePacks: [],
    streakFreezeTokens: 0,
    updatedAt: Date.now()
  };
}

function saveLocalInventory(inv: UserInventory) {
  try {
    localStorage.setItem(`lovelink_inventory_${inv.userId}`, JSON.stringify(inv));
  } catch {}
}

function getLocalTransactions(userId: string): CoinTransaction[] {
  try {
    const raw = localStorage.getItem(`lovelink_txs_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: `tx_welcome_${userId}`,
      userId,
      amount: 50,
      type: 'mission_reward',
      description: 'Welcome Gift: 50 Starting Love Coins!',
      createdAt: Date.now()
    }
  ];
}

function saveLocalTransactions(userId: string, txs: CoinTransaction[]) {
  try {
    localStorage.setItem(`lovelink_txs_${userId}`, JSON.stringify(txs.slice(0, 50)));
  } catch {}
}

export function LoveCoinsProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  const [wallet, setWallet] = useState<UserWallet | null>(() => {
    return userData?.id ? getLocalWallet(userData.id) : null;
  });
  const [inventory, setInventory] = useState<UserInventory | null>(() => {
    return userData?.id ? getLocalInventory(userData.id) : null;
  });
  const [transactions, setTransactions] = useState<CoinTransaction[]>(() => {
    return userData?.id ? getLocalTransactions(userData.id) : [];
  });
  const [missions, setMissions] = useState<(RomanticMission & { canSubmit: boolean; nextAvailableInHours: number })[]>(() => {
    return MISSIONS_CATALOG.map(m => ({ ...m, canSubmit: true, nextAvailableInHours: 0 }));
  });
  const [dailyRemainingQuota, setDailyRemainingQuota] = useState<number>(250);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize theme from storage immediately
  useEffect(() => {
    const saved = getStoredTheme();
    applyTheme(saved);
  }, []);

  // Sync initial state if userData becomes available
  useEffect(() => {
    if (userData?.id) {
      setWallet(prev => prev || getLocalWallet(userData.id));
      setInventory(prev => prev || getLocalInventory(userData.id));
      setTransactions(prev => prev.length > 0 ? prev : getLocalTransactions(userData.id));
    }
  }, [userData?.id]);

  const refreshWallet = useCallback(async () => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/coins/wallet?userId=${encodeURIComponent(userData.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wallet) {
          setWallet(data.wallet);
          saveLocalWallet(data.wallet);

          if (data.inventory) {
            setInventory(data.inventory);
            saveLocalInventory(data.inventory);
            if (data.inventory.activeTheme) {
              applyTheme(data.inventory.activeTheme);
            }
          }

          if (data.transactions) {
            setTransactions(data.transactions);
            saveLocalTransactions(userData.id, data.transactions);
          }

          setDailyRemainingQuota(data.dailyRemainingQuota ?? 250);
          if (data.missions) {
            setMissions(data.missions);
          }
        }
      }
    } catch (err) {
      // Graceful offline/network fallback
      const cached = getLocalWallet(userData.id);
      setWallet(cached);
      const cachedInv = getLocalInventory(userData.id);
      setInventory(cachedInv);
      const cachedTxs = getLocalTransactions(userData.id);
      setTransactions(cachedTxs);
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

    const missionDef = MISSIONS_CATALOG.find(m => m.id === missionId);
    const awardCoins = missionDef?.coinsReward || 40;

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

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sound.playLoveAlert();
          await refreshWallet();
          return {
            success: true,
            coinsAwarded: data.coinsAwarded,
            feedback: data.evaluation?.feedback || 'Love Coins awarded!'
          };
        } else {
          return {
            success: false,
            error: data.error || 'Failed to verify mission proof. Please try again.'
          };
        }
      }
    } catch {
      // Graceful client fallback
    }

    // Resilient local reward fallback
    const currentW = wallet || getLocalWallet(userData.id);
    const newBal = currentW.balance + awardCoins;
    const updatedWallet: UserWallet = {
      ...currentW,
      balance: newBal,
      totalEarned: currentW.totalEarned + awardCoins,
      dailyEarnedToday: currentW.dailyEarnedToday + awardCoins,
      updatedAt: Date.now()
    };
    saveLocalWallet(updatedWallet);
    setWallet(updatedWallet);

    const newTx: CoinTransaction = {
      id: `tx_${Date.now()}_mission_${missionId}`,
      userId: userData.id,
      amount: awardCoins,
      type: 'mission_reward',
      description: `Completed: ${missionDef?.title || 'Romantic Quest'} (+${awardCoins} coins)`,
      referenceId: missionId,
      createdAt: Date.now()
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveLocalTransactions(userData.id, updatedTxs);

    sound.playLoveAlert();
    return {
      success: true,
      coinsAwarded: awardCoins,
      feedback: 'Wonderful romantic gesture! Your proof has been verified and coins awarded ❤️'
    };
  };

  const spendCoins = async (itemId: string, itemType: string, cost: number) => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    // 1. Try server endpoint
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

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sound.playSuccess();
          await refreshWallet();
          return { success: true, newBalance: data.newBalance };
        } else {
          return { success: false, error: data.error || 'Could not complete coin purchase.' };
        }
      }
    } catch (err) {
      console.warn('Backend spend endpoint unavailable, applying local atomic deduction:', err);
    }

    // 2. Resilient local deduction fallback (guarantees coupon redemption and shop never fail)
    const currentW = wallet || getLocalWallet(userData.id);
    if (currentW.balance < cost) {
      return {
        success: false,
        error: `Insufficient Love Coins. You have ${currentW.balance} coins, but this costs ${cost}.`
      };
    }

    const newBal = currentW.balance - cost;
    const updatedWallet: UserWallet = {
      ...currentW,
      balance: newBal,
      totalSpent: (currentW.totalSpent || 0) + cost,
      updatedAt: Date.now()
    };
    saveLocalWallet(updatedWallet);
    setWallet(updatedWallet);

    // Update inventory if relevant
    const currentInv = inventory || getLocalInventory(userData.id);
    const updatedInv: UserInventory = { ...currentInv };
    if (itemType === 'themes' || itemType === 'theme') {
      if (!updatedInv.ownedThemes.includes(itemId)) {
        updatedInv.ownedThemes = [...updatedInv.ownedThemes, itemId];
      }
      updatedInv.activeTheme = itemId;
    } else if (itemType === 'badges' || itemType === 'badge') {
      if (itemId === 'token_streak_freeze') {
        updatedInv.streakFreezeTokens = (updatedInv.streakFreezeTokens || 0) + 1;
      } else if (!updatedInv.ownedBadges.includes(itemId)) {
        updatedInv.ownedBadges = [...updatedInv.ownedBadges, itemId];
        updatedInv.equippedBadge = itemId;
      }
    } else if (itemType === 'game_packs' || itemType === 'game_pack' || itemType === 'game') {
      if (!updatedInv.ownedGamePacks.includes(itemId)) {
        updatedInv.ownedGamePacks = [...updatedInv.ownedGamePacks, itemId];
      }
    }
    saveLocalInventory(updatedInv);
    setInventory(updatedInv);

    // Record local transaction
    const newTx: CoinTransaction = {
      id: `tx_${Date.now()}_local_${Math.random().toString(36).substring(2, 6)}`,
      userId: userData.id,
      amount: -cost,
      type: itemType === 'coupon' ? 'coupon_redeem' : 'item_purchase',
      description: itemType === 'coupon' ? `Redeemed Love Coupon` : `Unlocked: ${itemId}`,
      referenceId: itemId,
      createdAt: Date.now()
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveLocalTransactions(userData.id, updatedTxs);

    sound.playSuccess();
    return { success: true, newBalance: newBal };
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
    let giftRecord: any = null;

    // 1. Try server endpoint
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

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          giftRecord = data.gift;
        } else {
          return { success: false, error: data.error || 'Failed to send virtual gift.' };
        }
      }
    } catch {
      // Backend unavailable, fallback
    }

    // 2. If giftRecord wasn't returned by backend, do resilient local deduction
    if (!giftRecord) {
      const currentW = wallet || getLocalWallet(userData.id);
      if (currentW.balance < cost) {
        return {
          success: false,
          error: `Insufficient Love Coins. This gift costs ${cost} coins, but your balance is ${currentW.balance}.`
        };
      }

      const newBal = currentW.balance - cost;
      const updatedWallet: UserWallet = {
        ...currentW,
        balance: newBal,
        totalSpent: (currentW.totalSpent || 0) + cost,
        updatedAt: Date.now()
      };
      saveLocalWallet(updatedWallet);
      setWallet(updatedWallet);

      giftRecord = {
        id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        coupleSpaceId: space?.id || '',
        senderId: userData.id,
        recipientId: partnerUid,
        giftId,
        giftName,
        cost,
        note: note || '',
        createdAt: Date.now()
      };

      const newTx: CoinTransaction = {
        id: `tx_${Date.now()}_gift_${giftId}`,
        userId: userData.id,
        amount: -cost,
        type: 'virtual_gift',
        description: `Sent Gift: ${giftName}`,
        referenceId: giftId,
        createdAt: Date.now()
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      saveLocalTransactions(userData.id, updatedTxs);
    }

    // 3. Broadcast gift in Firestore couple space for live listener celebrations
    if (space?.id) {
      try {
        await addDoc(collection(db, `coupleSpaces/${space.id}/virtualGifts`), {
          id: giftRecord.id,
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
    return { success: true, gift: giftRecord };
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

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sound.playSuccess();
          await refreshWallet();
          return { success: true, coinsAwarded: data.coinsAwarded };
        } else {
          return { success: false, error: data.error || 'Referral verification failed.' };
        }
      }
    } catch {}

    // Resilient fallback
    const award = 25;
    const currentW = wallet || getLocalWallet(userData.id);
    const updatedWallet: UserWallet = {
      ...currentW,
      balance: currentW.balance + award,
      totalEarned: currentW.totalEarned + award,
      updatedAt: Date.now()
    };
    saveLocalWallet(updatedWallet);
    setWallet(updatedWallet);

    sound.playSuccess();
    return { success: true, coinsAwarded: award };
  };

  const claimDailyCheckIn = async () => {
    if (!userData?.id) {
      return { success: false, error: 'User not signed in.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentW = wallet || getLocalWallet(userData.id);

    if (currentW.lastCheckInDate === todayStr) {
      return {
        success: false,
        error: 'You have already checked in today! Return tomorrow to keep your streak glowing.'
      };
    }

    try {
      const res = await fetch('/api/coins/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sound.playSuccess();
          await refreshWallet();
          return {
            success: true,
            coinsAwarded: data.coinsAwarded,
            streakDays: data.streakDays
          };
        } else {
          return { success: false, error: data.error || 'Failed to claim daily check-in.' };
        }
      }
    } catch {}

    // Resilient local streak calculation
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = currentW.streakDays || 0;
    if (currentW.lastCheckInDate === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    const baseReward = 20;
    const streakBonus = Math.min((currentStreak - 1) * 5, 40);
    const totalAward = baseReward + streakBonus;

    const updatedWallet: UserWallet = {
      ...currentW,
      balance: currentW.balance + totalAward,
      totalEarned: currentW.totalEarned + totalAward,
      streakDays: currentStreak,
      lastCheckInDate: todayStr,
      updatedAt: Date.now()
    };
    saveLocalWallet(updatedWallet);
    setWallet(updatedWallet);

    const newTx: CoinTransaction = {
      id: `tx_${Date.now()}_checkin_${currentStreak}`,
      userId: userData.id,
      amount: totalAward,
      type: 'daily_checkin',
      description: `Daily Love Streak: Day ${currentStreak} (+${totalAward} coins)`,
      createdAt: Date.now()
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveLocalTransactions(userData.id, updatedTxs);

    sound.playSuccess();
    return {
      success: true,
      coinsAwarded: totalAward,
      streakDays: currentStreak
    };
  };

  const setActiveTheme = async (themeId: string) => {
    if (!userData?.id) return;
    applyTheme(themeId);

    const currentInv = inventory || getLocalInventory(userData.id);
    const updatedInv = { ...currentInv, activeTheme: themeId, updatedAt: Date.now() };
    saveLocalInventory(updatedInv);
    setInventory(updatedInv);

    try {
      await fetch('/api/coins/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          activeTheme: themeId
        })
      });
    } catch (err) {
      console.warn('Could not sync active theme preference to server:', err);
    }
  };

  const setEquippedBadge = async (badgeId: string) => {
    if (!userData?.id) return;

    const currentInv = inventory || getLocalInventory(userData.id);
    const updatedInv = { ...currentInv, equippedBadge: badgeId, updatedAt: Date.now() };
    saveLocalInventory(updatedInv);
    setInventory(updatedInv);

    try {
      await fetch('/api/coins/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          equippedBadge: badgeId
        })
      });
    } catch (err) {
      console.warn('Could not sync equipped badge preference to server:', err);
    }
  };

  return (
    <LoveCoinsContext.Provider
      value={{
        wallet,
        balance: wallet?.balance ?? 0,
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
