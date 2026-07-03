import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Award, Clock, AlertTriangle, ShieldCheck, Activity, RefreshCw, LogOut, Check, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import './EvaluationPage.css';

const EvaluationPage = ({ setActivePage }) => {
  const { activeQuizResult, activeQuiz, setActiveQuiz, setActiveQuizResult } = useAppContext();

  // Run celebration if score is high
  useEffect(() => {
    if (activeQuizResult && activeQuizResult.scorePercentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00bfff', '#00ffff', '#7b61ff', '#00ff66']
      });
    }
  }, [activeQuizResult]);

  // Load from local storage if state lost
  let result = activeQuizResult;
  if (!result) {
    const stored = window.localStorage.getItem('quizgen_active_result');
    result = stored ? JSON.parse(stored) : null;
  }

  if (!result) {
    return (
      <div className="quiz-error-state slide-up">
        <p>No evaluation report available. Please complete a quiz session.</p>
        <button className="neon-button" onClick={() => setActivePage('dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const handleRetake = () => {
    // Reconstruct the quiz to play again
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

  // Pie Chart calculations
  const total = result.questionCount;
  const correct = result.correctAnswers;
  const wrong = result.wrongAnswers;
  const skipped = result.skippedQuestions;

  // SVG Coordinates for Pie Chart
  const renderPieChart = () => {
    if (total === 0) return null;
    const radius = 50;
    const center = 60;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;

    // Calculate percentage stroke lengths
    const correctPct = correct / total;
    const wrongPct = wrong / total;
    const skippedPct = skipped / total;

    const correctStroke = circumference * correctPct;
    const wrongStroke = circumference * wrongPct;
    const skippedStroke = circumference * skippedPct;

    // Offsets
    const correctOffset = 0;
    const wrongOffset = -correctStroke;
    const skippedOffset = -(correctStroke + wrongStroke);

    return (
      <svg width="150" height="150" viewBox="0 0 120 120" className="evaluation-pie-svg">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        {correct > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--neon-green)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${correctStroke} ${circumference}`}
            strokeDashoffset={correctOffset}
            className="pie-segment segment-green"
          />
        )}
        {wrong > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--neon-red)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${wrongStroke} ${circumference}`}
            strokeDashoffset={wrongOffset}
            className="pie-segment segment-red"
          />
        )}
        {skipped > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--neon-orange)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${skippedStroke} ${circumference}`}
            strokeDashoffset={skippedOffset}
            className="pie-segment segment-orange"
          />
        )}
        {/* Core Center Display */}
        <circle cx={center} cy={center} r={radius - 8} fill="var(--bg-darker)" />
        <text x="60" y="58" textAnchor="middle" fontSize="12" fill="var(--text-muted)" fontFamily="var(--font-cyber)">ACCURACY</text>
        <text x="60" y="76" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--neon-cyan)" fontFamily="var(--font-cyber)">
          {Math.round((correct / total) * 100)}%
        </text>
      </svg>
    );
  };

  return (
    <div className="evaluation-wrapper slide-up">
      {/* Top Banner */}
      <div className="glass-panel eval-banner">
        <div className="cyber-accent accent-top-left"></div>
        <div className="cyber-accent accent-bottom-right"></div>
        <div className="eval-banner-stats">
          <div className="grade-badge-circle">
            <span className="eval-grade-label">GRADE</span>
            <span className="eval-grade-val">{result.grade}</span>
          </div>
          <div className="eval-headline-info">
            <span className="eval-status-tag neon-text-blue">Result Saved</span>
            <h2>Session Benchmark Report</h2>
            <p>Title: <span className="neon-text-cyan">{result.quizTitle}</span></p>
          </div>
        </div>
        <div className="eval-banner-actions">
          <button className="neon-button" onClick={handleRetake}>
            <RefreshCw size={14} /> Retake Assessment
          </button>
          <button className="neon-button neon-button-purple" onClick={() => setActivePage('dashboard')}>
            <LogOut size={14} /> Dashboard
          </button>
        </div>
      </div>

      {/* Main Grid: Left statistics & AI, Right Pie chart */}
      <div className="eval-stats-summary-grid">
        <div className="glass-panel stats-list-panel">
          <h3 className="panel-title">Performance Metrics</h3>
          <div className="eval-metrics-grid">
            <div className="eval-metric-box">
              <span className="box-label">Final Score</span>
              <span className="box-value neon-text-cyan">{result.correctAnswers} / {result.questionCount}</span>
            </div>
            <div className="eval-metric-box">
              <span className="box-label">Time Taken</span>
              <span className="box-value">{formatTime(result.timeTakenSeconds)}</span>
            </div>
            <div className="eval-metric-box">
              <span className="box-label">Difficulty</span>
              <span className="box-value neon-text-purple">{result.difficulty.toUpperCase()}</span>
            </div>
            <div className="eval-metric-box">
              <span className="box-label">Percentage</span>
              <span className="box-value neon-text-blue">{result.scorePercentage}%</span>
            </div>
          </div>
        </div>

        <div className="glass-panel pie-chart-panel">
          <h3 className="panel-title">Score Distribution</h3>
          <div className="pie-row-layout">
            {renderPieChart()}
            <div className="pie-legend-col">
              <div className="legend-row">
                <span className="legend-color-dot" style={{ backgroundColor: 'var(--neon-green)' }}></span>
                <span className="legend-text-label">Correct:</span>
                <span className="legend-text-val neon-text-green">{correct}</span>
              </div>
              <div className="legend-row">
                <span className="legend-color-dot" style={{ backgroundColor: 'var(--neon-red)' }}></span>
                <span className="legend-text-label">Incorrect:</span>
                <span className="legend-text-val neon-text-pink">{wrong}</span>
              </div>
              <div className="legend-row">
                <span className="legend-color-dot" style={{ backgroundColor: 'var(--neon-orange)' }}></span>
                <span className="legend-text-label">Skipped:</span>
                <span className="legend-text-val neon-text-orange">{skipped}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Feedback */}
      <div className="glass-panel ai-feedback-panel">
        <div className="cyber-accent accent-top-left"></div>
        <div className="cyber-accent accent-top-right"></div>
        <h3 className="panel-title panel-title-ai">
          <Activity size={18} className="neon-text-blue" />
          AI Feedback
        </h3>
        <p className="ai-feedback-summary">{result.aiFeedback?.summary}</p>

        <div className="ai-split-lists">
          <div className="ai-list-card">
            <h4>Strengths</h4>
            <ul>
              {result.aiFeedback?.strengths?.map((str, idx) => (
                <li key={idx}>
                  <Check size={14} className="neon-text-green" /> {str}
                </li>
              ))}
            </ul>
          </div>
          <div className="ai-list-card">
            <h4>Weaknesses</h4>
            <ul>
              {result.aiFeedback?.weaknesses?.map((weak, idx) => (
                <li key={idx}>
                  <AlertCircle size={14} className="neon-text-pink" /> {weak}
                </li>
              ))}
            </ul>
          </div>
          <div className="ai-list-card">
            <h4>Recommendations</h4>
            <ul>
              {result.aiFeedback?.recommendations?.map((rec, idx) => (
                <li key={idx} className="neon-text-cyan">
                  ⚡ {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Question Details Review */}
      <div className="glass-panel review-details-panel">
        <h3 className="panel-title">Question Review</h3>
        <div className="review-questions-list">
          {result.answersList?.map((ans, idx) => {
            const originalQ = result.questions.find(q => q.id === ans.questionId);
            if (!originalQ) return null;

            let status = 'skipped';
            if (ans.selectedAnswer !== null) {
              status = ans.isCorrect ? 'correct' : 'wrong';
            }

            return (
              <div key={ans.questionId} className={`review-question-item status-${status}`}>
                <div className="review-q-header">
                  <span className="review-q-index">Question {idx + 1}</span>
                  <span className={`review-q-status-badge badge-${status}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <p className="review-q-text">{originalQ.question_text}</p>

                <div className="review-answer-display">
                  <div className="ans-node">
                    <span className="ans-label">Selected Key:</span>
                    <span className={`ans-value ${status === 'correct' ? 'neon-text-green' : status === 'wrong' ? 'neon-text-pink' : 'neon-text-orange'}`}>
                      {ans.selectedAnswer || 'Unanswered'}
                    </span>
                  </div>
                  <div className="ans-node">
                    <span className="ans-label">Verified Target Key:</span>
                    <span className="ans-value neon-text-cyan">
                      {originalQ.type === 'FITB' ? originalQ.blank_answer : (originalQ.options?.find(o => o.is_correct)?.option_letter || 'N/A')}
                    </span>
                  </div>
                </div>

                <div className="review-explanation-box">
                  <span className="exp-title">AI Explanation:</span>
                  <p className="exp-content">{originalQ.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvaluationPage;
