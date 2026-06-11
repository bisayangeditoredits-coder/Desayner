'use client';
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useConversations } from '@/hooks/useConversations';

/**
 * MessagesPage — the main messages wrapper.
 *
 * Manages:
 * - Which conversation is active
 * - Mobile panel switching (list vs chat)
 * - Search query state
 */
const MessagesPage = memo(function MessagesPage({ currentUserId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get('open');
  const openedFromUrl = useRef(false);

  const { conversations, loading, markRead } = useConversations(currentUserId);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery]               = useState('');
  const [showChat, setShowChat]                     = useState(false); // mobile

  const handleSelect = useCallback((conv) => {
    setActiveConversation(conv);
    setShowChat(true);
    markRead(conv.id);
  }, [markRead]);

  const handleBack = useCallback(() => {
    setShowChat(false);
    setActiveConversation(null);
  }, []);

  // Deep-link: /messages?open={conversationId}
  useEffect(() => {
    if (!openId || loading || openedFromUrl.current) return;
    const conv = conversations.find((c) => c.id === openId);
    if (conv) {
      openedFromUrl.current = true;
      handleSelect(conv);
      router.replace('/messages', { scroll: false });
    }
  }, [openId, loading, conversations, handleSelect, router]);

  return (
    <div className="messages-layout">
      {/* Left panel — conversation list */}
      <div className={`messages-left ${showChat ? 'messages-left--hidden-mobile' : ''}`}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          activeId={activeConversation?.id}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Right panel — chat window */}
      <div className={`messages-right ${!showChat ? 'messages-right--hidden-mobile' : ''}`}>
        <ChatWindow
          conversation={activeConversation}
          currentUserId={currentUserId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
});

export default MessagesPage;
