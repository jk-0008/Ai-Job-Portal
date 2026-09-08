import { useState, useEffect, useRef } from 'react';
import API from '../api';
import jobiIcon from '../assets/jobi-icon.jpg';

// Helper to render formatted markdown-like text in chat bubbles
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (str) => {
    // Regex for bold **text** and inline `code`
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#ffffff', fontWeight: '600' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '4px' }} />;
        }

        // Section Headers (e.g. ### Header)
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#60a5fa',
                marginTop: idx > 0 ? '6px' : '0',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid rgba(96, 165, 250, 0.2)',
                paddingBottom: '4px',
              }}
            >
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </div>
          );
        }

        // Subheaders (e.g. #### Subheader)
        if (trimmed.startsWith('#### ')) {
          return (
            <div
              key={idx}
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#93c5fd',
                marginTop: '4px',
              }}
            >
              {renderInline(trimmed.replace(/^####\s+/, ''))}
            </div>
          );
        }

        // Bullet Items (e.g. • or * or -)
        if (/^[•*-]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[•*-]\s+/, '');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                paddingLeft: '4px',
                fontSize: '13.5px',
                lineHeight: '1.45',
              }}
            >
              <span style={{ color: '#3b82f6', fontSize: '14px', lineHeight: '1.2' }}>•</span>
              <div style={{ flex: 1 }}>{renderInline(content)}</div>
            </div>
          );
        }

        // Numbered List Items (e.g. 1. Item)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          const [, num, content] = numMatch;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                paddingLeft: '2px',
                fontSize: '13.5px',
                lineHeight: '1.45',
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {num}
              </span>
              <div style={{ flex: 1 }}>{renderInline(content)}</div>
            </div>
          );
        }

        // Highlight/Callout lines (e.g. 💡 Tip: or 👉 Note:)
        if (/^[💡👉🔒🎉✅⚠️⭐🔍]/.test(trimmed)) {
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                borderLeft: '3px solid #3b82f6',
                borderRadius: '0 6px 6px 0',
                padding: '6px 10px',
                margin: '4px 0',
                fontSize: '12.5px',
                color: '#cbd5e1',
              }}
            >
              {renderInline(trimmed)}
            </div>
          );
        }

        // Regular Text
        return (
          <div key={idx} style={{ fontSize: '13.5px', lineHeight: '1.45' }}>
            {renderInline(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // User Context from storage
  const userRole = localStorage.getItem('userRole') || 'guest';
  const username = localStorage.getItem('username') || '';
  const userDepartment = localStorage.getItem('userDepartment') || '';
  const companyName = localStorage.getItem('companyName') || '';

  // Tailored initial greeting based on active role
  const getInitialGreeting = () => {
    if (userRole === 'hiring_manager') {
      const dept = userDepartment ? `${companyName || 'Company'} · ${userDepartment}` : 'your department';
      return `Hello ${username || 'Hiring Lead'}! 👋 I'm Jobi, your AI Technical Interview & Recruitment Assistant. How can I assist with candidate screening, interview questions, or applicant metrics for **${dept}** today?`;
    }
    if (userRole === 'recruiter' || userRole === 'company_admin') {
      return `Hello ${username || 'there'}! 👋 I'm Jobi, your AI Recruitment Assistant. How can I assist with candidate pipelines, hiring statistics, or job postings today?`;
    }
    if (userRole === 'job_seeker') {
      return `Hello ${username || 'there'}! 👋 I'm Jobi, your AI Career Assistant. How can I assist with your job search, application status, or technical interview prep today?`;
    }
    return "Hello! 👋 I'm Jobi, your AI Career & Interview Assistant. How can I assist with job search, application tracking, or interview preparation today?";
  };

  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: getInitialGreeting(),
    },
  ]);

  // Dynamic Suggestion Prompt Pills tailored to role
  const getPromptPills = () => {
    if (userRole === 'hiring_manager') {
      return [
        { label: '👥 Department Stats', query: 'Show my department candidate pipeline stats' },
        { label: '🎯 Evaluate Interview Fit', query: 'How to evaluate candidate interview fit with Jobi AI?' },
        { label: '☕ Java Interview Questions', query: 'Practice interview questions for Java & Spring Boot' },
        { label: '📋 Application Conditions', query: 'Explain the 4 application conditions and screening stages' },
      ];
    }
    if (userRole === 'recruiter' || userRole === 'company_admin') {
      return [
        { label: '📈 Hiring Statistics', query: 'What are our current hiring statistics?' },
        { label: '🎯 Interview Fit Guide', query: 'How to evaluate candidate interview fit with Jobi AI?' },
        { label: '➕ How to Post a Job', query: 'How do I post a new job opening?' },
        { label: '🤖 AI Resume Scoring', query: 'How does Jobi AI score candidates?' },
      ];
    }
    // Job seeker & guest
    return [
      { label: '☕ Java Interview Prep', query: 'Practice interview questions for Java & Spring Boot' },
      { label: '📊 Track My Application', query: 'What is the current status and condition of my application?' },
      { label: '🔍 Find Java Roles', query: 'Find Java developer jobs in Chennai' },
      { label: '📝 Resume Optimization', query: 'How can I optimize my resume for AI scoring?' },
      { label: '💰 Salary Insights', query: 'What is the salary benchmark for Java and Python developers?' },
    ];
  };

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping]);

  // Ensure no lingering speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  // Core Send Routine
  const sendQuery = async (queryText) => {
    const textToSend = (queryText || '').trim();
    if (!textToSend) return;

    setMessage('');
    setChatLog((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setIsTyping(true);

    try {
      const res = await API.post('applications/chatbot/', { message: textToSend });
      const botReply = res.data.reply;
      setIsTyping(false);
      setChatLog((prev) => [...prev, { sender: 'ai', text: botReply }]);
    } catch {
      setIsTyping(false);
      const errorText = "I ran into an issue connecting to the network. Please verify the backend is running and try again.";
      setChatLog((prev) => [...prev, { sender: 'ai', text: errorText }]);
    }
  };

  // Open Chatbot and automatically send prompt when requested from Application Tracker
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        setTimeout(() => {
          sendQuery(e.detail.prompt);
        }, 150);
      }
    };
    window.addEventListener('openJobiChat', handleOpen);
    return () => window.removeEventListener('openJobiChat', handleOpen);
  }, []);

  const handleSend = () => {
    sendQuery(message);
  };

  const handleResetChat = () => {
    setChatLog([
      {
        sender: 'ai',
        text: getInitialGreeting(),
      },
    ]);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  // Role subtitle for header
  const getRoleHeaderBadge = () => {
    if (userRole === 'hiring_manager') {
      return userDepartment ? `${userDepartment} Lead` : 'Hiring Manager';
    }
    if (userRole === 'recruiter') return 'Recruiter';
    if (userRole === 'company_admin') return 'Company Admin';
    if (userRole === 'job_seeker') return 'Job Seeker';
    return 'Guest';
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={styles.launcherBtn}
          title="Open Jobi AI Assistant"
        >
          <img src={jobiIcon} alt="Jobi AI" style={styles.launcherIcon} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '700', lineHeight: '1.2' }}>Ask Jobi</span>
            <span style={{ fontSize: '10px', color: '#93c5fd', fontWeight: '500' }}>AI Assistant</span>
          </div>
          <span style={styles.onlineDot} />
        </button>
      )}

      {/* Main Container */}
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <img src={jobiIcon} alt="Jobi AI" style={styles.avatarImg} />
                <span style={styles.avatarOnlineDot} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Jobi</span>
                  <span style={styles.aiBadge}>AI 2.5</span>
                  <span style={styles.roleBadge}>{getRoleHeaderBadge()}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Smart Career & Technical Interview Assistant
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Reset / Clear Chat Button */}
              <button
                onClick={handleResetChat}
                style={styles.headerActionBtn}
                title="Restart conversation"
              >
                ↺
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={styles.headerActionBtn}
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat History Stream */}
          <div style={styles.messageStream}>
            {chatLog.map((chat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={styles.senderLabel(chat.sender)}>
                  {chat.sender === 'user' ? (
                    'You'
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <img src={jobiIcon} alt="" aria-hidden="true" style={styles.miniIcon} />
                      Jobi AI
                    </span>
                  )}
                </div>

                <div style={styles.messageBubble(chat.sender)}>
                  {chat.sender === 'user' ? (
                    <span>{chat.text}</span>
                  ) : (
                    <FormattedMessage text={chat.text} />
                  )}
                </div>

                {/* Copy action for AI messages */}
                {chat.sender === 'ai' && (
                  <div style={{ marginTop: '4px', marginLeft: '4px' }}>
                    <button
                      onClick={() => handleCopyText(chat.text, idx)}
                      style={styles.copyBtn}
                      title="Copy response"
                    >
                      {copiedIdx === idx ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={styles.typingIndicator}>
                <img src={jobiIcon} alt="" aria-hidden="true" style={styles.miniIcon} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Jobi is thinking
                  <span className="dot-pulse" style={styles.dotPulse}>...</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Suggestion Pills */}
          <div style={styles.pillsContainer}>
            <div style={styles.pillsScroll}>
              {getPromptPills().map((pill, i) => (
                <button
                  key={i}
                  onClick={() => sendQuery(pill.query)}
                  style={styles.pillBtn}
                  disabled={isTyping}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div style={styles.inputContainer}>
            <div style={styles.inputCapsule}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                placeholder={userRole === 'hiring_manager' ? "Ask about candidates, interview fit..." : "Ask Jobi about jobs, interview prep..."}
                style={styles.textInput}
                disabled={isTyping}
              />

              <button
                onClick={handleSend}
                disabled={!message.trim() || isTyping}
                style={styles.sendBtn(!!message.trim() && !isTyping)}
                title="Send message"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Styles
const styles = {
  launcherBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
    color: '#ffffff',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '30px',
    padding: '8px 16px 8px 10px',
    boxShadow: '0 10px 28px rgba(37, 99, 235, 0.38)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1000,
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
  },
  launcherIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #60a5fa',
    display: 'block',
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 6px #10b981',
    marginLeft: '2px',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '410px',
    maxWidth: 'calc(100vw - 32px)',
    height: '590px',
    maxHeight: 'calc(100vh - 48px)',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    borderRadius: '20px',
    boxShadow: '0 20px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(59, 130, 246, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '14px 16px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarImg: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #3b82f6',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
    display: 'block',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid #1e293b',
  },
  aiBadge: {
    fontSize: '9.5px',
    fontWeight: '800',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    color: '#60a5fa',
    padding: '1px 6px',
    borderRadius: '6px',
    border: '1px solid rgba(96, 165, 250, 0.35)',
    letterSpacing: '0.4px',
  },
  roleBadge: {
    fontSize: '9.5px',
    fontWeight: '600',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    color: '#94a3b8',
    padding: '1px 6px',
    borderRadius: '6px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  },
  headerActionBtn: {
    background: 'rgba(51, 65, 85, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#cbd5e1',
    fontSize: '14px',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  messageStream: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#0f172a',
  },
  senderLabel: (sender) => ({
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
    paddingLeft: sender === 'ai' ? '4px' : '0px',
    fontWeight: '500',
  }),
  miniIcon: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'inline-block',
    border: '1px solid #3b82f6',
  },
  messageBubble: (sender) => ({
    backgroundColor: sender === 'user' ? '#2563eb' : '#1e293b',
    color: sender === 'user' ? '#ffffff' : '#e2e8f0',
    padding: sender === 'user' ? '9px 14px' : '12px 16px',
    borderRadius: sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    maxWidth: '90%',
    fontSize: '13.5px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    border: sender === 'user' ? 'none' : '1px solid #334155',
    boxShadow: sender === 'user' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
  }),
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'color 0.15s ease',
  },
  typingIndicator: {
    fontSize: '12px',
    color: '#60a5fa',
    fontStyle: 'italic',
    paddingLeft: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dotPulse: {
    letterSpacing: '2px',
    fontWeight: '700',
  },
  pillsContainer: {
    padding: '8px 12px',
    backgroundColor: '#111827',
    borderTop: '1px solid #1f2937',
  },
  pillsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
    scrollbarWidth: 'none',
  },
  pillBtn: {
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    color: '#93c5fd',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11.5px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  inputContainer: {
    padding: '10px 14px 14px 14px',
    backgroundColor: '#111827',
    borderTop: '1px solid #1e293b',
  },
  inputCapsule: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: '24px',
    padding: '4px 10px 4px 14px',
    border: '1px solid #334155',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '13px',
    padding: '6px 4px',
  },
  sendBtn: (active) => ({
    background: active ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#334155',
    border: 'none',
    color: active ? '#ffffff' : '#64748b',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: active ? 'pointer' : 'default',
    boxShadow: active ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none',
    transition: 'all 0.15s ease',
  }),
};