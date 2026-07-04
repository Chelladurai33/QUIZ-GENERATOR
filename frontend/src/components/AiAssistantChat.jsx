import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send, Bot, X, Sparkles, HelpCircle, FileText, CheckCircle2, Upload, Paperclip } from 'lucide-react';
import './AiAssistantChat.css';

const AiAssistantChat = ({ isOpen, onClose, setActivePage }) => {
  const { token, mode, apiBaseUrl, generateQuiz, setActiveQuiz } = useAppContext();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Greetings, user! I am your cybernetic AI assistant. I can help you generate quizzes directly from this chat! Upload a file or paste text, and I\'ll create a customized quiz for you.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Wizard States
  const [wizardStep, setWizardStep] = useState(0); // 0 = normal chat, 1 = choose source, 2 = choose options, 3 = confirm
  const [wizardSource, setWizardSource] = useState(null); // 'file' or 'text'
  const [wizardText, setWizardText] = useState('');
  const [wizardDifficulty, setWizardDifficulty] = useState('Medium');
  const [wizardQuestionType, setWizardQuestionType] = useState('Mixed');
  const [wizardNumQuestions, setWizardNumQuestions] = useState(10);

  // Auto scroll to bottom when messages list updates or chat opens
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const appendUserMsg = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const appendAssistantMsg = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'assistant',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const startQuizWizard = () => {
    setWizardStep(1);
    setWizardSource(null);
    setWizardText('');
    setUploadedFile(null);
    setWizardDifficulty('Medium');
    setWizardQuestionType('Mixed');
    setWizardNumQuestions(10);

    appendAssistantMsg("🤖 Guided Quiz Generator activated! Let's construct a customized quiz step-by-step. Step 1: Please select how you want to provide the study material using the controls below.");
  };

  const cancelWizard = () => {
    setWizardStep(0);
    setWizardSource(null);
    setWizardText('');
    setUploadedFile(null);
    appendAssistantMsg("Guided Quiz Generator deactivated. You can chat with me normally now.");
  };

  const handleWizardGenerate = async () => {
    setIsLoading(true);
    appendUserMsg(`Starting generation of ${wizardNumQuestions} ${wizardQuestionType} questions (${wizardDifficulty} difficulty)...`);
    
    try {
      const config = {
        difficulty: wizardDifficulty,
        questionType: wizardQuestionType,
        numQuestions: wizardNumQuestions
      };
      
      const fileToUse = wizardSource === 'file' ? uploadedFile : null;
      const textToUse = wizardSource === 'text' ? wizardText : '';
      
      const quiz = await generateQuiz(fileToUse, textToUse, config);
      
      if (quiz) {
        setActiveQuiz(quiz);
        appendAssistantMsg(`✅ Quiz generated successfully! "${quiz.title}" with ${quiz.questionCount} questions. Redirecting to your quiz page...`);
        
        // Reset wizard
        setWizardStep(0);
        setWizardSource(null);
        setWizardText('');
        setUploadedFile(null);
        
        setTimeout(() => {
          setActivePage('quiz');
          onClose();
        }, 1500);
      } else {
        throw new Error("Could not parse study concepts.");
      }
    } catch (error) {
      appendAssistantMsg(`❌ Generation failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoResponse = (prompt) => {
    const query = prompt.toLowerCase();
    
    // Quiz generation intent detection
    if (query.includes('generate') || query.includes('create') || query.includes('make')) {
      if (query.includes('quiz')) {
        return "I can help you generate a quiz right here! Click the attachment icon 📎 to upload a file, or paste your text directly. Tell me your preferences for difficulty (Easy/Medium/Hard), question type (MCQ/TF/FITB/Mixed), and number of questions.";
      }
      if (query.includes('how to use')) {
        return "To generate a quiz, navigate to 'Generate Quiz' on the sidebar. Upload a document (PDF, DOCX, TXT, or Image) or paste your notes directly, choose a difficulty level and question type, and click 'Generate Quiz Now'!";
      }
    }
    
    // File format support
    if (query.includes('file') || query.includes('pdf') || query.includes('docx') || query.includes('txt') || query.includes('image') || query.includes('upload') || query.includes('format')) {
      return "We support PDF, DOCX, TXT, PPT, and common image formats (JPG/PNG). Click the attachment icon 📎 in this chat to upload a file directly!";
    }
    
    // Scoring and history
    if (query.includes('score') || query.includes('grade') || query.includes('calculate') || query.includes('history') || query.includes('report')) {
      return "Your submissions are graded instantly! You can view detailed correct, incorrect, and skipped counts, score percentages, and AI diagnostic feedback. All past reports are saved under 'Quiz History'.";
    }
    
    // Question types
    if (query.includes('mixed') || query.includes('mcq') || query.includes('tf') || query.includes('fitb') || query.includes('type')) {
      return "We support Multiple Choice Questions (MCQ), True/False (TF), Fill in the Blanks (FITB), or 'Mixed' mode which constructs a custom blend of all three types.";
    }
    
    // Difficulty levels
    if (query.includes('difficulty') || query.includes('easy') || query.includes('medium') || query.includes('hard')) {
      return "Choose from four difficulty levels: Easy (fundamental recall), Medium (conceptual application), Hard (analytical deep-dive), or Mixed (adaptive all-levels).";
    }
    
    // Greetings
    if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('who are you')) {
      return "Greetings, user! I am your cybernetic AI assistant. I can help you generate quizzes directly from this chat! Upload a file or paste text to get started.";
    }
    
    // Feedback and issues
    if (query.includes('feedback') || query.includes('suggest') || query.includes('issue') || query.includes('error') || query.includes('bug')) {
      return "We highly value your feedback! If you run into any issues, verify that your document text is clean and legible. Let us know if you have suggestions for improvement.";
    }
    
    // Help and guidance
    if (query.includes('help') || query.includes('guide') || query.includes('tutorial')) {
      return "I'm here to help! You can ask me to: 1) Generate quizzes from your content, 2) Explain how to use features, 3) Get recommendations for quiz settings. What would you like to do?";
    }
    
    return "I am your Quiz AI assistant. You can upload study documents, generate customized quizzes, evaluate your knowledge, and review past reports. Try asking 'Generate a quiz' or click the attachment icon to upload a file!";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      if (wizardStep === 1) {
        setWizardSource('file');
        appendUserMsg(`📎 Attached file: ${file.name}`);
        appendAssistantMsg(`File "${file.name}" attached successfully! Select "Next ➜" below to configure quiz options.`);
      } else {
        const userMsg = {
          id: Date.now(),
          sender: 'user',
          text: `📎 Uploaded file: ${file.name}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, userMsg]);
        
        const assistantMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `File "${file.name}" received! Now tell me your quiz preferences: difficulty (Easy/Medium/Hard), question type (MCQ/TF/FITB/Mixed), and number of questions. Or just say "Generate quiz" for default settings.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    }
  };

  const generateQuizFromChat = async (config = {}) => {
    const { difficulty = 'Medium', questionType = 'Mixed', numQuestions = 10 } = config;
    
    setIsLoading(true);
    const loadingMsg = {
      id: Date.now(),
      sender: 'assistant',
      text: `🔄 Generating ${difficulty} quiz with ${numQuestions} ${questionType} questions...`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const quizConfig = { difficulty, questionType, numQuestions };
      const quiz = await generateQuiz(uploadedFile, inputValue, quizConfig);
      
      if (quiz) {
        setActiveQuiz(quiz);
        const successMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `✅ Quiz generated successfully! "${quiz.title}" with ${quiz.questionCount} questions. Redirecting to quiz page...`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, successMsg]);
        
        // Clear inputs
        setInputValue('');
        setUploadedFile(null);
        
        // Redirect to quiz page after a short delay
        setTimeout(() => {
          setActivePage('quiz');
          onClose();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `❌ Failed to generate quiz: ${error.message}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseQuizConfig = (text) => {
    const config = { difficulty: 'Medium', questionType: 'Mixed', numQuestions: 10 };
    
    const lowerText = text.toLowerCase();
    
    // Parse difficulty
    if (lowerText.includes('easy')) config.difficulty = 'Easy';
    else if (lowerText.includes('hard')) config.difficulty = 'Hard';
    else if (lowerText.includes('medium')) config.difficulty = 'Medium';
    else if (lowerText.includes('mixed')) config.difficulty = 'Mixed';
    
    // Parse question type
    if (lowerText.includes('mcq') || lowerText.includes('multiple choice')) config.questionType = 'MCQ';
    else if (lowerText.includes('tf') || lowerText.includes('true/false')) config.questionType = 'TF';
    else if (lowerText.includes('fitb') || lowerText.includes('fill in the blank')) config.questionType = 'FITB';
    else if (lowerText.includes('mixed')) config.questionType = 'Mixed';
    
    // Parse number of questions
    const numberMatch = text.match(/(\d+)\s*(questions|qs|q)/i);
    if (numberMatch) {
      config.numQuestions = parseInt(numberMatch[1]);
    }
    
    return config;
  };

  const handleSendMessage = async (textToSend) => {
    const promptText = textToSend.trim();
    if (!promptText) return;

    // Check if user wants to generate a quiz
    const lowerPrompt = promptText.toLowerCase();
    const wantsQuizGeneration = lowerPrompt.includes('generate') && lowerPrompt.includes('quiz');
    const wantsRecommendations = lowerPrompt.includes('recommend') || lowerPrompt.includes('suggest') || lowerPrompt.includes('analyze');
    
    // Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    
    // If user wants recommendations and has content
    if (wantsRecommendations && (uploadedFile || inputValue.length > 30)) {
      setIsLoading(true);
      try {
        let contentToAnalyze = inputValue;
        if (uploadedFile) {
          contentToAnalyze = inputValue || "File content analysis requires text input. Please paste the content or use the Generate Quiz page.";
        }
        
        if (contentToAnalyze.length > 30) {
          const response = await fetch(`${apiBaseUrl}/chat/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(mode === 'api' && token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ content: contentToAnalyze })
          });
          
          let replyText;
          if (response.ok) {
            const data = await response.json();
            replyText = data.recommendations;
          } else {
            replyText = getDemoResponse(promptText);
          }
          
          const assistantMsg = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const assistantMsg = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: "To provide recommendations, I need more content! Please paste your study material text (at least 30 characters) or upload a file.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (e) {
        console.error("Analysis failed: ", e);
        const errorMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: "Analysis failed. Please try again or use the default quiz settings.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // If user wants to generate quiz and has content
    if (wantsQuizGeneration && (uploadedFile || inputValue.length > 30)) {
      const config = parseQuizConfig(promptText);
      await generateQuizFromChat(config);
      return;
    }
    
    // If user wants to generate quiz but no content, launch the wizard!
    if (wantsQuizGeneration && !uploadedFile && inputValue.length <= 30) {
      startQuizWizard();
      return;
    }
    
    setIsLoading(true);

    let replyText = '';

    try {
      if (mode === 'api' && token) {
        const response = await fetch(`${apiBaseUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prompt: promptText })
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.response;
        } else {
          replyText = getDemoResponse(promptText);
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        replyText = getDemoResponse(promptText);
      }
    } catch (e) {
      console.error("Chat communication failure: ", e);
      replyText = getDemoResponse(promptText);
    }

    const assistantMsg = {
      id: Date.now() + 1,
      sender: 'assistant',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion === 'Generate a quiz for me') {
      startQuizWizard();
    } else {
      handleSendMessage(suggestion);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue);
    }
  };

  const suggestions = [
    { text: 'Generate a quiz for me', icon: <Sparkles size={14} /> },
    { text: 'Recommend quiz settings', icon: <HelpCircle size={14} /> },
    { text: 'What files are supported?', icon: <FileText size={14} /> }
  ];

  return (
    <div className={`assistant-chat-panel ${isOpen ? 'open' : ''}`}>
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handleFileUpload}
        accept=".pdf,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
      />
      {/* Header */}
      <div className="chat-header">
        <div className="header-title">
          <Bot size={20} className="assistant-bot-icon animate-pulse" />
          <div>
            <div className="title-text">AI ASSISTANT</div>
            <div className="status-indicator">
              <span className="dot"></span>
              <span className="status-label">Online</span>
            </div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            {msg.sender === 'assistant' && (
              <div className="bot-avatar">
                <Bot size={16} />
              </div>
            )}
            <div className="message-bubble">
              <div className="message-text">{msg.text}</div>
              {msg.id === 1 && wizardStep === 0 && (
                <button
                  type="button"
                  className="wizard-trigger-btn"
                  onClick={startQuizWizard}
                >
                  <Sparkles size={14} /> Start Guided Quiz Generator
                </button>
              )}
              <div className="message-time">{msg.time}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="bot-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble loading-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && !isLoading && wizardStep === 0 && (
        <div className="quick-suggestions">
          <div className="suggestions-title">
            <Sparkles size={12} className="suggestions-icon" />
            <span>Suggested Queries</span>
          </div>
          <div className="suggestions-list">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                className="suggestion-pill"
                onClick={() => handleSuggestionClick(sug.text)}
              >
                {sug.icon}
                <span>{sug.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form or Wizard Panel */}
      {wizardStep > 0 ? (
        <div className="chat-wizard-panel">
          <div className="wizard-step-header">
            <span className="step-title">
              {wizardStep === 1 && "Step 1: Choose Study Material"}
              {wizardStep === 2 && "Step 2: Quiz Configuration"}
              {wizardStep === 3 && "Step 3: Confirm Generation"}
            </span>
            <span className="step-count">Step {wizardStep} of 3</span>
          </div>

          <div className="wizard-step-content">
            {wizardStep === 1 && (
              <div className="wizard-step-1">
                <div className="wizard-source-buttons">
                  <button
                    type="button"
                    className={`wizard-source-btn ${wizardSource === 'file' ? 'active' : ''}`}
                    onClick={() => {
                      setWizardSource('file');
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={18} />
                    <span>Upload Document</span>
                  </button>
                  <button
                    type="button"
                    className={`wizard-source-btn ${wizardSource === 'text' ? 'active' : ''}`}
                    onClick={() => setWizardSource('text')}
                  >
                    <FileText size={18} />
                    <span>Paste Text Notes</span>
                  </button>
                </div>

                {wizardSource === 'file' && (
                  <div className="wizard-file-selected">
                    {uploadedFile ? (
                      <div className="file-pill">
                        <Paperclip size={12} />
                        <span className="file-name">{uploadedFile.name}</span>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => {
                            setUploadedFile(null);
                            setWizardSource(null);
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="no-file-msg">No file selected. Click upload above.</span>
                    )}
                  </div>
                )}

                {wizardSource === 'text' && (
                  <textarea
                    className="wizard-textarea"
                    placeholder="Paste your study material here (at least 30 characters)..."
                    value={wizardText}
                    onChange={(e) => setWizardText(e.target.value)}
                  />
                )}
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-step-2">
                <div className="wizard-field">
                  <label>Difficulty Level</label>
                  <div className="wizard-btn-group">
                    {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        className={`wizard-select-btn ${wizardDifficulty === diff ? 'active' : ''}`}
                        onClick={() => setWizardDifficulty(diff)}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wizard-field">
                  <label>Question Type</label>
                  <div className="wizard-btn-group">
                    {['MCQ', 'TF', 'FITB', 'Mixed'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`wizard-select-btn ${wizardQuestionType === t ? 'active' : ''}`}
                        onClick={() => setWizardQuestionType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wizard-field-row">
                  <label>Number of Questions</label>
                  <select
                    className="wizard-select"
                    value={wizardNumQuestions}
                    onChange={(e) => setWizardNumQuestions(parseInt(e.target.value))}
                  >
                    {[5, 10, 15, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="wizard-step-3">
                <div className="wizard-summary-card">
                  <div className="summary-row">
                    <span className="summary-label">Source:</span>
                    <span className="summary-val text-ellipsis">
                      {wizardSource === 'file' ? `📄 ${uploadedFile?.name || 'File'}` : `✍️ Text (${wizardText.length} chars)`}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Difficulty:</span>
                    <span className="summary-val highlight-cyan">{wizardDifficulty}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Type:</span>
                    <span className="summary-val highlight-blue">{wizardQuestionType}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Questions:</span>
                    <span className="summary-val highlight-pink">{wizardNumQuestions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="wizard-step-actions">
            <button
              type="button"
              className="wizard-action-btn cancel"
              onClick={cancelWizard}
            >
              Cancel
            </button>
            
            {wizardStep > 1 && (
              <button
                type="button"
                className="wizard-action-btn back"
                onClick={() => setWizardStep(prev => prev - 1)}
              >
                Back
              </button>
            )}

            {wizardStep < 3 ? (
              <button
                type="button"
                className="wizard-action-btn next"
                disabled={
                  wizardStep === 1 &&
                  ((wizardSource === 'file' && !uploadedFile) ||
                   (wizardSource === 'text' && wizardText.trim().length < 30) ||
                   !wizardSource)
                }
                onClick={() => {
                  if (wizardStep === 1) {
                    const contentDesc = wizardSource === 'file' ? `file "${uploadedFile.name}"` : 'pasted text';
                    appendUserMsg(`Step 1 Complete: Provided study material via ${contentDesc}.`);
                    appendAssistantMsg("Great! Content source confirmed. Step 2: Select your preferred quiz settings (Difficulty, Type, Count) below.");
                  } else if (wizardStep === 2) {
                    appendUserMsg(`Step 2 Complete: Configured quiz parameters.`);
                    appendAssistantMsg("Excellent. Step 3: Please confirm all settings and click the Generate button to run the AI generator.");
                  }
                  setWizardStep(prev => prev + 1);
                }}
              >
                Next ➜
              </button>
            ) : (
              <button
                type="button"
                className="wizard-action-btn generate"
                disabled={isLoading}
                onClick={handleWizardGenerate}
              >
                {isLoading ? "Generating..." : "🚀 Generate Quiz"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="chat-input-wrapper">
            <button
              type="button"
              className="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload file for quiz generation"
            >
              <Paperclip size={16} />
            </button>
            <input
              type="text"
              className="chat-input-field"
              placeholder={uploadedFile ? `File: ${uploadedFile.name} - Add instructions...` : "Ask me anything or paste text to generate a quiz..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() && !uploadedFile || isLoading}>
              <Send size={16} />
            </button>
          </div>
          {uploadedFile && (
            <div className="chat-file-indicator">
              <FileText size={12} />
              <span>{uploadedFile.name}</span>
              <button type="button" onClick={() => setUploadedFile(null)} className="remove-file-btn">
                <X size={12} />
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default AiAssistantChat;
