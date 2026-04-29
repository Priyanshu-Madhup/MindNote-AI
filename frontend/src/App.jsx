/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border-2 border-[#D4C5A9]"></div>
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
          <div className="px-6 w-full mt-auto pt-6">
            <a className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 hover:bg-[#141414] py-2 px-2 -mx-2 rounded-lg transition-all" href="#">
              <img
                alt="User profile"
                className="w-8 h-8 rounded-full border border-[#2A2A2A] object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQUerqLbS1uQTcKCYpciMI3t0I_lwOZtFGvoZHyBti7IXf2SjJEQctdTI6Yq4JwyDQQmML3FBLfHW71LThPSj2ZJzNQtlYhqqVliOiO8_JSvECbnlZQWut11IMmozFwhF1aTmSxS8yB55OvPhuzpgz_uVWXjv3ikDswNQ0oiFYDfUJ_VpbCqYM7NMfBtJZFLeRUFBqPK8l6fcjEHGCT6RFukRUf974-ou3x43nbl6MfMQ1JPD6h44P2vXb1TyTxhqS4ISUFUS2bp0"
              />
              <div className="flex flex-col">
                <span className="text-[#E5E2E1] text-[12px] leading-none">Jane Doe</span>
                <span className="text-[#CEC5B9] text-[10px] uppercase tracking-wider mt-1 border border-[#2A2A2A] px-1 rounded-sm w-fit font-medium">Pro</span>
              </div>
            </a>
          </div>
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

// --- Main App ---
export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

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

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  const anyPanelOpen = isMobile && (sidebarOpen || rightPanelOpen);

  const closeAll = () => {
    setSidebarOpen(false);
    setRightPanelOpen(false);
  };


  return (
    <div className="flex h-screen w-full bg-[#0C0C0C] text-[#E5E2E1] font-sans selection:bg-[#D4C5A9] selection:text-[#0C0C0C]">

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
        className="flex-1 flex flex-col min-w-0 h-screen relative bg-[#0C0C0C]"
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-6 sm:pt-8 px-4 sm:px-8 pb-[100px] sm:pb-[120px]">
          <WelcomeSection />
        </div>

        {/* Chat Input Bar */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl flex flex-col z-20 h-[52px] sm:h-[56px] justify-center px-3 sm:px-4">
          <div className="relative flex items-center w-full">
            <Paperclip className="text-[#6B6B6B] mr-2 sm:mr-3 flex-shrink-0" size={18} />
            <input
              className="w-full bg-transparent border-none p-0 text-[#E5E2E1] placeholder:text-[#6B6B6B] focus:ring-0 text-[13px] sm:text-[14px] font-normal outline-none"
              placeholder="Ask anything across your notebooks..."
              type="text"
            />
            <button className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] bg-[#D4C5A9] rounded-full flex items-center justify-center hover:bg-[#E2D4B9] transition-colors ml-2 sm:ml-3 flex-shrink-0">
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
