import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Mail, ShieldAlert, Cpu, Calendar, Award, BookOpen, Key, CheckCircle } from 'lucide-react';
import './ProfilePage.css';

const AVATAR_PRESETS = [
  { id: 'neon-blue', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: 'Neon Blue' },
  { id: 'cyber-hacker', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: 'Cyber Grid' },
  { id: 'synthwave-pink', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: 'Pink Core' },
  { id: 'matrix-green', url: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', label: 'Matrix Code' }
];

const ProfilePage = () => {
  const { user, quizzes, updateProfile, showToast } = useAppContext();

  // Basic Info Form
  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profilePicture || '');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passErrors, setPassErrors] = useState({});

  // Stats calculations
  const totalQuizzes = quizzes.length;
  const highestScore = totalQuizzes ? Math.max(...quizzes.map(q => q.scorePercentage)) : 0;
  const avgScore = totalQuizzes ? Math.round(quizzes.reduce((acc, q) => acc + q.scorePercentage, 0) / totalQuizzes) : 0;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name field cannot be left blank.', 'error');
      return;
    }
    const success = await updateProfile({ name, profilePicture: selectedAvatar });
    if (success) {
      showToast('Profile updated successfully!', 'success');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentPassword) errors.current = 'Current password key is required.';
    if (!newPassword) errors.new = 'New password key is required.';
    else if (newPassword.length < 6) errors.new = 'New password must be at least 6 characters.';
    
    if (newPassword !== confirmNewPassword) {
      errors.confirm = 'Confirm password does not match new password.';
    }

    setPassErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // Simulate API or Local check
    showToast('Password updated successfully!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <div className="profile-page-wrapper slide-up">
      {/* Top Stats Dashboard Summary */}
      <div className="glass-panel profile-stats-panel">
        <div className="cyber-accent accent-top-left"></div>
        <div className="cyber-accent accent-bottom-right"></div>
        <div className="profile-hero-section">
          <div className="profile-avatar-capsule">
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Profile" className="profile-large-avatar" />
            ) : (
              <div className="profile-large-placeholder">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div className="profile-hero-meta">
            <h2>{user?.name}</h2>
            <span className="profile-id-tag neon-text-blue">Email: {user?.email}</span>
            <div className="profile-joined-row">
              <Calendar size={12} /> Joined: {user?.joinedDate || 'N/A'}
            </div>
          </div>
        </div>

        <div className="profile-summary-stats">
          <div className="profile-stat-box">
            <BookOpen size={16} className="neon-text-blue" />
            <div className="p-stat-info">
              <span>Quizzes Taken</span>
              <span>{totalQuizzes}</span>
            </div>
          </div>
          <div className="profile-stat-box">
            <Award size={16} className="neon-text-cyan" />
            <div className="p-stat-info">
              <span>Best Score</span>
              <span>{highestScore}%</span>
            </div>
          </div>
          <div className="profile-stat-box">
            <Cpu size={16} className="neon-text-purple" />
            <div className="p-stat-info">
              <span>Average Score</span>
              <span>{avgScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="profile-forms-grid">
        {/* Edit Bio Form */}
        <div className="glass-panel profile-form-card">
          <h3>UPDATE PROFILE DETAILS</h3>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="cyber-input-wrapper">
              <label className="cyber-label">Display Name</label>
              <div className="profile-input-container">
                <input
                  type="text"
                  className="cyber-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <User className="p-input-icon" size={16} />
              </div>
            </div>

            <div className="avatar-picker-section">
              <label className="cyber-label">Select Avatar Preset</label>
              <div className="avatars-preset-grid">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    className={`preset-avatar-btn ${selectedAvatar === av.url ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(av.url)}
                  >
                    <img src={av.url} alt={av.label} className="preset-avatar-img" />
                    <span className="preset-avatar-label">{av.label}</span>
                    {selectedAvatar === av.url && <div className="preset-checked-indicator"><CheckCircle size={10} /></div>}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="neon-button save-profile-btn">
              <span>UPDATE PROFILE</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="glass-panel profile-form-card">
          <h3>CHANGE PASSWORD</h3>
          <form onSubmit={handleUpdatePassword} className="profile-form">
            <div className="cyber-input-wrapper">
              <label className="cyber-label">Current Password</label>
              <div className="profile-input-container">
                <input
                  type="password"
                  className="cyber-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passErrors.current) setPassErrors(prev => ({ ...prev, current: '' }));
                  }}
                />
                <Key className="p-input-icon" size={16} />
              </div>
              {passErrors.current && <div className="p-error-msg"><ShieldAlert size={12} /> {passErrors.current}</div>}
            </div>

            <div className="cyber-input-wrapper">
              <label className="cyber-label">New Password</label>
              <div className="profile-input-container">
                <input
                  type="password"
                  className="cyber-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passErrors.new) setPassErrors(prev => ({ ...prev, new: '' }));
                  }}
                />
                <Key className="p-input-icon" size={16} />
              </div>
              {passErrors.new && <div className="p-error-msg"><ShieldAlert size={12} /> {passErrors.new}</div>}
            </div>

            <div className="cyber-input-wrapper">
              <label className="cyber-label">Confirm New Password</label>
              <div className="profile-input-container">
                <input
                  type="password"
                  className="cyber-input"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (passErrors.confirm) setPassErrors(prev => ({ ...prev, confirm: '' }));
                  }}
                />
                <Key className="p-input-icon" size={16} />
              </div>
              {passErrors.confirm && <div className="p-error-msg"><ShieldAlert size={12} /> {passErrors.confirm}</div>}
            </div>

            <button type="submit" className="neon-button neon-button-purple save-profile-btn">
              <span>UPDATE PASSWORD</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
