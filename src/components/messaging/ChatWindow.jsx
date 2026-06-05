'use client';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';

/**
 * ChatWindow — the main chat panel.
 *
 * Performance choices:
 * - Messages rendered with index-based grouping (no Date library)
 * - Scroll-to-bottom only on OWN new messages or initial load
 * - IntersectionObserver at top of list for load-more (pagination)
 * - CSS scroll-behavior: auto (NOT smooth) for old device performance
 * - TypingIndicator only rendered when isTyping === true
 */
const ChatWindow = memo(function ChatWindow({
  conversation,
  currentUserId,
  onBack,
}) {
  const { messages, loading, sending, hasMore, error, sendMessage, loadMore } = useMessages(
    conversation?.id
  );
  const { subscribe, sendTyping, stopTyping } = useTyping(conversation?.id, currentUserId);

  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);

  const listRef      = useRef(null);
  const topSentinel  = useRef(null);
  const isFirstLoad  = useRef(true);
  const prevMsgCount = useRef(0);

  const other = conversation?.other;

  // ── Subscribe to typing events ────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = subscribe((typing) => {
      setIsTyping(typing);
      // Auto-clear in case stop event is missed
      if (typing) {
        clearTimeout(typingTimer);
        const t = setTimeout(() => setIsTyping(false), 4000);
        setTypingTimer(t);
      }
    });
    return () => {
      unsub();
      clearTimeout(typingTimer);
    };
  }, [conversation?.id]);

  // ── Scroll to bottom on initial load or own message ───────
  useEffect(() => {
    if (!listRef.current) return;
    const lastMsg = messages[messages.length - 1];
    const isOwnMsg = lastMsg?.sender_id === currentUserId;

    if (isFirstLoad.current && messages.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      isFirstLoad.current = false;
    } else if (isOwnMsg && messages.length > prevMsgCount.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }

    prevMsgCount.current = messages.length;
  }, [messages, currentUserId]);

  // ── IntersectionObserver for load-more ───────────────────
  useEffect(() => {
    if (!topSentinel.current || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    obs.observe(topSentinel.current);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  // ── Send ──────────────────────────────────────────────────
  const handleSend = useCallback(async (payload) => {
    stopTyping();
    return sendMessage(payload);
  }, [sendMessage, stopTyping]);

  // ── Render ────────────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="chat-window chat-window--empty">
        <div className="chat-window__empty-state">
          <div className="chat-window__empty-icon">💬</div>
          <p className="chat-window__empty-title">Select a conversation</p>
          <p className="chat-window__empty-sub">or start a new one from someone's profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button
          className="chat-header__back"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>

        <Link href={`/profile/${other?.username}`} className="chat-header__user">
          <div className="chat-header__avatar-wrap">
            <UserAvatar
              src={other?.avatar_url}
              name={other?.full_name || other?.username}
              size={36}
            />
          </div>
          <div>
            <span className="chat-header__name">
              {other?.full_name || other?.username}
            </span>
            <span className="chat-header__handle">@{other?.username}</span>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={listRef}>
        {/* Top sentinel for pagination */}
        {hasMore && <div ref={topSentinel} className="chat-messages__sentinel" />}

        {loading && messages.length === 0 && (
          <div className="chat-messages__loading">
            <span className="chat-messages__spinner" />
          </div>
        )}

        {error && (
          <p className="chat-messages__error">{error}</p>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === currentUserId;
          const prevMsg = messages[idx - 1];
          const showAvatar = !isMine && prevMsg?.sender_id !== msg.sender_id;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              showAvatar={showAvatar}
              avatar={other?.avatar_url}
            />
          );
        })}

        {isTyping && <TypingIndicator name={other?.full_name || other?.username || 'User'} />}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        sending={sending}
        disabled={false}
      />
    </div>
  );
});

export default ChatWindow;
