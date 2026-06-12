/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './LandingPage';
import { useUser, UserButton, useAuth } from '@clerk/react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Search,
  Menu,
  Paperclip,
  ArrowUp,
  Headphones,
  Airplay,
  GraduationCap,
  GitBranch,
  Layers,
  Mic,
  Map,
  HelpCircle,
  Globe,
  MessageSquare,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOBILE_BP = 768;

// --- Helpers ---
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// --- Icons ---
const NotebookIcon = ({ filled = false, className = '' }) => (
  <BookOpen className={`${className} ${filled ? 'fill-current' : ''}`} size={14} />
);

// --- Sidebar Profile (real Clerk user) ---
const SidebarProfile = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    // Skeleton while Clerk initialises
    return (
      <div className="px-6 w-full mt-auto pt-6 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] animate-pulse flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-2.5 w-24 bg-[#1C1C1C] rounded animate-pulse" />
            <div className="h-2 w-32 bg-[#1C1C1C] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.firstName || 'User';
  const email       = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <div className="px-4 w-full mt-auto pt-4 border-t border-[#2A2A2A]">
      <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#141414] transition-all group cursor-pointer">
        {/* Clerk UserButton — avatar + account/sign-out menu on click */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 ring-1 ring-[#2A2A2A] group-hover:ring-[#D4C5A9] transition-all',
            },
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[#E5E2E1] text-[13px] leading-none font-medium truncate">
            {displayName}
          </span>
          {email && (
            <span className="text-[#6B6B6B] text-[11px] mt-1 truncate" title={email}>
              {email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sidebar ---
const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const notebooks = [
    { id: '1', title: 'Neural Architecture Search', sourcesCount: 3, notesCount: 12, lastEdited: '2d ago', tags: ['AI/ML', 'Draft'], active: true },
    { id: '2', title: 'Philosophy of Mind', sourcesCount: 8, notesCount: 45, lastEdited: '5d ago', tags: ['Cognitive Science'] },
    { id: '3', title: 'Q3 Market Analysis', sourcesCount: 12, notesCount: 8, lastEdited: '1w ago', tags: ['Finance', 'Review'] },
    { id: '4', title: 'Climate Policy Tech', sourcesCount: 5, notesCount: 22, lastEdited: '2w ago', tags: ['Research'] },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="sidebar"
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 flex flex-col justify-between py-8 w-[280px] h-screen border-r border-[#2A2A2A] bg-[#0C0C0C] z-[30] font-sans text-sm font-medium tracking-tight overflow-y-auto"
        >
          <div className="flex flex-col w-full">
            {/* Brand + Close on mobile */}
            <div className="px-6 mb-6 flex items-center justify-between text-xl font-bold tracking-tighter text-neutral-100 pb-5 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2.5">
                <img
                  src="/MindNote.png"
                  alt="MindNote AI logo"
                  className="w-6 h-6 object-contain drop-shadow-sm"
                />
                MindNote AI
              </div>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="text-[#6B6B6B] hover:text-[#F0F0F0] transition-colors p-1"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* New Notebook Button */}
            <div className="px-4 mb-4">
              <button className="flex items-center justify-center gap-2 w-full bg-[#D4C5A9] hover:bg-[#E2D4B9] text-[#0C0C0C] font-semibold rounded-lg py-2.5 text-[13px] transition-colors shadow-sm">
                <Plus size={16} strokeWidth={2.5} />
                New Notebook
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col w-full px-4">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-semibold">NOTEBOOKS</span>
              </div>

              {notebooks.map((nb) => (
                <div key={nb.id} className="flex flex-col w-full mb-1">
                  <div
                    className={`flex items-center gap-2 pl-2 pr-3 h-[36px] rounded-md cursor-pointer transition-colors ${
                      nb.active
                        ? 'border-l-2 border-[#D4C5A9] bg-[#1C1C1C] text-[#F0F0F0] rounded-l-none'
                        : 'text-[#A0A0A0] hover:text-[#F0F0F0] hover:bg-[#141414]'
                    }`}
                  >
                    {nb.active
                      ? <ChevronDown size={14} className="text-[#6B6B6B]" />
                      : <ChevronRight size={14} className="text-[#6B6B6B] -ml-1" />}
                    <NotebookIcon filled={nb.active} className={nb.active ? 'text-[#F0F0F0]' : 'text-[#A0A0A0]'} />
                    <span className="text-[13px] truncate">{nb.title}</span>
                  </div>

                  {nb.active && (
                    <div className="flex items-center gap-2 pl-9 py-2 cursor-pointer hover:bg-[#141414] rounded-md transition-colors mt-1">
                      <Paperclip size={12} className="text-[#6B6B6B]" />
                      <span className="text-[12px] text-[#6B6B6B] italic">Add PDF / Source</span>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer Profile */}
          <SidebarProfile />
        </motion.aside>
      )}
    </AnimatePresence>
  );
};


// --- Welcome Feature Card ---
const FeatureCard = ({ icon: Icon, label, desc }) => (
  <button className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 flex flex-col items-start gap-3 hover:bg-[#1C1C1C] hover:border-[#D4C5A9]/30 transition-all group text-left">
    <Icon size={22} className="text-[#D4C5A9] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
    <div>
      <p className="text-[13px] font-medium text-[#E5E2E1]">{label}</p>
      <p className="text-[12px] text-[#6B6B6B] mt-0.5 leading-snug">{desc}</p>
    </div>
  </button>
);

// --- Right Panel ---
const RightPanel = ({ isOpen, onClose, isMobile }) => {
  const tools = [
    { label: 'Audio Overview', icon: Headphones },
    { label: 'Slide Deck', icon: Airplay },
    { label: 'Mind Map', icon: GitBranch },
    { label: 'Flashcards', icon: Layers },
    { label: 'Quiz', icon: GraduationCap },
    { label: 'Report', icon: FileText },
  ];

  const recentOutputs = [
    { id: '1', title: 'Neural Arch Podcast', time: '2 hours ago • Audio', icon: Headphones },
    { id: '2', title: 'Q3 Executive Summary', time: 'Yesterday • Report', icon: FileText },
    { id: '3', title: 'Philosophy Concept Map', time: 'Oct 24 • Mind Map', icon: GitBranch },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="right-panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-[300px] sm:w-[320px] h-screen border-l border-[#2A2A2A] bg-[#0C0C0C] z-[30] flex flex-col overflow-y-auto"
        >
          {/* Studio Header */}
          <div className="p-6 pb-2 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-medium text-[#CEC5B9] tracking-widest uppercase">Studio</h2>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="text-[#6B6B6B] hover:text-[#F0F0F0] transition-colors p-1"
                  aria-label="Close studio panel"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-2 flex flex-col items-center justify-center gap-2 hover:bg-[#1C1C1C] hover:border-[#D4C5A9] transition-all aspect-square group"
                >
                  <tool.icon className="text-[#CEC5B9] group-hover:text-[#D4C5A9] stroke-1" size={24} />
                  <span className="text-[12px] text-[#E5E2E1] text-center leading-tight">
                    {tool.label.split(' ').map((word, i) => (
                      <React.Fragment key={i}>
                        {word}
                        {i === 0 && tool.label.includes(' ') && <br />}
                      </React.Fragment>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1">
            <h2 className="text-[11px] font-medium text-[#CEC5B9] tracking-widest uppercase mb-4">Recent Outputs</h2>
            <div className="flex flex-col">
              {recentOutputs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 py-3 border-b border-[#2A2A2A] hover:bg-[#141414] -mx-6 px-6 cursor-pointer transition-colors"
                >
                  <item.icon className="text-[#CEC5B9] mt-0.5" size={18} />
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#E5E2E1] font-medium">{item.title}</span>
                    <span className="text-[11px] text-[#CEC5B9] mt-1">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

// --- Welcome Section ---
const WelcomeSection = () => {
  const features = [
    { icon: Mic,           label: 'Audio Podcast',   desc: 'Generate natural narration from your documents' },
    { icon: Airplay,       label: 'Visual Podcast',  desc: 'Create video presentations with slides and audio' },
    { icon: Map,           label: 'Mind Maps',       desc: 'Visualize concepts and relationships interactively' },
    { icon: FileText,      label: 'Video Summaries', desc: 'Get YouTube-style video explanations' },
    { icon: MessageSquare, label: 'AI Chat',         desc: 'Ask questions about your documents naturally' },
    { icon: Layers,        label: 'Flashcards',      desc: 'Study with AI-generated flashcards' },
    { icon: HelpCircle,    label: 'Quiz Mode',       desc: 'Test your knowledge with AI quizzes' },
    { icon: Globe,         label: 'Website Analysis',desc: 'Analyze and chat with web content' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      {/* Greeting */}
      <h2 className="text-[28px] sm:text-[36px] md:text-[42px] font-bold tracking-tight text-[#D4C5A9] mb-1">
        {getGreeting()}
      </h2>
      <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mb-6 sm:mb-8">What would you like to do?</p>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
        {features.map((f) => (
          <FeatureCard key={f.label} {...f} />
        ))}
      </div>
    </motion.div>
  );
};

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// ── Thinking indicator — bare animated text, no bubble ───────────────────
const ThinkingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-2 mb-5 pl-1"
  >
    <span
      className="text-[13px] font-medium tracking-widest uppercase"
      style={{
        background: 'linear-gradient(90deg, #D4C5A9 0%, #f0e6cc 40%, #D4C5A9 80%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shimmer 1.6s linear infinite',
      }}
    >
      Thinking
    </span>
    <span className="flex gap-[3px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-[#D4C5A9]"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  </motion.div>
);

// ── Chat bubbles ──────────────────────────────────────────────────────────
const ChatMessage = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* No avatars — AI keeps its logo only */}
      <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '75%' }}>
        {!isUser && (
          <img src="/MindNote.png" alt="AI" className="w-6 h-6 rounded-full object-contain flex-shrink-0 mb-1 opacity-80" />
        )}
        <div
          className={`px-4 py-3 text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-[#D4C5A9] text-[#0C0C0C] rounded-2xl rounded-br-sm font-medium'
              : 'bg-[#1C1C1C] border border-[#2A2A2A] text-[#E5E2E1] rounded-2xl rounded-bl-sm'
          }`}
        >
          {msg.content}
          {msg.streaming && (
            <span className="inline-block w-[2px] h-[1em] bg-[#D4C5A9] ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---
export default function App() {
  const { isLoaded, isSignedIn } = useAuth();

  // showLanding is only true when Clerk confirms user is NOT signed in
  // This prevents the 1-second flash on refresh for signed-in users
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setShowLanding(!isSignedIn);
    }
  }, [isLoaded, isSignedIn]);

  const [isMobile, setIsMobile]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // ── Chat state ──────────────────────────────────────────────────────────
  const [messages, setMessages]   = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasChat, setHasChat]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);
  // Typewriter queue — chars drip out at CHAR_DELAY ms each
  const charQueue                 = useRef([]);
  const isTyping                  = useRef(false);
  const typingTarget              = useRef(null); // index into messages
  const CHAR_DELAY                = 18; // ~15% slower than raw SSE

  // Detect mobile and set initial sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setRightPanelOpen(false);
      } else {
        setSidebarOpen(true);
        setRightPanelOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isThinking) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInputText('');
    setHasChat(true);
    setIsThinking(true);

    // Placeholder assistant bubble (will be filled by stream)
    const assistantIdx = history.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch(`${BACKEND}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Don't hide thinking yet — keep it until first char arrives
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstChar = true;

      // ── Typewriter drip engine ──────────────────────────────────────────
      const drip = (idx) => {
        if (charQueue.current.length === 0) {
          isTyping.current = false;
          return;
        }
        const char = charQueue.current.shift();
        // Hide thinking indicator on very first character
        if (firstChar) {
          firstChar = false;
          setIsThinking(false);
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], content: updated[idx].content + char };
          return updated;
        });
        setTimeout(() => drip(idx), CHAR_DELAY);
      };

      typingTarget.current = assistantIdx;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.replace(/^data:\s*/, '');
          if (!trimmed || trimmed === '[DONE]') continue;
          try {
            const { token, error } = JSON.parse(trimmed);
            if (error) throw new Error(error);
            if (token) {
              // push each character individually into the queue
              for (const ch of token) charQueue.current.push(ch);
              if (!isTyping.current) {
                isTyping.current = true;
                drip(assistantIdx);
              }
            }
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch (err) {
      setIsThinking(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIdx] = {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Make sure the backend is running on ${BACKEND}.`,
          streaming: false,
        };
        return updated;
      });
    } finally {
      // Remove streaming cursor once done
      setMessages(prev =>
        prev.map((m, i) => i === assistantIdx ? { ...m, streaming: false } : m)
      );
      inputRef.current?.focus();
    }
  }, [inputText, messages, isThinking]);

  // While Clerk is initialising — show nothing (avoids flash)
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0C0C0C]">
        <img src="/MindNote.png" alt="Loading" className="w-10 h-10 object-contain opacity-60 animate-pulse" />
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  const anyPanelOpen = isMobile && (sidebarOpen || rightPanelOpen);

  const closeAll = () => {
    setSidebarOpen(false);
    setRightPanelOpen(false);
  };


  return (
    <div className="flex h-[100dvh] w-full bg-[#0C0C0C] text-[#E5E2E1] font-sans selection:bg-[#D4C5A9] selection:text-[#0C0C0C]">

      {/* Mobile backdrop — tap to close any open panel */}
      <AnimatePresence>
        {anyPanelOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAll}
            className="fixed inset-0 bg-black/60 z-[25] md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <motion.main
        animate={{
          marginLeft: !isMobile && sidebarOpen ? '280px' : '0px',
          marginRight: !isMobile && rightPanelOpen ? '320px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 h-[100dvh] relative bg-[#0C0C0C]"
      >
        {/* Top App Bar */}
        <header className="sticky top-0 left-0 w-full flex justify-between items-center h-14 sm:h-16 px-3 sm:px-6 border-b border-[#2A2A2A] bg-[#0C0C0C] z-20">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(o => !o)}
              className="text-[#A0A0A0] hover:text-[#F0F0F0] flex items-center justify-center transition-colors p-1.5 rounded-md hover:bg-[#1C1C1C]"
              aria-label="Toggle left sidebar"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[#D4C5A9] font-medium text-[16px] sm:text-[18px] tracking-tight">Notebooks</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search — hidden on mobile, visible on sm+ */}
            <div className="relative items-center hidden sm:flex">
              <Search className="absolute left-2 text-[#6B6B6B]" size={16} />
              <input
                className="w-[180px] md:w-[260px] h-[32px] bg-[#141414] border border-[#2A2A2A] rounded-md pl-8 pr-3 text-[#E5E2E1] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#A0A0A0] transition-colors text-[13px]"
                placeholder="Search notebooks..."
                type="text"
              />
            </div>

            {/* Search icon — mobile only */}
            <button
              className="sm:hidden text-[#A0A0A0] hover:text-[#F0F0F0] flex items-center justify-center transition-colors p-1.5 rounded-md hover:bg-[#1C1C1C]"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              id="right-panel-toggle"
              onClick={() => setRightPanelOpen(o => !o)}
              className="text-[#A0A0A0] hover:text-[#F0F0F0] flex items-center justify-center transition-colors p-1.5 rounded-md hover:bg-[#1C1C1C]"
              aria-label="Toggle right panel"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content — welcome screen OR chat history */}
        <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 px-2 sm:px-4 pb-[100px] sm:pb-[120px]">
          {!hasChat ? (
            <WelcomeSection />
          ) : (
            <div className="w-full max-w-none px-2">
              {messages.map((msg, i) => {
                // Don't render empty assistant placeholder — avoids the blank bubble flicker
                if (msg.role === 'assistant' && msg.streaming && msg.content === '') return null;
                return <ChatMessage key={i} msg={msg} />;
              })}
              <AnimatePresence>
                {isThinking && <ThinkingIndicator key="thinking" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Chat Input Bar — absolute so it always sits at the bottom of the dvh container */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl flex flex-col z-20 h-[52px] sm:h-[56px] justify-center px-3 sm:px-4">
          <div className="relative flex items-center w-full">
            <Paperclip className="text-[#6B6B6B] mr-2 sm:mr-3 flex-shrink-0" size={18} />
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isThinking}
              className="w-full bg-transparent border-none p-0 text-[#E5E2E1] placeholder:text-[#6B6B6B] focus:ring-0 text-[13px] sm:text-[14px] font-normal outline-none disabled:opacity-50"
              placeholder={isThinking ? 'MindNote is thinking…' : 'Ask anything across your notebooks...'}
              type="text"
            />
            <button
              onClick={sendMessage}
              disabled={isThinking || !inputText.trim()}
              className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] bg-[#D4C5A9] rounded-full flex items-center justify-center hover:bg-[#E2D4B9] transition-colors ml-2 sm:ml-3 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUp className="text-[#0C0C0C]" size={16} />
            </button>
          </div>
        </div>
      </motion.main>

      <RightPanel
        isOpen={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
}
