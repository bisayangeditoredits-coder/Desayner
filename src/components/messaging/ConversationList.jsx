'use client';
import React, { memo, useCallback } from 'react';
import UserAvatar from '@/components/UserAvatar';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/**
 * ConversationListItem — single row in the conversations list.
 * Memoized — only re-renders when its own data changes.
 */
const ConversationListItem = memo(function ConversationListItem({
  conversation,
  isActive,
  onClick,
}) {
  const { other, last_msg, last_msg_at, unread } = conversation;

  return (
    <button
      className={`conv-item ${isActive ? 'conv-item--active' : ''} ${unread > 0 ? 'conv-item--unread' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <div className="conv-item__avatar">
        <UserAvatar
          src={other?.avatar_url}
          name={other?.full_name || other?.username}
          size={40}
        />
        {unread > 0 && <span className="conv-item__badge">{unread > 9 ? '9+' : unread}</span>}
      </div>

      <div className="conv-item__body">
        <div className="conv-item__top">
          <span className="conv-item__name">
            {other?.full_name || other?.username || 'Unknown'}
          </span>
          {last_msg_at && (
            <span className="conv-item__time">{timeAgo(last_msg_at)}</span>
          )}
        </div>
        <p className="conv-item__last-msg">
          {last_msg || 'Start a conversation'}
        </p>
      </div>
    </button>
  );
});

/**
 * ConversationList — left panel.
 * Renders the list of conversations with search filtering.
 */
const ConversationList = memo(function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
}) {
  const filtered = searchQuery
    ? conversations.filter(c => {
        const name = (c.other?.full_name || c.other?.username || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
    : conversations;

  return (
    <div className="conv-list">
      <div className="conv-list__header">
        <h2 className="conv-list__title">Messages</h2>
      </div>

      {/* Search */}
      <div className="conv-list__search">
        <input
          type="search"
          className="conv-list__search-input"
          placeholder="Search conversations…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      {/* List */}
      <div className="conv-list__items" role="list">
        {loading && conversations.length === 0 ? (
          <div className="conv-list__empty">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="conv-item conv-item--skeleton" aria-hidden="true">
                <div className="conv-item__avatar-sk" />
                <div className="conv-item__body-sk" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="conv-list__empty-msg">
            {searchQuery ? 'No conversations found.' : 'No messages yet.'}
          </p>
        ) : (
          filtered.map(conv => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default ConversationList;
