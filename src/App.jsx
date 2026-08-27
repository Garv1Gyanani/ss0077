import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { auth, onAuthStateChanged, rtdb, ref, onValue } from './firebase';
import { getSEOPage } from './data/seoData';

// Components
import LandingPage from './components/LandingPage';
import Matchmaker from './components/Matchmaker';
import ChatRoom from './components/ChatRoom';
import AuthModal from './components/AuthModal';
import SEOPageLayout from './components/seo/SEOPageLayout';
import NotFoundPage from './components/seo/NotFoundPage';
import { trackVisitorArrival } from './utils/telemetry';

// Connect to Node.js backend
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://ss0088-production.up.railway.app';
const socket = io(SOCKET_URL, { autoConnect: true });

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'matching' | 'chat'
  const [chatMode, setChatMode] = useState('video'); // 'video' | 'text'
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  const [preferences, setPreferences] = useState({
    language: 'Any',
    region: 'Worldwide'
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // 1. Navigation handling (HTML5 History API)
  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track anonymous visitor arrival for real-time Telegram telemetry & acquisition metrics
  useEffect(() => {
    trackVisitorArrival(currentPath);
  }, [currentPath]);

  // 2. Toggle theme class on document root
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [stats, setStats] = useState({
    onlineCount: 4281,
    activeChats: 1024
  });

  const [matchDetails, setMatchDetails] = useState(null);

  // 3. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (socket.connected) {
        socket.emit('register-details', {
          profile: firebaseUser ? {
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            avatar: firebaseUser.photoURL
          } : null
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 4. Firebase RTDB listener for public stats fallback
  useEffect(() => {
    const statsRef = ref(rtdb, 'stats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setStats({
          onlineCount: val.onlineCount || 0,
          activeChats: val.activeChats || 0
        });
      }
    }, (error) => {
      console.warn("Could not read stats from Firebase RTDB:", error.message);
    });
    
    return () => unsubscribe();
  }, []);

  // 5. Socket.io listeners
  useEffect(() => {
    socket.on('stats-update', (data) => {
      setStats(data);
    });

    socket.on('match-found', (data) => {
      console.log("Match found!", data);
      setMatchDetails(data);
      setView('chat');
    });

    socket.on('disconnect', () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off('stats-update');
      socket.off('match-found');
      socket.off('disconnect');
    };
  }, []);

  // Action: Start matchmaking queue with optional preset preferences
  const startChat = (mode, customPrefs = null) => {
    const modeToUse = mode || chatMode;
    setChatMode(modeToUse);

    const activePrefs = {
      ...preferences,
      ...(customPrefs || {})
    };

    if (customPrefs) {
      setPreferences(activePrefs);
    }

    setView('matching');

    const profile = user ? {
      name: user.displayName || user.email.split('@')[0],
      avatar: user.photoURL
    } : {
      name: 'Stranger',
      avatar: null
    };

    socket.emit('join-queue', {
      chatMode: modeToUse,
      language: activePrefs.language || 'Any',
      region: activePrefs.region || 'Worldwide',
      profile: profile
    });
  };

  // Action: Cancel matchmaking
  const cancelMatch = () => {
    socket.emit('leave-queue');
    setView('landing');
  };

  // Action: Next match (skip current partner, find new one)
  const handleNext = () => {
    socket.emit('leave-room');
    setView('matching');
    setMatchDetails(null);

    const profile = user ? {
      name: user.displayName || user.email.split('@')[0],
      avatar: user.photoURL
    } : {
      name: 'Stranger',
      avatar: null
    };

    // Auto rejoin queue
    socket.emit('join-queue', {
      chatMode: chatMode,
      language: preferences.language,
      region: preferences.region,
      profile: profile
    });
  };

  // Action: End current call and go back to landing
  const handleEnd = () => {
    socket.emit('leave-room');
    setView('landing');
    setMatchDetails(null);
  };

  // Action: Update preferences (language/region)
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => {
      const nextPref = { ...prev, [key]: value };
      
      if (view === 'matching') {
        const profile = user ? {
          name: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL
        } : {
          name: 'Stranger',
          avatar: null
        };
        
        socket.emit('join-queue', {
          chatMode: chatMode,
          language: nextPref.language,
          region: nextPref.region,
          profile: profile
        });
      }

      return nextPref;
    });
  };

  // 6. View Rendering Logic
  const renderCurrentView = () => {
    // Matching Screen
    if (view === 'matching') {
      return (
        <Matchmaker 
          chatMode={chatMode} 
          stats={stats} 
          preferences={preferences}
          onPreferenceChange={handlePreferenceChange}
          onCancel={cancelMatch} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
    }

    // Active Chat Room Screen
    if (view === 'chat' && matchDetails) {
      return (
        <ChatRoom 
          chatMode={chatMode}
          socket={socket}
          partnerId={matchDetails.partnerId}
          initiator={matchDetails.initiator}
          partnerProfile={matchDetails.partnerProfile}
          onNext={handleNext}
          onEnd={handleEnd}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
    }

    // Landing Page (Root '/')
    if (currentPath === '/' || currentPath === '') {
      return (
        <LandingPage 
          user={user} 
          onStartChat={startChat} 
          onOpenAuth={() => setShowAuthModal(true)} 
          onNavigate={navigateTo}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
    }

    // Check if path matches one of the 42 SEO Blueprint pages
    const seoPageData = getSEOPage(currentPath);
    if (seoPageData) {
      return (
        <SEOPageLayout
          pageData={seoPageData}
          onStartChat={startChat}
          onNavigate={navigateTo}
          user={user}
          onOpenAuth={() => setShowAuthModal(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
    }

    // 404 Recovery Page
    return (
      <NotFoundPage 
        onNavigate={navigateTo}
        onStartChat={startChat}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  };

  return (
    <>
      {renderCurrentView()}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
