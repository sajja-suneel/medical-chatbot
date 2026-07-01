// frontend/components/Auth/LoginPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Mail, User, UserPlus, Lock, ArrowRight } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { InfoPanel } from './InfoPanel';
import { StatusAlerts } from './StatusAlerts';
import { AuthFormInput } from './AuthFormInput';
import { PasswordInput } from './PasswordInput';
import { RoleSelect } from './RoleSelect';

interface UserData {
  name: string;
  email: string;
  role: string;
  token?: string;
}

interface LoginPageProps {
  onLogin: (user: UserData) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Medical Assistant');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [pwdStrength, setPwdStrength] = useState<'Weak' | 'Medium' | 'Strong'>('Weak');
  const [pwdStrengthPercentage, setPwdStrengthPercentage] = useState(25);
  const [pwdStrengthColor, setPwdStrengthColor] = useState('#EF4444');

  useEffect(() => {
    if (!password) {
      setPwdStrength('Weak');
      setPwdStrengthPercentage(25);
      setPwdStrengthColor('#EF4444');
      return;
    }
    const hasNumbers = /\d/.test(password);
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length >= 8 && hasNumbers && hasLetters && hasSpecial) {
      setPwdStrength('Strong');
      setPwdStrengthPercentage(100);
      setPwdStrengthColor('#22C55E');
    } else if (password.length >= 6 && hasNumbers && hasLetters) {
      setPwdStrength('Medium');
      setPwdStrengthPercentage(60);
      setPwdStrengthColor('#F59E0B');
    } else {
      setPwdStrength('Weak');
      setPwdStrengthPercentage(25);
      setPwdStrengthColor('#EF4444');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid clinic email address.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // 1. Create credential credentials in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set profile display name
        await updateProfile(user, { displayName: name });

        // 3. Register user profile (name, role) in local MongoDB database
        const response = await fetch('http://localhost:8000/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }), // password ignored in DB signup
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to sync profile with database.');

        setSuccessMsg('Account created successfully! Please sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        // 1. Authenticate login credentials in Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Retrieve secure JWT ID Token
        const token = await user.getIdToken();

        // 3. Retrieve user profile (name, role) details from local MongoDB
        const response = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }), // password ignored in DB login
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Syncing user profile failed.');

        // 4. Pass session profile and verified ID Token up to page.tsx
        onLogin({
          name: user.displayName || data.user.name || 'Staff User',
          email: user.email || email,
          role: data.user.role || 'Medical Assistant',
          token: token
        });
      }
    } catch (err: any) {
      setError(err.message || 'Firebase Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const DotPattern = () => (
    <svg width="60" height="40" fill="none" style={{ opacity: 0.15 }}>
      <pattern id="dot-pattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="2" fill="#475569" />
      </pattern>
      <rect width="60" height="40" fill="url(#dot-pattern)" />
    </svg>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: '#EBF4FF',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #F0F6FF 0%, #D8E7FF 100%)',
        overflowY: 'auto',
        padding: '40px 20px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="bg-mesh" style={{ opacity: 0.1 }} />
      
      <div
        style={{
          width: '980px',
          minHeight: '680px',
          display: 'flex',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(30, 41, 59, 0.18)',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        <InfoPanel isSignUp={isSignUp} />

        <div
          style={{
            width: '55%',
            padding: '44px 48px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'absolute', top: '24px', left: '24px' }}><DotPattern /></div>
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}><DotPattern /></div>

          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  {isSignUp ? <UserPlus size={20} /> : <Lock size={20} />}
                </div>
              </div>
            </div>

            <div style={{ textAlignment: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: 0 }}>
                {isSignUp ? 'Fill in your details to create a secure portal account' : 'Enter your credentials to access your secure portal'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <StatusAlerts error={error} successMsg={successMsg} />

              {isSignUp && (
                <AuthFormInput
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="John Doe"
                  icon={<User size={16} color="#94A3B8" />}
                />
              )}

              <AuthFormInput
                label="Clinic Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="doctor@svhospital.com"
                icon={<Mail size={16} color="#94A3B8" />}
              />

              <PasswordInput
                value={password}
                onChange={setPassword}
                isSignUp={isSignUp}
                strength={pwdStrength}
                percentage={pwdStrengthPercentage}
                color={pwdStrengthColor}
              />

              {isSignUp && <RoleSelect value={role} onChange={setRole} />}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isLoading ? 'default' : 'pointer',
                  transition: 'opacity 0.2s, transform 0.1s',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                }}
              >
                {isLoading ? 'Processing...' : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            <div style={{ textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccessMsg('');
                  setPassword('');
                }}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px dashed rgba(59, 130, 246, 0.18)',
                color: '#3B82F6',
                fontSize: '11.5px',
                marginTop: '24px',
              }}
            >
              <Lock size={12} strokeWidth={2.5} />
              <span style={{ fontWeight: 600 }}>Your information is encrypted and secure</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}