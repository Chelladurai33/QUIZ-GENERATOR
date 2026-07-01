import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import GlowingCanvas from './components/GlowingCanvas';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import GenerateQuizPage from './pages/GenerateQuizPage';
import QuizTakingPage from './pages/QuizTakingPage';
import EvaluationPage from './pages/EvaluationPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const AppContent = () => {
  const { user } = useAppContext();
  const [activePage, setActivePage] = useState('dashboard');

  // Page titles mapping
  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'generate':
        return 'Generate Quiz';
      case 'quiz':
        return 'Quiz Session';
      case 'result':
        return 'Evaluation Report';
      case 'history':
        return 'Quiz History';
      case 'profile':
        return 'Edit Profile';
      default:
        return 'System Interface';
    }
  };

  if (!user) {
    return (
      <div className="app-auth-layout">
        <GlowingCanvas />
        <AuthPage />
        <Toast />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Drifting neon nodes canvas background */}
      <GlowingCanvas />
      
      {/* Cyberpunk glassmorphic sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main dashboard content panel */}
      <div className="main-content-wrapper">
        <Header pageTitle={getPageTitle(activePage)} />
        <main className="main-content">
          {activePage === 'dashboard' && <DashboardPage setActivePage={setActivePage} />}
          {activePage === 'generate' && <GenerateQuizPage setActivePage={setActivePage} />}
          {activePage === 'quiz' && <QuizTakingPage setActivePage={setActivePage} />}
          {activePage === 'result' && <EvaluationPage setActivePage={setActivePage} />}
          {activePage === 'history' && <HistoryPage setActivePage={setActivePage} />}
          {activePage === 'profile' && <ProfilePage />}
        </main>
      </div>

      {/* Floating status alert popup overlay */}
      <Toast />
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
