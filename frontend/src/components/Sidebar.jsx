import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, Cpu, History, User, LogOut, Terminal, Bot } from 'lucide-react';
import AiAssistantChat from './AiAssistantChat';
import './Sidebar.css';

const Sidebar = ({ activePage, setActivePage }) => {
  const { logout, user } = useAppContext();
  const [chatOpen, setChatOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'generate', label: 'Generate Quiz', icon: <Cpu size={20} /> },
    { id: 'history', label: 'Quiz History', icon: <History size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ];

  return (
    <>
      <aside className="cyber-sidebar">
        {/* Brand logo */}
        <div className="sidebar-brand">
          <Terminal size={24} className="neon-text-cyan brand-icon" />
          <div className="brand-text">
            <span className="brand-main">QUIZ</span>
            <span className="brand-sub neon-text-blue">AI GEN</span>
          </div>
        </div>

        {/* User profile capsule */}
        {user && (
          <div className="sidebar-user-card">
            <div className="user-avatar-wrapper">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="online-indicator"></div>
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role neon-text-blue">Student</div>
            </div>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            >
              <div className="nav-item-glow"></div>
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {activePage === item.id && <div className="active-dot"></div>}
            </button>
          ))}
        </nav>

        {/* Footer: AI Assistant + Logout */}
        <div className="sidebar-footer">
          {/* AI Assistant Toggle Button */}
          <button
            className={`nav-item ai-assistant-btn ${chatOpen ? 'active' : ''}`}
            onClick={() => setChatOpen((prev) => !prev)}
            title="AI Assistant"
          >
            <Bot size={20} className="ai-icon" />
            <span>AI Assistant</span>
            {chatOpen && <div className="active-dot"></div>}
          </button>

          {/* Log Out */}
          <button className="nav-item logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>

          <div className="sidebar-system-version">
            <span>v3.5</span>
          </div>
        </div>
      </aside>

      {/* AI Chat panel rendered outside <aside> so it overlays the page */}
      <AiAssistantChat isOpen={chatOpen} onClose={() => setChatOpen(false)} setActivePage={setActivePage} />
    </>
  );
};

export default Sidebar;
