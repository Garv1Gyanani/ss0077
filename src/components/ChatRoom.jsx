import React, { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

export default function ChatRoom({ 
  chatMode, 
  socket, 
  partnerId, 
  initiator, 
  partnerProfile,
  onNext, 
  onEnd,
  theme,
  toggleTheme
}) {
  const [messages, setMessages] = useState([
    { text: "You are now connected with a stranger.", isSystem: true, timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const durationTimerRef = useRef(null);

  // 1. Call Duration Timer
  useEffect(() => {
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current); };
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. WebRTC Peer Connection & Media Access
  useEffect(() => {
    let active = true;

    async function initWebRTC() {
      if (chatMode !== 'video') {
        setConnectionStatus('Connected');
        return;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
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
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus('Connected');
        }
      };

      pc.oniceconnectionstatechange = updateState;
      pc.onconnectionstatechange = updateState;

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && partnerId) {
          socket.emit('signal', { to: partnerId, type: 'candidate', candidate: event.candidate });
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
        setMessages(prev => [...prev, { text: `Media error: ${err.message}. Text-only mode active.`, isSystem: true, timestamp: Date.now() }]);
        setConnectionStatus('Connected');
      }

      if (initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', { to: partnerId, type: 'offer', sdp: offer });
        } catch (err) { console.error("Error creating offer:", err); }
      }
    }

    initWebRTC();

    const handleSignal = async (data) => {
      const { from, type, sdp, candidate } = data;
      if (from !== partnerId) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { to: partnerId, type: 'answer', sdp: answer });
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } else if (type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) { console.error("Signal error:", err); }
    };

    const handleReceiveMessage = (msg) => setMessages(prev => [...prev, { text: msg.text, sender: 'stranger', timestamp: msg.timestamp }]);
    const handleTyping = (isTyping) => setIsStrangerTyping(isTyping);
    const handlePartnerLeft = () => {
      setConnectionStatus('Partner Left');
      setMessages(prev => [...prev, { text: "Stranger has disconnected. Finding next match...", isSystem: true, timestamp: Date.now() }]);
      onNext();
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
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(track => track.stop()); localStreamRef.current = null; }
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(track => track.stop()); screenStreamRef.current = null; }
    };
  }, [partnerId, initiator, chatMode, socket, onNext]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsCamOff(!t.enabled); }
    }
  };

  const toggleScreenShare = async () => {
    if (isSharing) {
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
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
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && st) sender.replaceTrack(st);
        st.onended = () => toggleScreenShare();
      } catch (err) { console.error("Screen share error:", err); }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    socket.emit('send-message', inputText);
    setMessages(prev => [...prev, { text: inputText, sender: 'you', timestamp: Date.now() }]);
    setInputText('');
    socket.emit('typing', false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    socket.emit('typing', e.target.value.length > 0);
  };

  const statusColor = connectionStatus === 'Connected' ? 'bg-emerald-400' : connectionStatus === 'Partner Left' ? 'bg-red-400' : 'bg-amber-400';
  const statusGlow = connectionStatus === 'Connected' ? 'shadow-[0_0_8px_rgba(52,211,153,0.5)]' : '';

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
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              {/* End/Exit Button */}
              <button 
                onClick={onEnd}
                className="btn-outline h-9 px-4 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1.5 text-xs font-semibold"
                title="End Conversation"
              >
                <span className="material-symbols-outlined text-[16px]">call_end</span>
                Exit
              </button>

              {/* Next/Skip Button */}
              <button 
                onClick={onNext}
                className="btn-primary h-9 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5 relative z-10"
                title="Skip to Next Match"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Next
                  <span className="material-symbols-outlined text-[16px]">skip_next</span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Work Area: Centered Chat Column */}
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
                  placeholder="Type a message to stranger..."
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

  return (
    <div className="bg-[#060606] text-white h-screen w-full flex overflow-hidden font-body-md relative selection:bg-violet-500/30 noise-overlay">

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex justify-between items-center px-5 md:px-10 py-4 pointer-events-none">
        <div className="font-bold text-lg text-white/80 tracking-tight pointer-events-auto cursor-pointer hover:text-white transition-colors" onClick={onEnd}>
          Mingzy
        </div>
        
        {/* Status Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse ${statusGlow}`}></span>
            <span className="text-[11px] text-white/60 font-medium">{connectionStatus}</span>
            <span className="w-px h-3 bg-white/10"></span>
            <span className="text-[11px] text-white/40 font-mono">{formatTime(callDuration)}</span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 border border-white/[0.06] text-white/40 hover:text-white transition-all active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className={`flex-1 flex flex-col h-full relative p-3 pb-[110px] pt-[72px] transition-all duration-300 ${sidebarOpen ? 'md:pr-[356px]' : ''}`}>
        
        {/* Video Grid */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col md:flex-row gap-3 relative h-full">
          
          {/* Local User Panel */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0E0E0E] border border-white/[0.04] flex items-center justify-center group">
            {chatMode === 'video' ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
            ) : (
              <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px] text-white/15">person</span>
                </div>
                <span className="text-[11px] text-white/20 uppercase tracking-[0.15em]">You</span>
              </div>
            )}
            
            {isCamOff && chatMode === 'video' && (
              <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-20">
                <span className="material-symbols-outlined text-3xl text-white/15 mb-2">videocam_off</span>
                <span className="text-[10px] text-white/20 uppercase tracking-wider">Camera Off</span>
              </div>
            )}
            
            <div className="absolute inset-0 border border-white/[0.04] rounded-2xl pointer-events-none z-30"></div>
            
            <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 z-30">
              <span className="text-[11px] text-white/60 font-medium">You</span>
              {isMuted && <span className="material-symbols-outlined text-[14px] text-red-400/70">mic_off</span>}
            </div>
          </div>

          {/* Remote User Panel */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0E0E0E] border border-white/[0.04] flex items-center justify-center group">
            {chatMode === 'video' && connectionStatus === 'Connected' ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 animate-breathing-glow">
                  <span className="material-symbols-outlined text-[28px] text-white/15">question_mark</span>
                </div>
                <span className="text-[11px] text-white/20 uppercase tracking-[0.15em]">{partnerProfile?.name || 'Stranger'}</span>
                {connectionStatus !== 'Connected' && (
                  <span className="text-[10px] text-violet-400/60 animate-pulse mt-2">{connectionStatus}...</span>
                )}
              </div>
            )}

            <div className="absolute inset-0 border border-white/[0.04] rounded-2xl pointer-events-none z-30"></div>
            {connectionStatus === 'Connected' && <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(139,92,246,0.03)] rounded-2xl pointer-events-none z-30"></div>}
            
            <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 z-30">
              <span className="text-[11px] text-white/60 font-medium">{partnerProfile?.name || 'Stranger'}</span>
            </div>

            <div className="absolute bottom-3 right-3 glass-panel px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-30">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
              <span className="text-[10px] text-white/40">{connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Safety Overlay */}
        <div className="absolute bottom-[118px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="glass-panel px-4 py-1.5 rounded-full text-[10px] text-white/25 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px] text-violet-400/40">shield</span>
            Stay anonymous. Don't share personal info.
          </p>
        </div>
      </main>

      {/* Bottom Control Dock */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl w-fit glass-panel-strong flex gap-1 p-1.5 items-center z-50 glow-white-soft">
        
        {/* Mic */}
        <button 
          onClick={toggleMute}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${isMuted ? 'bg-red-500/15 text-red-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-[20px]">{isMuted ? 'mic_off' : 'mic'}</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isMuted ? 'Unmute' : 'Mute'}
          </div>
        </button>

        {/* Camera */}
        <button 
          onClick={toggleCam}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${isCamOff ? 'bg-red-500/15 text-red-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-[20px]">{isCamOff ? 'videocam_off' : 'videocam'}</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isCamOff ? 'Camera On' : 'Camera Off'}
          </div>
        </button>

        <div className="w-px h-6 bg-white/[0.06] mx-1"></div>

        {/* Screen Share */}
        <button 
          onClick={toggleScreenShare}
          className={`rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-90 group relative ${isSharing ? 'bg-violet-500/15 text-violet-300' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-[20px]">present_to_all</span>
          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity glass-panel text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
            {isSharing ? 'Stop Share' : 'Share Screen'}
          </div>
        </button>

        {/* End Call */}
        <button 
          onClick={onEnd}
          className="rounded-xl w-11 h-11 flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all active:scale-90 border border-red-500/10"
        >
          <span className="material-symbols-outlined text-[20px]">call_end</span>
        </button>

        <div className="w-px h-6 bg-white/[0.06] mx-1"></div>

        {/* Next Button */}
        <button 
          onClick={onNext}
          className="btn-primary rounded-xl px-6 py-2.5 flex items-center justify-center text-[11px] uppercase tracking-[0.1em] font-semibold relative z-10 gap-1.5"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            Next
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </span>
        </button>

        {/* Chat Toggle (Mobile) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden rounded-xl w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95 ml-1"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </button>
      </nav>

      {/* Side Chat Panel */}
      <aside className={`fixed right-0 top-0 h-full w-[344px] z-[60] bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/[0.04] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} hidden md:flex`}>
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/[0.04] flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Live Chat</h2>
            <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-[0.15em]">
              {connectionStatus === 'Connected' ? 'Session active' : connectionStatus}
            </p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/30 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {messages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={index} className="text-center text-[10px] text-white/20 my-3 flex items-center gap-2">
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
                    ? 'bg-violet-600/15 text-white/80 rounded-2xl rounded-br-md border border-violet-500/10' 
                    : 'bg-white/[0.04] text-white/70 rounded-2xl rounded-bl-md border border-white/[0.04]'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-white/15 mt-1 mx-1">
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

        {/* Message Input */}
        <div className="p-4 border-t border-white/[0.04]">
          <form onSubmit={handleSendMessage} className="relative flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl focus-within:border-violet-500/30 transition-colors">
            <button 
              type="button"
              onClick={() => setInputText(prev => prev + '👋')}
              className="p-2.5 text-white/25 hover:text-white/50 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
            </button>
            
            <input 
              type="text" 
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none text-sm text-white/80 focus:ring-0 placeholder:text-white/15 py-2.5 px-1 focus:outline-none"
              placeholder="Type a message..."
            />
            
            <button 
              type="submit"
              className="p-2.5 text-violet-400/60 hover:text-violet-300 transition-colors mr-0.5 focus:outline-none"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
