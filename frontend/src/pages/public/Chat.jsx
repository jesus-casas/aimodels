import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { tempChatAPI } from '../../services/api';
import folderImg from '../../images/folder.png';
import editImg from '../../images/edit.png';
import sidebarImg from '../../images/sidebar.png';
import interfaceImg from '../../images/interface.png';
import arrowDownImg from '../../images/arrow-down.png';
import googleLogo from '../../images/google-icon-logo-svgrepo-com.svg';
import openaiLogo from '../../images/openai-svgrepo-com.svg';
import anthropicLogo from '../../images/anthropic.svg';
import deepseekLogo from '../../images/deepseek.svg';
import qwenColorLogo from '../../images/qwen-color.svg';
import grokLogo from '../../images/grok.svg';

// Icon component using imported images
const Icon = ({ name, style = {}, className = '', onClick }) => {
  switch (name) {
    case 'folder':
      return <img src={folderImg} alt="folder" style={{ width: 25, height: 25, ...style }} className={className} onClick={onClick} />;
    case 'edit':
      return <img src={editImg} alt="edit" style={{ width: 25, height: 25, ...style }} className={className} onClick={onClick} />;
    case 'sidebar':
      return <img src={sidebarImg} alt="sidebar" style={{ width: 25, height: 25, ...style }} className={className} onClick={onClick} />;
    case 'interface':
      return <img src={interfaceImg} alt="interface" style={{ width: 28, height: 28, ...style }} className={className} onClick={onClick} />;
    case 'arrow-down':
      return <img src={arrowDownImg} alt="arrow down" style={{ width: 18, height: 18, ...style }} className={className} onClick={onClick} />;
    default:
      return null;
  }
};

