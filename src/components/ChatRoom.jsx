import React, { useEffect, useRef, useState, useCallback } from 'react';
import { resolveRTCConfiguration } from '../services/iceService';
import { MIDNIGHT_ICEBREAKERS } from '../data/profileAssets';
import { trackWebRTCSuccess, trackChatSessionComplete } from '../utils/telemetry';

const CAMERA_FILTERS = [
  { id: 'normal', name: 'Original', style: '' },
  { id: 'warm', name: 'Warm Lamp', style: 'sepia(0.2) contrast(1.05) brightness(1.05)' },
  { id: 'midnight', name: 'Midnight Glow', style: 'hue-rotate(330deg) saturate(1.2) contrast(1.1)' },
  { id: 'soft', name: 'Soft Glow', style: 'brightness(1.08) contrast(0.95)' }
];

// Subtle audio feedback synthesizer
function playAudioCue(type = 'connect') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'message') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'reaction') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'leave') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Autoplay fallback
  }
}

export default function ChatRoom({ 
  chatMode, 
  socket, 
  partnerId, 
  initiator, 
  partnerProfile,
  vibe = 'All Vibes',
  iceServers,
  onNext, 
  onEnd,
  theme,
  toggleTheme
}) {
  const [messages, setMessages] = useState(() => [
    { text: "You are now connected with a stranger.", isSystem: true, timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [icebreakerIdx, setIcebreakerIdx] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localMediaPromiseRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const sidebarOpenRef = useRef(sidebarOpen);
  const onNextRef = useRef(onNext);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const durationTimerRef = useRef(null);

  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  // Call Duration Timer
  useEffect(() => {
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => { 
      if (durationTimerRef.current) clearInterval(durationTimerRef.current); 
    };
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reaction Spawner
  const sendReaction = (emoji) => {
    playAudioCue('reaction');
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      x: 30 + Math.random() * 40,
      scale: 0.9 + Math.random() * 0.5
    };
    setFloatingReactions(prev => [...prev.slice(-10), newReaction]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2800);

    if (socket && partnerId) {
      socket.emit('send-message', emoji);
    }
  };

  // Send Icebreaker Directly
  const sendIcebreakerAsMessage = () => {
    const prompt = MIDNIGHT_ICEBREAKERS[icebreakerIdx];
    socket.emit('send-message', `💭 ${prompt}`);
    setMessages(prev => [...prev, { text: `💭 ${prompt}`, sender: 'you', timestamp: Date.now() }]);
    playAudioCue('message');
    setIcebreakerIdx(prev => (prev + 1) % MIDNIGHT_ICEBREAKERS.length);
  };

  // Audio Activity Visualizer
  const setupAudioAnalyser = useCallback((stream, isLocal) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return null;

      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let animId;
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const isSpeaking = avg > 18;

        if (isLocal) {
          setIsLocalSpeaking(isSpeaking);
        } else {
          setIsRemoteSpeaking(isSpeaking);
        }

        animId = requestAnimationFrame(checkVolume);
      };

      animId = requestAnimationFrame(checkVolume);

      return () => {
        if (animId) cancelAnimationFrame(animId);
        source.disconnect();
      };
    } catch (e) {
      return null;
    }
  }, []);

  // Pre-acquire Media Stream Helper
  const acquireLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (hdErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      localStreamRef.current = stream;
      setPermissionError(null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      return stream;
    } catch (err) {
      console.error("Camera/Mic Permission Error:", err);
      setPermissionError(err.message || 'Permission Denied');
      return null;
    }
  }, []);

  // WebRTC Setup
  useEffect(() => {
    let active = true;
    let localAnalyserCleanup = null;
    let remoteAnalyserCleanup = null;
    pendingCandidatesRef.current = [];

    localMediaPromiseRef.current = acquireLocalMedia().then(stream => {
      if (stream && active) {
        localAnalyserCleanup = setupAudioAnalyser(stream, true);
      }
      return stream;
    });

    async function initWebRTC() {
      if (chatMode !== 'video') {
        setConnectionStatus('Connected');
        playAudioCue('connect');
        return;
      }

      const rtcConfig = resolveRTCConfiguration(iceServers);
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      const updateState = () => {
        if (!active) return;
        const iceState = pc.iceConnectionState;
        const connState = pc.connectionState;

        if (iceState === 'connected' || iceState === 'completed' || connState === 'connected') {
          setConnectionStatus('Connected');
        } else if (iceState === 'disconnected' || iceState === 'failed' || connState === 'failed') {
          setConnectionStatus('Disconnected');
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          let stream = event.streams && event.streams[0];
          if (!stream) {
            stream = remoteVideoRef.current.srcObject || new MediaStream();
            stream.addTrack(event.track);
          }
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
          setConnectionStatus('Connected');
          playAudioCue('connect');
          trackWebRTCSuccess(partnerId, initiator);

          if (remoteAnalyserCleanup) remoteAnalyserCleanup();
          remoteAnalyserCleanup = setupAudioAnalyser(stream, false);
        }
      };

      pc.oniceconnectionstatechange = updateState;
      pc.onconnectionstatechange = updateState;

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && partnerId) {
          socket.emit('signal', { to: partnerId, type: 'candidate', candidate: event.candidate });
        }
      };

      const localStream = await localMediaPromiseRef.current;
      if (localStream && pc.signalingState !== 'closed') {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      if (initiator) {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
          socket.emit('signal', { to: partnerId, type: 'offer', sdp: offer });
        } catch (err) { 
          console.error("Error creating initial offer:", err); 
        }
      }
    }

    initWebRTC();

    const handleSignal = async (data) => {
      const { from, type, sdp, candidate } = data;
      if (from !== partnerId) return;
      const pc = pcRef.current;
      if (!pc || pc.signalingState === 'closed') return;

      try {
        if (type === 'offer') {
          const localStream = await localMediaPromiseRef.current;
          if (localStream && pc.signalingState !== 'closed') {
            const senders = pc.getSenders();
            localStream.getTracks().forEach((track) => {
              const alreadyAdded = senders.some(s => s.track && s.track.kind === track.kind);
              if (!alreadyAdded) {
                pc.addTrack(track, localStream);
              }
            });
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          while (pendingCandidatesRef.current.length > 0) {
            const pending = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(pending));
            } catch (e) {}
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { to: partnerId, type: 'answer', sdp: answer });
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          while (pendingCandidatesRef.current.length > 0) {
            const pending = pendingCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(pending));
            } catch (e) {}
          }
        } else if (type === 'candidate') {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        }
      } catch (err) { 
        console.error("Signal error:", err); 
      }
    };

    const handleReceiveMessage = (msg) => {
      playAudioCue('message');
      setMessages(prev => [...prev, { text: msg.text, sender: 'stranger', timestamp: msg.timestamp }]);
      if (!sidebarOpenRef.current && chatMode === 'video') {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleTyping = (isTyping) => setIsStrangerTyping(isTyping);

    const handlePartnerLeft = () => {
      playAudioCue('leave');
      setConnectionStatus('Partner Left');
      setMessages(prev => [...prev, { text: "Stranger has disconnected. Finding next match...", isSystem: true, timestamp: Date.now() }]);
      onNextRef.current();
    };

    socket.on('signal', handleSignal);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('partner-left', handlePartnerLeft);

    return () => {
      active = false;
      socket.off('signal', handleSignal);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('partner-left', handlePartnerLeft);

      if (localAnalyserCleanup) localAnalyserCleanup();
      if (remoteAnalyserCleanup) remoteAnalyserCleanup();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      if (pcRef.current) { 
        pcRef.current.close(); 
        pcRef.current = null; 
      }
      if (localStreamRef.current) { 
        localStreamRef.current.getTracks().forEach(track => track.stop()); 
        localStreamRef.current = null; 
      }
      if (screenStreamRef.current) { 
        screenStreamRef.current.getTracks().forEach(track => track.stop()); 
        screenStreamRef.current = null; 
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [partnerId, initiator, chatMode, socket, iceServers, acquireLocalMedia, setupAudioAnalyser]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isStrangerTyping]);

  // Media Controls
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { 
        t.enabled = !t.enabled; 
        setIsMuted(!t.enabled); 
      }
    }
  }, []);

  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { 
        t.enabled = !t.enabled; 
        setIsCamOff(!t.enabled); 
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      if (screenStreamRef.current) { 
        screenStreamRef.current.getTracks().forEach(t => t.stop()); 
        screenStreamRef.current = null; 
      }
      setIsSharing(false);
      if (localStreamRef.current && pcRef.current) {
        const vt = localStreamRef.current.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && vt) sender.replaceTrack(vt);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsSharing(true);
        const st = stream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender && st) sender.replaceTrack(st);
        st.onended = () => toggleScreenShare();
      } catch (err) { 
        console.error("Screen share error:", err); 
      }
    }
  }, [isSharing]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onNext();
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleCam();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleScreenShare();
      } else if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute, toggleCam, toggleScreenShare, onNext]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    socket.emit('send-message', inputText);
    setMessages(prev => [...prev, { text: inputText, sender: 'you', timestamp: Date.now() }]);
    setInputText('');
    socket.emit('typing', false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (val.length > 0) {
      socket.emit('typing', true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', false);
      }, 1500);
    } else {
      socket.emit('typing', false);
    }
  };

  const openChatSidebar = () => {
    setSidebarOpen(true);
    setUnreadCount(0);
  };

  const handleReportSubmit = () => {
    setShowReportModal(false);
    onNext();
  };

  const activeFilterStyle = CAMERA_FILTERS.find(f => f.id === selectedFilter)?.style || '';
  const statusColor = connectionStatus === 'Connected' 
    ? 'bg-emerald-400' 
    : connectionStatus === 'Partner Left' 
      ? 'bg-red-400' 
      : 'bg-mingzy-pink';

  // ═══════════════════════════════════════════════════════════════
  // TEXT CHAT MODE VIEW
  // ═══════════════════════════════════════════════════════════════
  if (chatMode === 'text') {
    return (
      <div className="bg-midnight-canvas text-[#f5ebfc] h-screen w-full flex flex-col overflow-hidden font-body-md relative noise-overlay selection:bg-mingzy-pink/30">
        
        {/* Top Header */}
        <header className="glass-plum-strong w-full z-50 shrink-0 border-b border-white/[0.06]">
          <div className="max-w-[1000px] mx-auto px-5 h-[72px] flex justify-between items-center">
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-mingzy-pink/20 to-mingzy-orchid/20 border border-mingzy-pink/30 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_12px_rgba(255,46,147,0.3)]">
                  {partnerProfile?.name ? partnerProfile.name[0].toUpperCase() : 'S'}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09060F] ${statusColor} animate-pulse`}></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white block">
                    {partnerProfile?.name || 'Stranger'}
                  </span>
                  <span className="text-[10px] glass-plum px-2 py-0.5 rounded-full text-mingzy-pink border border-mingzy-pink/20">
                    {vibe}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 block">
                  {connectionStatus} • {formatTime(callDuration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 cursor-pointer" onClick={onEnd}>
              <img src="/images/mingzy-logo.jpg" alt="" className="w-6 h-6 rounded-lg object-cover" />
              <span className="font-bold text-base text-white tracking-tight">Mingzy</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white transition-all"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <button 
                onClick={onEnd}
                className="btn-mingzy-ghost h-9 px-3.5 rounded-xl text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 text-xs font-semibold"
                title="End Conversation"
              >
                <span className="material-symbols-outlined text-[15px]">call_end</span>
                Exit
              </button>

              <button 
                onClick={onNext}
                className="btn-mingzy-cta h-9 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                title="Skip to Next Match (Ctrl+Enter)"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[15px]">skip_next</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Text Workspace */}
        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-[1000px] mx-auto px-4 md:px-6 py-6 overflow-hidden relative z-10">
          <div className="w-full h-full glass-plum-strong rounded-3xl flex flex-col overflow-hidden border border-white/[0.08] shadow-plum-floating">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4">
              {messages.map((msg, index) => {
                if (msg.isSystem) {
                  return (
                    <div key={index} className="text-center text-[11px] text-white/30 my-3 flex items-center justify-center gap-2">
                      <div className="flex-1 h-px bg-white/[0.05]"></div>
                      <span className="shrink-0">{msg.text}</span>
                      <div className="flex-1 h-px bg-white/[0.05]"></div>
                    </div>
                  );
                }

                const isYou = msg.sender === 'you';
                return (
                  <div key={index} className={`flex flex-col max-w-[70%] ${isYou ? 'self-end items-end' : 'items-start'} animate-fade-in-up opacity-0`}>
                    <div className={`px-4 py-3 text-sm leading-relaxed ${
                      isYou 
                        ? 'bg-gradient-to-r from-mingzy-pink/25 to-mingzy-orchid/20 text-white rounded-2xl rounded-br-md border border-mingzy-pink/30' 
                        : 'glass-plum text-white/90 rounded-2xl rounded-bl-md border border-white/[0.08]'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-white/25 mt-1.5 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {isStrangerTyping && (
                <div className="flex items-center gap-2 text-white/40 mt-1">
                  <span className="text-[11px]">Stranger is typing</span>
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <div key={delay} className="w-1.5 h-1.5 bg-mingzy-pink/60 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Icebreaker Strip */}
            <div className="px-6 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs text-white/60">
              <span className="truncate max-w-[75%] italic">"{MIDNIGHT_ICEBREAKERS[icebreakerIdx]}"</span>
              <button 
                onClick={sendIcebreakerAsMessage}
                className="text-[11px] text-mingzy-pink hover:underline font-semibold"
              >
                Send Question 💬
              </button>
            </div>

            {/* Quick Reactions Bar */}
            <div className="px-6 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center gap-2">
              {['♡', '🔥', '😂', '✨', '👋', '🌙'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 rounded-xl glass-plum hover:scale-110 active:scale-90 flex items-center justify-center text-sm transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 md:p-6 border-t border-white/[0.06] bg-white/[0.02]">
              <form onSubmit={handleSendMessage} className="relative flex items-center glass-plum border border-white/[0.08] rounded-2xl focus-within:border-mingzy-pink/50 transition-all p-1.5">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder:text-white/20 py-3 px-3 focus:outline-none"
                  placeholder="Type a message to stranger... (Press Enter)"
                />
                
                <button 
                  type="submit"
                  className="btn-mingzy-cta w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </form>
            </div>
            
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // HD VIDEO CHAT MODE VIEW
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="bg-midnight-canvas text-[#f5ebfc] h-screen w-full flex overflow-hidden font-body-md relative noise-overlay selection:bg-mingzy-pink/30">

      {/* Atmospheric Background Ambient Glows */}
      <div className="aurora-glow-top"></div>
      <div className="aurora-glow-coral top-1/2 -right-40"></div>

      {/* Floating Emoji Reactions Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map(r => (
          <span 
            key={r.id}
            className="absolute bottom-20 animate-heart-float text-3xl select-none"
            style={{
              left: `${r.x}%`,
              transform: `scale(${r.scale})`,
              textShadow: '0 0 16px rgba(255, 46, 147, 0.8)'
            }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-gradient-to-b from-[#09060F]/90 via-[#09060F]/60 to-transparent flex justify-between items-center px-4 md:px-10 py-3.5 pointer-events-none">
        <div className="pointer-events-auto cursor-pointer flex items-center gap-2" onClick={onEnd}>
          <img src="/images/mingzy-logo.jpg" alt="" className="w-6 h-6 rounded-lg object-cover shadow-[0_0_8px_rgba(255,46,147,0.3)]" />
          <span className="font-bold text-lg text-white tracking-tight">Mingzy</span>
        </div>
        
        {/* Status Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3.5 pointer-events-auto flex items-center gap-2">
          <div className="glass-plum px-4 py-1.5 rounded-full flex items-center gap-2.5 border border-white/[0.08] shadow-lg">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse shadow-[0_0_8px_#FF2E93]`}></span>
            <span className="text-[11px] text-white/80 font-medium">{connectionStatus}</span>
            <span className="w-px h-3 bg-white/10"></span>
            <span className="text-[11px] text-mingzy-pink font-semibold">{vibe}</span>
            <span className="w-px h-3 bg-white/10"></span>
            <span className="text-[11px] text-white/40 font-mono">{formatTime(callDuration)}</span>
          </div>
        </div>

        {/* Top Right: Theme, Report, & Exit */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button 
            onClick={() => setShowReportModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-red-400 transition-all"
            title="Report or Block"
          >
            <span className="material-symbols-outlined text-[18px]">flag</span>
          </button>

          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.06] text-white/40 hover:text-white transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button 
            onClick={onEnd}
            className="btn-mingzy-ghost h-9 px-3.5 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 text-xs font-semibold"
            title="End Conversation"
          >
            <span className="material-symbols-outlined text-[15px]">call_end</span>
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Video Grid */}
      <main className={`flex-1 flex flex-col h-full relative p-2 sm:p-4 pb-[105px] pt-[68px] transition-all duration-300 ${sidebarOpen ? 'lg:pr-[360px]' : ''}`}>
        
        {/* Organic Video Windows Container */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col md:flex-row gap-3 sm:gap-4 relative h-full">
          
          {/* YOU (Local User Panel) */}
          <div className={`flex-1 relative rounded-organic overflow-hidden bg-[#12071A] border transition-all duration-300 flex items-center justify-center group ${
            isLocalSpeaking && !isMuted ? 'border-mingzy-pink shadow-[0_0_30px_rgba(255,46,147,0.35)]' : 'border-white/[0.08]'
          }`}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ filter: activeFilterStyle }}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-all duration-300" 
            />
            
            {isCamOff && (
              <div className="absolute inset-0 bg-[#12071A] flex flex-col items-center justify-center z-20">
                <span className="material-symbols-outlined text-3xl text-white/20 mb-2">videocam_off</span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Camera Off</span>
              </div>
            )}

            {permissionError && (
              <div className="absolute inset-0 bg-[#12071A]/90 p-4 flex flex-col items-center justify-center text-center z-25">
                <span className="material-symbols-outlined text-3xl text-amber-400 mb-2">videocam_off</span>
                <p className="text-xs text-white/70 max-w-[200px]">Camera/Microphone access blocked.</p>
                <button 
                  onClick={acquireLocalMedia}
                  className="mt-3 px-3.5 py-1.5 rounded-full btn-mingzy-cta text-[11px]"
                >
                  Retry Permission
                </button>
              </div>
            )}

            {/* Video Filter Selector overlay */}
            <div className="absolute top-3 right-3 glass-plum px-2 py-1 rounded-full flex items-center gap-1 z-30 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              {CAMERA_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedFilter === f.id ? 'bg-mingzy-pink text-white font-bold' : 'text-white/40 hover:text-white'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            
            {/* Local User Tag */}
            <div className="absolute bottom-3 left-3 glass-plum px-3 py-1.5 rounded-xl flex items-center gap-2 z-30 border border-white/10">
              <span className="text-xs text-white font-medium flex items-center gap-1.5">
                You
                {isLocalSpeaking && !isMuted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-mingzy-pink animate-ping"></span>
                )}
              </span>
              {isMuted && <span className="material-symbols-outlined text-[13px] text-red-400">mic_off</span>}
            </div>
          </div>

          {/* SOMEONE NEW (Remote Partner Panel) */}
          <div className={`flex-1 relative rounded-organic-reverse overflow-hidden bg-[#12071A] border transition-all duration-300 flex items-center justify-center group ${
            isRemoteSpeaking ? 'border-mingzy-orchid shadow-[0_0_30px_rgba(217,70,239,0.35)]' : 'border-white/[0.08]'
          }`}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                connectionStatus === 'Connected' ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />

            {/* Waiting Placeholder */}
            {connectionStatus !== 'Connected' && (
              <div className="absolute inset-0 bg-[#12071A] flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3 animate-pulse-node">
                  <span className="text-2xl">♡</span>
                </div>
                <span className="text-xs text-white/50 tracking-wider font-medium">{partnerProfile?.name || 'Stranger'}</span>
                <span className="text-[11px] text-mingzy-pink animate-pulse mt-1.5">{connectionStatus}...</span>
              </div>
            )}
            
            {/* Remote User Tag */}
            <div className="absolute bottom-3 left-3 glass-plum px-3 py-1.5 rounded-xl flex items-center gap-2 z-30 border border-white/10">
              <span className="text-xs text-white font-medium flex items-center gap-1.5">
                {partnerProfile?.name || 'Stranger'}
                {isRemoteSpeaking && (
                  <span className="w-1.5 h-1.5 rounded-full bg-mingzy-orchid animate-ping"></span>
                )}
              </span>
            </div>

            {/* Creator Attribution Watermark (Sleek, Persistent, Non-Intrusive) */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 z-30 pointer-events-none opacity-70">
              <span className="w-1.5 h-1.5 rounded-full bg-mingzy-pink animate-pulse"></span>
              <span className="text-[10px] font-medium tracking-wide text-white/80">Mingzy • mingzy.space</span>
            </div>

            <div className="absolute bottom-3 right-3 glass-plum px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 z-30 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
              <span className="text-[10px] text-white/50">{connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Icebreaker Prompt Suggestion */}
        <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2 text-center pointer-events-auto hidden sm:flex items-center gap-2">
          <div className="glass-plum px-4 py-1.5 rounded-full text-xs text-white/70 flex items-center gap-2 border border-white/[0.08] shadow-lg">
            <span>💭</span>
            <span className="font-light italic">"{MIDNIGHT_ICEBREAKERS[icebreakerIdx]}"</span>
            <button 
              onClick={sendIcebreakerAsMessage}
              className="text-mingzy-pink hover:text-white transition-colors ml-1 font-semibold text-[11px]"
              title="Send to chat"
            >
              Ask
            </button>
            <button 
              onClick={() => setIcebreakerIdx(prev => (prev + 1) % MIDNIGHT_ICEBREAKERS.length)}
              className="text-white/30 hover:text-white transition-colors ml-1"
              title="Next Icebreaker"
            >
              ↻
            </button>
          </div>
        </div>
      </main>

      {/* Floating Bottom Control Dock */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full w-fit glass-plum-strong flex gap-1.5 p-1.5 items-center z-40 shadow-plum-floating border border-white/[0.1]">
        
        {/* Mic Toggle */}
        <button 
          onClick={toggleMute}
          className={`rounded-full w-11 h-11 flex items-center justify-center transition-all active:scale-90 ${
            isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
          }`}
          title="Toggle Mute (M)"
        >
          <span className="material-symbols-outlined text-[19px]">{isMuted ? 'mic_off' : 'mic'}</span>
        </button>

        {/* Cam Toggle */}
        <button 
          onClick={toggleCam}
          className={`rounded-full w-11 h-11 flex items-center justify-center transition-all active:scale-90 ${
            isCamOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
          }`}
          title="Toggle Camera (V)"
        >
          <span className="material-symbols-outlined text-[19px]">{isCamOff ? 'videocam_off' : 'videocam'}</span>
        </button>

        {/* Screen Share */}
        <button 
          onClick={toggleScreenShare}
          className={`rounded-full w-11 h-11 flex items-center justify-center transition-all active:scale-90 ${
            isSharing ? 'bg-mingzy-orchid/25 text-mingzy-orchid border border-mingzy-orchid/40' : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
          }`}
          title="Share Screen (S)"
        >
          <span className="material-symbols-outlined text-[19px]">present_to_all</span>
        </button>

        {/* Quick Reaction Button */}
        <button 
          onClick={() => sendReaction('♡')}
          className="rounded-full w-11 h-11 flex items-center justify-center text-mingzy-pink hover:bg-mingzy-pink/15 transition-all active:scale-90 text-lg"
          title="Send Heart Reaction"
        >
          ♡
        </button>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        {/* Skip to Next Stranger */}
        <button 
          onClick={onNext}
          className="btn-mingzy-cta rounded-full px-6 py-2.5 flex items-center justify-center text-xs font-bold tracking-wide gap-1.5 shadow-lit-cta"
          title="Skip to Next Match (Ctrl+Enter)"
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[16px]">skip_next</span>
        </button>

        {/* Chat Drawer Toggle */}
        <button 
          onClick={() => {
            if (sidebarOpen) {
              setSidebarOpen(false);
            } else {
              openChatSidebar();
            }
          }}
          className={`rounded-full w-11 h-11 flex items-center justify-center transition-all active:scale-95 relative ${
            sidebarOpen ? 'bg-mingzy-orchid/25 text-mingzy-orchid' : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
          }`}
          title="Toggle Chat (Esc)"
        >
          <span className="material-symbols-outlined text-[19px]">chat</span>
          {unreadCount > 0 && !sidebarOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mingzy-pink text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </nav>

      {/* Safety Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowReportModal(false)}></div>
          <div className="relative glass-plum-strong rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl z-10">
            <h3 className="text-base font-bold text-white mb-2">Report Conversation</h3>
            <p className="text-xs text-white/50 mb-4">Select an issue to block user and find your next match immediately:</p>
            <div className="flex flex-col gap-2 mb-5">
              {['Inappropriate behavior', 'Spam or advertising', 'Harassment', 'Underage concern'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                    reportReason === reason ? 'border-mingzy-pink bg-mingzy-pink/20 text-white' : 'border-white/10 glass-plum text-white/70 hover:border-white/20'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 rounded-xl glass-plum text-xs text-white/60"
              >
                Cancel
              </button>
              <button 
                onClick={handleReportSubmit}
                className="flex-1 py-2 rounded-xl btn-mingzy-cta text-xs font-bold"
              >
                Submit & Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Messages Sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      <aside className={`fixed right-0 top-0 h-full w-full sm:w-[360px] z-[60] glass-plum-strong border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mingzy-pink/30 to-mingzy-orchid/30 flex items-center justify-center font-bold text-white text-xs">
              {partnerProfile?.name ? partnerProfile.name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">{partnerProfile?.name || 'Stranger'}</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                {connectionStatus === 'Connected' ? 'Live Chat Active' : connectionStatus}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white"
            title="Close Chat"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {messages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={index} className="text-center text-[10px] text-white/30 my-2 flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/[0.04]"></div>
                  <span>{msg.text}</span>
                  <div className="flex-1 h-px bg-white/[0.04]"></div>
                </div>
              );
            }

            const isYou = msg.sender === 'you';
            return (
              <div key={index} className={`flex flex-col max-w-[85%] ${isYou ? 'self-end items-end' : 'items-start'} animate-fade-in-up opacity-0`}>
                <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                  isYou 
                    ? 'bg-gradient-to-r from-mingzy-pink/25 to-mingzy-orchid/20 text-white rounded-2xl rounded-br-md border border-mingzy-pink/30' 
                    : 'glass-plum text-white/90 rounded-2xl rounded-bl-md border border-white/[0.06]'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-white/20 mt-1 mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {isStrangerTyping && (
            <div className="flex items-center gap-2 text-white/30 mt-1">
              <span className="text-[10px]">Stranger is typing</span>
              <div className="flex gap-0.5">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-1 h-1 bg-mingzy-pink/60 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-white/[0.06] bg-white/[0.01]">
          <form onSubmit={handleSendMessage} className="relative flex items-center glass-plum border border-white/[0.08] rounded-xl focus-within:border-mingzy-pink/40 p-1">
            <input 
              type="text" 
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder:text-white/20 py-2 px-2 focus:outline-none"
              placeholder="Type a message..."
            />
            
            <button 
              type="submit"
              className="w-8 h-8 rounded-lg btn-mingzy-cta flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      </aside>

    </div>
  );
}
