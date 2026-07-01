'use client';

import React from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Copy, 
  Volume2, 
  VolumeX, 
  Check 
} from 'lucide-react';

interface ActionButtonsProps {
  messageId: string;
  content: string;
  isDark: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  speakingId: string | null;
  onToggleSpeech: (id: string, text: string) => void;
  feedback: 'helpful' | 'unhelpful' | null;
  onFeedback: (id: string, type: 'helpful' | 'unhelpful' | null) => void;
  sharedId: string | null;
  onShare: (id: string, text: string) => void;
}

export function ActionButtons({
  messageId,
  content,
  isDark,
  copiedId,
  onCopy,
  speakingId,
  onToggleSpeech,
  feedback,
  onFeedback,
  sharedId,
  onShare
}: ActionButtonsProps) {
  const isCopied = copiedId === messageId;
  const isSpeaking = speakingId === messageId;
  const isShared = sharedId === messageId;

  // Common button styling helper
  const getBtnStyle = (isActive: boolean, activeBg: string, activeColor: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: isActive ? activeBg : 'transparent',
    border: isActive ? `1px solid ${activeColor}` : (isDark ? '1px solid #2D3748' : '1px solid #E2E8F0'),
    padding: '5px 12px',
    borderRadius: '20px',
    color: isActive ? activeColor : (isDark ? '#A0AEC0' : '#94A3B8'),
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignSelf: 'flex-start', paddingLeft: '4px' }}>
      
      {/* 👍 Helpful Button */}
      <button
        onClick={() => onFeedback(messageId, feedback === 'helpful' ? null : 'helpful')}
        style={getBtnStyle(feedback === 'helpful', 'rgba(34, 197, 94, 0.12)', '#22C55E')}
      >
        <ThumbsUp size={11} fill={feedback === 'helpful' ? '#22C55E' : 'none'} />
        <span>{feedback === 'helpful' ? 'Helpful!' : 'Helpful'}</span>
      </button>

      {/* 👎 Not Helpful Button */}
      <button
        onClick={() => onFeedback(messageId, feedback === 'unhelpful' ? null : 'unhelpful')}
        style={getBtnStyle(feedback === 'unhelpful', 'rgba(239, 68, 68, 0.12)', '#EF4444')}
      >
        <ThumbsDown size={11} fill={feedback === 'unhelpful' ? '#EF4444' : 'none'} />
        <span>{feedback === 'unhelpful' ? 'Flagged' : 'Not Helpful'}</span>
      </button>

      {/* 🔗 Share Button */}
      <button
        onClick={() => onShare(messageId, content)}
        style={getBtnStyle(isShared, 'rgba(59, 130, 246, 0.12)', '#3B82F6')}
      >
        <Share2 size={11} />
        <span>{isShared ? 'Link Copied!' : 'Share'}</span>
      </button>

      {/* 📋 Copy Button */}
      <button
        onClick={() => onCopy(messageId, content)}
        style={getBtnStyle(isCopied, 'rgba(168, 85, 247, 0.12)', '#A855F7')}
      >
        {isCopied ? <Check size={11} /> : <Copy size={11} />}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>

      {/* 🔊 Read Aloud Button */}
      <button
        onClick={() => onToggleSpeech(messageId, content)}
        style={getBtnStyle(isSpeaking, 'rgba(236, 72, 153, 0.12)', '#EC4899')}
      >
        {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
        <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
      </button>

    </div>
  );
}