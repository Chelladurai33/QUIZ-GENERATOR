import React from 'react';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, Cpu, History, Award, BookOpen, Clock, Activity, ArrowUpRight } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = ({ setActivePage }) => {
  const { quizzes, user, setActiveQuizResult } = useAppContext();

  // Compute Stats
  const totalQuizzes = quizzes.length;
  const avgScore = totalQuizzes
    ? Math.round(quizzes.reduce((acc, q) => acc + q.scorePercentage, 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes
    ? Math.max(...quizzes.map((q) => q.scorePercentage))
    : 0;
  
  const recentQuiz = totalQuizzes ? quizzes[0] : null;

  // Custom SVG line chart coordinates generator
  const renderScoreChart = () => {
    if (totalQuizzes === 0) {
      return (
        <div className="empty-chart-state">
          <Activity size={24} className="neon-text-blue empty-chart-icon" />
          <span>No Logs Found</span>
        </div>
      );
    }

    const chartWidth = 500;
    const chartHeight = 150;
    const padding = 20;
    const pointsCount = Math.min(7, totalQuizzes);
    
    // Get last N quiz results in chronological order (reverse of list)
    const recentScores = quizzes
      .slice(0, pointsCount)
      .reverse()
      .map(q => q.scorePercentage);

    // If only 1 score, duplicate to draw a line
    const dataPoints = recentScores.length === 1 ? [recentScores[0], recentScores[0]] : recentScores;
    const steps = dataPoints.length - 1;
    
    let pathD = '';
    const coordinateList = [];

    dataPoints.forEach((score, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / steps;
      // Invert Y because SVG coordinates start from top
      const y = chartHeight - padding - (score * (chartHeight - padding * 2)) / 100;
      coordinateList.push({ x, y, score });
      if (index === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });

    // Generate area path that closes at bottom
    const areaD = `${pathD} L ${coordinateList[coordinateList.length - 1].x} ${chartHeight - padding} L ${coordinateList[0].x} ${chartHeight - padding} Z`;

    return (
      <div className="chart-svg-wrapper">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="neon-dashboard-chart">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.03)" />
          <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" />
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.07)" />

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Glowing Line */}
          <path d={pathD} fill="none" stroke="var(--neon-cyan)" strokeWidth="3" className="chart-line-glow" />

          {/* Points */}
          {coordinateList.map((pt, idx) => (
            <g key={idx} className="chart-node-group">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="var(--bg-dark)"
                stroke="var(--neon-purple)"
                strokeWidth="2"
                className="chart-node-circle"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="2"
                fill="var(--neon-cyan)"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-secondary)"
                fontFamily="var(--font-cyber)"
              >
                {pt.score}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper slide-up">
      {/* Welcome banner */}
      <div className="glass-panel welcome-panel">
        <div className="cyber-accent accent-top-left"></div>
        <div className="cyber-accent accent-bottom-right"></div>
        <div className="welcome-text-side">
          <span className="welcome-tag neon-text-blue">Online</span>
          <h1>Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p>
            Upload your study notes, PDFs, or textbook chapters to generate a quiz and test your knowledge.
          </p>
          <button className="neon-button welcome-btn" onClick={() => setActivePage('generate')}>
            <Cpu size={16} />
            <span>Generate New Quiz</span>
          </button>
        </div>
        <div className="welcome-illustration-side">
          <div className="core-reactor">
            <div className="reactor-ring ring-1"></div>
            <div className="reactor-ring ring-2"></div>
            <div className="reactor-core">
              <Cpu size={32} className="neon-text-cyan" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {/* Stat 1 */}
        <div className="glass-panel stat-card card-blue">
          <div className="stat-icon-wrapper">
            <BookOpen size={20} className="neon-text-blue" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Quizzes</span>
            <span className="stat-value">{totalQuizzes}</span>
          </div>
          <div className="stat-glow"></div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel stat-card card-purple">
          <div className="stat-icon-wrapper">
            <Award size={20} className="neon-text-purple" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Average Score</span>
            <span className="stat-value">{avgScore}%</span>
          </div>
          <div className="stat-glow"></div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel stat-card card-cyan">
          <div className="stat-icon-wrapper">
            <Activity size={20} className="neon-text-cyan" />
          </div>
          <div className="stat-info">
            <span className="stat-title">Best Score</span>
            <span className="stat-value">{bestScore}%</span>
          </div>
          <div className="stat-glow"></div>
        </div>
      </div>

      {/* Secondary layout splits */}
      <div className="dashboard-details-row">
        {/* Chart panel */}
        <div className="glass-panel chart-panel-wrapper">
          <div className="panel-header">
            <h3>Performance History</h3>
            <span className="panel-sub">Score trend of last 7 sessions</span>
          </div>
          {renderScoreChart()}
        </div>

        {/* Recent session card */}
        <div className="glass-panel recent-session-wrapper">
          <div className="panel-header">
            <h3>Recent Session</h3>
            <span className="panel-sub">Details of recently completed evaluation</span>
          </div>

          {recentQuiz ? (
            <div className="recent-quiz-details">
              <div className="rq-title-row">
                <span className="rq-title">{recentQuiz.quizTitle}</span>
                <span className={`rq-grade-pill ${recentQuiz.scorePercentage >= 70 ? 'pass' : 'fail'}`}>
                  GRADE: {recentQuiz.grade}
                </span>
              </div>
              
              <div className="rq-metrics-grid">
                <div className="rq-metric-item">
                  <span className="rq-metric-label">SCORE</span>
                  <span className="rq-metric-value neon-text-blue">{recentQuiz.scorePercentage}%</span>
                </div>
                <div className="rq-metric-item">
                  <span className="rq-metric-label">TIME</span>
                  <span className="rq-metric-value">
                    {Math.floor(recentQuiz.timeTakenSeconds / 60)}m {recentQuiz.timeTakenSeconds % 60}s
                  </span>
                </div>
                <div className="rq-metric-item">
                  <span className="rq-metric-label">DIFFICULTY</span>
                  <span className="rq-metric-value neon-text-purple">{recentQuiz.difficulty.toUpperCase()}</span>
                </div>
              </div>

              <button
                className="neon-button neon-button-purple rq-review-btn"
                onClick={() => {
                  setActiveQuizResult(recentQuiz);
                  window.localStorage.setItem('quizgen_active_result', JSON.stringify(recentQuiz));
                  setActivePage('result');
                }}
              >
                <span>View Report</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            <div className="empty-chart-state">
              <History size={24} className="neon-text-purple empty-chart-icon" />
              <span>No Recent Quizzes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
