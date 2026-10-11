import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Send, 
  Heart, 
  Sparkles, 
  MessageCircle, 
  Gamepad2, 
  CalendarHeart, 
  Copy, 
  Check, 
  Square, 
  Image as ImageIcon, 
  Zap, 
  BrainCircuit, 
  X,
  Volume2,
  VolumeX,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'aira';
  text?: string;
  type?: 'text' | 'card_message' | 'card_date' | 'card_game';
  cardData?: any;
  imageUrl?: string;
}

export function AiraScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const userName = userData?.displayName?.split(' ')[0] || 'You';
  const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
  const daysTogether = space?.createdAt ? Math.max(1, Math.floor((Date.now() - space.createdAt) / (1000 * 60 * 60 * 24))) : 1;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'aira',
      text: `Hi ${userName}! 💖 I'm AIRA, your relationship companion. How can I brighten your day with ${partnerName}?`,
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState('');
  
  // Card action states
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sentMessageIds, setSentMessageIds] = useState<Record<string, boolean>>({});
  const [savedDatePlanIds, setSavedDatePlanIds] = useState<Record<string, boolean>>({});

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation(`${pos.coords.latitude}, ${pos.coords.longitude}`),
        () => console.warn('Location access denied')
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const suggestions = [
    { text: "Write a sweet love note", icon: MessageCircle },
    { text: "Suggest a fun game", icon: Gamepad2 },
    { text: "Plan a romantic date", icon: CalendarHeart },
    { text: "Relationship advice", icon: Heart }
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64Data = result.split(',')[1];
      setUploadedImage({
        url: result,
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!inputText.trim() && !uploadedImage) return;

    const userText = inputText;
    const currentUploaded = uploadedImage;
    setInputText('');
    setUploadedImage(null);
    
    // Add user message to UI
    const newMessages = [...messages, { 
       id: Date.now().toString(), 
       sender: 'user' as const, 
       text: userText,
       imageUrl: currentUploaded?.url 
    }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const parts: any[] = [];
      if (currentUploaded) {
        parts.push({
          inlineData: {
            data: currentUploaded.base64,
            mimeType: currentUploaded.mimeType
          }
        });
      }
      if (userText) {
        parts.push({ text: userText });
      }

      const newContent = { role: 'user', parts };
      const nextChatHistory = [...chatHistory, newContent];
      
      const systemInstruction = `You are AIRA, a loving and emotionally intelligent AI companion inside Love Link, a private couples app.
User Name: ${userName}
Partner Name: ${partnerName}
Days Together: ${daysTogether}
Location GPS: ${userLocation || 'Unknown'}

Your tone: Warm, empathetic, romantic, gentle, and practical. Like a supportive friend who cares deeply about their relationship happiness.
Keep responses concise, clear, and well-spaced. Use soft emojis (💗, 🌸, ✨, 💌).
- If suggesting a romantic note, date, or game, provide helpful advice and trigger the appropriate card.
- Output generateLoveMessageCard for special love messages.
- Output generateDateIdeaCard for date planning.
- Output generateGameCard for playful couple games.`;

      const response = await fetch('/api/aira/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: nextChatHistory,
          systemInstruction,
          isSmartMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const resData = await response.json();
      let aiMsg: ChatMessage = { id: Date.now().toString() + "aira", sender: 'aira' };
      let textContent = resData.text || "";

      if (resData.candidateContent) {
        nextChatHistory.push(resData.candidateContent);
      }

      if (Array.isArray(resData.functionCalls)) {
        for (const call of resData.functionCalls) {
          if (call.name === 'generateLoveMessageCard') {
            aiMsg.type = 'card_message';
            aiMsg.cardData = { generatedMessage: call.args?.message };
          } else if (call.name === 'generateDateIdeaCard') {
            aiMsg.type = 'card_date';
            aiMsg.cardData = { dateIdea: call.args?.idea };
          } else if (call.name === 'generateGameCard') {
            aiMsg.type = 'card_game';
            aiMsg.cardData = { gameName: call.args?.gameName };
          }
          nextChatHistory.push({
            role: 'user',
            parts: [{
              functionResponse: {
                name: call.name,
                response: { status: "displayed successfully" }
              }
            }]
          });
        }
      }

      const finalMsgText = textContent.trim();
      if (aiMsg.type && finalMsgText) {
          setMessages(prev => [...prev, { id: 'text_' + Date.now(), sender: 'aira', type: 'text', text: finalMsgText }, aiMsg]);
      } else if (aiMsg.type) {
          setMessages(prev => [...prev, aiMsg]);
      } else if (finalMsgText) {
          aiMsg.type = 'text';
          aiMsg.text = finalMsgText;
          setMessages(prev => [...prev, aiMsg]);
      }

      setChatHistory(nextChatHistory);

      if (isVoiceActive && finalMsgText) {
         speakText(finalMsgText);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'aira', type: 'text', text: "I'm right here with you! Please give me a second and ask again 🌸" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const cleanText = text.replace(/[*_#\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.toLowerCase().includes('female'));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.05;
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInputText(transcript);
    };
    
    recognition.start();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSendToPartnerChat = async (messageText: string) => {
    if (!space?.id || !userData?.id || !messageText) return;
    try {
      const messageData = {
        id: `msg_${Date.now()}_${userData.id}`,
        coupleSpaceId: space.id,
        senderId: userData.id,
        content: messageText,
        type: 'text',
        createdAt: Date.now()
      };
      await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), messageData);
      setSentMessageIds(prev => ({ ...prev, [messageText]: true }));
    } catch (e) {
      console.error("Failed to send message to partner", e);
    }
  };

  const handleSaveDatePlan = async (dateIdea: string) => {
    if (!space?.id || !userData?.id || !dateIdea) return;
    try {
      const planId = `plan_${Date.now()}`;
      await setDoc(doc(db, `coupleSpaces/${space.id}/datePlans`, planId), {
        id: planId,
        coupleSpaceId: space.id,
        creatorId: userData.id,
        title: dateIdea.split('.')[0]?.slice(0, 45) || 'AIRA Romantic Date',
        description: dateIdea,
        budget: 'Medium ($$)',
        mood: 'Romantic & Cozy',
        createdAt: Date.now()
      });
      setSavedDatePlanIds(prev => ({ ...prev, [dateIdea]: true }));
    } catch (e) {
      console.error("Failed to save date plan", e);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-rose-50 via-pink-50/50 to-rose-50 text-rose-950 font-sans relative overflow-hidden">
      
      {/* Subtle Ambient Blobs */}
      <div className="absolute top-16 right-[-8%] w-[280px] h-[280px] bg-rose-200/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-24 left-[-8%] w-[260px] h-[260px] bg-pink-200/25 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating Home Nav Button */}
      <BottomNav />

      {/* 1. HEADER (Styled to match the rest of Love Link) */}
      <header className="pl-20 pr-4 sm:pr-6 py-3.5 bg-white/80 backdrop-blur-xl border-b border-rose-100 flex items-center justify-between sticky top-0 z-20 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-rose-200/50 border-2 border-white shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-serif font-bold text-base sm:text-lg text-rose-950 leading-tight">
                AIRA
              </h1>
              <span className="text-[10px] font-semibold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                Companion
              </span>
            </div>
            <p className="text-[11px] font-medium text-rose-500/90 leading-tight mt-0.5">
              Always here for you & {partnerName} 💗
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Voice Output Toggle */}
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            title={isVoiceActive ? "Voice response enabled" : "Voice response muted"}
            className={`p-2 rounded-full border transition-all active:scale-95 ${
              isVoiceActive 
                ? 'bg-rose-100 text-rose-600 border-rose-200' 
                : 'bg-white/80 text-rose-400 hover:text-rose-600 border-rose-100'
            }`}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fast / Smart Mode Segmented Pill */}
          <div className="bg-rose-100/70 p-0.5 rounded-full border border-rose-200/60 flex items-center">
            <button
              onClick={() => setIsSmartMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                !isSmartMode
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-rose-600/70 hover:text-rose-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Fast</span>
            </button>
            <button
              onClick={() => setIsSmartMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                isSmartMode
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-rose-600/70 hover:text-rose-700'
              }`}
            >
              <BrainCircuit className="w-3 h-3" />
              <span>Smart</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. RELATIONSHIP CONTEXT BANNER */}
      <div className="py-1.5 px-4 bg-white/50 backdrop-blur-xs border-b border-rose-100/60 flex items-center justify-center gap-2 text-xs text-rose-600 font-medium shrink-0">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        <span>Together for {daysTogether} {daysTogether === 1 ? 'day' : 'days'}</span>
        <span className="text-rose-300">·</span>
        <span className="text-rose-500/80">Private space with {partnerName}</span>
      </div>

      {/* 3. CHAT MESSAGES AREA (Proper spacing and light theme) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 relative z-10 scroll-smooth">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'aira' ? (
              <div className="flex gap-2.5 max-w-[88%] sm:max-w-[80%] items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 border border-white">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                
                <div className="space-y-2 flex-1">
                  {/* Regular Text Bubble */}
                  {msg.type === 'text' && msg.text && (
                    <div className="bg-white border border-rose-100 text-rose-950 p-4 rounded-[1.75rem] rounded-tl-sm text-[15px] leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  )}

                  {/* Card: Love Message */}
                  {msg.type === 'card_message' && (
                    <div className="bg-white border border-rose-200/80 p-5 rounded-[2rem] rounded-tl-sm shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-rose-600">
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        <h4 className="font-serif font-bold text-sm text-rose-950">Special Love Note</h4>
                      </div>
                      
                      <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl text-rose-900/90 italic text-[15px] leading-relaxed">
                        "{msg.cardData?.generatedMessage}"
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleSendToPartnerChat(msg.cardData?.generatedMessage)}
                          disabled={sentMessageIds[msg.cardData?.generatedMessage]}
                          className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-1.5"
                        >
                          {sentMessageIds[msg.cardData?.generatedMessage] ? (
                            <>
                              <Check className="w-4 h-4 text-white" />
                              <span>Sent to {partnerName}!</span>
                            </>
                          ) : (
                            <>
                              <span>Send to {partnerName}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleCopy(msg.cardData?.generatedMessage)}
                          title="Copy message"
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-600 rounded-xl transition-all active:scale-95"
                        >
                          {copiedText === msg.cardData?.generatedMessage ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card: Date Idea */}
                  {msg.type === 'card_date' && (
                    <div className="bg-white border border-rose-200/80 p-5 rounded-[2rem] rounded-tl-sm shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-rose-600">
                        <CalendarHeart className="w-4 h-4 text-rose-500" />
                        <h4 className="font-serif font-bold text-sm text-rose-950">Curated Date Idea</h4>
                      </div>
                      
                      <div className="bg-rose-50/60 border border-rose-100/70 p-4 rounded-2xl text-rose-950/90 text-[14.5px] leading-relaxed">
                        {msg.cardData?.dateIdea}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => handleSaveDatePlan(msg.cardData?.dateIdea)}
                          disabled={savedDatePlanIds[msg.cardData?.dateIdea]}
                          className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-1.5"
                        >
                          {savedDatePlanIds[msg.cardData?.dateIdea] ? (
                            <>
                              <Check className="w-4 h-4 text-white" />
                              <span>Saved to Planner!</span>
                            </>
                          ) : (
                            <>
                              <CalendarHeart className="w-4 h-4" />
                              <span>Save to Date Planner</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => navigate('/date-planner')}
                          className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-600 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card: Game */}
                  {msg.type === 'card_game' && (
                    <div className="bg-white border border-purple-200/80 p-5 rounded-[2rem] rounded-tl-sm shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-purple-600">
                        <Gamepad2 className="w-4 h-4 text-purple-600" />
                        <h4 className="font-serif font-bold text-sm text-purple-950">Couple Game Time</h4>
                      </div>
                      
                      <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl">
                        <h5 className="font-bold text-purple-950 text-sm mb-1">{msg.cardData?.gameName || "Truth or Dare"}</h5>
                        <p className="text-purple-900/70 text-xs">Spark laughs, deep intimacy, and playful conversation together!</p>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => navigate('/truth-or-dare')}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Play Truth or Dare</span>
                        </button>
                        <button 
                          onClick={() => navigate('/game')}
                          className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200/70 text-purple-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        >
                          More Games
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-w-[88%] sm:max-w-[80%] items-end">
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Shared" 
                    className="max-w-[220px] max-h-[220px] rounded-2xl shadow-sm border border-rose-200/80 object-cover" 
                  />
                )}
                {msg.text && (
                  <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white p-4 rounded-[1.75rem] rounded-tr-sm text-[15px] leading-relaxed shadow-sm shadow-rose-500/15">
                    {msg.text}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing State */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 max-w-[85%] items-end"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs border border-white">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-rose-100 p-4 px-5 rounded-[1.75rem] rounded-tl-sm flex items-center gap-1.5 shadow-xs h-12">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0 }} className="w-2 h-2 bg-rose-400 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} className="w-2 h-2 bg-pink-400 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }} className="w-2 h-2 bg-rose-300 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* 4. BOTTOM INPUT AREA (Proper padding, lite color scheme, clean spacing) */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-rose-100 px-4 pt-3 pb-4 sm:pb-5 shadow-[0_-4px_20px_rgba(244,63,94,0.04)] z-30 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2.5">
          
          {/* Active Voice Speaking Banner */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-200/80 px-3.5 py-2 rounded-2xl flex items-center justify-between text-xs text-rose-700"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1 items-center h-4">
                    {[...Array(4)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: ['20%', '100%', '20%'] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: 'easeInOut' }}
                        className="w-1 bg-rose-500 rounded-full" 
                      />
                    ))}
                  </div>
                  <span className="font-medium">AIRA voice narration active</span>
                </div>
                <button 
                  onClick={() => setIsVoiceActive(false)}
                  className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Square className="w-3 h-3 fill-current" /> Stop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploaded Image Preview Thumbnail */}
          <AnimatePresence>
            {uploadedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-rose-50 border border-rose-200/80 p-1.5 pr-3 rounded-2xl w-fit"
              >
                <img 
                  src={uploadedImage.url} 
                  alt="Upload preview" 
                  className="w-10 h-10 object-cover rounded-xl border border-rose-200" 
                />
                <span className="text-xs font-medium text-rose-700">Image attached</span>
                <button 
                  onClick={() => setUploadedImage(null)}
                  className="p-1 text-rose-400 hover:text-rose-700 rounded-full hover:bg-rose-200/50 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Suggestions Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 mask-linear">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s.text)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50/80 active:scale-95 border border-rose-200/70 rounded-full text-xs font-semibold text-rose-700 hover:text-rose-900 transition-all shrink-0 shadow-xs"
              >
                <s.icon className="w-3.5 h-3.5 text-rose-500" />
                <span>{s.text}</span>
              </button>
            ))}
          </div>

          {/* Floating Input Bar */}
          <div className="flex items-center gap-1.5 bg-rose-50/70 hover:bg-rose-50 focus-within:bg-white border border-rose-200/80 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-200/50 p-1.5 rounded-full shadow-xs transition-all">
            <input 
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageUpload}
            />
            
            {/* Image picker button */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Add a photo"
              className={`p-2.5 rounded-full shrink-0 transition-colors ${
                uploadedImage 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'text-rose-500 hover:text-rose-700 hover:bg-rose-100/70'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Voice microphone button */}
            <button 
              type="button"
              onClick={() => {
                setIsVoiceActive(true);
                startListening();
              }}
              title="Speak message"
              className={`p-2.5 rounded-full shrink-0 transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200' 
                  : 'text-rose-500 hover:text-rose-700 hover:bg-rose-100/70'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            {/* Text input */}
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={uploadedImage ? "Add a message about this photo..." : "Ask AIRA anything..."}
              className="flex-1 bg-transparent border-none text-rose-950 placeholder:text-rose-300 text-[14.5px] px-2 py-2 focus:outline-none"
            />
            
            {/* Send button */}
            <button 
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() && !uploadedImage}
              title="Send to AIRA"
              className="p-2.5 rounded-full shrink-0 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white disabled:opacity-35 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
