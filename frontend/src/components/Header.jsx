import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Network, Database, LogOut, ShieldCheck, HelpCircle } from 'lucide-react';
import './Header.jsx'; // We'll keep styles in a separate CSS file or in App.css. Let's create Header.css!
import './Header.css';

const Header = ({ pageTitle }) => {
  const { mode, toggleMode, user, logout } = useAppContext();

  return (
    <header className="cyber-header">
      <div className="header-title-container">
        <h2 className="header-title neon-text-blue">{pageTitle}</h2>
        <span className="header-status-code">Status: Active</span>
      </div>

      <div className="header-actions">
        {/* Toggle Mode Switch */}
        <div className="mode-toggle-wrapper" onClick={toggleMode} title="Toggle between Local Offline Simulation and Live Backend API">
          <span className="mode-label">Mode:</span>
          <div className={`mode-pill ${mode === 'api' ? 'mode-api' : 'mode-demo'}`}>
            {mode === 'api' ? (
              <>
                <Database size={14} className="mode-icon anim-pulse" />
                <span className="mode-text">Live API</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} className="mode-icon" />
                <span className="mode-text">Demo Mode</span>
              </>
            )}
            <div className="mode-indicator-glow"></div>
          </div>
        </div>

        {/* User quick status */}
        {user && (
          <div className="header-user-status">
            <span className="user-greeting">Hi, <span className="neon-text-cyan">{user.name.split(' ')[0]}</span></span>
            <button className="header-logout-icon-btn" onClick={logout} title="Disconnect session">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
