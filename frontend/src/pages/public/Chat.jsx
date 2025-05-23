import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState([
    { id: 1, name: 'General' },
    { id: 2, name: 'Work' },
    { id: 3, name: 'Personal' }
  ]);
  const [selectedFolder, setSelectedFolder] = useState(1);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'New Chat', folderId: 1, messages: [] },
    { id: 2, title: 'Project Discussion', folderId: 1, messages: [] },
    { id: 3, title: 'Code Review', folderId: 2, messages: [] }
  ]);
  const [selectedChat, setSelectedChat] = useState(1);
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        content: "This is a simulated AI response. In a real implementation, this would be connected to an AI model API.",
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      folderId: selectedFolder,
      messages: []
    };
    setChatHistory(prev => [...prev, newChat]);
    setSelectedChat(newChat.id);
    setMessages([]);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button 
          style={styles.newChatButton}
          onClick={handleNewChat}
        >
          New Chat
        </button>
        
        {/* Folders */}
        <div style={styles.folders}>
          <h3 style={styles.sidebarTitle}>Folders</h3>
          {folders.map(folder => (
            <div
              key={folder.id}
              style={{
                ...styles.folderItem,
                ...(selectedFolder === folder.id && styles.selectedItem)
              }}
              onClick={() => setSelectedFolder(folder.id)}
            >
              {folder.name}
            </div>
          ))}
        </div>

        {/* Chat History */}
        <div style={styles.chatHistory}>
          <h3 style={styles.sidebarTitle}>Chats</h3>
          {chatHistory
            .filter(chat => chat.folderId === selectedFolder)
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

      {/* Main Chat Area */}
      <div style={styles.chatArea}>
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
              <div style={styles.messageTimestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={styles.loadingMessage}>
              <div style={styles.loadingDots}>
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form style={styles.inputForm} onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={styles.input}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            style={styles.sendButton}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
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
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  newChatButton: {
    padding: '0.75rem',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    width: '100%',
  },
  sidebarTitle: {
    fontSize: '0.9rem',
    color: '#666',
    margin: '0 0 0.5rem 0',
  },
  folders: {
    marginBottom: '1rem',
  },
  folderItem: {
    padding: '0.5rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#333',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  chatHistory: {
    flex: 1,
    overflowY: 'auto',
  },
  chatItem: {
    padding: '0.5rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#333',
    marginBottom: '0.25rem',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    color: '#4A90E2',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  message: {
    maxWidth: '80%',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    color: 'white',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  messageContent: {
    marginBottom: '0.25rem',
  },
  messageTimestamp: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  inputForm: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    borderTop: '1px solid #e0e0e0',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  loadingMessage: {
    alignSelf: 'flex-start',
    padding: '0.75rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
  },
  loadingDots: {
    display: 'flex',
    gap: '0.25rem',
    fontSize: '1.5rem',
    color: '#666',
  },
};

export default Chat;
