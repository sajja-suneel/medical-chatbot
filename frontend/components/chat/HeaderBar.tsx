// C:\Users\sajja\vscode\health\frontend\components\chat\HeaderBar.tsx
'use client';

import React from 'react';
import { FileText, Sun, Moon } from 'lucide-react';

interface HeaderBarProps {
  theme: 'light' | 'dark';
  onThemeChange: (newTheme: 'light' | 'dark') => void;
  showIndexer: boolean;
  onToggleIndexer: () => void;
}

export function HeaderBar({ theme, onThemeChange, showIndexer, onToggleIndexer }: HeaderBarProps) {
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        padding: '12px 24px',
        borderBottom: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
        background: isDark 
          ? 'linear-gradient(90deg, #1F2937 0%, #111827 100%)' 
          : 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)',
        color: isDark ? '#E2E8F0' : '#1E3A8A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(30, 41, 59, 0.04)',
      }}
    >
      {/* 🩺 Left Branding Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: isDark ? '0 4px 10px rgba(0, 0, 0, 0.2)' : '0 4px 10px rgba(30, 41, 59, 0.06)',
            userSelect: 'none'
          }}
        >
          🤖
        </div>
        <div>
          <h2 style={{ 
            fontSize: '14px', 
            fontWeight: 800, 
            color: isDark ? '#FFFFFF' : '#1E3A8A', 
            margin: 0, 
            lineHeight: '1.2', 
            fontFamily: "'Outfit', sans-serif", 
            letterSpacing: '0.2px' 
          }}>
            Healthcare Chatbot
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
            <span style={{ 
              fontSize: '10px', 
              color: isDark ? '#9CA3AF' : '#2563EB', 
              fontWeight: 700 
            }}>
              Online & Ready
            </span>
          </div>
        </div>
      </div>

      {/* ⚙️ Right Control Buttons (Translucent Circles) */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        
        {/* Indexer Panel Toggle */}
        <button 
          type="button"
          onClick={onToggleIndexer}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: showIndexer 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#FFFFFF' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s',
          }}
          title={showIndexer ? "Hide Document Indexer" : "Show Document Indexer"}
        >
          <FileText size={15} />
        </button>

        {/* Light Mode Button */}
        <button 
          type="button"
          onClick={() => onThemeChange('light')}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: theme === 'light' 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#E2E8F0' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s'
          }}
          title="Light Mode"
        >
          <Sun size={15} />
        </button>
        
        {/* Dark Mode Button */}
        <button 
          type="button"
          onClick={() => onThemeChange('dark')}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: theme === 'dark' 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#FFFFFF' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s'
          }}
          title="Dark Mode"
        >
          <Moon size={15} />
        </button>
      </div>
    </div>
  );
}