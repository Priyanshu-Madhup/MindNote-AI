import React, { useEffect, useRef, useState } from 'react';
import Background3D from './Background3D';

// --- Marquee Feature Card -------------------------------------------------------
// Purely presentational - scale is applied externally by the RAF loop in MarqueeFeatures.
// Hover only changes border/background; transform is owned by the RAF.
const MarqueeCard = ({ icon, title, desc, tag }) => (
  <div
    className="marquee-card"
    style={{
      minWidth: '300px',
      maxWidth: '300px',
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '28px 24px',
      marginRight: '13px',
      cursor: 'default',
      flexShrink: 0,
      // Only animate visual properties here - transform is driven by RAF
      transition: 'border-color 0.3s ease, background 0.3s ease',
      boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      transformOrigin: 'center center',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)';
      e.currentTarget.style.background   = 'rgba(201,168,76,0.07)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      e.currentTarget.style.background   = 'rgba(255,255,255,0.03)';
    }}
  >
    {/* Category tag */}
    <span style={{
      display: 'inline-block',
      fontSize: '0.58rem',
      letterSpacing: '0.13em',
      fontWeight: 700,
      textTransform: 'uppercase',
      color: '#c9a84c',
      background: 'rgba(201,168,76,0.1)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: '4px',
      padding: '3px 8px',
      marginBottom: '20px',
      fontFamily: 'Manrope, sans-serif',
    }}>
      {tag}
    </span>

    {/* Icon */}
    <div style={{ marginBottom: '14px' }}>
      <span className="material-symbols-outlined"
        style={{ fontSize: '32px', color: '#e6c364', display: 'block' }}>
        {icon}
      </span>
    </div>

    {/* Title */}
    <h3 style={{
      fontFamily: 'Epilogue, sans-serif',
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#f0ece0',
      marginBottom: '10px',
      lineHeight: 1.3,
    }}>
      {title}
    </h3>

    {/* Description */}
    <p style={{
      fontFamily: 'Manrope, sans-serif',
      fontSize: '0.82rem',
      color: '#6b6b6b',
      lineHeight: 1.65,
    }}>
      {desc}
    </p>
  </div>
);

// --- Infinite Marquee with dynamic centre-scale ---------------------------------
const MarqueeFeatures = ({ features }) => {
  const [paused, setPaused] = useState(false);
  const containerRef = useRef(null);
  const trackRef     = useRef(null);
  const rafRef       = useRef(null);
  const pausedRef    = useRef(false);

  const doubled = [...features, ...features];

  const MIN_SCALE = 0.58;
  const MAX_SCALE = 1.06;
  const FADE_ZONE = 0.16;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const applyScales = () => {
      const container = containerRef.current;
      const track     = trackRef.current;
      if (!container || !track) { rafRef.current = requestAnimationFrame(applyScales); return; }

      const cRect   = container.getBoundingClientRect();
      const centerX = cRect.left + cRect.width / 2;
      const halfW   = cRect.width / 2;

      Array.from(track.children).forEach(card => {
        const r      = card.getBoundingClientRect();
        const cardCX = r.left + r.width / 2;
        const dist   = Math.abs(cardCX - centerX);
        const norm   = Math.min(dist / halfW, 1);

        const t     = (1 - Math.cos(Math.PI * norm)) / 2;
        const scale = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * t;

        const opacity = norm > (1 - FADE_ZONE)
          ? 1 - (norm - (1 - FADE_ZONE)) / FADE_ZONE * 0.6
          : 1;

        const glow      = 1 - t;
        const borderA   = (0.06 + glow * 0.78).toFixed(3);
        const outerBlur = Math.round(glow * 32);
        const innerBlur = Math.round(glow * 12);
        const outerSprd = Math.round(glow * 5);

        card.style.transform   = `scale(${scale.toFixed(4)})`;
        card.style.opacity     = opacity.toFixed(4);
        card.style.zIndex      = Math.round(scale * 10);
        card.style.borderColor = `rgba(201,168,76,${borderA})`;
        card.style.boxShadow   = glow > 0.08
          ? `0 0 ${outerBlur}px ${outerSprd}px rgba(201,168,76,${(glow * 0.38).toFixed(3)}),
             0 0 ${innerBlur}px rgba(201,168,76,${(glow * 0.60).toFixed(3)}),
             inset 0 1px 0 rgba(255,255,255,0.07)`
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)';
      });

      rafRef.current = requestAnimationFrame(applyScales);
    };

    rafRef.current = requestAnimationFrame(applyScales);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
        paddingTop: '32px',
        paddingBottom: '40px',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div
        ref={trackRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          animation: 'marquee-scroll 32.3s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}
      >
        {doubled.map((f, i) => (
          <MarqueeCard key={`${f.title}-${i}`} {...f} />
        ))}
      </div>
    </div>
  );
};


