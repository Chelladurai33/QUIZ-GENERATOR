import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Upload, FileText, Image, X, CheckCircle, Cpu, ChevronRight, Zap } from 'lucide-react';
import './GenerateQuizPage.css';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
];

const GenerateQuizPage = ({ setActivePage }) => {
  const { generateQuiz, quizLoading, setActiveQuiz } = useAppContext();

  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'

  // Config
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState('Mixed');

  const fileInputRef = useRef(null);

  const simulateUpload = (file) => {
    setUploadedFile(file);
    setUploadProgress(0);
    setUploadDone(false);
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 20 + 10;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setUploadDone(true);
      }
      setUploadProgress(Math.min(Math.round(prog), 100));
    }, 180);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) simulateUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) {
      simulateUpload(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (file) => {
    if (!file) return <FileText size={20} />;
    if (file.type.startsWith('image/')) return <Image size={20} />;
    return <FileText size={20} />;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canProceedStep1 = (inputMode === 'file' && uploadDone) || (inputMode === 'text' && pasteText.trim().length > 30);

  const handleGenerate = async () => {
    const config = { difficulty, numQuestions: parseInt(numQuestions), questionType };
    const fileToSend = inputMode === 'file' ? uploadedFile : null;
    const textToSend = inputMode === 'text' ? pasteText : '';
    const quiz = await generateQuiz(fileToSend, textToSend, config);
    if (quiz) {
      setActivePage('quiz');
    }
  };

  const difficulties = [
    { id: 'Easy', label: 'EASY', desc: 'Fundamental recall tasks', color: 'var(--neon-green)' },
    { id: 'Medium', label: 'MEDIUM', desc: 'Conceptual application', color: 'var(--neon-blue)' },
    { id: 'Hard', label: 'HARD', desc: 'Analytical deep-dive', color: 'var(--neon-red)' },
    { id: 'Mixed', label: 'MIXED', desc: 'Adaptive all-levels', color: 'var(--neon-purple)' },
  ];

  const qTypes = ['Multiple Choice', 'True / False', 'Fill in the Blanks', 'Mixed'];
  const qTypeKeys = ['MCQ', 'TF', 'FITB', 'Mixed'];

  return (
    <div className="generate-page-wrapper slide-up">
      {/* Step Indicator */}
      <div className="step-indicator-bar">
        {['Upload Content', 'Configure Quiz', 'Generate'].map((label, idx) => (
          <React.Fragment key={idx}>
            <div className={`step-node ${step > idx ? 'done' : ''} ${step === idx + 1 ? 'active' : ''}`}>
              <div className="step-circle">
                {step > idx + 1 ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {idx < 2 && <div className={`step-connector ${step > idx + 1 ? 'done' : ''}`}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 - Upload */}
      {step === 1 && (
        <div className="glass-panel gen-step-panel fade-in">
          <div className="cyber-accent accent-top-left"></div>
          <div className="cyber-accent accent-bottom-right"></div>
          <h2 className="step-title">UPLOAD_DOCUMENT_NODE</h2>
          <p className="step-desc">Feed the AI cognition engine with your study material. Supports PDF, DOCX, TXT, PPT, and image formats.</p>

          {/* Input mode toggle */}
          <div className="input-mode-toggle">
            <button className={`mode-tab ${inputMode === 'file' ? 'active' : ''}`} onClick={() => setInputMode('file')}>
              <Upload size={14} /> File Upload
            </button>
            <button className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>
              <FileText size={14} /> Paste Text
            </button>
          </div>

          {inputMode === 'file' ? (
            <>
              {!uploadedFile ? (
                <div
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drop-zone-icon-ring">
                    <Upload size={36} className="neon-text-cyan" />
                  </div>
                  <p className="drop-zone-title">DRAG &amp; DROP DOCUMENT</p>
                  <p className="drop-zone-sub">or click to browse files</p>
                  <div className="drop-zone-types">PDF • DOCX • TXT • PPT • JPG • PNG</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".pdf,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="uploaded-file-card">
                  <div className="file-icon-wrapper">{getFileIcon(uploadedFile)}</div>
                  <div className="file-meta">
                    <span className="file-name">{uploadedFile.name}</span>
                    <span className="file-size">{formatBytes(uploadedFile.size)}</span>
                    <div className="upload-progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="file-status">
                      {uploadDone
                        ? <><CheckCircle size={12} className="neon-text-green" /> EXTRACTION_COMPLETE</>
                        : `UPLOADING... ${uploadProgress}%`}
                    </span>
                  </div>
                  <button className="remove-file-btn" onClick={handleRemoveFile}><X size={16} /></button>
                </div>
              )}
            </>
          ) : (
            <textarea
              className="cyber-input text-paste-area"
              placeholder="Paste your text content here... (minimum 30 characters)"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          )}

          <button
            className="neon-button step-next-btn"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
          >
            <span>PROCEED_TO_CONFIGURATION</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* STEP 2 - Configure */}
      {step === 2 && (
        <div className="glass-panel gen-step-panel fade-in">
          <div className="cyber-accent accent-top-left"></div>
          <div className="cyber-accent accent-bottom-right"></div>
          <h2 className="step-title">QUIZ_PARAMETER_MATRIX</h2>
          <p className="step-desc">Configure the AI cognition parameters for optimal quiz generation.</p>

          {/* Difficulty */}
          <div className="config-section">
            <label className="cyber-label">Difficulty Tier</label>
            <div className="difficulty-grid">
              {difficulties.map((d) => (
                <button
                  key={d.id}
                  className={`difficulty-card ${difficulty === d.id ? 'selected' : ''}`}
                  style={{ '--card-color': d.color }}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span className="diff-label" style={{ color: d.color }}>{d.label}</span>
                  <span className="diff-desc">{d.desc}</span>
                  {difficulty === d.id && <div className="diff-selected-indicator"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div className="config-section">
            <label className="cyber-label">Question Count</label>
            <div className="q-count-grid">
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <button
                  key={n}
                  className={`q-count-btn ${numQuestions === n ? 'selected' : ''}`}
                  onClick={() => setNumQuestions(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type */}
          <div className="config-section">
            <label className="cyber-label">Question Type Protocol</label>
            <div className="qtype-grid">
              {qTypes.map((qt, idx) => (
                <button
                  key={qt}
                  className={`qtype-card ${questionType === qTypeKeys[idx] ? 'selected' : ''}`}
                  onClick={() => setQuestionType(qTypeKeys[idx])}
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          <div className="step-nav-row">
            <button className="neon-button neon-button-purple" onClick={() => setStep(1)}>
              ← BACK
            </button>
            <button className="neon-button step-next-btn" onClick={() => setStep(3)}>
              <span>INITIATE_GENERATION</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 - Generate */}
      {step === 3 && (
        <div className="glass-panel gen-step-panel gen-step-3 fade-in">
          <div className="cyber-accent accent-top-left"></div>
          <div className="cyber-accent accent-bottom-right"></div>
          <h2 className="step-title">COGNITIVE_SYNTHESIS_ENGINE</h2>
          <p className="step-desc">Review your configuration and trigger the AI generation sequence.</p>

          <div className="config-summary-grid">
            <div className="summary-item">
              <span className="summary-label">SOURCE</span>
              <span className="summary-value neon-text-blue">
                {inputMode === 'file' ? uploadedFile?.name : 'Direct Text Input'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">DIFFICULTY</span>
              <span className="summary-value neon-text-purple">{difficulty.toUpperCase()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">QUESTIONS</span>
              <span className="summary-value neon-text-cyan">{numQuestions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">TYPE</span>
              <span className="summary-value">{questionType}</span>
            </div>
          </div>

          {quizLoading ? (
            <div className="ai-loading-wrapper">
              <div className="ai-loading-core">
                <div className="ai-ring ai-ring-1"></div>
                <div className="ai-ring ai-ring-2"></div>
                <div className="ai-ring ai-ring-3"></div>
                <Cpu size={32} className="neon-text-cyan ai-loader-icon anim-pulse" />
              </div>
              <p className="ai-loading-text neon-text-blue">AI_COGNITION_ENGINE PROCESSING...</p>
              <p className="ai-loading-sub">Extracting semantic concepts and generating question nodes</p>
            </div>
          ) : (
            <button className="neon-button generate-main-btn" onClick={handleGenerate}>
              <Zap size={20} />
              <span>GENERATE_QUIZ_NOW</span>
            </button>
          )}

          {!quizLoading && (
            <button className="neon-button neon-button-purple step-back-btn" onClick={() => setStep(2)}>
              ← RECONFIGURE
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerateQuizPage;
