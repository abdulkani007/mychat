import { useState } from "react";

function MessageBubble({ message, currentUser, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [showHover, setShowHover] = useState(false);

  const isMine = message.senderId === currentUser.uid;

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

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message._id, editText);
      setIsEditing(false);
    }
  };

  const handleDelete = (type) => {
    if (window.confirm(`Delete message for ${type}?`)) {
      onDelete(message._id, type);
      setShowMenu(false);
    }
  };

  return (
    <div 
      className={`message ${isMine ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="message-bubble">
        {!isMine && <div className="sender-name">{message.senderName}</div>}
        
        {message.type === "image" && (
          <img
            src={`http://localhost:4000${message.fileUrl}`}
            alt="Shared"
            className="message-image"
          />
        )}

        {message.type === "video" && (
          <video
            src={`http://localhost:4000${message.fileUrl}`}
            controls
            className="message-video"
          />
        )}

        {message.text && !isEditing && (
          <div className="message-text">{message.text}</div>
        )}

        {isEditing && (
          <div className="edit-container">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="edit-input"
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleEdit} className="edit-save">Save</button>
              <button onClick={() => setIsEditing(false)} className="edit-cancel">Cancel</button>
            </div>
          </div>
        )}

        <div className="message-footer">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {message.isEdited && <span className="edited-label">edited</span>}
          {isMine && (
            <span className={`message-status ${message.status === 'seen' ? 'seen' : ''}`}>
              {getStatusIcon(message.status)}
            </span>
          )}
        </div>

        {isMine && showHover && !isEditing && (
          <div className="message-actions">
            <button 
              className="action-icon edit-icon" 
              onClick={() => setIsEditing(true)}
              title="Edit"
            >
              ✏️
            </button>
            <button 
              className="action-icon menu-icon" 
              onClick={() => setShowMenu(!showMenu)}
              title="More"
            >
              ⋮
            </button>
          </div>
        )}

        {showMenu && (
          <div className="message-menu">
            <button onClick={() => handleDelete('me')}>Delete for me</button>
            <button onClick={() => handleDelete('everyone')}>Delete for everyone</button>
            <button onClick={() => setShowMenu(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
