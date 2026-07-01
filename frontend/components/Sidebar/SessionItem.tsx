// C:\Users\sajja\vscode\health\frontend\components\Sidebar\SessionItem.tsx
'use client';

import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

interface Session {
  id: string;
  domain: string;
  date: string;
  title?: string;
}

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SessionItem({ session, isActive, onSelect, onDelete }: SessionItemProps) {
  const getRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'var(--bubble)',
        border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-color)',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.01)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--bubble)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#3B82F6' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <MessageSquare size={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isActive ? '#3B82F6' : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {session.title || 'New Chat'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {getRelativeTime(session.date)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          marginLeft: '6px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}