// C:\Users\sajja\vscode\health\frontend\components\chat\MessageBubble.tsx
'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  isDark: boolean;
  onSuggestionClick: (text: string) => void;
}

export function MessageBubble({ msg, isDark, onSuggestionClick }: MessageBubbleProps) {
  const isUser = msg.role === 'user';
  const [showMetadata, setShowMetadata] = useState(false); // Controls inspect metadata card

  // Helper to format inline citations [1], [2] as styled superscripts
  const formatInlineCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/);
    return parts.map((part, index) => {
      if (/^\[\d+\]$/.test(part)) {
        const numIndex = parseInt(part.slice(1, -1)) - 1;
        // Lookup the matching filename for the citation tooltip
        const filename = msg.chunks && msg.chunks[numIndex] 
          ? msg.chunks[numIndex].source 
          : `Source ${numIndex + 1}`;
        
        return (
          <sup 
            key={index} 
            style={{ 
              color: '#2563EB', 
              fontWeight: 800, 
              margin: '0 2px',
              cursor: 'help',
              userSelect: 'none',
              fontSize: '10px'
            }}
            title={filename}
          >
            {part}
          </sup>
        );
      }
      return part;
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ fontWeight: 600 }}>
            {formatInlineCitations(part.slice(2, -2))}
          </strong>
        );
      }
      return <React.Fragment key={index}>{formatInlineCitations(part)}</React.Fragment>;
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
      
      {/* 👤 Sender Label */}
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
        {/* Render text with markdown logic & inline citations */}
        {formatMessageContent(msg.content)}

        {/* 📄 Sources Footnotes */}
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
            {msg.chunks.map((doc, idx) => (
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
                <span style={{ color: '#2563EB', fontWeight: 800 }}>[{idx + 1}]</span>
                <span>📄 {doc.source}</span>
                <span style={{ color: '#94A3B8', fontSize: '9.5px' }}>(Page {doc.page_no})</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom row containing Time Stamp and checkmarks */}
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
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12l5.25 5 10.75-11" />
                <path d="M8 12l5.25 5 10.75-11" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* 🔍 Search Metadata Expandable Panel (Only for Model Responses) */}
      {!isUser && msg.chunks && msg.chunks.length > 0 && (
        <div style={{ width: '100%', maxWidth: '75%', marginTop: '6px' }}>
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            style={{
              background: 'none', border: 'none', color: '#3B82F6', fontSize: '10px',
              fontWeight: 800, cursor: 'pointer', padding: '4px 2px', display: 'flex',
              alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}
          >
            <span>{showMetadata ? 'Hide' : 'Inspect'} Search Metadata</span>
            <span style={{ fontSize: '8px' }}>{showMetadata ? '▲' : '▼'}</span>
          </button>

          {showMetadata && (
            <div style={{
              marginTop: '6px',
              backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '11px', color: isDark ? '#9CA3AF' : '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Retrieved <strong>{msg.chunks.length}</strong> matching document chunk(s) via Qdrant Hybrid RRF Search.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {msg.chunks.map((chunk, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                      fontSize: '11.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      <span style={{ color: '#3B82F6' }}>Source [{idx + 1}]</span>
                      <span style={{ color: '#F59E0B' }}>RRF Score: {chunk.score}</span>
                    </div>
                    <div style={{ fontStyle: 'italic', color: isDark ? '#D1D5DB' : '#475569', marginBottom: '6px', lineHeight: '1.4', paddingLeft: '6px', borderLeft: '2px solid #E2E8F0' }}>
                      "{chunk.chunk_text.slice(0, 220)}..."
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'right', fontWeight: 500 }}>
                      File: {chunk.source} | Page: {chunk.page_no}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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