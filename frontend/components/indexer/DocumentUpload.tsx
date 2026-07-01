// frontend/components/indexer/DocumentUpload.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { IndexedFileList } from './IndexedFileList';
import { DragDropZone } from './DragDropZone';
import { StatusDisplay } from './StatusDisplay';
import { QuickActionsGrid } from './QuickActionsGrid';
import { StatsDashboard } from './StatsDashboard';

interface DocumentUploadProps {
  onClose: () => void;
  onNewChat?: () => void;
  sessionCount?: number;
  token?: string; // Accept the authorization token as a prop
}

export default function DocumentUpload({ onClose, onNewChat, sessionCount, token }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'indexing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingFiles, setExistingFiles] = useState<{ filename: string; size: number }[]>([]);
  
  const [showFileList, setShowFileList] = useState(false);
  const [localSessionCount, setLocalSessionCount] = useState(0);

  const fetchExistingFiles = async () => {
    if (!token) return; // Do not fetch if token is not loaded yet
    try {
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}` // Attach authorization token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  // Fallback to localStorage count if prop is not provided
  useEffect(() => {
    if (sessionCount !== undefined) return;

    const updateSessionCount = () => {
      const savedUser = localStorage.getItem('clinic_logged_in_user');
      let email = '';
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          email = userObj.email;
        } catch (e) {
          console.error('Error parsing logged-in user:', e);
        }
      }

      const userKey = email ? `rag_chatbot_sessions_${email}` : 'rag_chatbot_sessions';
      const stored = localStorage.getItem(userKey);
      if (stored) {
        try {
          setLocalSessionCount(JSON.parse(stored).length);
        } catch (e) {
          setLocalSessionCount(0);
        }
      } else {
        setLocalSessionCount(0);
      }
    };

    updateSessionCount();
    window.addEventListener('storage', updateSessionCount);
    window.addEventListener('app:new-chat', updateSessionCount);
    return () => {
      window.removeEventListener('storage', updateSessionCount);
      window.removeEventListener('app:new-chat', updateSessionCount);
    };
  }, [sessionCount]);

  useEffect(() => {
    fetchExistingFiles();
  }, [uploadState, token]); // Re-fetch when token is loaded or uploadState changes

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    if (!token) {
      setUploadState('error');
      setErrorMessage('Authentication token is missing. Please sign in again.');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.csv', '.xlsx', '.xls', '.txt'];
    const validFiles = files.filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (validFiles.length === 0) {
      setUploadState('error');
      setErrorMessage('Invalid file types. Please select PDF, DOCX, CSV, XLSX, XLS, or TXT.');
      return;
    }

    setUploadState('uploading'); setErrorMessage('');
    const formData = new FormData();
    validFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Attach token
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      setUploadState('indexing');
      
      setTimeout(() => {
        setUploadState('success');
        fetchExistingFiles();
      }, 3000);

    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'An error occurred during file upload');
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!token) return;
    try {
      setUploadState('uploading');
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Attach token
        }
      });
      if (response.ok) {
        setUploadState('idle');
        fetchExistingFiles();
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Error deleting file');
    }
  };

  const handleClearAll = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete all indexed documents? This cannot be undone.')) return;
    try {
      setUploadState('uploading');
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Attach token
        }
      });
      if (response.ok) {
        setUploadState('idle');
        fetchExistingFiles();
      } else {
        throw new Error('Failed to clear documents');
      }
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Error clearing documents');
    }
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      window.dispatchEvent(new CustomEvent('app:new-chat'));
    }
  };

  const activeSessionCount = sessionCount !== undefined ? sessionCount : localSessionCount;

  return (
    <div style={{ width: '320px', backgroundColor: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', zIndex: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      <SidebarHeader onClose={onClose} />
      
      <DragDropZone dragActive={dragActive} onDrag={handleDrag} onDrop={handleDrop} onChange={handleChange} />
      
      <StatusDisplay uploadState={uploadState} errorMessage={errorMessage} onReset={() => setUploadState('idle')} />

      {showFileList ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={() => setShowFileList(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: 'none', border: 'none', color: 'var(--primary)', 
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '14px',
              padding: '4px 0', alignSelf: 'flex-start'
            }}
          >
            ← Back to Dashboard
          </button>
          <IndexedFileList files={existingFiles} onDeleteFile={handleDeleteFile} onClearAll={handleClearAll} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <QuickActionsGrid onNewChat={handleNewChatClick} onViewDocuments={() => setShowFileList(true)} />
          <StatsDashboard sessionCount={activeSessionCount} documentCount={existingFiles.length} />
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}