const modelOptions = [
  { label: 'GPT-4o', desc: 'Great for most tasks', img: openaiLogo },
  { label: 'o3', desc: 'Uses advanced reasoning', img: openaiLogo },
  { label: 'o4-mini', desc: 'Fastest at advanced reasoning', img: openaiLogo },
  { label: 'o4-mini-high', desc: 'Great at coding and visual reasoning', img: openaiLogo },
  { label: 'Qwen', desc: 'Alibaba Qwen Model', img: qwenColorLogo },
  { label: 'Meta', desc: 'Meta AI Model', img: 'https://web.lmarena.ai/images/models/meta.svg' },
  { label: 'Gemini-2.5-Pro-Preview-05-06', desc: 'Google Proprietary', img: googleLogo },
  { label: 'Claude 3.7 Sonnet (20250219)', desc: 'Anthropic Proprietary', img: anthropicLogo },
  { label: 'Gemini-2.5-Flash-Preview-05-20', desc: 'Google Proprietary', img: googleLogo },
  { label: 'GPT-4.1-2025-04-14', desc: 'OpenAI Proprietary', img: openaiLogo },
  { label: 'Claude 3.5 Sonnet (20241022)', desc: 'Anthropic Proprietary', img: anthropicLogo },
  { label: 'o3-2025-04-16', desc: 'OpenAI Proprietary', img: openaiLogo },
  { label: 'GPT-4.1-mini-2025-04-14', desc: 'OpenAI Proprietary', img: openaiLogo },
  { label: 'DeepSeek-V3-0324', desc: 'DeepSeek MIT', img: deepseekLogo },
  { label: 'DeepSeek-R1', desc: 'DeepSeek MIT', img: deepseekLogo },
  { label: 'Qwen3-235B-A22B', desc: 'Alibaba Qwen Model', img: qwenColorLogo },
  { label: 'Grok', desc: 'xAI Grok Model', img: grokLogo },
];

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(1);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownHover, setDropdownHover] = useState(false);

  // Get or generate a session_id for anonymous users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString();
      localStorage.setItem('anonymous_session_id', sessionId);
    }
    return sessionId;
  };

  // Load chat history on mount
  useEffect(() => {
    const loadChats = async () => {
      const sessionId = getSessionId();
      try {
        const chats = await tempChatAPI.getChats(sessionId);
        setChatHistory(chats);
        if (chats.length > 0) {
          setSelectedChat(chats[0].id);
        } else {
          // If no chats exist, create a new one
          const newChat = await tempChatAPI.createChat({ session_id: sessionId, title: 'New Chat' });
          setChatHistory([newChat]);
          setSelectedChat(newChat.id);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    loadChats();
  }, []);

  // Load messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      const loadMessages = async () => {
        try {
          const msgs = await tempChatAPI.getMessages(selectedChat);
          setMessages(msgs);
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      };
      loadMessages();
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // For interface icon animation
  const [interfaceFade, setInterfaceFade] = useState(false);
  useEffect(() => {
    if (isLoading) {
      setInterfaceFade(true);
    } else {
      setTimeout(() => setInterfaceFade(false), 400); // fade out after loading
    }
  }, [isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await tempChatAPI.addMessage({ chat_id: selectedChat, role: 'user', content: input });
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          content: "This is a simulated AI response. In a real implementation, this would be connected to an AI model API.",
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiResponse]);
        tempChatAPI.addMessage({ chat_id: selectedChat, role: 'assistant', content: aiResponse.content });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    const sessionId = getSessionId();
    try {
      const newChat = await tempChatAPI.createChat({ session_id: sessionId, title: 'New Chat' });
      setChatHistory(prev => [...prev, newChat]);
      setSelectedChat(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      {sidebarVisible && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <div style={styles.sidebarTopRow}>
              <Icon
                name="sidebar"
                style={{ marginRight: 12, cursor: 'pointer' }}
                onClick={() => {
                  console.log('Sidebar icon clicked: hiding sidebar');
                  setSidebarVisible(false);
                }}
              />
              <div style={{ flex: 1 }} />
              <Icon name="edit" style={{ marginRight: 10, cursor: 'pointer' }} onClick={handleNewChat} />
            </div>
            <div style={styles.logoRow}>
              <span style={styles.logo}>AI Models</span>
            </div>
          </div>
          <div style={styles.chatHistorySection}>
            <div style={styles.chatsTitle}>Chats</div>
            {chatHistory
              .map(chat => (
                <div
                  key={chat.id}
                  style={{
                    ...styles.chatItem,
                    ...(selectedChat === chat.id && styles.selectedItem)
                  }}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  {chat.title}
                </div>
              ))}
          </div>
        </div>
      )}
      {/* Main Chat Area */}
      <div style={styles.mainArea}>
        {/* Header with model dropdown */}
        <div style={styles.header}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            position: 'relative',
            padding: '0 24px'
          }}>
            {/* Left section: sidebar icon + model dropdown */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!sidebarVisible && (
                <Icon
                  name="sidebar"
                  style={{ marginRight: 12, cursor: 'pointer' }}
                  onClick={() => setSidebarVisible(true)}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    ...styles.modelDropdown,
                    background: dropdownHover ? '#f0f0f0' : '#fff',
                    border: 'none',
                    boxShadow: dropdownHover ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                  }}
                  onClick={() => setShowDropdown(v => !v)}
                  onMouseEnter={() => setDropdownHover(true)}
                  onMouseLeave={() => setDropdownHover(false)}
                  tabIndex={0}
                >
                  {/* Model Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {selectedModel.img && (
                      <img src={selectedModel.img} alt={selectedModel.label} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4, objectFit: 'contain' }} />
                    )}
                    <span style={styles.modelLabel}>{selectedModel.label}</span>
                  </div>
                  <Icon name="arrow-down" style={styles.dropdownArrow} />
                </div>
                {showDropdown && (
                  <div style={styles.dropdownMenu}>
                    {modelOptions.map((option, idx) => (
                      <div
                        key={option.label}
                        style={{
                          ...styles.dropdownItem,
                          ...(selectedModel.label === option.label ? styles.dropdownSelected : {}),
                          display: 'flex', alignItems: 'center'
                        }}
                        onClick={() => {
                          setSelectedModel(option);
                          setShowDropdown(false);
                        }}
                      >
                        {option.img && (
                          <img src={option.img} alt={option.label} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4, objectFit: 'contain' }} />
                        )}
                        <span style={{ verticalAlign: 'middle' }}>{option.label}</span>
                        <div style={{ fontSize: '0.85em', color: '#66666', marginLeft: 8 }}>{option.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Chat Window */}
        <div style={styles.chatArea}>
          {messages.length === 0 && !isLoading ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyTitle}>Ready when you are.</div>
              <div style={styles.emptySubtitle}>Start a conversation with today's highest performing AI models.</div>
            </div>
          ) : (
            <div style={styles.messagesContainer}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    ...styles.message,
                    ...(message.role === 'user' ? styles.userMessage : styles.aiMessage)
                  }}
                >
                  <div style={styles.messageContent}>{message.content}</div>
                </div>
              ))}
              {isLoading && (
                <div style={styles.loadingMessage}>
                  <Icon name="interface" className={interfaceFade ? 'fade-in-out' : ''} style={styles.interfaceIcon} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        {/* Input Bar */}
        <form style={styles.inputForm} onSubmit={handleSendMessage}>
          {/* TODO: Add a button to add image button chat */}
          {/* <button type="button" style={styles.inputIconButton} tabIndex={-1}>
            +
          </button> */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything"
            style={styles.input}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Inter, Arial, sans-serif',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#fff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    boxSizing: 'border-box',
  },
  sidebarTop: {
    padding: '1.5rem 1.5rem 0.5rem 1.5rem',
    borderBottom: '1px solid #f0f0f0',
  },
  sidebarTopRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.7rem',
  },
  logoRow: {
    fontWeight: 700,
    fontSize: '1.4rem',
    marginBottom: '1.2rem',
    color: '#222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    fontWeight: 700,
    fontSize: '1.4rem',
    color: '#222',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    minWidth: 0,
  },
  header: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
    position: 'relative',
    zIndex: 2,
  },
  modelDropdownWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  modelDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#fff',
    borderRadius: '6px',
    padding: '0.5rem 1.2rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#222',
    cursor: 'pointer',
    minWidth: '180px',
    userSelect: 'none',
    transition: 'background 0.2s, box-shadow 0.2s',
  },
  modelLabel: {
    flex: 1,
  },
  dropdownArrow: {
    fontSize: '0.5rem',
    marginLeft: '0.5rem',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '110%',
    left: 0,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    minWidth: '440px',
    maxHeight: '500px',
    overflowY: 'auto',
    zIndex: 10,
    padding: '0.5rem 0',
  },
  dropdownItem: {
    padding: '0.7rem 1.2rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  dropdownSelected: {
    background: '#e3f2fd',
    color: '#1976d2',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    position: 'relative',
    minHeight: 0,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#222',
    fontSize: '1.5rem',
    fontWeight: 600,
    opacity: 0.7,
    height: '100%',
  },
  emptyTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#000000',
  },
  emptySubtitle: {
    fontSize: '1.1rem',
    color: '#666',
    fontWeight: 400,
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    minHeight: 0,
  },
  message: {
    maxWidth: '60%',
    padding: '0.5rem 1rem',
    borderRadius: '24px',
    fontSize: '1rem',
    marginLeft: '1.5rem',
    marginRight: '1.5rem',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    color: 'white',
    marginRight: '2.5rem',
    borderRadius: '24px',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #e0e0e0',
    marginLeft: '2.5rem',
    borderRadius: '24px',
  },
  messageContent: {
    marginBottom: 0,

  },
  loadingMessage: {
    alignSelf: 'flex-start',
    padding: '1rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    color: '#666',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    minHeight: 40,
  },
  interfaceIcon: {
    animation: 'fadeInOut 1.2s linear infinite',
    opacity: 0.7,
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.2rem 2rem',
    borderTop: '1px solid #e0e0e0',
    background: '#fff',
    position: 'relative',
    zIndex: 2,
  },
  input: {
    flex: 1,
    padding: '1rem',
    borderRadius: '24px',
    border: '1px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    background: '#f5f5f5',
    margin: '0 0.5rem',
  },
  chatHistorySection: {
    padding: '1rem 1.5rem 0.5rem 1.5rem',
  },
  chatsTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#222',
    marginBottom: '0.7rem',
  },
  chatItem: {
    padding: '0.5rem 0.5rem 0.5rem 0.7rem',
    borderRadius: '4px',
    fontSize: '1rem',
    color: '#333',
    cursor: 'pointer',
    marginBottom: '0.2rem',
    background: 'none',
    transition: 'background 0.2s',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
};

// Add fadeInOut animation to the page
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes fadeInOut {
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
}
`;
document.head.appendChild(styleSheet);

export default Chat;
