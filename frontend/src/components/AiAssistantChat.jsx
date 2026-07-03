import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send, Bot, X, Sparkles, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import './AiAssistantChat.css';

const AiAssistantChat = ({ isOpen, onClose }) => {
  const { token, mode, apiBaseUrl } = useAppContext();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Greetings, user! I am your cybernetic AI assistant. Ask me how to generate a quiz, which files are supported, or how scoring works!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom when messages list updates or chat opens
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const getDemoResponse = (prompt) => {
    const query = prompt.toLowerCase();
    if (query.includes('generate') || query.includes('create') || query.includes('make') || query.includes('how to use')) {
      return "To generate a quiz, navigate to 'Generate Quiz' on the sidebar. Upload a document (PDF, DOCX, TXT, or Image) or paste your notes directly, choose a difficulty level and question type, and click 'Generate Quiz Now'!";
    }
    if (query.includes('file') || query.includes('pdf') || query.includes('docx') || query.includes('txt') || query.includes('image') || query.includes('upload') || query.includes('format')) {
      return "We support PDF, DOCX, TXT, and common image formats (JPG/PNG). Image files undergo OCR processing to automatically extract text for the quiz questions.";
    }
    if (query.includes('score') || query.includes('grade') || query.includes('calculate') || query.includes('history') || query.includes('report')) {
      return "Your submissions are graded instantly! You can view detailed correct, incorrect, and skipped counts, score percentages, and AI diagnostic feedback. All past reports are saved under 'Quiz History'.";
    }
    if (query.includes('mixed') || query.includes('mcq') || query.includes('tf') || query.includes('fitb') || query.includes('type')) {
      return "We support Multiple Choice Questions (MCQ), True/False (TF), Fill in the Blanks (FITB), or 'Mixed' mode which constructs a custom blend of all three types.";
    }
    if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('who are you')) {
      return "Greetings, user! I am your cybernetic AI assistant. How can I help you navigate the Quiz AI Gen system today?";
    }
    if (query.includes('feedback') || query.includes('suggest') || query.includes('issue') || query.includes('error') || query.includes('bug')) {
      return "We highly value your feedback! If you run into any issues, verify that your document text is clean and legible. Let us know if you have suggestions for improvement.";
    }
    return "I am your Quiz AI assistant. You can upload study documents, generate customized quizzes, evaluate your knowledge, and review past reports. Try asking 'How do I generate a quiz?' or 'What file formats are supported?'";
  };

  const handleSendMessage = async (textToSend) => {
    const promptText = textToSend.trim();
    if (!promptText) return;

    // Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    let replyText = '';

    try {
      if (mode === 'api' && token) {
        // Query Spring Boot API
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
          // fallback to client-side answers on network/server error
          replyText = getDemoResponse(promptText);
        }
      } else {
        // Demo response
        await new Promise((r) => setTimeout(r, 600));
        replyText = getDemoResponse(promptText);
      }
    } catch (e) {
      console.error("Chat communication failure: ", e);
      replyText = getDemoResponse(promptText);
    }

    // Add Assistant Message
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
    handleSendMessage(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue);
    }
  };

  const suggestions = [
    { text: 'How do I generate a quiz?', icon: <HelpCircle size={14} /> },
    { text: 'What files are supported?', icon: <FileText size={14} /> },
    { text: 'How are quizzes graded?', icon: <CheckCircle2 size={14} /> }
  ];

  return (
    <div className={`assistant-chat-panel ${isOpen ? 'open' : ''}`}>
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
      {messages.length === 1 && !isLoading && (
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Query the system database..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() || isLoading}>
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiAssistantChat;
