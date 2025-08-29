import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

import ChatMobileBar from '../components/chats/ChatMobileBar.jsx';
import ChatSidebar from '../components/chats/ChatSidebar.jsx';
import ChatMessages from '../components/chats/ChatMessages.jsx';
import ChatComposer from '../components/chats/ChatComposer.jsx';
import '../components/chats/ChatLayout.css';
import NewChatModal from '../components/chats/NewChatModal.jsx';

import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats,
  removeChat,
} from '../store/chatSlice.js';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  const activeChatRef = useRef(activeChatId);
  useEffect(() => {
    activeChatRef.current = activeChatId;
  }, [activeChatId]);

  const getAuthHeaders = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // Create new chat (from modal)
  const handleNewChat = () => setNewChatOpen(true);

  const submitNewChat = async ({ title, message }) => {
    setCreatingChat(true);
    try {
      const response = await axios.post(
        'https://luna-your-assistance-1.onrender.com/api/chat',
        { title },
        { headers: getAuthHeaders() }
      );
      dispatch(startNewChat(response.data.chat));
      setSidebarOpen(false);
      setNewChatOpen(false);
      setMessages([]);
      if (message && message.trim()) {
        // Prefill the composer with first message and focus it
        dispatch(setInput(message.trim()));
        // Small delay to ensure component mounts before focusing
        setTimeout(() => {
          const composer = document.querySelector('textarea.composer-input');
          composer?.focus();
        }, 0);
      } else {
        // Still move focus to composer for convenience
        setTimeout(() => {
          const composer = document.querySelector('textarea.composer-input');
          composer?.focus();
        }, 0);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setCreatingChat(false);
    }
  };

  // Load chats + setup socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get('https://luna-your-assistance-1.onrender.com/api/chat', { headers: getAuthHeaders() })
      .then((response) => {
        dispatch(setChats([...(response.data.chats || [])].reverse()));
      })
      .catch((err) => {
        console.error('Error fetching chats:', err);
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });

    const tempSocket = io('https://luna-your-assistance-1.onrender.com', {
      auth: { token },
    });

    tempSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      // If auth fails at socket level, clear token and force re-login
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });

    tempSocket.on('ai-response', (messagePayload) => {
      if (messagePayload.chat && messagePayload.chat !== activeChatRef.current)
        return;
      setMessages((prev) => [...prev, { type: 'ai', content: messagePayload.content }]);
      dispatch(sendingFinished());
    });

    setSocket(tempSocket);
    return () => tempSocket.disconnect();
  }, [dispatch, navigate]);

  // Send user message
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;

    dispatch(sendingStarted());

    const newMessages = [...messages, { type: 'user', content: trimmed }];
    setMessages(newMessages);
    dispatch(setInput(''));

    if (socket) {
      socket.emit('ai-message', {
        chat: activeChatId,
        content: trimmed,
      });
    }
  };

  // Load chat messages
  const getMessages = async (chatId) => {
    try {
      const response = await axios.get(
        `https://luna-your-assistance-1.onrender.com/api/chat/messages/${chatId}`,
        { headers: getAuthHeaders() }
      );

      setMessages(
        response.data.messages.map((m) => ({
          type: m.role === 'user' ? 'user' : 'ai',
          content: m.content,
        }))
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Delete a chat
  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`https://luna-your-assistance-1.onrender.com/api/chat/${chatId}`, { headers: getAuthHeaders() });
      dispatch(removeChat(chatId));
      // Clear messages if we deleted the active chat
      if (activeChatRef.current === chatId) {
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (err) {
      console.error('Error deleting chat:', err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to delete chat');
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
    if (socket) {
      try { socket.disconnect(); } catch {
        // ignore
      }
    }
    dispatch(setChats([]));
    setMessages([]);
    navigate('/login');
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar onToggleSidebar={() => setSidebarOpen((o) => !o)} onNewChat={handleNewChat} />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
  onLogout={handleLogout}
  onDeleteChat={handleDeleteChat}
      />
      <main className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>Luna — your assistant</h1>
            <p>
              Ask anything. Paste text, brainstorm ideas, or get quick explanations. Your chats stay in the sidebar so you can pick up where you left off.
            </p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer input={input} setInput={(v) => dispatch(setInput(v))} onSend={sendMessage} isSending={isSending} />
        )}
      </main>
      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSubmit={submitNewChat}
        submitting={creatingChat}
      />
      {sidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Home;