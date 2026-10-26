import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import { sound } from '../lib/sound';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended' | 'declined' | 'missed';

export interface CallSession {
  id: string;
  coupleSpaceId: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: 'calling' | 'connected' | 'ended' | 'declined' | 'missed';
  offer?: string;
  answer?: string;
  callerCandidates?: any[];
  receiverCandidates?: any[];
  createdAt: number;
  updatedAt: number;
}

interface CallContextType {
  activeCall: CallSession | null;
  callStatus: CallStatus;
  callType: CallType;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('video');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [duration, setDuration] = useState(0);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const durationTimerRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const processedCandidatesRef = useRef<Set<string>>(new Set());

  // Stop current ringing or dial tone sound
  const stopTone = useCallback(() => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
  }, []);

  // Safely add candidate or queue if remote description isn't set yet
  const addCandidateSafely = useCallback(async (pc: RTCPeerConnection, candidate: any) => {
    if (!candidate || !candidate.candidate) return;
    const candKey = `${candidate.candidate}_${candidate.sdpMid}_${candidate.sdpMLineIndex}`;
    if (processedCandidatesRef.current.has(candKey)) return;

    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        processedCandidatesRef.current.add(candKey);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('addIceCandidate error:', err);
      }
    } else {
      // Queue for later when remoteDescription is set
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  // Drain all pending ICE candidates once remoteDescription has been applied
  const drainPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const cand of pending) {
      if (!cand || !cand.candidate) continue;
      const candKey = `${cand.candidate}_${cand.sdpMid}_${cand.sdpMLineIndex}`;
      if (!processedCandidatesRef.current.has(candKey)) {
        try {
          processedCandidatesRef.current.add(candKey);
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('Error draining ICE candidate:', err);
        }
      }
    }
  }, []);

  // Cleanup local media stream & connection
  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    clearInterval(durationTimerRef.current);
    clearTimeout(ringTimeoutRef.current);
    pendingCandidatesRef.current = [];
    processedCandidatesRef.current.clear();
    stopTone();
  }, [stopTone]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      setDuration(0);
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationTimerRef.current);
    }
    return () => clearInterval(durationTimerRef.current);
  }, [callStatus]);

  // Listen for active calls in the couple space
  useEffect(() => {
    if (!space?.id || !userData?.id) return;

    const callsCol = collection(db, `coupleSpaces/${space.id}/calls`);
    const q = query(
      callsCol,
      where('status', 'in', ['calling', 'connected']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        if (callStatus === 'incoming' || callStatus === 'calling' || callStatus === 'connected') {
          cleanupMedia();
          setCallStatus('ended');
          setTimeout(() => setCallStatus('idle'), 1800);
          setActiveCall(null);
        }
        return;
      }

      const callDoc = snapshot.docs[0];
      const callData = { id: callDoc.id, ...callDoc.data() } as CallSession;
      setActiveCall(callData);
      setCallType(callData.type);

      const isCaller = callData.callerId === userData.id;
      const isReceiver = callData.receiverId === userData.id;

      if (!isCaller && !isReceiver) return;

      // Handle Incoming Call on Receiver
      if (isReceiver && callData.status === 'calling') {
        if (callStatus !== 'incoming' && callStatus !== 'connected') {
          setCallStatus('incoming');
          stopTone();
          stopAudioRef.current = sound.playRingtone();

          // Auto-miss after 45s of ringing
          clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = setTimeout(async () => {
            try {
              await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, callData.id), {
                status: 'missed',
                updatedAt: Date.now()
              });
            } catch {}
          }, 45000);
        }
      }

      // Handle Connected State on Caller
      if (isCaller && callData.status === 'connected' && callData.answer && peerConnectionRef.current) {
        stopTone();
        const pc = peerConnectionRef.current;
        if (pc.signalingState === 'have-local-offer') {
          try {
            const answerDesc = new RTCSessionDescription(JSON.parse(callData.answer));
            await pc.setRemoteDescription(answerDesc);
            setCallStatus('connected');

            // Apply all receiver candidates that were gathered
            if (callData.receiverCandidates && callData.receiverCandidates.length > 0) {
              for (const cand of callData.receiverCandidates) {
                await addCandidateSafely(pc, cand);
              }
            }
            await drainPendingCandidates(pc);
          } catch (e) {
            console.error('Error setting remote answer on caller:', e);
          }
        }
      }

      // Stream new incoming remote ICE candidates
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        const candidates = isCaller ? callData.receiverCandidates : callData.callerCandidates;
        if (candidates && candidates.length > 0) {
          for (const cand of candidates) {
            await addCandidateSafely(pc, cand);
          }
          if (pc.remoteDescription) {
            await drainPendingCandidates(pc);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space.id}/calls`);
    });

    return () => {
      unsubscribe();
      stopTone();
    };
  }, [space?.id, userData?.id, callStatus, cleanupMedia, stopTone, addCandidateSafely, drainPendingCandidates]);

  // Request user media with clean echo cancellation & fallbacks
  const getMedia = async (type: CallType, frontCam: boolean = true): Promise<MediaStream> => {
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };

    const videoConstraints = type === 'video' ? {
      facingMode: frontCam ? 'user' : 'environment',
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30 }
    } : false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(type === 'voice');
      return stream;
    } catch (err) {
      console.warn('getUserMedia camera/mic request error, trying audio fallback:', err);
      // Fallback to audio-only if camera unavailable or denied
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      localStreamRef.current = fallbackStream;
      setLocalStream(fallbackStream);
      setIsMuted(false);
      setIsVideoOff(true);
      return fallbackStream;
    }
  };

  // Start outgoing call
  const startCall = async (type: CallType) => {
    if (!space?.id || !userData?.id || !partnerData?.id) return;
    cleanupMedia();
    setCallType(type);
    setCallStatus('calling');
    sound.tap();

    stopTone();
    stopAudioRef.current = sound.playDialTone();

    try {
      const stream = await getMedia(type, true);
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local audio and video tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks (both audio and video)
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          setRemoteStream(prev => {
            const newStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
            if (!newStream.getTracks().some(t => t.id === event.track.id)) {
              newStream.addTrack(event.track);
            }
            return newStream;
          });
        }
      };

      const callId = `call_${Date.now()}_${userData.id}`;
      const iceCandidates: any[] = [];

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          iceCandidates.push(event.candidate.toJSON());
          try {
            await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, callId), {
              callerCandidates: iceCandidates,
              updatedAt: Date.now()
            });
          } catch {}
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });
      await pc.setLocalDescription(offer);

      const callDocData: CallSession = {
        id: callId,
        coupleSpaceId: space.id,
        callerId: userData.id,
        receiverId: partnerData.id,
        type,
        status: 'calling',
        offer: JSON.stringify(offer),
        callerCandidates: [],
        receiverCandidates: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(doc(db, `coupleSpaces/${space.id}/calls`, callId), callDocData);
      setActiveCall(callDocData);

      // Auto cancel after 40 seconds if partner doesn't pick up
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(async () => {
        if (callStatus === 'calling') {
          await endCall();
        }
      }, 40000);
    } catch (err) {
      console.error('Failed to initiate call:', err);
      cleanupMedia();
      setCallStatus('idle');
      alert('Could not start call. Please check microphone/camera permissions in your browser or device.');
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!activeCall || !space?.id || !userData?.id) return;
    stopTone();
    sound.chime();

    try {
      const stream = await getMedia(activeCall.type, true);
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks (voice and video)
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          setRemoteStream(prev => {
            const newStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
            if (!newStream.getTracks().some(t => t.id === event.track.id)) {
              newStream.addTrack(event.track);
            }
            return newStream;
          });
        }
      };

      const receiverCandidates: any[] = [];
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          receiverCandidates.push(event.candidate.toJSON());
          try {
            await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, activeCall.id), {
              receiverCandidates,
              updatedAt: Date.now()
            });
          } catch {}
        }
      };

      if (activeCall.offer) {
        // 1. Set Remote Description (Offer from caller)
        const offerDesc = new RTCSessionDescription(JSON.parse(activeCall.offer));
        await pc.setRemoteDescription(offerDesc);

        // 2. Immediately add all initial caller candidates that were collected while ringing
        if (activeCall.callerCandidates && activeCall.callerCandidates.length > 0) {
          for (const cand of activeCall.callerCandidates) {
            await addCandidateSafely(pc, cand);
          }
        }
        await drainPendingCandidates(pc);

        // 3. Create Answer and set Local Description
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: activeCall.type === 'video'
        });
        await pc.setLocalDescription(answer);

        // 4. Update Firestore call session
        await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, activeCall.id), {
          status: 'connected',
          answer: JSON.stringify(answer),
          updatedAt: Date.now()
        });

        setCallStatus('connected');
      }
    } catch (err) {
      console.error('Error answering call:', err);
      cleanupMedia();
      setCallStatus('idle');
      alert('Could not connect call. Please check microphone/camera permissions in your browser or device.');
    }
  };

  // Decline incoming call
  const declineCall = async () => {
    if (!activeCall || !space?.id) return;
    stopTone();
    sound.tap();
    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, activeCall.id), {
        status: 'declined',
        updatedAt: Date.now()
      });
    } catch {}
    cleanupMedia();
    setCallStatus('idle');
    setActiveCall(null);
  };

  // End active call
  const endCall = async () => {
    stopTone();
    sound.pop();
    if (activeCall && space?.id) {
      try {
        await updateDoc(doc(db, `coupleSpaces/${space.id}/calls`, activeCall.id), {
          status: 'ended',
          updatedAt: Date.now()
        });
      } catch {}
    }
    cleanupMedia();
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('idle');
      setActiveCall(null);
    }, 1500);
  };

  // Toggle audio mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuted = !isMuted;
        audioTracks.forEach(t => { t.enabled = !nextMuted; });
        setIsMuted(nextMuted);
        sound.pop();
      }
    }
  };

  // Toggle video camera on/off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextVideoOff = !isVideoOff;
        videoTracks.forEach(t => { t.enabled = !nextVideoOff; });
        setIsVideoOff(nextVideoOff);
        sound.pop();
      }
    }
  };

  // Toggle speaker audio element (UI state indicator)
  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => !prev);
    sound.pop();
  };

  // Flip between front and rear camera
  const flipCamera = async () => {
    if (!localStreamRef.current || callType !== 'video') return;
    const nextFront = !isFrontCamera;
    setIsFrontCamera(nextFront);
    sound.tap();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: nextFront ? 'user' : 'environment' }
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (peerConnectionRef.current && newVideoTrack) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }

        // Replace track in localStream
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (e) {
      console.warn('Camera flip failed:', e);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        callStatus,
        callType,
        isMuted,
        isVideoOff,
        isSpeakerOn,
        isFrontCamera,
        duration,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        flipCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
