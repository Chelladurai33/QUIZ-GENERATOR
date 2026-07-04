import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateQuizQuestions, generateAIFeedback } from '../services/mockGenerator';

// Safe JSON helper — returns null instead of throwing on empty/non-JSON responses
async function safeJson(response) {
  const text = await response.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Config state
  const [mode, setMode] = useState(() => localStorage.getItem('quizgen_mode') || 'demo'); // 'demo' or 'api'
  const [apiBaseUrl] = useState(() =>
    import.meta.env.VITE_API_BASE_URL || '/api'
  );

  // Authentication State
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('quizgen_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quizgen_token') || null);
  const [authLoading, setAuthLoading] = useState(false);

  // Toasts Notification State
  const [toasts, setToasts] = useState([]);

  // Quiz taking state
  const [quizzes, setQuizzes] = useState(() => {
    const storedHistory = localStorage.getItem('quizgen_history');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState({});
  const [activeQuizResult, setActiveQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('quizgen_history', JSON.stringify(quizzes));
  }, [quizzes]);

  // Save mode to localStorage
  useEffect(() => {
    localStorage.setItem('quizgen_mode', mode);
  }, [mode]);

  // Sync history logs from API / localStorage depending on active mode
  useEffect(() => {
    const fetchHistory = async () => {
      if (mode === 'api' && token) {
        try {
          const response = await fetch(`${apiBaseUrl}/quizzes/history`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setQuizzes(data);
          }
        } catch (err) {
          console.error('Failed to fetch live history logs:', err);
        }
      } else if (mode === 'demo') {
        const storedHistory = localStorage.getItem('quizgen_history');
        setQuizzes(storedHistory ? JSON.parse(storedHistory) : []);
      }
    };
    fetchHistory();
  }, [mode, token, apiBaseUrl]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Toggle between API and Demo modes
  const toggleMode = () => {
    const nextMode = mode === 'demo' ? 'api' : 'demo';
    if (nextMode === 'api' && token === 'demo_jwt_token_cyberpunk_neon') {
      setUser(null);
      setToken(null);
      localStorage.removeItem('quizgen_user');
      localStorage.removeItem('quizgen_token');
      showToast('Demo session closed. Log in again for Live API mode.', 'info');
    }
    setMode(nextMode);
    showToast(`Switched to ${nextMode.toUpperCase()} mode!`, 'info');
  };

  // Authentication Actions
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      if (mode === 'demo') {
        // Mock Login
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const users = JSON.parse(localStorage.getItem('quizgen_demo_users') || '[]');
        const foundUser = users.find((u) => u.email === email);
        
        if (!foundUser) {
          throw new Error('User account not found. Please register first.');
        }
        if (foundUser.password !== password) {
          throw new Error('Incorrect credentials. Please verify password.');
        }

        const sessionUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          profilePicture: foundUser.profilePicture || '',
          joinedDate: foundUser.joinedDate || new Date().toLocaleDateString()
        };

        setUser(sessionUser);
        setToken('demo_jwt_token_cyberpunk_neon');
        localStorage.setItem('quizgen_user', JSON.stringify(sessionUser));
        localStorage.setItem('quizgen_token', 'demo_jwt_token_cyberpunk_neon');
        showToast('System sync established! Welcome back.', 'success');
        return true;
      } else {
        // API Live Login
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await safeJson(response);
        if (!response.ok) {
          throw new Error(data?.message || `Authentication failed (HTTP ${response.status})`);
        }
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('quizgen_user', JSON.stringify(data.user));
        localStorage.setItem('quizgen_token', data.token);
        showToast('Live system sync established!', 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      if (mode === 'demo') {
        // Mock Registration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const users = JSON.parse(localStorage.getItem('quizgen_demo_users') || '[]');
        const exists = users.some((u) => u.email === email);
        
        if (exists) {
          throw new Error('Email identifier already exists in system.');
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          password,
          profilePicture: '',
          joinedDate: new Date().toLocaleDateString()
        };

        users.push(newUser);
        localStorage.setItem('quizgen_demo_users', JSON.stringify(users));
        showToast('Registration successful! Access granted.', 'success');
        return true;
      } else {
        // API Live Registration
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await safeJson(response);
        if (!response.ok) {
          throw new Error(data?.message || `Registration failed (HTTP ${response.status})`);
        }
        showToast('Live registration successful! Proceeding to Login.', 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('quizgen_user');
    localStorage.removeItem('quizgen_token');
    showToast('Terminal connection closed.', 'info');
  };

  const handleSessionExpired = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('quizgen_user');
    localStorage.removeItem('quizgen_token');
    showToast('Session expired. Please log in again.', 'error');
  };

  const updateProfile = async (updates) => {
    try {
      if (mode === 'demo') {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('quizgen_user', JSON.stringify(updatedUser));
        
        // Update user in registration database
        const users = JSON.parse(localStorage.getItem('quizgen_demo_users') || '[]');
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...updates };
          localStorage.setItem('quizgen_demo_users', JSON.stringify(users));
        }
        
        showToast('Bio-profile metrics updated.', 'success');
        return true;
      } else {
        const response = await fetch(`${apiBaseUrl}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (response.status === 401 || response.status === 403) {
          handleSessionExpired();
          throw new Error('Session expired. Please log in again.');
        }
        const data = await safeJson(response);
        if (!response.ok) {
          throw new Error(data?.message || `Profile update failed (HTTP ${response.status})`);
        }
        setUser(data.user);
        localStorage.setItem('quizgen_user', JSON.stringify(data.user));
        showToast('Live bio-profile metrics updated.', 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Quiz Actions
  const generateQuiz = async (fileObj, contentText, config) => {
    setQuizLoading(true);
    try {
      if (mode === 'demo') {
        // Mock generation
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate extraction + AI time
        const questions = generateQuizQuestions(fileObj?.name || 'Manual Content Text', contentText, config);
        
        if (questions.length === 0) {
          throw new Error('AI could not parse any relevant concepts from document.');
        }

        const newQuiz = {
          id: Date.now(),
          title: fileObj ? fileObj.name : 'Concept Summary Quiz',
          difficulty: config.difficulty,
          questionType: config.questionType,
          questionCount: config.numQuestions,
          fileName: fileObj ? fileObj.name : 'Direct Input.txt',
          questions: questions,
          createdAt: new Date().toISOString()
        };

        setActiveQuiz(newQuiz);
        setActiveQuizAnswers({});
        setActiveQuizResult(null);
        showToast('Cognitive quiz generated successfully!', 'success');
        return newQuiz;
      } else {
        // API Live Quiz Generation
        if (!token || token === 'demo_jwt_token_cyberpunk_neon') {
          showToast('Please log in to use Live API mode.', 'error');
          return null;
        }
        const formData = new FormData();
        if (fileObj) {
          formData.append('file', fileObj);
        } else {
          formData.append('text', contentText);
        }
        formData.append('difficulty', config.difficulty);
        formData.append('questionType', config.questionType);
        formData.append('questionCount', config.numQuestions);

        const response = await fetch(`${apiBaseUrl}/quizzes/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.status === 401 || response.status === 403) {
          handleSessionExpired();
          throw new Error('Session expired. Please log in again.');
        }

        const data = await safeJson(response);
        if (!response.ok) {
          throw new Error(data?.message || `AI quiz generation failed (HTTP ${response.status})`);
        }
        
        setActiveQuiz(data.quiz);
        setActiveQuizAnswers({});
        setActiveQuizResult(null);
        showToast('Live AI Quiz generated successfully!', 'success');
        return data.quiz;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    } finally {
      setQuizLoading(false);
    }
  };

  const saveAnswer = (questionId, selectedAnswer) => {
    setActiveQuizAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer
    }));
  };

  const submitQuiz = async (timeTakenSec) => {
    if (!activeQuiz) return null;
    
    try {
      const answersList = activeQuiz.questions.map((q) => {
        const selAns = activeQuizAnswers[q.id];
        let isCorrect = false;
        
        if (q.type === 'MCQ' || q.type === 'TF') {
          const correctOption = q.options?.find(opt => opt.is_correct);
          isCorrect = correctOption ? correctOption.option_letter === selAns : false;
        } else if (q.type === 'FITB') {
          isCorrect = selAns ? selAns.toLowerCase().trim() === q.blank_answer.toLowerCase().trim() : false;
        }

        return {
          questionId: q.id,
          selectedAnswer: selAns || null,
          isCorrect
        };
      });

      const correctCount = answersList.filter((a) => a.isCorrect && a.selectedAnswer !== null).length;
      const skippedCount = activeQuiz.questions.filter((q) => !activeQuizAnswers[q.id]).length;
      const wrongCount = activeQuiz.questions.length - correctCount - skippedCount;
      const scorePercentage = (correctCount / activeQuiz.questions.length) * 100;

      // Grade calculation
      let grade = 'F';
      if (scorePercentage >= 90) grade = 'A+';
      else if (scorePercentage >= 80) grade = 'A';
      else if (scorePercentage >= 70) grade = 'B';
      else if (scorePercentage >= 60) grade = 'C';
      else if (scorePercentage >= 50) grade = 'D';

      if (mode === 'demo') {
        const feedback = generateAIFeedback(correctCount, activeQuiz.questions.length, timeTakenSec, activeQuiz.difficulty);
        
        const result = {
          id: Date.now(),
          quizId: activeQuiz.id,
          quizTitle: activeQuiz.title,
          difficulty: activeQuiz.difficulty,
          questionCount: activeQuiz.questionCount,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          skippedQuestions: skippedCount,
          scorePercentage: Math.round(scorePercentage),
          grade,
          timeTakenSeconds: timeTakenSec,
          aiFeedback: feedback,
          answersList: answersList,
          questions: activeQuiz.questions,
          createdAt: new Date().toISOString()
        };

        setActiveQuizResult(result);
        localStorage.setItem('quizgen_active_result', JSON.stringify(result));
        setQuizzes((prev) => [result, ...prev]);
        showToast('Cognitive evaluation complete!', 'success');
        return result;
      } else {
        // API Live Submission
        const payload = {
          quizId: activeQuiz.id,
          answers: activeQuizAnswers,
          timeTakenSeconds: timeTakenSec
        };

        const response = await fetch(`${apiBaseUrl}/quizzes/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 401 || response.status === 403) {
          handleSessionExpired();
          throw new Error('Session expired. Please log in again.');
        }

        const data = await safeJson(response);
        if (!response.ok) {
          throw new Error(data?.message || `Quiz submission failed (HTTP ${response.status})`);
        }

        setActiveQuizResult(data);
        localStorage.setItem('quizgen_active_result', JSON.stringify(data));
        setQuizzes((prev) => [data, ...prev]);
        showToast('Live evaluation completed and saved!', 'success');
        return data;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    }
  };

  const deleteQuizResult = async (id) => {
    try {
      if (mode === 'demo') {
        setQuizzes((prev) => prev.filter((q) => q.id !== id));
        showToast('Quiz record deleted.', 'info');
        return true;
      } else {
        const response = await fetch(`${apiBaseUrl}/quizzes/results/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.status === 401 || response.status === 403) {
          handleSessionExpired();
          throw new Error('Session expired. Please log in again.');
        }
        if (!response.ok) {
          throw new Error('Failed to delete live quiz history');
        }
        setQuizzes((prev) => prev.filter((q) => q.id !== id));
        showToast('Live quiz record deleted.', 'info');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        toggleMode,
        user,
        token,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        toasts,
        showToast,
        quizzes,
        activeQuiz,
        setActiveQuiz,
        activeQuizAnswers,
        saveAnswer,
        activeQuizResult,
        setActiveQuizResult,
        quizLoading,
        generateQuiz,
        submitQuiz,
        deleteQuizResult
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
