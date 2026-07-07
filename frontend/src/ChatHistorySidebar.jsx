/**
 * ChatHistorySidebar.jsx — MindNote AI
 * ======================================
 * A ChatGPT-style conversation history sidebar.
 *
 * Features:
 *  - "+ New Chat" button
 *  - List of past conversations (sorted by latest)
 *  - Click to load conversation messages
 *  - Inline rename on double-click
 *  - Delete with trash icon
 *  - Loading skeletons
 *  - Empty state
 *  - Relative timestamps
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X, MessageSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// ── Relative time helper ───────────────────────────────────────────────────
function relativeTime(dateStr) {
  const date = new Date(dateStr);
  const now   = new Date();
  const diffMs = now - date;
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay  = Math.floor(diffMs / 86400000);

  if (diffMin < 1)   return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Loading skeleton ───────────────────────────────────────────────────────
const ConvSkeleton = () => (
  <div className="flex flex-col gap-1 px-4 mb-1">
    {[80, 60, 70].map((w, i) => (
      <div key={i} className="flex items-center gap-2 px-2 py-2">
        <div className="w-3 h-3 rounded-full bg-[#2A2A2A] animate-pulse flex-shrink-0" />
        <div
          className="h-2.5 rounded bg-[#2A2A2A] animate-pulse"
          style={{ width: `${w}%` }}
        />
      </div>
    ))}
  </div>
);

// ── Single conversation item ───────────────────────────────────────────────
const ConvItem = ({ conv, isActive, onSelect, onDelete, onRename }) => {
  const [isEditing,  setIsEditing]  = useState(false);
  const [editTitle,  setEditTitle]  = useState(conv.title);
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRenameSubmit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conv.title) {
      onRename(conv.id, trimmed);
    } else {
      setEditTitle(conv.title); // revert
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setEditTitle(conv.title);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-center gap-2 mx-2 mb-0.5 rounded-lg cursor-pointer transition-all ${
        isActive
          ? 'bg-[#1C1C1C] border-l-2 border-[#D4C5A9] rounded-l-none pl-2 pr-2 py-2'
          : 'hover:bg-[#141414] px-2 py-2'
      }`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={() => !isEditing && onSelect(conv.id)}
      onDoubleClick={() => { setIsEditing(true); setShowDelete(false); }}
      title="Double-click to rename"
    >
      {/* Icon */}
      <MessageSquare
        size={13}
        className={`flex-shrink-0 ${isActive ? 'text-[#D4C5A9]' : 'text-[#4A4A4A] group-hover:text-[#6B6B6B]'}`}
      />

      {/* Title or edit input */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRenameSubmit}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-[#252525] border border-[#D4C5A9]/40 rounded px-1.5 py-0.5 text-[12px] text-[#E5E2E1] outline-none min-w-0"
        />
      ) : (
        <span
          className={`flex-1 text-[12px] truncate leading-snug ${
            isActive ? 'text-[#F0F0F0] font-medium' : 'text-[#A0A0A0] group-hover:text-[#D0D0D0]'
          }`}
        >
          {conv.title}
        </span>
      )}

      {/* Editing actions */}
      {isEditing ? (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleRenameSubmit}
            className="text-[#D4C5A9] hover:text-white transition-colors"
            title="Save"
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => { setEditTitle(conv.title); setIsEditing(false); }}
            className="text-[#6B6B6B] hover:text-white transition-colors"
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        /* Delete button — shown on hover */
        <AnimatePresence>
          {showDelete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="flex-shrink-0 text-[#4A4A4A] hover:text-red-400 transition-colors p-0.5 rounded"
              title="Delete conversation"
            >
              <Trash2 size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

// ── Main ChatHistorySidebar component ─────────────────────────────────────
export default function ChatHistorySidebar({
  currentConvId,
  onSelectConversation,
  onNewChat,
  onTitleUpdate,        // called when a title auto-generates or renames
}) {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Fetch all conversations ────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/conversations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Could not load history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Expose refresh so parent (App.jsx) can trigger after sending messages
  useEffect(() => {
    // Re-fetch whenever currentConvId changes (new conv created or switched)
    if (currentConvId) fetchConversations();
  }, [currentConvId, fetchConversations]);

  // ── Delete conversation ────────────────────────────────────────────────
  const handleDelete = async (convId) => {
    // Optimistic removal from UI
    setConversations(prev => prev.filter(c => c.id !== convId));

    // If deleting the active conversation → trigger new chat
    if (convId === currentConvId) onNewChat();

    try {
      const res = await fetch(`${BACKEND}/conversation/${convId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      // Re-fetch to restore accurate state
      fetchConversations();
    }
  };

  // ── Rename conversation ────────────────────────────────────────────────
  const handleRename = async (convId, newTitle) => {
    // Optimistic update
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, title: newTitle } : c)
    );
    if (convId === currentConvId) onTitleUpdate?.(newTitle);

    try {
      const res = await fetch(`${BACKEND}/conversation/${convId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Failed to rename:', err);
      fetchConversations(); // restore accurate state
    }
  };

  // ── Public refresh method via ref (called by App.jsx after message save) ──
  // Exposed via a custom event so App doesn't need a ref to this component
  useEffect(() => {
    const handler = (e) => {
      // Update or add the conversation in the list
      const { id, title, updated_at } = e.detail || {};
      if (id) {
        setConversations(prev => {
          const exists = prev.find(c => c.id === id);
          if (exists) {
            return [
              { ...exists, title, updated_at },
              ...prev.filter(c => c.id !== id),
            ];
          }
          // New conversation — add at top
          return [
            { id, title, updated_at, created_at: updated_at },
            ...prev,
          ];
        });
      }
    };

    window.addEventListener('mindnote:conversation-updated', handler);
    return () => window.removeEventListener('mindnote:conversation-updated', handler);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      {/* Section header */}
      <div className="flex justify-between items-center mb-2 px-6">
        <span className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-semibold">
          Chat History
        </span>
        {conversations.length > 0 && (
          <span className="text-[10px] text-[#4A4A4A]">{conversations.length}</span>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-0 chat-history-scroll">
        {loading ? (
          <ConvSkeleton />
        ) : error ? (
          <div className="px-6 py-3 text-[12px] text-red-400/70 flex items-center gap-2">
            <X size={12} />
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-6 py-6 flex flex-col items-center gap-2 text-center">
            <MessageSquare size={24} className="text-[#2A2A2A]" />
            <p className="text-[12px] text-[#4A4A4A] leading-relaxed">
              No conversations yet.
              <br />
              Start a new chat!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {conversations.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === currentConvId}
                onSelect={onSelectConversation}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
