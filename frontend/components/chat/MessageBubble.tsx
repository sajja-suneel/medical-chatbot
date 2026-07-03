// C:\Users\sajja\vscode\health\frontend\components\chat\MessageBubble.tsx
'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  isDark: boolean;
  onSuggestionClick: (text: string) => void;
}

export function MessageBubble({ msg, isDark, onSuggestionClick }: MessageBubbleProps) {
  const isUser = msg.role === 'user';

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.replace(/^[-*]\s+/, '');
        return (
          <li key={lineIndex} style={{ marginLeft: '20px', marginBottom: '4px', listStyleType: 'disc', fontSize: '14px', lineHeight: '1.5' }}>
            {formatBoldText(text)}
          </li>
        );
      }
      if (/^\d+\.\s+/.test(line.trim())) {
        const text = line.replace(/^\d+\.\s+/, '');
        return (
          <li key={lineIndex} style={{ marginLeft: '20px', marginBottom: '4px', listStyleType: 'decimal', fontSize: '14px', lineHeight: '1.5' }}>
            {formatBoldText(text)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={lineIndex} style={{ height: '8px' }} />;
      }
      return (
        <p key={lineIndex} style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.5' }}>
          {formatBoldText(line)}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: '20px', width: '100%' }}>
      
      {/* 👤 Sender Label (You / Assistant) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '0 4px', zIndex: 1 }}>
        {isUser ? (
          <>
            <User size={12} style={{ color: isDark ? '#A0AEC0' : '#64748B' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#E2E8F0' : '#475569' }}>You</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '13px', color: '#F59E0B' }}>✨</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>Assistant</span>
          </>
        )}
      </div>

      {/* Message Bubble Card */}
      <div
        style={{
          maxWidth: '75%',
          padding: '14px 18px',
          borderRadius: '16px',
          borderTopRightRadius: isUser ? '4px' : '16px',
          borderTopLeftRadius: isUser ? '16px' : '4px',
          background: isUser ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : (isDark ? '#1F2937' : '#FFFFFF'),
          border: isUser ? 'none' : `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
          color: isUser ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#1E293B'),
          boxShadow: isUser ? '0 4px 12px rgba(59, 130, 246, 0.12)' : '0 4px 12px rgba(15, 23, 42, 0.02)',
          zIndex: 1,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {/* Render text with markdown logic */}
        {formatMessageContent(msg.content)}

        {/* 📄 Retrieved Source Citations */}
        {!isUser && msg.chunks && msg.chunks.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px', 
            marginTop: '12px', 
            paddingTop: '10px', 
            borderTop: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 850, color: isDark ? '#9CA3AF' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sources:</span>
            {Array.from(new Set(msg.chunks.map(c => `${c.source}#Page ${c.page_no}`))).map((citation, idx) => {
              const [source, page] = citation.split('#');
              return (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: isDark ? '#2D3748' : '#F8FAFC',
                    border: `1px solid ${isDark ? '#4A5568' : '#CBD5E1'}`,
                    color: isDark ? '#E2E8F0' : '#334155',
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>📄 {source}</span>
                  <span style={{ color: '#3B82F6', fontSize: '9.5px' }}>({page})</span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Bottom row containing Time Stamp and blue double checkmarks */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          gap: '4px', 
          marginTop: '8px', 
          fontSize: '9.5px', 
          fontWeight: 500,
          color: isUser ? 'rgba(255, 255, 255, 0.75)' : (isDark ? '#9CA3AF' : '#64748B'),
          userSelect: 'none'
        }}>
          <span>
            {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
          </span>
          {isUser && (
            <span style={{ display: 'flex', alignItems: 'center', color: '#38BDF8', marginLeft: '2px' }} title="Sent & Read">
              {/* Blue Double Checkmark icon */}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12l5.25 5 10.75-11" />
                <path d="M8 12l5.25 5 10.75-11" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Suggestion Chips */}
      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {msg.suggestions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(opt)}
              style={{
                background: isDark ? '#2D3748' : '#EFF6FF',
                color: isDark ? '#93C5FD' : '#2563EB',
                border: `1px solid ${isDark ? '#4A5568' : '#BFDBFE'}`,
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}