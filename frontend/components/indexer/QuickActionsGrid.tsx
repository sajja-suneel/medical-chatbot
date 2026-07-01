'use client';

import React from 'react';
import { Plus, Star, Folder, Settings } from 'lucide-react';

interface QuickActionsGridProps {
  onNewChat: () => void;
  onViewDocuments: () => void;
}

export function QuickActionsGrid({ onNewChat, onViewDocuments }: QuickActionsGridProps) {
  const actionBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: 'var(--bubble)',
    border: '1px solid var(--border-color)',
    padding: '12px 14px',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '12.5px',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  };

  const iconWrapperStyle: React.CSSProperties = {
    width: '50px',
    height: '28px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    flexShrink: 0,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--primary)';
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-color)';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
        Quick Actions
      </h4>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 16px 0', fontWeight: 500 }}>
        Manage all your chats and data
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
       

        

        {/* My Documents */}
        <button
          onClick={onViewDocuments}
          style={actionBtnStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ ...iconWrapperStyle, backgroundColor: '#22C55E' }}>
            <Folder size={14} fill="#FFF" stroke="none" />
          </div>
          <span>My Documents</span>
        </button>

       
      </div>
    </div>
  );
}