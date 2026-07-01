import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Mail, Lock, User, Eye, EyeOff, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import './AuthPage.css';

const AuthPage = () => {
  const { login, register, authLoading } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Errors state
  const [errors, setErrors] = useState({});

  // Password strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'NONE', color: 'var(--text-muted)' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: 'WEAK', color: 'var(--neon-red)' };
    if (score <= 4) return { score, label: 'MEDIUM', color: 'var(--neon-orange)' };
    return { score, label: 'STRONG', color: 'var(--neon-green)' };
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please provide a valid email format.';
    }

    if (!password) {
      newErrors.password = 'Password input is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!isLogin) {
      if (!name.trim()) {
        newErrors.name = 'Full name is required.';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isLogin) {
      await login(email, password);
    } else {
      const success = await register(name, email, password);
      if (success) {
        // Clear fields and switch to login
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setIsLogin(true);
      }
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="auth-page-container fade-in">
      <div className="auth-terminal-header">
        <Terminal size={32} className="neon-text-cyan auth-brand-icon anim-pulse" />
        <h1 className="auth-brand-title">
          QUIZ<span className="neon-text-blue">AI_GEN</span>
        </h1>
        <p className="auth-subtitle">COGNITIVE DATA EXTRACTION SUITE</p>
      </div>

      <div className="glass-panel auth-card">
        {/* Cyberpunk corner brackets */}
        <div className="cyber-accent accent-top-left"></div>
        <div className="cyber-accent accent-top-right"></div>
        <div className="cyber-accent accent-bottom-left"></div>
        <div className="cyber-accent accent-bottom-right"></div>

        <div className="auth-card-header">
          <h2>{isLogin ? 'SYNC_NODE_LOGIN' : 'REGISTER_NEW_NODE'}</h2>
          <p>{isLogin ? 'Enter authorization keys to enter' : 'Integrate credentials into the system database'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field (Register only) */}
          {!isLogin && (
            <div className="cyber-input-wrapper">
              <label className="cyber-label">Full Name</label>
              <div className="input-field-container">
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                />
                <User className="input-field-icon" size={16} />
              </div>
              {errors.name && <div className="auth-error-msg"><ShieldAlert size={12} /> {errors.name}</div>}
            </div>
          )}

          {/* Email Field */}
          <div className="cyber-input-wrapper">
            <label className="cyber-label">Email Address</label>
            <div className="input-field-container">
              <input
                type="email"
                className="cyber-input"
                placeholder="node@network.domain"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
              />
              <Mail className="input-field-icon" size={16} />
            </div>
            {errors.email && <div className="auth-error-msg"><ShieldAlert size={12} /> {errors.email}</div>}
          </div>

          {/* Password Field */}
          <div className="cyber-input-wrapper">
            <label className="cyber-label">Password Key</label>
            <div className="input-field-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="cyber-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
              />
              <Lock className="input-field-icon" size={16} />
              <div className="cyber-input-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
            {errors.password && <div className="auth-error-msg"><ShieldAlert size={12} /> {errors.password}</div>}

            {/* Password strength indicator (Register only) */}
            {!isLogin && password && (
              <div className="strength-meter-wrapper">
                <div className="strength-label">
                  STRENGTH: <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
                </div>
                <div className="strength-bars">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className="strength-bar"
                      style={{
                        backgroundColor: idx <= strength.score ? strength.color : 'rgba(255,255,255,0.05)',
                        boxShadow: idx <= strength.score ? `0 0 5px ${strength.color}` : 'none'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div className="cyber-input-wrapper">
              <label className="cyber-label">Confirm Password</label>
              <div className="input-field-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="cyber-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                />
                <Lock className="input-field-icon" size={16} />
              </div>
              {errors.confirmPassword && (
                <div className="auth-error-msg"><ShieldAlert size={12} /> {errors.confirmPassword}</div>
              )}
            </div>
          )}

          {/* Remember Me & Forgot Password (Login only) */}
          {isLogin && (
            <div className="auth-options">
              <label className="cyber-checkbox-label">
                <input
                  type="checkbox"
                  className="cyber-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Node
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => alert('Demo Feature: Cryptographic recovery bypass code sent to local storage logs.')}
              >
                Forgot Decrypt Key?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button type="submit" className="neon-button auth-submit-btn" disabled={authLoading}>
            {authLoading ? (
              <>
                <Cpu size={16} className="anim-pulse" />
                <span>PROCESSING_REQUEST...</span>
              </>
            ) : (
              <span>{isLogin ? 'AUTHORIZE_SYNC' : 'REGISTER_NODE'}</span>
            )}
          </button>
        </form>

        {/* Toggle Form Trigger */}
        <div className="auth-toggle-trigger">
          {isLogin ? (
            <p>
              Node not registered in local database?{' '}
              <button className="auth-toggle-btn" onClick={() => { setIsLogin(false); setErrors({}); }}>
                Create Node Account
              </button>
            </p>
          ) : (
            <p>
              Node keys already integrated?{' '}
              <button className="auth-toggle-btn" onClick={() => { setIsLogin(true); setErrors({}); }}>
                Authorize Existing Connection
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
