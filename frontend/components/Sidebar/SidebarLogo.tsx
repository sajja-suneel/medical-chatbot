// C:\Users\sajja\vscode\health\frontend\components\Sidebar\SidebarLogo.tsx
'use client';

import React from 'react';

export function SidebarLogo() {
  return (
    <div style={{ padding: '24px 16px 16px 16px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            <path d="M11 7h2v2h2v2h-2v2h-2v-2H9V9h2V7z" fill="#FFFFFF" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            Healthcare Chatbot
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Your AI Health Assistant
          </span>
        </div>
      </div>
    </div>
  );
}