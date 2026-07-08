// C:\Users\sajja\vscode\health\frontend\components\chat\HeaderBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Sun, Moon, CloudRain, Droplets, Thermometer, AlertTriangle } from 'lucide-react';

interface HeaderBarProps {
  theme: 'light' | 'dark';
  onThemeChange: (newTheme: 'light' | 'dark') => void;
  showIndexer: boolean;
  onToggleIndexer: () => void;
  weatherCity: string | { lat: number; lon: number } | null;
}

interface WeatherData {
  success: boolean;
  city: string;
  temp: number;
  humidity: number;
  description: string;
  health_advisory: string;
  icon: string;
  error?: string;
}

export function HeaderBar({ theme, onThemeChange, showIndexer, onToggleIndexer, weatherCity }: HeaderBarProps) {
  const isDark = theme === 'dark';
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Re-fetch weather whenever the city or coordinates change
  useEffect(() => {
    async function fetchWeather(city: string | { lat: number; lon: number }) {
      try {
        const userStr = localStorage.getItem('clinic_logged_in_user');
        const userObj = userStr ? JSON.parse(userStr) : null;
        const token = userObj?.token;
        if (!token) return;

        let url = 'http://localhost:8000/weather';
        if (typeof city === 'string') {
          url += `?city=${encodeURIComponent(city)}`;
        } else {
          url += `?lat=${city.lat}&lon=${city.lon}`;
        }

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWeather(data);
          }
        }
      } catch (err) {
        console.error("Failed to retrieve weather records: ", err);
      }
    }

    if (weatherCity) {
      fetchWeather(weatherCity);
    }
  }, [weatherCity]);

  // Compute dummy forecast steps for the SVG Graph based on current temperature
  const currentTemp = weather?.temp || 28;
  const morningTemp = Math.round(currentTemp - 3);
  const afternoonTemp = Math.round(currentTemp + 2);
  const eveningTemp = Math.round(currentTemp - 1);

  return (
    <div
      style={{
        padding: '12px 24px',
        borderBottom: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
        background: isDark 
          ? 'linear-gradient(90deg, #1F2937 0%, #111827 100%)' 
          : 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)',
        color: isDark ? '#E2E8F0' : '#1E3A8A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        position: 'relative',
        boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(30, 41, 59, 0.04)',
      }}
    >
      {/* 🩺 Left Branding Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: isDark ? '0 4px 10px rgba(0, 0, 0, 0.2)' : '0 4px 10px rgba(30, 41, 59, 0.06)',
            userSelect: 'none'
          }}
        >
          🩺
        </div>
        <div>
          <h2 style={{ 
            fontSize: '14px', 
            fontWeight: 800, 
            color: isDark ? '#FFFFFF' : '#1E3A8A', 
            margin: 0, 
            lineHeight: '1.2', 
            fontFamily: "'Outfit', sans-serif", 
            letterSpacing: '0.2px' 
          }}>
            Sri Venkateshwara Portal
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
            <span style={{ 
              fontSize: '10px', 
              color: isDark ? '#9CA3AF' : '#2563EB', 
              fontWeight: 700 
            }}>
              Active Health Assistant
            </span>
          </div>
        </div>
      </div>

      {/* 🌤️ Center Weather Health Widget with Dropdown Details */}
      {weather && (
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(30,41,59,0.05)',
              border: `1px solid ${isDark ? '#4B5563' : '#BFDBFE'}`,
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              userSelect: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '15px' }}>{weather.icon}</span>
            <span style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
              {weather.city}: {weather.temp}°C
            </span>
            <span style={{ fontSize: '10px', color: '#10B981' }}>▼ View Graph</span>
          </div>

          {/* Expanded Forecast Details and SVG Chart */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '38px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '320px',
                background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#4B5563' : '#E2E8F0'}`,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.15)',
                padding: '16px',
                zIndex: 100,
                color: isDark ? '#E5E7EB' : '#1F2937',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>{weather.city} Forecast</span>
                <span 
                  onClick={() => setShowDropdown(false)}
                  style={{ cursor: 'pointer', fontSize: '12px', color: '#9CA3AF' }}
                >
                  ✕ Close
                </span>
              </div>

              {/* 1. SVG Temperature Trend Line Graph */}
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>
                  TODAY'S TEMPERATURE TREND
                </span>
                <svg width="260" height="70" style={{ overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="20" y1="50" x2="240" y2="50" stroke={isDark ? '#374151' : '#E2E8F0'} strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Smooth Graph Path */}
                  <path
                    d={`M 20 40 Q 75 10 130 ${50 - (afternoonTemp - currentTemp) * 8} T 240 45`}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                  />

                  {/* Nodes & Data Labels */}
                  {/* Morning */}
                  <circle cx="20" cy="40" r="4" fill="#3B82F6" />
                  <text x="20" y="58" fontSize="9" textAnchor="middle" fill="#9CA3AF">Morning</text>
                  <text x="20" y="28" fontSize="10" fontWeight="bold" textAnchor="middle" fill={isDark ? '#FFF' : '#333'}>{morningTemp}°</text>

                  {/* Afternoon */}
                  <circle cx="130" cy={50 - (afternoonTemp - currentTemp) * 8} r="4" fill="#EF4444" />
                  <text x="130" y="58" fontSize="9" textAnchor="middle" fill="#9CA3AF">Noon</text>
                  <text x="130" y={40 - (afternoonTemp - currentTemp) * 8} fontSize="10" fontWeight="bold" textAnchor="middle" fill={isDark ? '#FFF' : '#333'}>{afternoonTemp}°</text>

                  {/* Evening */}
                  <circle cx="240" cy="45" r="4" fill="#10B981" />
                  <text x="240" y="58" fontSize="9" textAnchor="middle" fill="#9CA3AF">Night</text>
                  <text x="240" y="33" fontSize="10" fontWeight="bold" textAnchor="middle" fill={isDark ? '#FFF' : '#333'}>{eveningTemp}°</text>
                </svg>
              </div>

              {/* 2. Humidity Progress Bar Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF' }}>
                  <Droplets size={12} color="#3B82F6" /> Humidity
                </span>
                <span style={{ fontWeight: 700 }}>{weather.humidity}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: isDark ? '#374151' : '#E2E8F0', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${weather.humidity}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }} />
              </div>

              {/* 3. Medical Advisory Alert Box */}
              <div
                style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderLeft: '4px solid #EF4444',
                  padding: '10px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#EF4444', marginBottom: '4px' }}>
                  <AlertTriangle size={13} />
                  Medical Advisor Warning:
                </div>
                <div style={{ color: isDark ? '#D1D5DB' : '#4B5563', lineHeight: '1.4' }}>
                  {weather.health_advisory}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⚙️ Right Control Buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        
        <button 
          type="button"
          onClick={onToggleIndexer}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: showIndexer 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#FFFFFF' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s',
          }}
          title={showIndexer ? "Hide Document Indexer" : "Show Document Indexer"}
        >
          <FileText size={15} />
        </button>

        <button 
          type="button"
          onClick={() => onThemeChange('light')}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: theme === 'light' 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#E2E8F0' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s'
          }}
          title="Light Mode"
        >
          <Sun size={15} />
        </button>
        
        <button 
          type="button"
          onClick={() => onThemeChange('dark')}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: theme === 'dark' 
              ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)') 
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.06)'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: isDark ? '#FFFFFF' : '#2563EB', 
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s'
          }}
          title="Dark Mode"
        >
          <Moon size={15} />
        </button>
      </div>
    </div>
  );
}