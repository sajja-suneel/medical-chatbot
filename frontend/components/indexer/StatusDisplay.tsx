'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';

interface StatusDisplayProps {
  uploadState: 'idle' | 'uploading' | 'indexing' | 'success' | 'error';
  errorMessage: string;
  onReset: () => void;
}

export function StatusDisplay({ uploadState, errorMessage, onReset }: StatusDisplayProps) {
  if (uploadState === 'idle') return null;

  return (
    <div style={{ marginTop: '16px', flexShrink: 0 }}>
      {uploadState === 'uploading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bubble)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Loader size={13} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <div style={{ fontSize: '12px' }}>
            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Processing document change...</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Updating records</p>
          </div>
        </div>
      )}

      {uploadState === 'indexing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bubble)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Loader size={13} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <div style={{ fontSize: '12px' }}>
            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Vectorizing chunks...</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Computing Dense & SPLADE vectors</p>
          </div>
        </div>
      )}

      {uploadState === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.04)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>Indexing Complete!</span>
          </div>
          <button onClick={onReset} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', marginTop: '2px' }}>Upload more</button>
        </div>
      )}

      {uploadState === 'error' && (
        <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(239, 68, 68, 0.04)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />
          <div style={{ fontSize: '12px' }}>
            <p style={{ fontWeight: 500, color: '#EF4444' }}>Upload Error</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px', lineHeight: '1.3' }}>{errorMessage}</p>
            <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}