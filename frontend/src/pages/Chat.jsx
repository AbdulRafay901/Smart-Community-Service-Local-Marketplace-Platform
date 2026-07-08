import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, Image, MessageSquare, User, Clock, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const messageEndRef = useRef(null);

  // States
  const [threads, setThreads] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // The other User object we are chatting with
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load threads on mount
  const fetchThreads = async (selectUserId = null) => {
    try {
      const response = await api.get('/chats');
      setThreads(response.data);

      // If we came here from "Contact Seller" with a specific user state
      if (selectUserId && !activeUser) {
        // Find if that user is already in threads
        const existingThread = response.data.find(t => t.user.id === parseInt(selectUserId));
        if (existingThread) {
          setActiveUser(existingThread.user);
        } else {
          // If not in threads yet, fetch user details and add mock/active selection
          const userDetails = await api.get(`/reviews/user/${selectUserId}`); // returns reviews but we can fetch user profile
          // A safer route is just fetching user details via `/reviews/user/{id}` where reviews contains reviewer details,
          // or we can mock/fetch. Let's find user from reviews, or if not found, we query standard profile endpoint.
          // Let's call endpoint we have:
          try {
            const reviewsRes = await api.get(`/reviews/user/${selectUserId}`);
            if (reviewsRes.data.length > 0) {
              setActiveUser(reviewsRes.data[0].reviewed_user);
            } else {
              // Fallback fetch details from listing if redirect sent us info
              // For simplicity, we query a mock user object with ID
              setActiveUser({ id: parseInt(selectUserId), name: 'Local Provider' });
            }
          } catch (e) {
            setActiveUser({ id: parseInt(selectUserId), name: 'Local Provider' });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load threads:", error);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    const selectedUserId = location.state?.selectedUserId || null;
    fetchThreads(selectedUserId);
  }, [location]);

  // Load messages for active user
  const fetchMessages = async () => {
    if (!activeUser) return;
    try {
      const response = await api.get(`/messages/${activeUser.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Poll messages and threads every 3 seconds for real-time feel
  useEffect(() => {
    if (!activeUser) return;
    
    // Initial fetch
    setLoadingMessages(true);
    fetchMessages().then(() => setLoadingMessages(false));

    const interval = setInterval(() => {
      fetchMessages();
      fetchThreads();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeUser]);

  // Auto-scroll on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imageFile) return;

    try {
      const formData = new FormData();
      formData.append('receiver_id', activeUser.id);
      if (messageText) {
        formData.append('message', messageText);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Append new message and clear inputs
      setMessages(prev => [...prev, response.data]);
      setMessageText('');
      clearImage();
      
      // Refresh threads to show updated preview
      fetchThreads();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Message could not be sent.");
    }
  };

  return (
    <div className="card glass grid-cols-12" style={{
      display: 'grid', height: '70vh', minHeight: '550px',
      overflow: 'hidden', padding: 0, borderRadius: 'var(--radius-lg)'
    }}>
      
      {/* Left panel: Inbox Threads List */}
      <div style={{
        gridColumn: 'span 4', borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'rgba(255,255,255,0.01)'
      }} className="chat-threads-panel">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Messages Inbox</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingThreads ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading chats...</p>
          ) : threads.length === 0 && !activeUser ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ strokeWidth: 1.5, margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem' }}>No conversations yet. Connect with providers on details pages!</p>
            </div>
          ) : (
            <>
              {/* If we have a selected user who is not yet in the active thread database list, render them on top */}
              {activeUser && !threads.find(t => t.user.id === activeUser.id) && (
                <div 
                  onClick={() => setActiveUser(activeUser)}
                  style={{
                    padding: '1rem', borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer', backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  <img 
                    src={activeUser.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                    alt={activeUser.name} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{activeUser.name}</p>
                    <small style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Active conversation</small>
                  </div>
                </div>
              )}

              {/* Render existing threads */}
              {threads.map(t => {
                const isSelected = activeUser && activeUser.id === t.user.id;
                return (
                  <div 
                    key={t.user.id}
                    onClick={() => setActiveUser(t.user)}
                    style={{
                      padding: '1rem', borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer', backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <img 
                      src={t.user.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                      alt={t.user.name} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user.name}</h4>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          {new Date(t.last_message.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      <p style={{
                        fontSize: '0.775rem', color: t.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: t.unread_count > 0 ? 700 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {t.last_message.sender_id === user.id ? 'You: ' : ''}
                        {t.last_message.message || 'Sent an image'}
                      </p>
                    </div>
                    {t.unread_count > 0 && (
                      <span style={{
                        backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '50%',
                        minWidth: '18px', height: '18px', fontSize: '0.65rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 700
                      }}>
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Right panel: Active Chat Room */}
      <div style={{
        gridColumn: 'span 8', display: 'flex', flexDirection: 'column', height: '100%'
      }} className="chat-window-panel">
        
        {activeUser ? (
          <>
            {/* Header info */}
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.01)'
            }}>
              <img 
                src={activeUser.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                alt={activeUser.name} 
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeUser.name}</h4>
                <small style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}>
                  <CheckCircle size={10} /> Online sync active
                </small>
              </div>
            </div>

            {/* Conversation Area */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(0,0,0,0.01)' }}>
              {loadingMessages ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>Retrieving chats history...</p>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ strokeWidth: 1.5, margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>Say hello to initiate communication!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSender = msg.sender_id === user.id;
                  return (
                    <div 
                      key={msg.id}
                      style={{
                        alignSelf: isSender ? 'flex-end' : 'flex-start',
                        maxWidth: '70%', display: 'flex', flexDirection: 'column',
                        alignItems: isSender ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                        backgroundColor: isSender ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: isSender ? 'white' : 'var(--text-primary)',
                        borderTopRightRadius: isSender ? '2px' : 'var(--radius-md)',
                        borderTopLeftRadius: !isSender ? '2px' : 'var(--radius-md)',
                        boxShadow: 'var(--shadow-sm)', fontSize: '0.875rem', lineHeight: '1.45'
                      }}>
                        {msg.image_path && (
                          <div style={{ marginBottom: msg.message ? '0.5rem' : 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxWidth: '280px' }}>
                            <img 
                              src={msg.image_path.startsWith('http') ? msg.image_path : `http://localhost:8000${msg.image_path}`} 
                              alt="Shared media" 
                              style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                        {msg.message}
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={10} />
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Media Image sharing selection preview */}
            {imagePreview && (
              <div style={{
                padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-primary)'
              }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={imagePreview} alt="upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={clearImage}
                    style={{
                      position: 'absolute', top: '1px', right: '1px', backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>Image attached. Ready to send.</small>
              </div>
            )}

            {/* Composer Input Form */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '1rem', borderTop: '1px solid var(--border-color)',
                display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)'
              }}
            >
              {/* Upload Image shortcut */}
              <label 
                htmlFor="chat-image"
                style={{
                  padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Image size={18} />
                <input type="file" id="chat-image" onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              </label>

              {/* Message text */}
              <input 
                type="text" 
                className="form-input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                style={{ flex: 1 }}
              />

              <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem' }}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            <MessageSquare size={48} style={{ strokeWidth: 1.25, margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Selected Chat</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
              Select an inbox thread on the left side, or contact providers on marketplace listings to begin messaging.
            </p>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .chat-threads-panel {
            grid-column: span 12 !important;
            height: 250px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-color) !important;
          }
          .chat-window-panel {
            grid-column: span 12 !important;
            height: calc(100% - 250px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
