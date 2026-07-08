// frontend/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import DocumentUpload from '@/components/indexer/DocumentUpload';
import LoginPage from '@/components/Auth/LoginPage';

interface ChunkDetail {
  chunk_no: number;
  score: number;
  chunk_text: string;
  page_no: string | number;
  source: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: { page: string | number; source: string }[];
  chunks?: ChunkDetail[];
  suggestions?: string[]; 
  timestamp?: string;
}

interface UserData {
  name: string;
  email: string;
  role: string;
  token?: string;
}

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessions, setSessions] = useState<{ id: string; domain: string; date: string; title?: string }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showIndexer, setShowIndexer] = useState<boolean>(true);

  // Weather state (Accepts either City string or Lat/Lon GPS coordinates)
  const [weatherCity, setWeatherCity] = useState<string | { lat: number; lon: number } | null>(null);

  // Load Auth State, User Sessions, Theme, and GPS Geolocation on mount
  useEffect(() => {
    const loginSession = localStorage.getItem('clinic_logged_in');
    const savedUser = localStorage.getItem('clinic_logged_in_user');
    
    if (loginSession === 'true' && savedUser) {
      const userObj: UserData = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setCurrentUser(userObj);
      if (userObj.token) {
        fetchSessions(userObj.token);
      }
    }

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Geolocation API to fetch local coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWeatherCity({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation denied or failed. Defaulting to Hyderabad.", error);
          setWeatherCity("Tirupati");
        }
      );
    } else {
      setWeatherCity("Tirupati");
    }
  }, []);

  // Update HTML theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // API Call: Fetch sessions
  const fetchSessions = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:8000/sessions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) {
          selectSession(data[0].id, authToken);
        } else {
          startNewSession();
        }
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  const handleLoginSuccess = (user: UserData) => {
    localStorage.setItem('clinic_logged_in', 'true');
    localStorage.setItem('clinic_logged_in_user', JSON.stringify(user));
    setIsLoggedIn(true);
    setCurrentUser(user);
    if (user.token) {
      fetchSessions(user.token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clinic_logged_in');
    localStorage.removeItem('clinic_logged_in_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSessions([]);
    setMessages([]);
  };

  const startNewSession = () => {
    const newId = crypto.randomUUID();
    setActiveSessionId(newId);
    setMessages([{
      id: crypto.randomUUID(),
      role: 'model',
      content: "Welcome to Sri Venkateshwara Hospital.\nI can help you schedule a healthcare checkup or answer medical queries.",
    }]);
  };

  const selectSession = async (sessionId: string, customToken?: string) => {
    const token = customToken || currentUser?.token;
    if (!token) return;

    setActiveSessionId(sessionId);
    try {
      const res = await fetch(`http://localhost:8000/sessions/${sessionId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const history = await res.json();
        const mapped = history.map((msg: any) => ({
          id: crypto.randomUUID(),
          role: msg.role === 'model' ? 'model' : 'user',
          content: msg.content
        }));
        
        if (mapped.length === 0) {
          setMessages([{
            id: crypto.randomUUID(),
            role: 'model',
            content: "Welcome to Sri Venkateshwara Hospital.\nI can help you schedule a healthcare checkup or answer medical queries."
          }]);
        } else {
          setMessages(mapped);
        }
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  };

  const deleteSession = async (id: string) => {
    const token = currentUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = sessions.filter((s) => s.id !== id);
        setSessions(updated);
        if (activeSessionId === id) {
          if (updated.length > 0) {
            selectSession(updated[0].id);
          } else {
            startNewSession();
          }
        }
      }
    } catch (e) {
      console.error('Error deleting session:', e);
    }
  };

  const getCurrentFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (text: string) => {
    if (!currentUser || !currentUser.token) return;
    const token = currentUser.token;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: getCurrentFormattedTime()
    };

    const cleanedMessages = messages.map(m => ({ ...m, suggestions: undefined }));
    const updatedMessages = [...cleanedMessages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: text,
          session_id: activeSessionId,
          domain: 'medical',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Request failed (Status: ${response.status})`);
      }
      if (!response.body) throw new Error('No stream body received');

      const assistantMsgId = crypto.randomUUID();
      const initialAssistantMsg: Message = {
        id: assistantMsgId,
        role: 'model',
        content: '',
        chunks: [],
        timestamp: getCurrentFormattedTime()
      };
      
      setMessages([...updatedMessages, initialAssistantMsg]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;
      let buffer = '';
      let accumulatedContent = '';
      let accumulatedMetadata: any = null;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleaned = line.trim();
          if (!cleaned.startsWith('data: ')) continue;
          
          const dataStr = cleaned.slice(6).trim();
          if (dataStr === '[DONE]') {
            finished = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              accumulatedContent += parsed.token;
            }
            if (parsed.metadata) {
              accumulatedMetadata = parsed.metadata;
              // Reactive weather update: checks if city is returned in response
              if (parsed.metadata.weather_city) {
                setWeatherCity(parsed.metadata.weather_city);
              }
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: accumulatedContent,
                      chunks: accumulatedMetadata?.chunks || msg.chunks,
                    }
                  : msg
              )
            );
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }

      await fetchSessions(token);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: 'Error: Could not retrieve response from server.',
        timestamp: getCurrentFormattedTime()
      };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <div className="bg-mesh" />
      <div className="bg-mesh-secondary" />

      <Sidebar
        activeSessionId={activeSessionId}
        sessions={sessions}
        onSelectSession={(id) => selectSession(id)}
        onNewChat={() => startNewSession()}
        onDeleteSession={deleteSession}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        theme={theme}
        onThemeChange={setTheme}
        showIndexer={showIndexer}
        onToggleIndexer={() => setShowIndexer(!showIndexer)}
        weatherCity={weatherCity} // Prop forwarded here
      />

      {showIndexer && (
        <DocumentUpload 
          onClose={() => setShowIndexer(false)} 
          onNewChat={() => startNewSession()}
          sessionCount={sessions.length}
          token={currentUser?.token}
        />
      )}
    </main>
  );
}