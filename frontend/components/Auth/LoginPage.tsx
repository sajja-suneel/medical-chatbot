// frontend/components/Auth/LoginPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Mail, User, UserPlus, Lock, ArrowRight } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail // Added for forgot password feature
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
  const [isForgotPassword, setIsForgotPassword] = useState(false); // Controls forgot password screen
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Medical Assistant');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false); // Controls email verification screen

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

  // Google Sign-In SSO integration
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      // Sync Google account profile with local MongoDB
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.displayName || 'Google User',
          email: user.email || '',
          password: '', 
          role: 'Medical Assistant' 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Google database sync failed.');

      onLogin({
        name: user.displayName || data.user.name || 'Google User',
        email: user.email || '',
        role: data.user.role || 'Medical Assistant',
        token: token
      });
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Form Submission (Login & Email Registration)
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
        // 1. Create credential entry in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set profile display name
        await updateProfile(user, { displayName: name });

        // 3. Send verification link to user's email
        await sendEmailVerification(user);

        setSuccessMsg('Verification email sent! Check your inbox to verify your email, then click "Confirm Verification" below.');
        setNeedsVerification(true); 
      } else {
        // 1. Sign in using Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Prevent unverified users from logging in (unless using Google Auth)
        if (!user.emailVerified) {
          setError('Email is not verified. Please verify your email before logging in.');
          setIsLoading(false);
          return;
        }

        // 3. Retrieve secure JWT ID Token
        const token = await user.getIdToken();

        // 4. Retrieve user profile details from local MongoDB
        const response = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Database sync failed.');

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

  // Verification Checker (Triggered after email link is clicked)
  const checkEmailVerification = async () => {
    setError('');
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload(); 
        if (user.emailVerified) {
          // Sync profile details to local MongoDB
          const response = await fetch('http://localhost:8000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: '', role }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || 'Failed to sync user profile.');

          setSuccessMsg('Account verified successfully!');
          onLogin({
            name: user.displayName || name,
            email: user.email || email,
            role: role,
            token: await user.getIdToken()
          });
        } else {
          setError('Email is not verified yet. Please check your inbox and click the verification link.');
        }
      } else {
        setError('No active user session found. Please try signing up again.');
      }
    } catch (err: any) {
      setError(err.message || 'Email verification check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
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
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('A password reset link has been sent to your email address.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
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
                  {isForgotPassword ? <Lock size={20} /> : (isSignUp ? <UserPlus size={20} /> : <Lock size={20} />)}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>
                {isForgotPassword 
                  ? 'Reset Your Password' 
                  : (needsVerification ? 'Verify Your Email' : (isSignUp ? 'Create Account' : 'Welcome Back'))}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, margin: 0 }}>
                {isForgotPassword
                  ? 'Enter your email to receive a password reset link.'
                  : (needsVerification 
                      ? 'We sent a verification link to your email. Click it to confirm.' 
                      : (isSignUp ? 'Fill in your details to create a secure portal account' : 'Enter your credentials to access your secure portal'))}
              </p>
            </div>

            <StatusAlerts error={error} successMsg={successMsg} />

            {/* Forgot Password Screen */}
            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AuthFormInput
                  label="Clinic Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="doctor@svhospital.com"
                  icon={<Mail size={16} color="#94A3B8" />}
                />

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
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', marginTop: '10px' }}
                >
                  Back to Login
                </button>
              </form>
            ) : needsVerification ? (
              /* Email Verification Screen */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <button
                  onClick={checkEmailVerification}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isLoading ? 'default' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Confirm Verification'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNeedsVerification(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  ← Go Back to Login
                </button>
              </div>
            ) : (
              /* Regular Login/Signup Screen */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                {/* Forgot Password Link (Only shown in sign-in mode) */}
                {!isSignUp && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 600, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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

                {/* Third-Party Authentication (Google Provider) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '0 10px', textTransform: 'uppercase' }}>Or Continue With</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    border: '1px solid #CBD5E1',
                    padding: '11px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  {/* Google Icon SVG */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Google Account</span>
                </button>
              </form>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INFO</span>
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
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMsg('');
                  setPassword('');
                  setNeedsVerification(false);
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