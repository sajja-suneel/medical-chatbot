'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Message, ChunkDetail } from './types';

import { HeaderBar } from './HeaderBar';
import { MessageBubble } from './MessageBubble';
import { SourceList } from './SourceList';
import { ActionButtons } from './ActionButtons';
import { InputForm } from './InputForm';
import { CitationModal } from './CitationModal';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (newTheme: 'light' | 'dark') => void;
  showIndexer: boolean;
  onToggleIndexer: () => void;
}

export default function ChatWindow({ 
  messages, isLoading, onSendMessage, theme, onThemeChange, showIndexer, onToggleIndexer 
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<ChunkDetail | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesFeedRef = useRef<HTMLDivElement>(null);

  const [feedbackState, setFeedbackState] = useState<Record<string, 'helpful' | 'unhelpful' | null>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sharedMessageId, setSharedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Scroll to bottom on updates
  useEffect(() => {
    messagesFeedRef.current?.scrollTo({ top: messagesFeedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const toggleSourceAccordion = (id: string) => {
    setExpandedSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeech = (id: string, text: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingMessageId(null);
      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShare = async (id: string, text: string) => {
    const shareData = {
      title: 'Healthcare AI Assistant Response',
      text: text,
      url: window.location.href
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const shareUrl = `${window.location.origin}/share?text=${encodeURIComponent(text)}`;
        await navigator.clipboard.writeText(shareUrl);
        setSharedMessageId(id);
        setTimeout(() => setSharedMessageId(null), 2000);
      }
    } catch (err) {
      console.error('Error sharing: ', err);
    }
  };

  const handleFeedback = (id: string, type: 'helpful' | 'unhelpful' | null) => {
    setFeedbackState(prev => ({ ...prev, [id]: prev[id] === type ? null : type }));
  };

  return (
    <div style={{ 
      flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative',
      background: isDark ? '#111827' : '#F8FAFC' 
    }}>
      <HeaderBar theme={theme} onThemeChange={onThemeChange} showIndexer={showIndexer} onToggleIndexer={onToggleIndexer} />
      
      <div ref={messagesFeedRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble msg={msg} isDark={isDark} onSuggestionClick={onSendMessage} />
            
            <SourceList 
              msg={msg} 
              isDark={isDark} 
              isExpanded={!!expandedSources[msg.id]} 
              onToggle={() => toggleSourceAccordion(msg.id)} 
              onChunkClick={setSelectedChunk} 
            />

            {msg.role === 'model' && (
              <ActionButtons 
                messageId={msg.id} 
                content={msg.content} 
                isDark={isDark} 
                copiedId={copiedMessageId} 
                onCopy={handleCopy} 
                speakingId={speakingMessageId} 
                onToggleSpeech={handleToggleSpeech} 
                feedback={feedbackState[msg.id] || null} 
                onFeedback={handleFeedback} 
                sharedId={sharedMessageId}
                onShare={handleShare}
              />
            )}
          </div>
        ))}
      </div>

      <InputForm inputText={inputText} setInputText={setInputText} isLoading={isLoading} isDark={isDark} onSubmit={handleSubmit} />
      
      {selectedChunk && <CitationModal selectedChunk={selectedChunk} isDark={isDark} onClose={() => setSelectedChunk(null)} />}
    </div>
  );
}