import React, { useEffect, useRef, useState, useCallback } from 'react';
import { resolveRTCConfiguration } from '../services/iceService';

// Audio feedback synthesizer for subtle tactile cues
function playAudioCue(type = 'connect') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'message') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.06); // A5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'leave') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.12); // A4
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Gracefully handle browser autoplay policies
  }
}

export default function ChatRoom({ 
  chatMode, 
  socket, 
  partnerId, 
  initiator, 
  partnerProfile,
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
  
  // Default sidebar closed on mobile (<1024px) so video call is immediately visible!
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
  
  // Mirror refs: allow reading current values inside useEffect without adding them as dependencies
  const sidebarOpenRef = useRef(sidebarOpen);
  const onNextRef = useRef(onNext);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const durationTimerRef = useRef(null);

  // Keep mirror refs synced with state
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  // 1. Call Duration Timer
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

  // 2. Setup Speaking Activity Visualizer
  const setupAudioAnalyser = useCallback((stream, isLocal) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

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

  // 3. Pre-acquire Media Stream Helper with Retries
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
        console.warn("Fallback to baseline getUserMedia constraints:", hdErr.message);
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

  // 4. WebRTC Peer Connection & Media Access
  useEffect(() => {
    let active = true;
    let localAnalyserCleanup = null;
    let remoteAnalyserCleanup = null;
    pendingCandidatesRef.current = [];

    // Begin acquiring local media immediately
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

      // Flush buffered remote ICE candidates once remote description is set
      const flushPendingCandidates = async () => {
        if (!pc || !pc.remoteDescription) return;
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.debug("Buffered candidate addition notice:", e.message);
          }
        }
      };

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

      // Remote Track Handler
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

          if (remoteAnalyserCleanup) remoteAnalyserCleanup();
          remoteAnalyserCleanup = setupAudioAnalyser(stream, false);
        }
      };

      pc.oniceconnectionstatechange = updateState;
      pc.onconnectionstatechange = updateState;

      pc.onicecandidateerror = (event) => {
        if (event.errorCode !== 701) {
          console.debug("ICE Candidate Notice:", event.errorText || event.errorCode);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && partnerId) {
          socket.emit('signal', { to: partnerId, type: 'candidate', candidate: event.candidate });
        }
      };

      // Await local media to ensure local tracks are attached before initial offer
      const localStream = await localMediaPromiseRef.current;
      if (localStream && pc.signalingState !== 'closed') {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // If designated as initiator, create and dispatch the offer
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

    // Signal Reception Handler
    const handleSignal = async (data) => {
      const { from, type, sdp, candidate } = data;
      if (from !== partnerId) return;
      const pc = pcRef.current;
      if (!pc || pc.signalingState === 'closed') return;

      try {
        if (type === 'offer') {
          // Ensure local media tracks are attached before generating answer
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
          
          // Flush any buffered candidates
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
          
          // Flush any buffered candidates
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

  // 5. Auto Scroll Messages
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isStrangerTyping]);

  // 6. Media Controls
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

  // 7. Keyboard Shortcuts (M: Mute, V: Cam, S: Screen, Esc: Sidebar)
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

  // 8. Message Handling with Debouncing
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

  const statusColor = connectionStatus === 'Connected' 
    ? 'bg-emerald-400' 
    : connectionStatus === 'Partner Left' 
      ? 'bg-red-400' 
      : 'bg-amber-400';
  const statusGlow = connectionStatus === 'Connected' 
    ? 'shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
    : '';

  // ═══════════════════════════════════════════════════════════════
  // TEXT CHAT MODE VIEW
  // ═══════════════════════════════════════════════════════════════
  if (chatMode === 'text') {
    return (
      <div className="bg-ambient-gradient text-white h-screen w-full flex flex-col overflow-hidden font-body-md relative selection:bg-violet-500/30 noise-overlay">
        
        {/* Header */}
        <header className="glass-panel-strong w-full z-50 shrink-0 border-b border-white/[0.04] pointer-events-auto">
          <div className="max-w-[1000px] mx-auto px-5 h-[72px] flex justify-between items-center">
            
            {/* Left: Stranger Profile info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-300 text-sm">
                  {partnerProfile?.name ? partnerProfile.name[0].toUpperCase() : 'S'}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#f8fafc] dark:border-[#0a0a0a] ${statusColor} ${statusGlow} animate-pulse`}></span>
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  {partnerProfile?.name || 'Stranger'}
                </span>
                <span className="text-[10px] text-white/40 block">
                  {connectionStatus} • {formatTime(callDuration)}
                </span>
              </div>
            </div>

            {/* Middle: Logo */}
            <div className="font-bold text-lg text-white/85 tracking-tight cursor-pointer hover:text-white transition-colors" onClick={onEnd}>
              Mingzy
            </div>

            {/* Right: Controls & Theme Toggle */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <button 
                onClick={onEnd}
                className="btn-outline h-9 px-4 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1.5 text-xs font-semibold"
                title="End Conversation"
              >
                <span className="material-symbols-outlined text-[16px]">call_end</span>
                Exit
              </button>

              <button 
                onClick={onNext}
                className="btn-primary h-9 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5 relative z-10"
                title="Skip to Next Match (Ctrl+Enter)"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Next
                  <span className="material-symbols-outlined text-[16px]">skip_next</span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Text Chat Workspace */}
        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-[1000px] mx-auto px-4 md:px-6 py-6 overflow-hidden relative z-10">
          <div className="w-full h-full glass-panel rounded-3xl flex flex-col overflow-hidden glow-indigo">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-4">
              {messages.map((msg, index) => {
                if (msg.isSystem) {
                  return (
                    <div key={index} className="text-center text-[10px] text-white/20 my-3 flex items-center justify-center gap-2">
                      <div className="flex-1 h-px bg-white/[0.04]"></div>
                      <span className="shrink-0">{msg.text}</span>
                      <div className="flex-1 h-px bg-white/[0.04]"></div>
                    </div>
                  );
                }

                const isYou = msg.sender === 'you';
                return (
                  <div key={index} className={`flex flex-col max-w-[70%] ${isYou ? 'self-end items-end' : 'items-start'} animate-fade-in-up opacity-0`} style={{ animationDelay: '0ms' }}>
                    <div className={`px-4 py-3 text-sm leading-relaxed ${
                      isYou 
                        ? 'bg-violet-600/15 text-white/80 rounded-2xl rounded-br-md border border-violet-500/10' 
                        : 'bg-white/[0.04] text-white/70 rounded-2xl rounded-bl-md border border-white/[0.04]'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-white/15 mt-1.5 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {isStrangerTyping && (
                <div className="flex items-center gap-2 text-white/25 mt-1">
                  <span className="text-[10px]">Stranger is typing</span>
                  <div className="flex gap-0.5">
                    {[0, 150, 300].map(delay => (
                      <div key={delay} className="w-1 h-1 bg-violet-400/50 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Area */}
            <div className="p-4 md:p-6 border-t border-white/[0.04] bg-white/[0.01]">
              <form onSubmit={handleSendMessage} className="relative flex items-center bg-white/[0.03] border border-white/[0.06] rounded-2xl focus-within:border-violet-500/30 transition-all p-1.5">
                <button 
                  type="button"
                  onClick={() => setInputText(prev => prev + '👋')}
                  className="p-3 text-white/25 hover:text-white/50 transition-colors focus:outline-none flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                </button>
                
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border-none text-sm text-white/80 focus:ring-0 placeholder:text-white/15 py-3 px-2 focus:outline-none"
                  placeholder="Type a message to stranger... (Press Enter)"
                />
                
                <button 
                  type="submit"
                  className="w-10 h-10 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-400 flex items-center justify-center transition-colors focus:outline-none shrink-0"
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
    <div className="bg-[#060606] text-white h-screen w-full flex overflow-hidden font-body-md relative selection:bg-violet-500/30 noise-overlay">

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex justify-between items-center px-4 md:px-10 py-3.5 pointer-events-none">
        <div className="font-bold text-lg text-white/80 tracking-tight pointer-events-auto cursor-pointer hover:text-white transition-colors flex items-center gap-2" onClick={onEnd}>
          <span>Mingzy</span>
        </div>
        
        {/* Clean Status & Call Duration Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3.5 pointer-events-auto flex items-center gap-2">
          <div className="glass-panel px-4 py-1.5 rounded-full flex items-center gap-2.5 border border-white/10 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse ${statusGlow}`}></span>
            <span className="text-[11px] text-white/70 font-medium">{connectionStatus}</span>
            <span className="w-px h-3 bg-white/10"></span>
            <span className="text-[11px] text-white/40 font-mono">{formatTime(callDuration)}</span>
          </div>
        </div>

        {/* Top Right: Theme & Exit */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button 
            onClick={onEnd}
            className="btn-outline h-9 px-3.5 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 text-xs font-semibold"
            title="End Conversation"
          >
            <span className="material-symbols-outlined text-[16px]">call_end</span>
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Video Canvas */}
      <main className={`flex-1 flex flex-col h-full relative p-2 sm:p-3 pb-[100px] pt-[64px] transition-all duration-300 ${sidebarOpen ? 'lg:pr-[356px]' : ''}`}>
        
        {/* Video Grid: Stacked 50/50 on Mobile, Side-by-Side on Desktop */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col md:flex-row gap-2 sm:gap-3 relative h-full">
          
          {/* Local User Panel */}
          <div className={`flex-1 relative rounded-2xl overflow-hidden bg-[#0E0E0E] border transition-all duration-200 flex items-center justify-center group ${
            isLocalSpeaking && !isMuted ? 'border-violet-500/60 shadow-[0_0_24px_rgba(139,92,246,0.25)]' : 'border-white/[0.06]'
          }`}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
            />
            
            {isCamOff && (
              <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-20">
                <span className="material-symbols-outlined text-3xl text-white/20 mb-2">videocam_off</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Camera Off</span>
              </div>
            )}

            {permissionError && (
              <div className="absolute inset-0 bg-[#0A0A0A]/90 p-4 flex flex-col items-center justify-center text-center z-25">
                <span className="material-symbols-outlined text-3xl text-amber-400 mb-2">videocam_off</span>
                <p className="text-xs text-white/70 max-w-[200px]">Camera/Microphone access blocked in browser.</p>
                <button 
                  onClick={acquireLocalMedia}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-violet-600/30 text-violet-200 text-[11px] border border-violet-500/30"
                >
                  Retry Permission
                </button>
              </div>
            )}
            
            <div className="absolute inset-0 border border-white/[0.04] rounded-2xl pointer-events-none z-30"></div>
            
            {/* Local User Tag */}
            <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 z-30">
              <span className="text-[11px] text-white/75 font-medium flex items-center gap-1.5">
                You
                {isLocalSpeaking && !isMuted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping"></span>
                )}
              </span>
              {isMuted && <span className="material-symbols-outlined text-[14px] text-red-400/80">mic_off</span>}
            </div>
          </div>

          {/* Remote User Panel */}
          <div className={`flex-1 relative rounded-2xl overflow-hidden bg-[#0E0E0E] border transition-all duration-200 flex items-center justify-center group ${
            isRemoteSpeaking ? 'border-emerald-500/60 shadow-[0_0_24px_rgba(52,211,153,0.25)]' : 'border-white/[0.06]'
          }`}>
            {/* ALWAYS mount the video element so ontrack can attach the remote stream at any time */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                connectionStatus === 'Connected' ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />

            {/* Placeholder overlay shown until connected */}
            {connectionStatus !== 'Connected' && (
              <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 animate-breathing-glow">
                  <span className="material-symbols-outlined text-[28px] text-white/20">question_mark</span>
                </div>
                <span className="text-[11px] text-white/30 uppercase tracking-[0.15em]">{partnerProfile?.name || 'Stranger'}</span>
                <span className="text-[10px] text-violet-400/70 animate-pulse mt-2">{connectionStatus}...</span>
              </div>
            )}

            <div className="absolute inset-0 border border-white/[0.04] rounded-2xl pointer-events-none z-30"></div>
            {connectionStatus === 'Connected' && <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(139,92,246,0.03)] rounded-2xl pointer-events-none z-30"></div>}
            
            {/* Remote User Tag */}
            <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 z-30">
              <span className="text-[11px] text-white/75 font-medium flex items-center gap-1.5">
                {partnerProfile?.name || 'Stranger'}
                {isRemoteSpeaking && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </span>
            </div>

            <div className="absolute bottom-3 right-3 glass-panel px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-30">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
              <span className="text-[10px] text-white/50">{connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Safety Overlay */}
        <div className="absolute bottom-[108px] left-1/2 -translate-x-1/2 text-center pointer-events-none hidden sm:block">
          <p className="glass-panel px-4 py-1.5 rounded-full text-[10px] text-white/30 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px] text-violet-400/50">shield</span>
            Stay anonymous. Don't share sensitive personal info.
          </p>
        </div>
      </main>

      {/* Bottom Floating Control Dock */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-2xl w-fit glass-panel-strong flex gap-1 p-1.5 items-center z-40 glow-white-soft border border-white/10">
        
        {/* Mic Toggle (Hotkey: M) */}
        <button 
          onClick={toggleMute}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${
            isMuted ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          title="Toggle Mute (M)"
        >
          <span className="material-symbols-outlined text-[20px]">{isMuted ? 'mic_off' : 'mic'}</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isMuted ? 'Unmute (M)' : 'Mute (M)'}
          </div>
        </button>

        {/* Camera Toggle (Hotkey: V) */}
        <button 
          onClick={toggleCam}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${
            isCamOff ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          title="Toggle Camera (V)"
        >
          <span className="material-symbols-outlined text-[20px]">{isCamOff ? 'videocam_off' : 'videocam'}</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isCamOff ? 'Camera On (V)' : 'Camera Off (V)'}
          </div>
        </button>

        <div className="w-px h-6 bg-white/[0.08] mx-1"></div>

        {/* Screen Share (Hotkey: S) */}
        <button 
          onClick={toggleScreenShare}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${
            isSharing ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          title="Share Screen (S)"
        >
          <span className="material-symbols-outlined text-[20px]">present_to_all</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isSharing ? 'Stop Share (S)' : 'Share Screen (S)'}
          </div>
        </button>

        {/* End Call */}
        <button 
          onClick={onEnd}
          className="rounded-xl w-11 h-11 flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all active:scale-90 border border-red-500/20"
          title="End Call"
        >
          <span className="material-symbols-outlined text-[20px]">call_end</span>
        </button>

        <div className="w-px h-6 bg-white/[0.08] mx-1"></div>

        {/* Next Stranger Button */}
        <button 
          onClick={onNext}
          className="btn-primary rounded-xl px-5 sm:px-6 py-2.5 flex items-center justify-center text-[11px] uppercase tracking-[0.1em] font-semibold relative z-10 gap-1.5 shadow-lg shadow-violet-600/25"
          title="Skip to Next Match (Ctrl+Enter)"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            Next
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </span>
        </button>

        {/* Chat Drawer Toggle Button */}
        <button 
          onClick={() => {
            if (sidebarOpen) {
              setSidebarOpen(false);
            } else {
              openChatSidebar();
            }
          }}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-95 relative ml-0.5 ${
            sidebarOpen ? 'bg-violet-600/20 text-violet-300' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
          title="Toggle Chat Sidebar (Esc)"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          {unreadCount > 0 && !sidebarOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </nav>

      {/* Backdrop overlay on mobile when chat drawer is open */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      {/* Slide-out Chat Sidebar (Desktop: right dock, Mobile: full-screen slide-in drawer) */}
      <aside className={`fixed right-0 top-0 h-full w-full sm:w-[360px] z-[60] bg-[#0A0A0A]/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600/15 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-xs">
              {partnerProfile?.name ? partnerProfile.name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">{partnerProfile?.name || 'Stranger'}</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">
                {connectionStatus === 'Connected' ? 'Live Chat Active' : connectionStatus}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/40 hover:text-white"
            title="Close Chat (Esc)"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {messages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={index} className="text-center text-[10px] text-white/25 my-2 flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/[0.04]"></div>
                  <span>{msg.text}</span>
                  <div className="flex-1 h-px bg-white/[0.04]"></div>
                </div>
              );
            }

            const isYou = msg.sender === 'you';
            return (
              <div key={index} className={`flex flex-col max-w-[85%] ${isYou ? 'self-end items-end' : 'items-start'} animate-fade-in-up opacity-0`} style={{ animationDelay: '0ms' }}>
                <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                  isYou 
                    ? 'bg-violet-600/20 text-white/90 rounded-2xl rounded-br-md border border-violet-500/20' 
                    : 'bg-white/[0.06] text-white/80 rounded-2xl rounded-bl-md border border-white/[0.04]'
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
                  <div key={delay} className="w-1 h-1 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/[0.06] bg-white/[0.01]">
          <form onSubmit={handleSendMessage} className="relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl focus-within:border-violet-500/40 transition-colors p-1">
            <button 
              type="button"
              onClick={() => setInputText(prev => prev + '👋')}
              className="p-2 text-white/30 hover:text-white/60 transition-colors focus:outline-none"
              title="Add Wave"
            >
              <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
            </button>
            
            <input 
              type="text" 
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none text-sm text-white/90 focus:ring-0 placeholder:text-white/20 py-2 px-1 focus:outline-none"
              placeholder="Type a message..."
            />
            
            <button 
              type="submit"
              className="w-8 h-8 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 flex items-center justify-center transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
