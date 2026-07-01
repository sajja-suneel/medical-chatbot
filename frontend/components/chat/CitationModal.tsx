'use client';

import React from 'react';
import { X, FileText } from 'lucide-react';
import { ChunkDetail } from './types';

interface CitationModalProps {
  selectedChunk: ChunkDetail;
  isDark: boolean;
  onClose: () => void;
}

export function CitationModal({ selectedChunk, isDark, onClose }: CitationModalProps) {
  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
    }}>
      <div style={{ 
        background: isDark ? '#1A202C' : '#FFFFFF', 
        color: isDark ? '#E2E8F0' : '#1E293B',
        width: '100%', maxWidth: '600px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <FileText size={18} style={{ color: '#7C3AED' }} />
            <span>Source Document Fragment</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#A0AEC0' : '#64748B' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', fontSize: '14px', lineHeight: 1.6 }}>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', fontSize: '13px', color: isDark ? '#A0AEC0' : '#64748B' }}>
            <div><strong>File:</strong> {selectedChunk.source}</div>
            <div><strong>Page:</strong> {selectedChunk.page_no}</div>
            <div><strong>Relevance Score:</strong> {(selectedChunk.score * 100).toFixed(1)}%</div>
          </div>
          <div style={{ 
            padding: '14px', borderRadius: '8px', fontStyle: 'italic',
            background: isDark ? '#2D3748' : '#F8FAFC', borderLeft: '4px solid #7C3AED' 
          }}>
            "{selectedChunk.chunk_text}"
          </div>
        </div>
      </div>
    </div>
  );
}