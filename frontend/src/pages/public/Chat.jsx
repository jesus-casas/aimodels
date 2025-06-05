import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { tempChatAPI } from '../../services/api';
import { FolderIcon, EditIcon, SidebarIcon, InterfaceIcon, ArrowDownIcon, DeleteIcon } from '../../icons';
import googleLogo from '../../images/google-icon-logo-svgrepo-com.svg';
import openaiLogo from '../../images/openai-svgrepo-com.svg';
import anthropicLogo from '../../images/anthropic.svg';


// Icon component using SVG icons
const Icon = ({ name, style = {}, className = '', onClick }) => {
  switch (name) {
    case 'folder':
      return <FolderIcon style={style} className={className} onClick={onClick} />;
    case 'edit':
      return <EditIcon style={style} className={className} onClick={onClick} />;
    case 'sidebar':
      return <SidebarIcon style={style} className={className} onClick={onClick} />;
    case 'interface':
      return <InterfaceIcon style={style} className={className} onClick={onClick} />;
    case 'arrow-down':
      return <ArrowDownIcon style={style} className={className} onClick={onClick} />;
    case 'delete':
      return <DeleteIcon style={style} className={className} onClick={onClick} />;
    default:
      return null;
  }
};

const modelOptions = [
  // OpenAI Models
  { 
    label: 'chatgpt-4o-latest', 
    model: 'GPT-4o', 
    desc: 'Fast, intelligent, flexible GPT model', 
    img: openaiLogo 
  },
  { 
    label: 'o3-2025-04-16', 
    model: 'o3', 
    desc: 'Most powerful reasoning model', 
    img: openaiLogo 
  },
  { 
    label: 'gpt-4.5-preview-2025-02-27', 
    model: 'GPT-4.5', 
    desc: 'Largest and most capable GPT model', 
    img: openaiLogo 
  },
  { 
    label: 'gpt-4.1-2025-04-14', 
    model: 'GPT-4.1', 
    desc: 'Flagship GPT model for complex tasks', 
    img: openaiLogo 
  },
  { 
    label: 'o4-mini-2025-04-16', 
    model: 'o4-mini', 
    desc: 'Faster, more affordable reasoning model', 
    img: openaiLogo 
  },
  { 
    label: 'o1-2024-12-17', 
    model: 'o1', 
    desc: 'Previous full o-series reasoning model', 
    img: openaiLogo 
  },
  // Google Models
  { 
    label: 'gemini-2.5-pro-preview-05-06', 
    model: 'Gemini Pro', 
    desc: 'Thinking, reasoning, multimodal, coding', 
    img: googleLogo 
  },
  { 
    label: 'gemini-2.5-flash-preview-05-20', 
    model: 'Gemini Flash', 
    desc: 'Adaptive thinking, cost efficiency', 
    img: googleLogo 
  },
  // Anthropic Models
  { 
    label: 'claude-3-7-sonnet-20250219', 
    model: 'Claude 3.7', 
    desc: 'Anthropic Proprietary', 
    img: anthropicLogo 
  },
  // DeepSeek Models
  // { label: 'DeepSeek-V3-0324', model: 'DeepSeek V3', desc: 'DeepSeek MIT', img: deepseekLogo },
  // { label: 'DeepSeek-R1', model: 'DeepSeek R1', desc: 'DeepSeek MIT', img: deepseekLogo },
  // Qwen Models
  // { label: 'Qwen3-235B-A22B', model: 'Qwen 3', desc: 'Alibaba Qwen Model', img: qwenColorLogo },
  // xAI Models
  //{ label: 'Grok', model: 'Grok', desc: 'xAI Grok Model', img: grokLogo },
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
  const dropdownRef = useRef(null);

  // Get or generate a session_id for anonymous users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString();
      localStorage.setItem('anonymous_session_id', sessionId);
    }
    return sessionId;
  };

  // Load chat history on mount and expose as a function
  const loadChats = async (selectLatest = false) => {
    const sessionId = getSessionId();
    try {
      const chats = await tempChatAPI.getChats(sessionId);
      setChatHistory(chats);
      if (chats.length > 0) {
        if (selectLatest) {
          setSelectedChat(chats[0].id);
        } else if (!selectedChat || !chats.some(c => c.id === selectedChat)) {
          setSelectedChat(chats[0].id);
        }
      } else {
        // No chats exist, auto-create a new chat
        const newChat = await tempChatAPI.createChat({ session_id: sessionId, title: 'New Chat' });
        setChatHistory([newChat]);
        setSelectedChat(newChat.id);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line
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

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // func: send message to the server 
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

    // Supported models for streaming (all current OpenAI models)
    const streamingModels = [
      'chatgpt-4o-latest',
      'o3-2025-04-16',
      'gpt-4.5-preview-2025-02-27',
      'gpt-4.1-2025-04-14',
      'o4-mini-2025-04-16',
      'o1-2024-12-17',
    ];
    const isStreaming = streamingModels.includes(selectedModel.label.toLowerCase());

    if (isStreaming) {
      // Streaming implementation
      let aiMessageId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ]);
      try {
        const reader = await tempChatAPI.completeChatStream({
          chat_id: selectedChat,
          role: 'user',
          content: input,
          model: selectedModel.label.toLowerCase()
        });
        let aiContent = '';
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          const chunk = new TextDecoder().decode(value);
          // SSE: data: { ... }\n\n
          chunk.split(/\n\n/).forEach(line => {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.delta) {
                aiContent += data.delta;
                setMessages(prevMsgs => prevMsgs.map(m =>
                  m.id === aiMessageId ? { ...m, content: aiContent } : m
                ));
              }
              if (data.done) {
                done = true;
              }
              if (data.error) {
                setMessages(prevMsgs => prevMsgs.map(m =>
                  m.id === aiMessageId ? { ...m, content: '[Error: ' + data.error + ']' } : m
                ));
                done = true;
              }
            }
          });
        }
        setIsLoading(false);
        await loadChats();
      } catch (error) {
        setIsLoading(false);
        setMessages(prevMsgs => prevMsgs.map(m =>
          m.id === aiMessageId ? { ...m, content: '[Streaming error]' } : m
        ));
      }
    } else {
      // Fallback to non-streaming
      try {
        const aiResponse = await tempChatAPI.completeChat({
          chat_id: selectedChat,
          role: 'user',
          content: input,
          model: selectedModel.label.toLowerCase()
        });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            content: aiResponse.content,
            role: 'assistant',
            timestamp: new Date().toISOString()
          }
        ]);
        setIsLoading(false);
        await loadChats();
      } catch (error) {
        console.error('Failed to send message:', error);
        setIsLoading(false);
      }
    }
  };

  const handleNewChat = async () => {
    const sessionId = getSessionId();
    // Prevent multiple 'New Chat' chats: check if one exists with no messages
    const existingNewChat = chatHistory.find(
      chat => chat.title === 'New Chat'
    );
    if (existingNewChat) {
      // Optionally, check if it has no messages
      try {
        const msgs = await tempChatAPI.getMessages(existingNewChat.id);
        if (msgs.length === 0) {
          setSelectedChat(existingNewChat.id);
          setMessages([]);
          return;
        }
      } catch (error) {
        // fallback: just select it
        setSelectedChat(existingNewChat.id);
        setMessages([]);
        return;
      }
    }
    try {
      const newChat = await tempChatAPI.createChat({ session_id: sessionId, title: 'New Chat' });
      // Re-fetch chat list and select the new chat
      await loadChats(true);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await tempChatAPI.deleteChat(chatId);
      // Re-fetch chat list and update selected chat
      await loadChats();
      setMessages([]);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  useEffect(() => {
    const handleUnload = async () => {
      const sessionId = localStorage.getItem('anonymous_session_id');
      if (sessionId) {
        // Use navigator.sendBeacon for reliability on unload
        navigator.sendBeacon(
          `${process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001/api'
            : 'https://auth-backend-7pl7.onrender.com/api'
          }/tempchat/chats/session/${sessionId}`
        );
        // Optionally clear session id
        localStorage.removeItem('anonymous_session_id');
      }
    };
    window.addEventListener('unload', handleUnload);
    return () => window.removeEventListener('unload', handleUnload);
  }, []);

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
            {chatHistory.map(chat => (
              <div
                key={chat.id}
                style={{
                  ...styles.chatItem,
                  ...(selectedChat === chat.id && styles.selectedItem),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  onClick={() => setSelectedChat(chat.id)}
                  style={{
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {chat.title.replace(/^"(.+)"$/, '$1')}
                </div>
                {selectedChat === chat.id && (
                  <Icon
                    name="delete"
                    style={{ cursor: 'pointer', marginLeft: 8 }}
                    onClick={() => handleDeleteChat(chat.id)}
                  />
                )}
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
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    {selectedModel.img && (
                      <img
                        src={selectedModel.img}
                        alt={selectedModel.model}
                        style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4, objectFit: 'contain' }}
                      />
                    )}
                    <span style={styles.modelLabel}>{selectedModel.model}</span>
                  </div>
                  <Icon name="arrow-down" style={styles.dropdownArrow} />
                </div>
                {showDropdown && (
                  <div ref={dropdownRef} style={styles.dropdownMenu}>
                    {modelOptions.map((option, idx) => (
                      <div
                        key={option.label}
                        style={{
                          ...styles.dropdownItem,
                          ...(selectedModel.label === option.label ? styles.dropdownSelected : {}),
                          display: 'flex', 
                          flexDirection: 'column',
                          padding: '0.8rem 1.2rem'
                        }}
                        onClick={() => {
                          setSelectedModel(option);
                          setShowDropdown(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          {option.img && (
                            <img src={option.img} alt={option.model} style={{ width: 22, height: 22, marginRight: 8, borderRadius: 4, objectFit: 'contain' }} />
                          )}
                          <span style={{ fontSize: '1rem', fontWeight: 500 }}>{option.model}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 30 }}>
                          <span style={{ fontSize: '0.75rem', color: '#666', marginBottom: 2 }}>{option.label}</span>
                          <span style={{ fontSize: '0.85rem', color: '#666' }}>{option.desc}</span>
                        </div>
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
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#222',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
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
