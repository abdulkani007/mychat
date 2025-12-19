import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { io } from "socket.io-client";
import axios from "axios";
import "./Chat.css";

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      const token = await user.getIdToken();
      const res = await axios.get("http://localhost:4000/api/messages");
      setMessages(res.data);

      socketRef.current = io("ws://localhost:4000", {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current.on("receive_message", (msg) => {
        setMessages((prev) => {
          
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      });

      socketRef.current.on("message_deleted", ({ id }) => {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        // Clear any local state related to this message
        setEditingId(prev => prev === id ? null : prev);
        setShowDeleteMenu(prev => prev === id ? null : prev);
        setHoveredMessage(prev => prev === id ? null : prev);
      });

      socketRef.current.on("message_edited", (msg) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...msg } : m))
        );
        // Clear editing state for all clients
        setEditingId(prev => prev === msg._id ? null : prev);
        setEditText(prev => prev && editingId === msg._id ? "" : prev);
      });

      socketRef.current.on("user_typing", ({ userId, isTyping }) => {
        setTypingUsers(prev => 
          isTyping 
            ? [...prev.filter(id => id !== userId), userId]
            : prev.filter(id => id !== userId)
        );
      });

      socketRef.current.on("user_online", ({ userId, isOnline }) => {
        setOnlineUsers(prev => 
          isOnline 
            ? [...prev.filter(id => id !== userId), userId]
            : prev.filter(id => id !== userId)
        );
      });

      socketRef.current.on("message_status_updated", ({ messageId, status }) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? { ...msg, status } : msg
          )
        );
      });
    };

    setup();
    return () => socketRef.current?.disconnect();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const messageText = text.trim();
    setText(""); // Clear immediately for better UX
    stopTyping();
    socketRef.current.emit("send_message", messageText);
  };

  const sendFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("senderId", user.uid);
    formData.append("senderName", user.displayName);
    await axios.post("http://localhost:4000/upload", formData);
    setFile(null);
  };

  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditText(msg.text);
  };

  const saveEdit = () => {
    const originalMessage = messages.find(m => m._id === editingId);
    if (editText.trim() && editText !== originalMessage?.text) {
      socketRef.current.emit("edit_message", { id: editingId, text: editText.trim() });
    } else {
   
      setEditingId(null);
      setEditText("");
    }
  };

  const deleteMessage = (id, type) => {
    if (window.confirm(`Delete message for ${type}?`)) {
    
      setShowDeleteMenu(null);
      setHoveredMessage(null);
      socketRef.current.emit("delete_message", { id, deleteType: type });
    }
  };

  const startTyping = () => {
    socketRef.current.emit("typing_start");
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 3000);
  };

  const stopTyping = () => {
    socketRef.current.emit("typing_stop");
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'seen': return '✓✓';
      default: return '';
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    if (user.uid?.startsWith('fake_')) {
      localStorage.removeItem('fakeUser');
      localStorage.removeItem('fakeToken');
      await axios.post('http://localhost:4000/api/logout', { uid: user.uid });
      window.location.reload();
    } else {
      await signOut(auth);
    }
  };

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (!event.target.closest('.delete-menu-container')) {
        setShowDeleteMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 
  useEffect(() => {
    const handleConnect = () => console.log('Socket connected');
    const handleDisconnect = () => console.log('Socket disconnected');
    const handleReconnect = () => {
      console.log('Socket reconnected');
      // Refresh messages on reconnect to ensure sync
      axios.get("http://localhost:4000/api/messages")
        .then(res => setMessages(res.data))
        .catch(err => console.error('Failed to refresh messages:', err));
    };

    if (socketRef.current) {
      socketRef.current.on('connect', handleConnect);
      socketRef.current.on('disconnect', handleDisconnect);
      socketRef.current.on('reconnect', handleReconnect);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('reconnect', handleReconnect);
      }
    };
  }, []);

  return (
    <div className="chat-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4f46e5&color=fff`} 
              alt={user.displayName}
              className="profile-avatar"
            />
            <div className="profile-info">
              <h3 className="profile-name">{user.displayName}</h3>
              <span className="profile-status">Active now</span>
            </div>
          </div>
          <div className="profile-menu-container">
            <button 
              className="menu-btn" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              ⋮
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <button onClick={handleLogout} className="dropdown-item">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-list">
          <div className="chat-item active">
            <div className="chat-avatar">🌍</div>
            <div className="chat-details">
              <div className="chat-name">Global Chat</div>
              <div className="last-message">
                {typingUsers.length > 0 
                  ? "typing..." 
                  : messages[messages.length - 1]?.text?.substring(0, 25) || "Start chatting!"
                }
              </div>
            </div>
            {onlineUsers.length > 0 && (
              <span className="online-badge">{onlineUsers.length}</span>
            )}
          </div>
        </div>
      </div>

    
      <div className="chat-main">
        <div className="chat-header">
          <div className="header-info">
            <div className="header-avatar">🌍</div>
            <div className="header-details">
              <h3 className="header-title">Global Chat</h3>
              <span className="header-status">
                {typingUsers.length > 0 ? "typing..." : `${onlineUsers.length} members online`}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-btn">🔍</button>
            <button className="action-btn">⋮</button>
          </div>
        </div>

        <div className="messages-area">
          {messages.map((msg) => {
            const isMine = msg.senderId === user.uid;
            const isEditing = editingId === msg._id;
            
            return (
              <div 
                key={msg._id} 
                className={`message ${isMine ? 'mine' : 'theirs'}`}
              >
                <div 
                  className="message-bubble"
                  onMouseEnter={() => isMine && !isEditing && setHoveredMessage(msg._id)}
                  onMouseLeave={(e) => {
                    // Only hide if not moving to the options menu
                    const rect = e.currentTarget.getBoundingClientRect();
                    const optionsArea = {
                      left: rect.right - 10,
                      right: rect.right + 80,
                      top: rect.top,
                      bottom: rect.bottom
                    };
                    
                    if (e.clientX < optionsArea.left || e.clientX > optionsArea.right || 
                        e.clientY < optionsArea.top || e.clientY > optionsArea.bottom) {
                      setTimeout(() => {
                        if (!showDeleteMenu) {
                          setHoveredMessage(null);
                        }
                      }, 100);
                    }
                  }}
                >
                  {!isMine && <div className="sender-name">{msg.senderName}</div>}
                  
                  {msg.type === "image" && (
                    <img
                      src={`http://localhost:4000${msg.fileUrl}`}
                      alt="Shared"
                      className="message-media"
                    />
                  )}

                  {msg.type === "video" && (
                    <video
                      src={`http://localhost:4000${msg.fileUrl}`}
                      controls
                      className="message-media"
                    />
                  )}

                  {msg.text && !isEditing && (
                    <div className="message-text">{msg.text}</div>
                  )}

                  {isEditing && (
                    <div className="edit-box">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={saveEdit} className="save-btn">Save</button>
                        <button onClick={() => setEditingId(null)} className="cancel-btn">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                    {msg.isEdited && <span className="edited-tag">edited</span>}
                    {isMine && (
                      <span className={`status-icon ${msg.status === 'seen' ? 'seen' : ''}`}>
                        {getStatusIcon(msg.status)}
                      </span>
                    )}
                  </div>

                  {isMine && !isEditing && (hoveredMessage === msg._id || showDeleteMenu === msg._id) && (
                    <div className="message-options">
                      <button 
                        onClick={() => {
                          startEdit(msg);
                          setHoveredMessage(null);
                        }} 
                        className="option-btn edit-option" 
                        title="Edit message"
                      >
                        Edit
                      </button>
                      <div className="delete-menu-container">
                        <button 
                          onClick={() => setShowDeleteMenu(showDeleteMenu === msg._id ? null : msg._id)}
                          className="option-btn delete-option-btn" 
                          title="Delete message"
                        >
                          Delete
                        </button>
                        {showDeleteMenu === msg._id && (
                          <div className="delete-dropdown">
                            <button 
                              onClick={() => {
                                deleteMessage(msg._id, 'me');
                                setShowDeleteMenu(null);
                                setHoveredMessage(null);
                              }}
                              className="delete-option"
                            >
                              Delete for me
                            </button>
                            <button 
                              onClick={() => {
                                deleteMessage(msg._id, 'everyone');
                                setShowDeleteMenu(null);
                                setHoveredMessage(null);
                              }}
                              className="delete-option"
                            >
                              Delete for everyone
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <button 
            className="attach-btn"
            onClick={() => fileInputRef.current.click()}
            title="Attach media"
          >
            📎
          </button>
          
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="input-box">
            <input
              type="text"
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="text-input"
            />
            <button 
              className="emoji-btn"
              onClick={() => setText(prev => prev + "😊")}
            >
              😊
            </button>
          </div>

          {file ? (
            <button className="send-btn active" onClick={sendFile}>
              📤
            </button>
          ) : (
            <button 
              className={`send-btn ${text.trim() ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!text.trim()}
            >
              ➤
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;