import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { DigitalGift, DigitalGiftContent, RecipientGiftResponse } from '../types/digitalGifts';
import { handleFirestoreError, OperationType } from './errorHandler';

const LOCAL_STORAGE_PREFIX = 'loveverse_digital_gifts_';

export function generateShareToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function saveLocalDraft(gift: DigitalGift): void {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}draft_${gift.coupleSpaceId}_${gift.productId}`;
    localStorage.setItem(key, JSON.stringify(gift));
  } catch (err) {
    console.warn('Could not save local gift draft:', err);
  }
}

export function getLocalDraft(spaceId: string, productId: string): DigitalGift | null {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}draft_${spaceId}_${productId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(spaceId: string, productId: string): void {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}draft_${spaceId}_${productId}`;
    localStorage.removeItem(key);
  } catch {}
}

export async function createOrUpdateDigitalGift(
  spaceId: string,
  gift: DigitalGift
): Promise<{ success: boolean; error?: string; giftId: string }> {
  try {
    const giftRef = doc(db, `coupleSpaces/${spaceId}/digitalGifts`, gift.id);
    
    // Clean data for Firestore
    const payload = {
      ...gift,
      updatedAt: Date.now()
    };

    await setDoc(giftRef, payload, { merge: true });

    // If public sharing is enabled, also sync or update the shareable document
    if (gift.isPublicShare && gift.shareToken) {
      const publicRef = doc(db, 'public_digital_gifts', gift.shareToken);
      await setDoc(publicRef, {
        id: gift.id,
        shareToken: gift.shareToken,
        creatorId: gift.creatorId,
        creatorName: gift.creatorName,
        recipientName: gift.recipientName || 'My Beloved',
        productId: gift.productId,
        title: gift.title,
        theme: gift.theme,
        content: gift.content,
        recipientResponse: gift.recipientResponse || null,
        isPublicShare: true,
        createdAt: gift.createdAt,
        updatedAt: Date.now()
      }, { merge: true });
    }

    return { success: true, giftId: gift.id };
  } catch (err) {
    console.error('Error saving digital gift:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `coupleSpaces/${spaceId}/digitalGifts/${gift.id}`);
    } catch {}
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save digital gift', giftId: gift.id };
  }
}

export async function submitGiftResponse(
  spaceId: string,
  giftId: string,
  response: RecipientGiftResponse,
  shareToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const giftRef = doc(db, `coupleSpaces/${spaceId}/digitalGifts`, giftId);
    await updateDoc(giftRef, {
      recipientResponse: response,
      updatedAt: Date.now()
    });

    // Also update public doc if token exists
    if (shareToken) {
      try {
        const publicRef = doc(db, 'public_digital_gifts', shareToken);
        await updateDoc(publicRef, {
          recipientResponse: response,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn('Note updating public response mirror:', e);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error submitting gift response:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Could not submit response' };
  }
}

export async function deleteDigitalGift(
  spaceId: string,
  giftId: string,
  shareToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, `coupleSpaces/${spaceId}/digitalGifts`, giftId));
    
    if (shareToken) {
      try {
        await deleteDoc(doc(db, 'public_digital_gifts', shareToken));
      } catch {}
    }

    return { success: true };
  } catch (err) {
    console.error('Error deleting digital gift:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete gift' };
  }
}

export async function getPublicDigitalGift(shareToken: string): Promise<DigitalGift | null> {
  try {
    const publicRef = doc(db, 'public_digital_gifts', shareToken);
    const snap = await getDoc(publicRef);
    if (snap.exists()) {
      return snap.data() as DigitalGift;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching public digital gift:', err);
    return null;
  }
}

export function subscribeToCoupleDigitalGifts(
  spaceId: string,
  callback: (gifts: DigitalGift[]) => void
): () => void {
  if (!spaceId) return () => {};
  const giftsCol = collection(db, `coupleSpaces/${spaceId}/digitalGifts`);
  
  return onSnapshot(giftsCol, (snap) => {
    const list: DigitalGift[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as DigitalGift);
    });
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  }, (err) => {
    console.warn('Real-time digital gifts listener warning:', err);
  });
}
