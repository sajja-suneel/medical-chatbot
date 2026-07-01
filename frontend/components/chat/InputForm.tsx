// C:\Users\sajja\vscode\health\frontend\components\chat\InputForm.tsx
'use client';

import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isDark: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function InputForm({ inputText, setInputText, isLoading, isDark, onSubmit }: InputFormProps) {
  return (
    <form onSubmit={onSubmit} style={{ 
      padding: '16px 24px', 
      borderTop: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
      background: isDark ? '#1A202C' : '#FFFFFF'
    }}>
      <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question about your knowledge base documents..."
          disabled={isLoading}
          style={{
            flex: 1, padding: '14px 50px 14px 16px', borderRadius: '10px', fontSize: '15px', outline: 'none',
            background: isDark ? '#2D3748' : '#F8FAFC',
            color: isDark ? '#E2E8F0' : '#1E293B',
            border: `1px solid ${isDark ? '#4A5568' : '#CBD5E1'}`,
            transition: 'border-color 0.2s'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputText.trim()}
          style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '8px', 
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer', opacity: !inputText.trim() ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && inputText.trim()) {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && inputText.trim()) {
              e.currentTarget.style.backgroundColor = '#3B82F6';
            }
          }}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </form>
  );
}