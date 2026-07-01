// C:\Users\sajja\vscode\health\frontend\components\indexer\DragDropZone.tsx
'use client';

import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface DragDropZoneProps {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DragDropZone({ dragActive, onDrag, onDrop, onChange }: DragDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={onDrag} onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        height: '160px',
        border: dragActive ? '2.5px dashed #3B82F6' : '2px dashed rgba(59, 130, 246, 0.25)',
        borderRadius: '16px',
        backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.01)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease-in-out', flexShrink: 0
      }}
      onMouseEnter={(e) => { 
        if (!dragActive) { 
          e.currentTarget.style.borderColor = '#3B82F6'; 
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.03)'; 
        } 
      }}
      onMouseLeave={(e) => { 
        if (!dragActive) { 
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)'; 
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.01)'; 
        } 
      }}
    >
      <input type="file" ref={fileInputRef} onChange={onChange} multiple accept=".pdf,.docx,.csv,.xlsx,.xls,.txt" style={{ display: 'none' }} />
      <UploadCloud size={28} style={{ color: '#3B82F6', marginBottom: '8px', opacity: 0.9 }} />
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Drag & drop files here</span>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>or click to browse</span>
      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>Supports PDF, DOCX, CSV, TXT</span>
    </div>
  );
}