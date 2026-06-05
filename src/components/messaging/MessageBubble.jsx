'use client';
import React, { memo } from 'react';

/**
 * MessageBubble — single message.
 * Memoized to prevent re-renders when other messages update.
 */
function timeStr(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble = memo(function MessageBubble({ message, isMine, showAvatar, avatar }) {
  const isImage = !!message.image_url;

  return (
    <div className={`msg-row ${isMine ? 'msg-row--mine' : 'msg-row--theirs'}`}>
      {/* Avatar placeholder for alignment */}
      {!isMine && (
        <div className="msg-avatar">
          {showAvatar && avatar && (
            <img src={avatar} alt="" className="msg-avatar__img" loading="lazy" />
          )}
        </div>
      )}

      <div className={`msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`}>
        {isImage && (
          <img
            src={message.image_url}
            alt="Attachment"
            className="msg-bubble__img"
            loading="lazy"
            decoding="async"
          />
        )}
        {message.body && (
          <p className="msg-bubble__text">{message.body}</p>
        )}
        <span className="msg-bubble__time">
          {timeStr(message.created_at)}
          {isMine && (
            <span className="msg-bubble__seen" aria-label={message.seen ? 'Seen' : 'Sent'}>
              {message.seen ? ' ✓✓' : ' ✓'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
});

export default MessageBubble;
