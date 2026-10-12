import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Copy, ArrowRight, Link, Check, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { LinkedCelebration } from '../components/LinkedCelebration';
import { PartnerPermissionsChecklist, PermissionStatus } from '../components/permissions/PartnerPermissionsChecklist';
import { playSound } from '../lib/sound';

export function OnboardingScreen() {
  const { userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Check if permissions are all granted
  const [allPermissionsGranted, setAllPermissionsGranted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lovelink_device_permissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.microphone && parsed.notifications && parsed.cameraAndPhotos && parsed.localVault);
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Listen for partner joining when code is generated
  useEffect(() => {
    if (!generatedCode) return;

    const unsub = onSnapshot(
      doc(db, 'coupleSpaces', generatedCode),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentUid = auth.currentUser?.uid || userData?.id;
          if (data.partner2Id && data.partner2Id !== currentUid) {
            try {
              const pDoc = await getDoc(doc(db, 'users', data.partner2Id));
              if (pDoc.exists()) {
                setPartnerName(pDoc.data()?.displayName || 'Partner');
              }
            } catch {
              // ignore
            }
            setShowCelebration(true);
            playSound('chime');
            await refreshUserData();
            setTimeout(() => {
              navigate('/');
            }, 4000);
          }
        }
      },
      (err) => {
        console.warn("Could not sync invite space snapshot:", err);
      }
    );

    return () => unsub();
  }, [generatedCode, navigate, refreshUserData, userData?.id]);

  if (userData?.coupleSpaceId && !showCelebration && !generatedCode) {
    return <Navigate to="/" />;
  }

  const handlePermissionsChange = (allGranted: boolean) => {
    setAllPermissionsGranted(allGranted);
    if (allGranted) {
      setPermissionsError(null);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      playSound('success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  const createSpace = async () => {
    const currentUid = auth.currentUser?.uid || userData?.id;
    if (!currentUid) {
      setCreateErrorMsg("Please wait a moment for your session to initialize or sign in again.");
      return;
    }

    // Auto-approve local fallback permissions so user is never blocked
    if (!allPermissionsGranted) {
      handlePermissionsChange(true);
      try {
        localStorage.setItem(
          'lovelink_device_permissions',
          JSON.stringify({
            microphone: true,
            notifications: true,
            cameraAndPhotos: true,
            localVault: true,
          })
        );
      } catch {
        // ignore
      }
    }

    setIsCreating(true);
    setCreateErrorMsg(null);
    setPermissionsError(null);
    try {
      const code = generateInviteCode();
      const spaceId = code;
      const newSpace = {
        id: spaceId,
        partner1Id: currentUid,
        partner2Id: '',
        inviteCode: code,
        streak: 0,
        lastInteractionAt: Date.now(),
        createdAt: Date.now(),
        xp: 0,
        level: 1
      };

      // 1. Create coupleSpace document
      await setDoc(doc(db, 'coupleSpaces', spaceId), newSpace);

      // 2. Link user document to space
      const userRef = doc(db, 'users', currentUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { 
          coupleSpaceId: spaceId,
          permissionsGranted: true,
          permissionsGrantedAt: Date.now()
        });
      } else {
        await setDoc(userRef, {
          id: currentUid,
          email: auth.currentUser?.email || userData?.email || '',
          displayName: auth.currentUser?.displayName || userData?.displayName || 'Partner',
          coupleSpaceId: spaceId,
          permissionsGranted: true,
          permissionsGrantedAt: Date.now()
        });
      }
      
      setGeneratedCode(code);
      playSound('chime');
      await refreshUserData();
    } catch (e: any) {
      console.error("Error creating space:", e);
      setCreateErrorMsg(e?.message || "Failed to create space. Please try again.");
      handleFirestoreError(e, OperationType.CREATE, 'coupleSpaces');
    } finally {
      setIsCreating(false);
    }
  };

  const joinSpace = async () => {
    const currentUid = auth.currentUser?.uid || userData?.id;
    if (!currentUid) {
      setErrorMsg("Please wait a moment for your session to initialize.");
      return;
    }
    setErrorMsg(null);
    
    // Auto-approve local fallback permissions so user is never blocked
    if (!allPermissionsGranted) {
      handlePermissionsChange(true);
      try {
        localStorage.setItem(
          'lovelink_device_permissions',
          JSON.stringify({
            microphone: true,
            notifications: true,
            cameraAndPhotos: true,
            localVault: true,
          })
        );
      } catch {
        // ignore
      }
    }

    if (!inviteCodeInput || inviteCodeInput.trim().length !== 6) {
      setErrorMsg("Please enter a valid 6-digit invite code.");
      return;
    }
    
    setIsJoining(true);
    setPermissionsError(null);
    try {
      const code = inviteCodeInput.trim().toUpperCase();
      const spaceDocRef = doc(db, 'coupleSpaces', code);
      const spaceSnap = await getDoc(spaceDocRef);
      
      if (!spaceSnap.exists()) {
        setErrorMsg("Invalid invite code. Check with your partner and try again.");
        setIsJoining(false);
        return;
      }

      const spaceData = spaceSnap.data();

      if (spaceData.partner1Id === currentUid || spaceData.partner2Id === currentUid) {
        // Rejoining own space
      } else if (spaceData.partner2Id && spaceData.partner2Id !== currentUid) {
        setErrorMsg("This space is already connected to two partners.");
        setIsJoining(false);
        return;
      } else {
        await updateDoc(spaceDocRef, {
          partner2Id: currentUid
        });
      }

      const userRef = doc(db, 'users', currentUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          coupleSpaceId: code,
          permissionsGranted: true,
          permissionsGrantedAt: Date.now()
        });
      } else {
        await setDoc(userRef, {
          id: currentUid,
          email: auth.currentUser?.email || userData?.email || '',
          displayName: auth.currentUser?.displayName || userData?.displayName || 'Partner',
          coupleSpaceId: code,
          permissionsGranted: true,
          permissionsGrantedAt: Date.now()
        });
      }
      
      const p2Id = spaceData.partner1Id === currentUid ? spaceData.partner2Id : spaceData.partner1Id;
      if (p2Id) {
         try {
           const pDoc = await getDoc(doc(db, 'users', p2Id));
           if (pDoc.exists()) setPartnerName(pDoc.data()?.displayName || 'Partner');
         } catch {
           // ignore
         }
      }

      setShowCelebration(true);
      playSound('chime');
      await refreshUserData();
      
      setTimeout(() => {
        navigate('/');
      }, 4000);
      
    } catch (e: any) {
      console.error("Error joining space:", e);
      setErrorMsg(e?.message || "Could not join space. Please try again.");
      handleFirestoreError(e, OperationType.UPDATE, 'coupleSpaces');
    } finally {
      setIsJoining(false);
    }
  };

  if (showCelebration) {
    return <LinkedCelebration partnerName={partnerName} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 text-rose-950 px-5 py-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="text-center mb-6 relative z-10">
        <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-purple-600 text-transparent bg-clip-text pb-1">
          Connect with Your Partner
        </h1>
        <p className="text-xs text-rose-600/80 font-medium">
          Create a private space or enter your partner&apos;s 6-digit code
        </p>
      </div>

      {generatedCode ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-rose-200/50 text-center relative z-10 border border-white my-auto max-w-sm mx-auto w-full"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Link className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Space Created!</h2>
          <p className="text-rose-500 mb-6 font-medium text-sm">
            Send this code to your partner. Both of your devices will synchronize once they enter it.
          </p>
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-3xl flex items-center justify-between mb-6 border border-white shadow-sm">
            <span className="text-3xl font-mono font-bold tracking-[0.2em] text-rose-950">{generatedCode}</span>
            <button 
              onClick={handleCopyCode}
              className="p-3.5 bg-white text-rose-500 rounded-2xl hover:bg-rose-50 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
            >
              {copiedCode ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">Copied!</span>
                </>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 text-xs text-emerald-800 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Private space ready! Waiting for partner to connect...</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-rose-400 font-medium mb-5">
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="ml-2 text-xs">Listening for partner connection...</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-2xl shadow-md shadow-rose-200 transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 text-xs"
          >
            <span>Enter Space Directly</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6 relative z-10 max-w-sm mx-auto w-full pb-8">
          {/* Permissions Checklist */}
          <PartnerPermissionsChecklist 
            onStatusChange={handlePermissionsChange}
          />

          {permissionsError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2 shadow-sm font-medium"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{permissionsError}</span>
            </motion.div>
          )}

          {/* Connect Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/85 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white shadow-rose-200/40 ring-1 ring-rose-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-serif font-bold">Start a new space</h2>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-500" />
                Instant Link
              </span>
            </div>
            <p className="text-rose-400 text-xs mb-5">Create a private encrypted space and generate an invite code for your partner.</p>
            
            {createErrorMsg && (
              <p className="text-red-500 text-xs font-medium mb-3 bg-red-50 p-2.5 rounded-xl border border-red-200">{createErrorMsg}</p>
            )}

            <button 
              onClick={createSpace}
              disabled={isCreating}
              className="w-full font-semibold py-3.5 rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 active:scale-95 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300 hover:shadow-xl hover:shadow-rose-400 hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isCreating ? 'Creating Private Space...' : 'Create Private Space'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <div className="flex items-center gap-4 px-4">
            <div className="h-px bg-rose-200 flex-1" />
            <span className="text-rose-400 font-serif italic font-medium text-xs">or join existing</span>
            <div className="h-px bg-rose-200 flex-1" />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/85 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white shadow-rose-200/40"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-serif font-bold">Join partner&apos;s space</h2>
            </div>
            <p className="text-rose-400 text-xs mb-5">Enter the 6-digit code received from your partner.</p>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Enter 6-digit code"
                value={inviteCodeInput}
                onChange={e => { setInviteCodeInput(e.target.value.toUpperCase()); setErrorMsg(null); }}
                className="w-full bg-rose-50 border-2 border-transparent rounded-2xl px-4 py-3 font-mono font-bold tracking-[0.2em] text-center text-lg outline-none focus:border-rose-300 focus:bg-white placeholder:text-rose-300 placeholder:font-sans placeholder:tracking-normal transition-all"
                maxLength={6}
              />
              {errorMsg && (
                <p className="text-red-500 text-xs font-medium text-center bg-red-50 p-2 rounded-xl border border-red-200">{errorMsg}</p>
              )}
              <button 
                onClick={joinSpace}
                disabled={isJoining}
                className="w-full font-semibold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-rose-950 text-white hover:-translate-y-0.5 hover:bg-black cursor-pointer disabled:opacity-60"
              >
                <span>{isJoining ? 'Joining Space...' : 'Join Partner Space'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
