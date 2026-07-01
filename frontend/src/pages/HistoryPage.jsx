import React from 'react';
import { useAppContext } from '../context/AppContext';
import { History, Calendar, Award, Clock, Eye, Trash2, RotateCcw, Cpu } from 'lucide-react';
import './HistoryPage.css';

const HistoryPage = ({ setActivePage }) => {
  const { quizzes, deleteQuizResult, setActiveQuizResult, setActiveQuiz } = useAppContext();

  const handleOpenResult = (result) => {
    setActiveQuizResult(result);
    // Keep cached in local storage
    window.localStorage.setItem('quizgen_active_result', JSON.stringify(result));
    setActivePage('result');
  };

  const handleRetake = (result) => {
    const originalQuiz = {
      id: result.quizId,
      title: result.quizTitle,
      difficulty: result.difficulty,
      questionCount: result.questionCount,
      questions: result.questions,
      fileName: result.fileName || 'Replay.txt'
    };
    setActiveQuiz(originalQuiz);
    setActiveQuizResult(null);
    setActivePage('quiz');
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="history-page-wrapper slide-up">
      <div className="history-header">
        <div className="header-meta">
          <span className="section-status-tag neon-text-blue">Quiz History</span>
          <h2>Session Logs History</h2>
          <p>Review or re-launch your past cognitive quiz assessments</p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="glass-panel empty-history-panel">
          <div className="cyber-accent accent-top-left"></div>
          <div className="cyber-accent accent-bottom-right"></div>
          <History size={48} className="neon-text-blue empty-icon anim-pulse" />
          <h3>No Quiz History Yet</h3>
          <p>No quiz reports have been registered. Generate a new quiz from your files to log evaluations.</p>
          <button className="neon-button" onClick={() => setActivePage('generate')}>
            <Cpu size={16} /> Generate Quiz
          </button>
        </div>
      ) : (
        <div className="history-list">
          {quizzes.map((q) => (
            <div key={q.id} className="glass-panel history-card">
              <div className="history-card-left">
                <div className="card-q-title-row">
                  <h3 className="card-q-title">{q.quizTitle}</h3>
                </div>
                <div className="card-q-meta-grid">
                  <span className="meta-card-item">
                    <Calendar size={12} /> {formatDate(q.createdAt || q.id)}
                  </span>
                  <span className="meta-card-item">
                    <Award size={12} className="neon-text-purple" /> Diff: {q.difficulty}
                  </span>
                  <span className="meta-card-item">
                    <Clock size={12} /> Duration: {formatTime(q.timeTakenSeconds)}
                  </span>
                </div>
              </div>

              <div className="history-card-right">
                <div className="card-score-wrapper">
                  <span className="score-percent-val neon-text-cyan">{q.scorePercentage}%</span>
                  <span className="score-grade-badge">GRADE: {q.grade}</span>
                </div>
                <div className="card-actions-wrapper">
                  <button
                    className="history-action-btn view-btn"
                    onClick={() => handleOpenResult(q)}
                    title="View Report"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="history-action-btn retake-btn"
                    onClick={() => handleRetake(q)}
                    title="Retake Quiz"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="history-action-btn delete-btn"
                    onClick={() => {
                      if (window.confirm('Delete this evaluation record from storage?')) {
                        deleteQuizResult(q.id);
                      }
                    }}
                    title="Delete Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
