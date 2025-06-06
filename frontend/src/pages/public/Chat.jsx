import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { tempChatAPI } from '../../services/api';
import { FolderIcon, EditIcon, SidebarIcon, InterfaceIcon, ArrowDownIcon, DeleteIcon, SendIcon } from '../../icons';
import googleLogo from '../../images/google-icon-logo-svgrepo-com.svg';
import openaiLogo from '../../images/openai-svgrepo-com.svg';
import anthropicLogo from '../../images/anthropic.svg';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';


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
    case 'send':
      return <SendIcon style={style} className={className} onClick={onClick} />;
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [dropdownHover, setDropdownHover] = useState(false);
  const dropdownRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);

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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Set a timeout to remove the border after scrolling stops
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    const messagesContainer = document.querySelector('[style*="messagesContainer"]');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }
  }, []);

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

  const isFirstUserMessage = messages.length > 0 && messages[0].role === 'user';

  // Inject mobile-specific styles
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @media (max-width: 600px) {
        .chat-container {
          flex-direction: column !important;
          height: 100dvh !important;
          width: 100vw !important;
        }
        .center-column {
          width: 100% !important;
          max-width: 100vw !important;
          min-width: 0 !important;
          padding: 0 0.5rem !important;
        }
        .input-form {
          position: fixed !important;
          bottom: 0;
          left: 0;
          width: 100vw !important;
          padding: 0.5rem 0.5rem !important;
          border-radius: 0 !important;
          z-index: 100;
        }
        .messages-container {
          padding: 1rem 0 4.5rem 0 !important;
          min-height: 0 !important;
          max-height: calc(100dvh - 7rem) !important;
          overflow-y: auto !important;
        }
      }
    `;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  return (
    <div className="chat-container" style={styles.container}>
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
        <div
          style={{
            ...styles.header,
            borderBottom: isScrolling ? '1px solid #e0e0e0' : 'none'
          }}
        >
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
              <div style={{ minWidth: 0, position: 'relative', zIndex: 20 }}>
                <div
                  style={{
                    ...styles.modelDropdown,
                    background: dropdownHover ? '#f0f0f0' : '#fff',
                    border: 'none',
                    boxShadow: dropdownHover ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                    position: 'relative',
                    zIndex: 21
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
                  <div ref={dropdownRef} style={{ ...styles.dropdownMenu, zIndex: 20 }}>
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
                          <span style={{ fontSize: '0.75rem', color: '#666666', marginBottom: 2 }}>{option.label}</span>
                          <span style={{ fontSize: '0.85rem', color: '#666666' }}>{option.desc}</span>
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
          <div className="center-column" style={styles.centerColumn}>
            {messages.length === 0 && !isLoading ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>Ready when you are.</div>
                <div style={styles.emptySubtitle}>Start a conversation with today's highest performing AI models.</div>
              </div>
            ) : (
              <div
                className="messages-container"
                style={{
                  ...styles.messagesContainer,
                  ...(isFirstUserMessage ? { paddingTop: '12rem' } : {})
                }}
              >
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.message,
                      ...(message.role === 'user' ? styles.userMessage : styles.aiMessage),
                      ...(message.role === 'user' && idx === 0 ? styles.firstUserMessage : {}),
                    }}
                  >
                    <div style={styles.messageContent}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              return !inline ? (
                                <SyntaxHighlighter style={oneLight} language={className?.replace('language-', '')}>
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code style={{background: '#eee', borderRadius: 4, padding: '2px 4px'}} {...props}>{children}</code>
                              );
                            },
                            hr() {
                              return (
                                <hr
                                  style={{
                                    border: 'none',
                                    borderTop: '1.5px solid #e0e0e0',
                                    borderRadius: '2px',
                                    margin: '2.5rem 0',
                                    width: '80%',
                                  }}
                                />
                              );
                            },
                            ul({children, ...props}) {
                              return <ul style={styles.markdownList} {...props}>{children}</ul>;
                            },
                            ol({children, ...props}) {
                              return <ol style={styles.markdownList} {...props}>{children}</ol>;
                            },
                            li({children, ...props}) {
                              return <li style={styles.markdownListItem} {...props}>{children}</li>;
                            },
                            table({children, ...props}) {
                              return (
                                <div style={{ 
                                  overflowX: 'auto', 
                                  margin: '1rem 0',
                                  width: '100%',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}>
                                  <table style={{ 
                                    borderCollapse: 'collapse', 
                                    width: '100%',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.5
                                  }} {...props}>
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            th({children, ...props}) {
                              return (
                                <th style={{ 
                                  border: '1px solid #e0e0e0', 
                                  padding: '0.75rem 1rem',
                                  background: '#f5f5f5',
                                  fontWeight: 600,
                                  textAlign: 'left',
                                  color: '#333'
                                }} {...props}>
                                  {children}
                                </th>
                              );
                            },
                            td({children, ...props}) {
                              return (
                                <td style={{ 
                                  border: '1px solid #e0e0e0', 
                                  padding: '0.75rem 1rem',
                                  color: '#333'
                                }} {...props}>
                                  {children}
                                </td>
                              );
                            },
                            blockquote({children, ...props}) {
                              return (
                                <blockquote style={{
                                  borderLeft: '4px solid #1976d2',
                                  background: '#f7fafd',
                                  margin: '1.5em 0',
                                  padding: '0.8em 1.2em',
                                  color: '#333',
                                  fontStyle: 'italic',
                                  borderRadius: '6px',
                                }} {...props}>
                                  {children}
                                </blockquote>
                              );
                            },
                            img({src, alt, ...props}) {
                              return (
                                <img
                                  src={src}
                                  alt={alt}
                                  style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    margin: '1.2em auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                  }}
                                  {...props}
                                />
                              );
                            },
                            a({href, children, ...props}) {
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#1976d2',
                                    textDecoration: 'underline',
                                    wordBreak: 'break-all',
                                    cursor: 'pointer',
                                  }}
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                            h1({children, ...props}) {
                              return <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '1.2em 0 0.7em 0', color: '#222' }} {...props}>{children}</h1>;
                            },
                            h2({children, ...props}) {
                              return <h2 style={{ fontSize: '1.7rem', fontWeight: 600, margin: '1.1em 0 0.6em 0', color: '#222' }} {...props}>{children}</h2>;
                            },
                            h3({children, ...props}) {
                              return <h3 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '1em 0 0.5em 0', color: '#222' }} {...props}>{children}</h3>;
                            },
                            h4({children, ...props}) {
                              return <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.9em 0 0.4em 0', color: '#222' }} {...props}>{children}</h4>;
                            },
                            h5({children, ...props}) {
                              return <h5 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.8em 0 0.3em 0', color: '#222' }} {...props}>{children}</h5>;
                            },
                            h6({children, ...props}) {
                              return <h6 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.7em 0 0.2em 0', color: '#222' }} {...props}>{children}</h6>;
                            },
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
        {/* Input Bar */}
        <form className="input-form" style={styles.inputForm} onSubmit={handleSendMessage}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              style={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '1rem',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: input.trim() ? 'pointer' : 'default',
                opacity: input.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000'
              }}
              disabled={!input.trim() || isLoading}
            >
              <SendIcon style={{ width: 28, height: 28 }} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    position: 'relative',
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
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
    padding: '2rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    minHeight: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '100%',
    overflowY: 'auto',
  },
  message: {
    maxWidth: '900px',
    width: 'auto',
    padding: '0.5rem 1rem',
    borderRadius: '24px',
    fontSize: '1rem',
    wordBreak: 'break-word',
  },
  userMessage: {
    backgroundColor: '#e0e0e0',
    color: '#222',
    borderRadius: '24px',
    boxShadow: 'none',
    border: 'none',
    alignSelf: 'flex-end',
    textAlign: 'left',
  },
  aiMessage: {
    backgroundColor: '#ffffff',
    color: '#333',
    border: 'none',
    borderRadius: '24px',
    boxShadow: 'none',
    alignSelf: 'flex-start',
    lineHeight: 1.8,
    fontSize: '1.05rem',
  },
  firstUserMessage: {
    marginTop: '3rem',
  },
  messageContent: {
    marginBottom: 0,
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
    paddingRight: '3rem',
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
  centerColumn: {
    width: '75%',
    minWidth: 0,
    maxWidth: '1000px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    flex: 1,
    height: '100%',
  },
  markdownList: {
    paddingLeft: '1.5em',
    margin: '1em 0',
  },
  markdownListItem: {
    marginBottom: '0.5em',
    lineHeight: 1.7,
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
