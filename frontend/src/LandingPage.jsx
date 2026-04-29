import React, { useEffect, useRef, useState } from 'react';

// ─── Knowledge Graph ──────────────────────────────────────────────────────────
const KnowledgeGraph = () => {
  const svgRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Expanded coordinate space — nodes can roam freely
    const W = 500, H = 500;

    // Home positions pushed outward toward the edges so nodes wander far.
    // `pinned:true` → very soft centre-spring only (not hard-pinned).
    const nodeDefs = [
      { id: 'center',     hx: 250, hy: 250, r: 45, label: 'YOUR NOTES', centre: true  },
      { id: 'podcast',    hx:  80, hy:  70, r: 28, label: 'PODCAST',    centre: false },
      { id: 'quiz',       hx: 430, hy: 130, r: 28, label: 'QUIZ',       centre: false },
      { id: 'mindmap',    hx:  60, hy: 310, r: 28, label: 'MIND MAP',   centre: false },
      { id: 'summary',    hx: 420, hy: 360, r: 28, label: 'SUMMARY',    centre: false },
      { id: 'chat',       hx: 130, hy: 450, r: 28, label: 'CHAT',       centre: false },
      { id: 'flashcards', hx: 380, hy: 460, r: 28, label: 'FLASHCARDS', centre: false },
    ];

    const nodes = nodeDefs.map(d => ({ ...d, x: d.hx, y: d.hy, vx: 0, vy: 0 }));

    // Build SVG link elements once
    const linkEls = [];
    const linksContainer = svg.querySelector('#graph-links');
    nodes.filter(n => !n.centre).forEach(n => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#c9a84c');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-opacity', '0.6');
      if (n.id === 'podcast' || n.id === 'flashcards') line.setAttribute('stroke-dasharray', '5 5');
      linksContainer.appendChild(line);
      linkEls.push({ source: nodes[0], target: n, el: line });
    });

    // SVG coordinate transform — works correctly even when cursor is outside the element
    const toSVG = (cx, cy) => {
      const pt = svg.createSVGPoint();
      pt.x = cx; pt.y = cy;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const mouse = { x: null, y: null, inside: false };
    let draggedNode = null;
    let hoveredNode = null;

    // Sync DOM positions from state
    const render = () => {
      nodes.forEach(n => {
        const el = svg.querySelector(`#gnode-${n.id}`);
        if (!el) return;
        const circle = el.querySelector('circle');
        const text = el.querySelector('text');
        circle.setAttribute('cx', n.x);
        circle.setAttribute('cy', n.y);
        text.setAttribute('x', n.x);
        text.setAttribute('y', n.y + (n.centre ? 5 : 3));
      });
      linkEls.forEach(l => {
        l.el.setAttribute('x1', l.source.x); l.el.setAttribute('y1', l.source.y);
        l.el.setAttribute('x2', l.target.x); l.el.setAttribute('y2', l.target.y);
      });
    };

    const updateCursor = () => {
      svg.style.cursor = draggedNode ? 'grabbing' : hoveredNode ? 'grab' : 'default';
    };

    // Physics
    const tick = () => {
      const centre = nodes[0]; // centre node

      nodes.forEach(n => {
        if (n === draggedNode) return;

        // High damping → slow, viscous, fluid feel
        n.vx *= 0.97;
        n.vy *= 0.97;

        // Large ambient drift → nodes never stop meandering
        n.vx += (Math.random() - 0.5) * 0.18;
        n.vy += (Math.random() - 0.5) * 0.18;

        if (n.centre) {
          // Centre node: very soft spring so it wobbles within ~40px of home
          n.vx += (n.hx - n.x) * 0.006;
          n.vy += (n.hy - n.y) * 0.006;
        } else {
          // Outer nodes: extremely weak home spring — they drift far but eventually return
          n.vx += (n.hx - n.x) * 0.003;
          n.vy += (n.hy - n.y) * 0.003;

          // Very gentle pull toward centre node (keeps graph connected-ish)
          const dcx = centre.x - n.x, dcy = centre.y - n.y;
          n.vx += dcx * 0.0008;
          n.vy += dcy * 0.0008;
        }

        // Mouse interaction (only while cursor is inside the SVG viewport)
        if (mouse.inside && mouse.x !== null) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.hypot(dx, dy) || 0.001;

          if (draggedNode) {
            // When dragging → push nearby nodes away from the dragged node
            const ddx = draggedNode.x - n.x;
            const ddy = draggedNode.y - n.y;
            const dd = Math.hypot(ddx, ddy) || 0.001;
            if (dd < 90 && n !== draggedNode) {
              const push = ((90 - dd) / 90) * 0.7;
              n.vx -= (ddx / dd) * push;
              n.vy -= (ddy / dd) * push;
            }
          } else {
            // Idle hover → wide magnetic attraction toward cursor
            if (dist < 200) {
              const pull = ((200 - dist) / 200) * 0.018 * dist;
              n.vx += (dx / dist) * pull;
              n.vy += (dy / dist) * pull;
            }
          }
        }

        // Soft boundary — gentle reflection near edges instead of hard clamp
        const pad = n.r + 4;
        if (n.x < pad)      n.vx += (pad - n.x) * 0.08;
        if (n.x > W - pad)  n.vx -= (n.x - (W - pad)) * 0.08;
        if (n.y < pad)      n.vy += (pad - n.y) * 0.08;
        if (n.y > H - pad)  n.vy -= (n.y - (H - pad)) * 0.08;

        n.x += n.vx;
        n.y += n.vy;
      });

      // Dragged node follows cursor smoothly (lerp)
      if (draggedNode && mouse.x !== null) {
        draggedNode.x += (mouse.x - draggedNode.x) * 0.35;
        draggedNode.y += (mouse.y - draggedNode.y) * 0.35;
      }

      render();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    // ── Events ────────────────────────────────────────────────────────────────
    const onMouseEnter = () => { mouse.inside = true; };
    const onMouseLeave = () => {
      if (!draggedNode) { mouse.inside = false; mouse.x = null; mouse.y = null; hoveredNode = null; }
      updateCursor();
    };

    const onMove = (e) => {
      const c = toSVG(e.clientX, e.clientY);
      mouse.x = c.x; mouse.y = c.y;
      if (!draggedNode) hoveredNode = nodes.find(n => Math.hypot(n.x - c.x, n.y - c.y) < n.r) || null;
      updateCursor();
    };

    const onDown = (e) => {
      e.preventDefault();
      const c = toSVG(e.clientX, e.clientY);
      draggedNode = nodes.find(n => Math.hypot(n.x - c.x, n.y - c.y) < n.r + 6) || null;
      if (draggedNode) { draggedNode.vx = 0; draggedNode.vy = 0; }
      updateCursor();
    };

    const onUp = () => {
      if (draggedNode) {
        // Give released node a small fling velocity
        draggedNode.vx *= 0.4;
        draggedNode.vy *= 0.4;
        draggedNode = null;
      }
      hoveredNode = null;
      updateCursor();
    };

    // Touch
    const onTouchStart = (e) => {
      const t = e.touches[0];
      const c = toSVG(t.clientX, t.clientY);
      mouse.x = c.x; mouse.y = c.y; mouse.inside = true;
      draggedNode = nodes.find(n => Math.hypot(n.x - c.x, n.y - c.y) < n.r + 14) || null;
      if (draggedNode) { draggedNode.vx = 0; draggedNode.vy = 0; }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const c = toSVG(e.touches[0].clientX, e.touches[0].clientY);
      mouse.x = c.x; mouse.y = c.y;
    };
    const onTouchEnd = () => { draggedNode = null; mouse.inside = false; };

    svg.addEventListener('mouseenter', onMouseEnter);
    svg.addEventListener('mouseleave', onMouseLeave);
    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    svg.addEventListener('touchmove',  onTouchMove,  { passive: false });
    svg.addEventListener('touchend',   onTouchEnd);

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      svg.removeEventListener('mouseenter', onMouseEnter);
      svg.removeEventListener('mouseleave', onMouseLeave);
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
      while (linksContainer.firstChild) linksContainer.removeChild(linksContainer.firstChild);
    };
  }, []);

  const outerNodes = [
    { id: 'podcast',    cx:  80, cy:  70, label: 'PODCAST' },
    { id: 'quiz',       cx: 430, cy: 130, label: 'QUIZ' },
    { id: 'mindmap',    cx:  60, cy: 310, label: 'MIND MAP' },
    { id: 'summary',    cx: 420, cy: 360, label: 'SUMMARY' },
    { id: 'chat',       cx: 130, cy: 450, label: 'CHAT' },
    { id: 'flashcards', cx: 380, cy: 460, label: 'FLASHCARDS' },
  ];

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 500 500"
      className="w-full h-full select-none"
      style={{ touchAction: 'none', overflow: 'visible' }}
    >
      <g id="graph-links" />
      <g id="graph-nodes">
        {/* Central node — soft spring, can wander */}
        <g id="gnode-center">
          <circle cx="250" cy="250" r="45" fill="rgba(28,27,27,0.85)" stroke="#c9a84c" strokeWidth="1.5" />
          <text
            x="250" y="255" textAnchor="middle" fontSize="10" fontWeight="700"
            fill="#e6c364" fontFamily="Manrope, sans-serif" letterSpacing="0.1em"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            YOUR NOTES
          </text>
        </g>
        {/* Outer nodes — loose, roam freely */}
        {outerNodes.map(n => (
          <g key={n.id} id={`gnode-${n.id}`}>
            <circle
              cx={n.cx} cy={n.cy} r="28"
              fill="rgba(28,27,27,0.9)" stroke="#333"
              onMouseEnter={e => { e.currentTarget.setAttribute('stroke', '#c9a84c'); e.currentTarget.setAttribute('r', '30'); }}
              onMouseLeave={e => { e.currentTarget.setAttribute('stroke', '#333'); e.currentTarget.setAttribute('r', '28'); }}
            />
            <text
              x={n.cx} y={n.cy + 3} textAnchor="middle" fontSize="8" fontWeight="700"
              fill="#e5e2e1" fontFamily="Manrope, sans-serif" letterSpacing="0.1em"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};



// ─── Feature Item ─────────────────────────────────────────────────────────────
const FeatureItem = ({ icon, title, desc }) => (
  <div className="border-r border-b border-[#222] p-8 hover:bg-[#1c1b1b] transition-colors group cursor-default">
    <span className="material-symbols-outlined text-[#e6c364] mb-4 block" style={{ fontSize: '36px' }}>
      {icon}
    </span>
    <h3
      className="text-2xl font-semibold mb-2 group-hover:text-[#e6c364] transition-colors leading-tight"
      style={{ fontFamily: 'Epilogue, sans-serif' }}
    >
      {title}
    </h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
  </div>
);


// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: 'podcasts',      title: 'Audio Podcast',    desc: 'Convert complex papers into digestible audio discussions.' },
    { icon: 'movie',         title: 'Visual Podcast',   desc: 'Synchronized visuals mapped to AI-generated narration.' },
    { icon: 'account_tree',  title: 'Mind Maps',        desc: 'Non-linear visual structures of your internal knowledge.' },
    { icon: 'video_library', title: 'Video Summaries',  desc: 'Extract core concepts from hours of footage in minutes.' },
    { icon: 'chat_bubble',   title: 'AI Chat',          desc: 'Question your documents with a RAG-powered interface.' },
    { icon: 'style',         title: 'Flashcards',       desc: 'Automated Spaced Repetition for long-term retention.' },
    { icon: 'quiz',          title: 'Quiz Mode',        desc: 'Adaptive testing that evolves with your mastery level.' },
    { icon: 'web',           title: 'Website Analysis', desc: 'Turn entire domains into a structured knowledge base.' },
  ];



  return (
    <div className="bg-[#0a0a0a] text-[#f0ece0] selection:bg-[#e6c364] selection:text-[#0a0a0a]">

      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 w-full z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 flex justify-between items-center px-8 h-20">
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
          {/* Login */}
          <button
            id="lp-login"
            onClick={onEnterApp}
            className="border border-zinc-700 text-zinc-300 uppercase tracking-widest text-xs font-semibold px-5 py-2.5 hover:border-zinc-400 hover:text-zinc-100 transition-all"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Log In
          </button>
          {/* Get Started */}
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
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="min-h-screen grid grid-cols-1 md:grid-cols-12 border-b border-[#222]">
          <div className="md:col-span-7 flex flex-col justify-center px-8 md:px-10 py-24 md:border-r border-[#222]">
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
                className="border border-[#222] text-[#f0ece0] uppercase tracking-[0.1em] text-[0.75rem] font-bold px-10 py-5 hover:bg-[#1c1b1b] transition-colors"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                See How It Works
              </button>
            </div>
          </div>

          <div className="md:col-span-5 relative bg-[#0a0a0a] overflow-visible min-h-[480px]">
            {/* Hairline grid */}
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Graph fills the entire pane */}
            <div className="absolute inset-0">
              <KnowledgeGraph />
            </div>
          </div>
        </section>


        {/* ── Trust Bar ───────────────────────────────────────────────────── */}
        <div className="border-b border-[#222] py-8 px-8 flex flex-col md:flex-row items-center justify-between gap-8">
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

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="features" className="py-32">
          <div className="px-8 mb-16">
            <h2
              className="text-[0.7rem] tracking-[0.1em] font-bold uppercase text-[#e6c364] mb-4"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              MULTIMODAL INTELLIGENCE
            </h2>
            <div className="flex justify-between items-end border-b border-[#222] pb-4">
              <h1
                className="text-[3rem] font-semibold leading-[1.2] tracking-[-0.02em]"
                style={{ fontFamily: 'Epilogue, sans-serif' }}
              >
                The Learning Suite
              </h1>
              <span
                className="text-zinc-500 text-[0.7rem] tracking-[0.1em] uppercase mb-1"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                [08 SYSTEM MODULES]
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#222] mx-8">
            {features.map(f => (
              <FeatureItem key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </section>

        {/* ── How It Works + Artifact Tiles ──────────────────────────────── */}
        <section id="studio" className="border-t border-[#222]">
          {/* Inject icon animation keyframes */}

          {/* ── How It Works header ── */}
          <div className="px-8 pt-16 pb-4 border-b border-[#222]">
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

          {/* ── 3 Steps ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#222]">
            {[
              {
                step: '01',
                title: 'Upload Anything',
                body: 'Drop a PDF, paste a URL, upload a lecture video, or type raw notes. MindNote AI accepts any format.',
                detail: 'PDF · URL · VIDEO · TEXT · AUDIO',
              },
              {
                step: '02',
                title: 'AI Synthesises',
                body: 'Our models read, chunk, embed and reason over your content — extracting structure, concepts and key insights.',
                detail: 'EXTRACTION · EMBEDDING · REASONING',
              },
              {
                step: '03',
                title: 'Learn Your Way',
                body: 'Receive a full suite of study artifacts — tailored to your material — ready to consume, share or export.',
                detail: 'PODCAST · MAP · QUIZ · CARDS · REPORT',
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className={`px-8 py-12 flex flex-col gap-6 ${
                  i < 2 ? 'border-b md:border-b-0 md:border-r border-[#222]' : ''
                }`}
              >
                {/* Large editorial step number */}
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

                {/* Connector arrow — only between steps */}
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-[#333] text-2xl pointer-events-none">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>


        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="py-32 bg-[#e6c364] text-[#0a0a0a] text-center">
          <h2
            className="text-[4rem] sm:text-[4.5rem] font-bold leading-[1.1] tracking-[-0.04em] mb-8"
            style={{ fontFamily: 'Epilogue, sans-serif' }}
          >
            Unlock Your Focus.
          </h2>
          <p
            className="text-[1.125rem] leading-[1.7] text-[#0a0a0a]/80 mb-16 max-w-2xl mx-auto"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Join the future of document intelligence. Stop searching through your notes and start having
            conversations with them.
          </p>
          <button
            id="lp-cta-explore"
            onClick={onEnterApp}
            className="bg-[#0a0a0a] text-[#e6c364] uppercase tracking-[0.1em] text-[0.75rem] font-bold px-24 py-6 hover:brightness-125 transition-all"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Explore MindNote AI
          </button>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 border-t border-zinc-800 w-full py-16">
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
            © 2024 MINDNOTE AI. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
