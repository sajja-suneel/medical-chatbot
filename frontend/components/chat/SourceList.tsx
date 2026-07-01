'use client';

import React from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Message, ChunkDetail } from './types';

interface SourceListProps {
  msg: Message;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChunkClick: (chunk: ChunkDetail) => void;
}

export function SourceList({ msg, isDark, isExpanded, onToggle, onChunkClick }: SourceListProps) {
  if (!msg.chunks || msg.chunks.length === 0) return null;

  return (
    <div style={{ marginLeft: '52px', marginBottom: '16px', maxWidth: '75%' }}>
      <button 
        onClick={onToggle}
        style={{ 
          background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', 
          fontSize: '13px', color: '#7C3AED', fontWeight: 600, cursor: 'pointer', padding: 0 
        }}
      >
        <FileText size={14} />
        {isExpanded ? 'Hide Supporting Sources' : `View ${msg.chunks.length} Sources`}
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div style={{ 
          marginTop: '8px', padding: '12px', borderRadius: '8px', 
          background: isDark ? '#1A202C' : '#FAFAFA', 
          border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
        }}>
          {msg.chunks.map((chunk, i) => (
            <div 
              key={i} 
              onClick={() => onChunkClick(chunk)}
              style={{ 
                padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                background: isDark ? '#2D3748' : '#FFFFFF', border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span style={{ fontWeight: 500, color: isDark ? '#E2E8F0' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                📄 {chunk.source} (Pg. {chunk.page_no})
              </span>
              <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {(chunk.score * 100).toFixed(0)}% match
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}