// --- Landing Page ---------------------------------------------------------------
export default function LandingPage({ onEnterApp }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef(0);

  const features = [
    {
      icon: 'hub',
      tag: 'RETRIEVAL',
      title: 'Dual-Pipeline RAG',
      desc: 'Combines dense vector search with sparse keyword retrieval for unmatched document comprehension accuracy.',
    },
    {
      icon: 'account_tree',
      tag: 'VISUALIZATION',
      title: 'Knowledge Graph',
      desc: 'Automatically maps concepts and relationships across your documents into a living, interactive graph.',
    },
    {
      icon: 'picture_as_pdf',
      tag: 'EXTRACTION',
      title: 'PDF Intelligence',
      desc: 'Deep semantic parsing of PDFs — tables, figures, footnotes and all — zero manual formatting required.',
    },
    {
      icon: 'manage_search',
      tag: 'SEARCH',
      title: 'Vector Search',
      desc: 'Sub-second semantic search across thousands of documents using high-dimensional embedding models.',
    },
    {
      icon: 'podcasts',
      tag: 'AUDIO',
      title: 'Audio Podcast',
      desc: 'Transform dense research papers into engaging, conversational audio you can learn from anywhere.',
    },
    {
      icon: 'chat_bubble',
      tag: 'DIALOGUE',
      title: 'AI Chat',
      desc: 'Hold natural-language conversations with your entire knowledge base, grounded in your own documents.',
    },
    {
      icon: 'style',
      tag: 'RETENTION',
      title: 'Smart Flashcards',
      desc: 'AI-generated spaced repetition cards that adapt difficulty to your personal mastery curve.',
    },
    {
      icon: 'quiz',
      tag: 'ASSESSMENT',
      title: 'Adaptive Quiz',
      desc: 'Dynamic question generation that evolves with your progress, exposing gaps before exam day.',
    },
  ];



  return (
    <>
    {/* Fixed 3D background canvas */}
    <Background3D scrollRef={scrollRef} />

    <div className="text-[#f0ece0] selection:bg-[#e6c364] selection:text-[#0a0a0a]" style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>

      {/* Top Nav */}
      <header className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-zinc-800/50 flex justify-between items-center px-8 h-20" style={{ background: 'rgba(10,10,10,0.6)' }}>
        <button
          className="text-xl font-black tracking-tighter text-zinc-100 cursor-pointer"
          style={{ fontFamily: 'Epilogue, sans-serif' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          MINDNOTE AI
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', id: 'features' },
            { label: 'Studio',   id: 'studio'   },
          ].map(({ label, id }, i) => (
            <button
              key={label}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily: 'Epilogue, sans-serif' }}
              className={`uppercase tracking-widest text-xs font-semibold transition-all duration-200 ${
                i === 0
                  ? 'text-[#e6c364] border-b border-[#e6c364] pb-0.5'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            id="lp-login"
            onClick={onEnterApp}
            className="border border-zinc-700 text-zinc-300 uppercase tracking-widest text-xs font-semibold px-5 py-2.5 hover:border-zinc-400 hover:text-zinc-100 transition-all"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Log In
          </button>
          <button
            id="lp-get-started-nav"
            onClick={onEnterApp}
            className="bg-[#c9a84c] text-[#503d00] uppercase tracking-widest text-xs font-semibold px-5 py-2.5 hover:brightness-110 active:opacity-80 transition-all"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Get Started
          </button>
          <button
            className="md:hidden text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-zinc-950/95 border-b border-zinc-800 flex flex-col py-4 px-8 gap-1">
          {[
            { label: 'Features', id: 'features' },
            { label: 'Studio',   id: 'studio'   },
          ].map(({ label, id }) => (
            <button
              key={label}
              onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="uppercase tracking-widest text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors py-3 text-left"
              style={{ fontFamily: 'Epilogue, sans-serif' }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { onEnterApp(); setMobileMenuOpen(false); }}
            className="uppercase tracking-widest text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors py-3 text-left"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Log In
          </button>
        </div>
      )}

      <main>
        {/* Hero */}
        <section className="min-h-screen flex items-center" style={{ background: 'transparent' }}>
          <div className="px-8 md:px-16 py-24 max-w-2xl">
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 border border-[#e6c364] text-[#e6c364] text-[0.7rem] tracking-[0.1em] font-bold uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                V2.0 NOW LIVE
              </span>
            </div>
            <h1
              className="text-[3.5rem] sm:text-[4rem] md:text-[4.5rem] leading-[1.1] font-bold tracking-[-0.04em] mb-8"
              style={{ fontFamily: 'Epilogue, sans-serif' }}
            >
              Turn Any Document Into{' '}
              <span className="text-[#e6c364] italic">Knowledge</span>
            </h1>
            <p
              className="text-[1.125rem] leading-[1.7] text-[#cac6bb] max-w-xl mb-16"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Podcasts, flashcards, mind maps, quizzes and more — all generated by AI from your notes.
              Focus on thinking, we'll handle the synthesis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="lp-hero-get-started"
                onClick={onEnterApp}
                className="bg-[#e6c364] text-[#0a0a0a] uppercase tracking-[0.1em] text-[0.75rem] font-bold px-10 py-5 hover:brightness-110 transition-all"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Get Started Free
              </button>
              <button
                id="lp-how-it-works"
                className="border border-[#333] text-[#f0ece0] uppercase tracking-[0.1em] text-[0.75rem] font-bold px-10 py-5 hover:bg-white/5 transition-colors backdrop-blur-sm"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                See How It Works
              </button>
            </div>
          </div>
        </section>


        {/* Trust Bar */}
        <div className="border-b border-white/5 py-8 px-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm" style={{ background: 'rgba(10,10,10,0.35)' }}>
          <span
            className="text-[0.7rem] tracking-[0.1em] font-bold uppercase text-zinc-500"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            TRUSTED BY 50,000+ STUDENTS AT GLOBAL INSTITUTIONS
          </span>
          <div className="flex flex-wrap justify-center gap-16 opacity-40 grayscale">
            {['STANFORD', 'HARVARD', 'MIT', 'OXFORD'].map(u => (
              <span key={u} className="font-black text-xl" style={{ fontFamily: 'Epilogue, sans-serif' }}>{u}</span>
            ))}
          </div>
        </div>

        {/* Features — Infinite Marquee */}
        <section id="features" style={{ paddingTop: '80px', paddingBottom: '80px', background: 'transparent' }}>
          <div style={{ padding: '0 32px', marginBottom: '48px' }}>
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '14px',
              }}
            >
              MULTIMODAL INTELLIGENCE
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Epilogue, sans-serif',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: '#f0ece0',
                  margin: 0,
                }}
              >
                The Full Feature Suite
              </h2>
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#444',
                  marginBottom: '4px',
                }}
              >
                [08 SYSTEM MODULES]
              </span>
            </div>

            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.72rem',
                color: '#444',
                marginTop: '14px',
                letterSpacing: '0.05em',
              }}
            >
              Hover to pause &nbsp;&middot;&nbsp; Scroll to explore
            </p>
          </div>

          <MarqueeFeatures features={features} />
        </section>

        {/* How It Works */}
        <section id="studio" className="border-t border-white/5" style={{ background: 'rgba(10,10,10,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="px-8 pt-16 pb-4 border-b border-white/5">
            <p
              className="text-[0.7rem] tracking-[0.1em] font-bold uppercase text-[#e6c364] mb-3"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              HOW IT WORKS
            </p>
            <h2
              className="text-[2.5rem] md:text-[3rem] font-bold leading-[1.15] tracking-[-0.03em] max-w-lg"
              style={{ fontFamily: 'Epilogue, sans-serif' }}
            >
              Three steps to cognitive clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5">
            {[
              {
                step: '01',
                title: 'Upload Anything',
                body: 'Drop a PDF, paste a URL, upload a lecture video, or type raw notes. MindNote AI accepts any format.',
                detail: 'PDF \u00b7 URL \u00b7 VIDEO \u00b7 TEXT \u00b7 AUDIO',
              },
              {
                step: '02',
                title: 'AI Synthesises',
                body: 'Our models read, chunk, embed and reason over your content \u2014 extracting structure, concepts and key insights.',
                detail: 'EXTRACTION \u00b7 EMBEDDING \u00b7 REASONING',
              },
              {
                step: '03',
                title: 'Learn Your Way',
                body: 'Receive a full suite of study artifacts \u2014 tailored to your material \u2014 ready to consume, share or export.',
                detail: 'PODCAST \u00b7 MAP \u00b7 QUIZ \u00b7 CARDS \u00b7 REPORT',
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className={`px-8 py-12 flex flex-col gap-6 ${
                  i < 2 ? 'border-b md:border-b-0 md:border-r border-white/5' : ''
                }`}
              >
                <span
                  className="text-[5rem] font-black leading-none tracking-tighter text-[#1a1a1a] select-none"
                  style={{ fontFamily: 'Epilogue, sans-serif' }}
                >
                  {s.step}
                </span>

                <div>
                  <h3
                    className="text-xl font-bold mb-3 text-[#f0ece0]"
                    style={{ fontFamily: 'Epilogue, sans-serif' }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-[#888] text-sm leading-relaxed mb-5"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {s.body}
                  </p>
                  <p
                    className="text-[#e6c364]/50 text-[9px] tracking-[0.15em] uppercase font-bold"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {s.detail}
                  </p>
                </div>

                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-[#333] text-2xl pointer-events-none">
                    {'\u2192'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>


        {/* CTA */}
        <section className="py-32 text-center" style={{ background: 'rgba(201,168,76,0.08)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(201,168,76,0.15)' }}>
          <h2
            className="text-[4rem] sm:text-[4.5rem] font-bold leading-[1.1] tracking-[-0.04em] mb-8 text-[#f0ece0]"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Unlock Your Focus.
          </h2>
          <p
            className="text-[1.125rem] leading-[1.7] text-[#cac6bb] mb-16 max-w-2xl mx-auto"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Join the future of document intelligence. Stop searching through your notes and start having
            conversations with them.
          </p>
          <button
            id="lp-cta-explore"
            onClick={onEnterApp}
            className="bg-[#e6c364] text-[#0a0a0a] uppercase tracking-[0.1em] text-[0.75rem] font-bold px-24 py-6 hover:brightness-110 transition-all"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Explore MindNote AI
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 w-full py-16" style={{ background: 'rgba(10,10,10,0.65)', backdropFilter: 'blur(10px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center max-w-7xl mx-auto px-8 w-full gap-6">
          <div className="text-lg font-black tracking-tighter text-zinc-100" style={{ fontFamily: 'Epilogue, sans-serif' }}>
            MINDNOTE AI
          </div>
          <div className="flex justify-center gap-8 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'Epilogue, sans-serif' }}>
            {['Privacy', 'Terms', 'Github', 'Contact'].map(l => (
              <a key={l} href="#" className="text-zinc-500 hover:text-[#e6c364] transition-colors">{l}</a>
            ))}
          </div>
          <div className="text-right text-[10px] tracking-widest uppercase text-zinc-500" style={{ fontFamily: 'Epilogue, sans-serif' }}>
            {'\u00a9'} 2024 MINDNOTE AI. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
