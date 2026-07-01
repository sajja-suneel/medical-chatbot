'use client';

import React from 'react';
import { SessionItem } from './SessionItem';

interface Session {
  id: string;
  domain: string;
  date: string;
  title?: string;
}

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelectSession, onDeleteSession }: SessionListProps) {
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px 12px' }}>
      <h3
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          letterSpacing: '1.2px',
          padding: '0 4px 8px 4px',
          fontWeight: 700,
        }}
      >
        Recent Threads
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sessions.length === 0 ? (
          <div style={{ padding: '16px 8px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No previous conversations.
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelectSession(session.id)}
              onDelete={(e) => handleDeleteClick(e, session.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}