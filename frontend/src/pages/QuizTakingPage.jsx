import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Clock, ChevronLeft, ChevronRight, SkipForward, Send, Flag, CheckCircle, Circle } from 'lucide-react';
import './QuizTakingPage.css';

const QuizTakingPage = ({ setActivePage }) => {
  const { activeQuiz, saveAnswer, activeQuizAnswers, submitQuiz, setActiveQuizResult } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [flagged, setFlagged] = useState({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [fillText, setFillText] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const currentQ = activeQuiz?.questions[currentIndex];
    if (currentQ?.type === 'FITB') {
      setFillText(activeQuizAnswers[currentQ.id] || '');
    }
  }, [currentIndex, activeQuiz, activeQuizAnswers]);

  if (!activeQuiz) {
    return (
      <div className="quiz-error-state slide-up">
        <p>No active quiz found. Please generate a quiz first.</p>
        <button className="neon-button" onClick={() => setActivePage('generate')}>Go to Generator</button>
      </div>
    );
  }

  const questions = activeQuiz.questions;
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(activeQuizAnswers).length;
  const progressPct = ((currentIndex + 1) / totalQ) * 100;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectOption = (optionLetter) => {
    saveAnswer(currentQ.id, optionLetter);
  };

  const handleFillSave = () => {
    if (fillText.trim()) saveAnswer(currentQ.id, fillText.trim());
  };

  const handleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSkip = () => {
    if (currentIndex < totalQ - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleNext = () => {
    if (currentQ.type === 'FITB') handleFillSave();
    if (currentIndex < totalQ - 1) setCurrentIndex(currentIndex + 1);
    else setShowSubmitDialog(true);
  };

  const handleSubmitConfirm = async () => {
    clearInterval(timerRef.current);
    if (currentQ.type === 'FITB' && fillText.trim()) saveAnswer(currentQ.id, fillText.trim());
    setShowSubmitDialog(false);
    const result = await submitQuiz(elapsed);
    if (result) setActivePage('result');
  };

  const getQuestionStatus = (q) => {
    if (activeQuizAnswers[q.id]) return 'answered';
    if (flagged[q.id]) return 'flagged';
    return 'unanswered';
  };

  return (
    <div className="quiz-taking-wrapper slide-up">
      {/* Top Bar */}
      <div className="quiz-top-bar">
        <div className="quiz-progress-section">
          <div className="quiz-q-counter neon-text-blue">
            Q{currentIndex + 1} / {totalQ}
          </div>
          <div className="quiz-progress-bar-wrapper">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="quiz-answered-stat">
            {answeredCount}/{totalQ} Answered
          </div>
        </div>
        <div className="quiz-timer">
          <Clock size={14} className="neon-text-blue" />
          <span className="timer-digits">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="quiz-body-layout">
        {/* Main Question Card */}
        <div className="quiz-question-main">
          <div className="glass-panel question-card">
            <div className="cyber-accent accent-top-left"></div>
            <div className="cyber-accent accent-bottom-right"></div>

            <div className="q-header-row">
              <span className={`q-type-tag q-type-${currentQ.type.toLowerCase()}`}>{currentQ.type}</span>
              <button
                className={`flag-btn ${flagged[currentQ.id] ? 'flagged' : ''}`}
                onClick={handleFlag}
                title="Flag for review"
              >
                <Flag size={14} />
                {flagged[currentQ.id] ? 'Flagged ✓' : 'Flag'}
              </button>
            </div>

            <h3 className="question-text">{currentQ.question_text}</h3>

            {/* MCQ Options */}
            {currentQ.type === 'MCQ' && (
              <div className="mcq-options">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.option_letter}
                    className={`mcq-option ${activeQuizAnswers[currentQ.id] === opt.option_letter ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(opt.option_letter)}
                  >
                    <span className="opt-letter">{opt.option_letter}</span>
                    <span className="opt-text">{opt.option_text}</span>
                    <div className="opt-selector">
                      {activeQuizAnswers[currentQ.id] === opt.option_letter
                        ? <CheckCircle size={16} className="neon-text-cyan" />
                        : <Circle size={16} />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* True / False */}
            {currentQ.type === 'TF' && (
              <div className="tf-options">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.option_letter}
                    className={`tf-btn ${activeQuizAnswers[currentQ.id] === opt.option_letter ? 'selected' : ''} ${opt.option_text === 'True' ? 'tf-true' : 'tf-false'}`}
                    onClick={() => handleSelectOption(opt.option_letter)}
                  >
                    {opt.option_text === 'True' ? '✓ TRUE' : '✗ FALSE'}
                  </button>
                ))}
              </div>
            )}

            {/* Fill in the Blank */}
            {currentQ.type === 'FITB' && (
              <div className="fitb-wrapper">
                <div className="cyber-input-wrapper">
                  <label className="cyber-label">Enter your answer</label>
                  <input
                    type="text"
                    className="cyber-input fitb-input"
                    placeholder="Type your answer here..."
                    value={fillText}
                    onChange={(e) => setFillText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFillSave()}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="quiz-nav-row">
            <button
              className="neon-button neon-button-purple"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} /> PREV
            </button>
            <button className="neon-button" onClick={handleSkip} disabled={currentIndex === totalQ - 1}>
              SKIP <SkipForward size={16} />
            </button>
            {currentIndex === totalQ - 1 ? (
              <button className="neon-button neon-button-pink" onClick={() => setShowSubmitDialog(true)}>
                <Send size={16} /> SUBMIT
              </button>
            ) : (
              <button className="neon-button" onClick={handleNext}>
                NEXT <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette */}
        <div className="quiz-palette-panel glass-panel">
          <h4 className="palette-title">Questions</h4>
          <div className="palette-legend">
            <span className="legend-item"><span className="legend-dot answered"></span>Answered</span>
            <span className="legend-item"><span className="legend-dot flagged"></span>Flagged</span>
            <span className="legend-item"><span className="legend-dot unanswered"></span>Pending</span>
          </div>
          <div className="palette-grid">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`palette-btn ${getQuestionStatus(q)} ${currentIndex === idx ? 'current' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            className="neon-button neon-button-pink palette-submit-btn"
            onClick={() => setShowSubmitDialog(true)}
          >
            <Send size={14} /> SUBMIT QUIZ
          </button>
        </div>
      </div>

      {/* Submit Dialog */}
      {showSubmitDialog && (
        <div className="dialog-overlay fade-in">
          <div className="glass-panel submit-dialog">
            <div className="cyber-accent accent-top-left"></div>
            <div className="cyber-accent accent-bottom-right"></div>
            <h3>Submit Quiz?</h3>
            <div className="dialog-stats">
              <div className="dialog-stat-item">
                <span>Answered</span>
                <span className="neon-text-green">{answeredCount}</span>
              </div>
              <div className="dialog-stat-item">
                <span>Skipped</span>
                <span className="neon-text-orange">{totalQ - answeredCount}</span>
              </div>
              <div className="dialog-stat-item">
                <span>Time</span>
                <span className="neon-text-blue">{formatTime(elapsed)}</span>
              </div>
            </div>
            <p className="dialog-warning">Are you sure you want to finalize and submit this evaluation?</p>
            <div className="dialog-actions">
              <button className="neon-button neon-button-purple" onClick={() => setShowSubmitDialog(false)}>
                CANCEL
              </button>
              <button className="neon-button neon-button-pink" onClick={handleSubmitConfirm}>
                <Send size={14} /> CONFIRM &amp; SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTakingPage;
