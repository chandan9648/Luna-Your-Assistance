import React from 'react';
import './ChatSidebar.css';


const ChatSidebar = ({ chats, activeChatId, onSelectChat, onNewChat, open, onLogout, onDeleteChat }) => {


  
  return (
    <aside className={"chat-sidebar " + (open ? 'open' : '')} aria-label="Previous chats">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="small-btn" onClick={onNewChat}>New</button>
          <button className="small-btn" onClick={onLogout} aria-label="Log out">Logout</button>
        </div>
      </div>
      <nav className="chat-list" aria-live="polite">
        {chats.map(c => (
          <div key={c._id} className={"chat-list-item " + (c._id === activeChatId ? 'active' : '')}>
            <button
              className="title-line"
              style={{ all: 'unset', cursor: 'pointer' }}
              onClick={() => onSelectChat(c._id)}
            >
              {c.title}
            </button>
            <div style={{ position: 'absolute', right: 10, top: 8, display: 'flex', gap: 6 }}>
              <button
                className="small-btn"
                aria-label={`Delete chat ${c.title}`}
                onClick={(e) => { e.stopPropagation(); onDeleteChat && onDeleteChat(c._id); }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {chats.length === 0 && <p className="empty-hint">No chats yet.</p>}
      </nav>
      
    </aside>
  );
};

export default ChatSidebar;