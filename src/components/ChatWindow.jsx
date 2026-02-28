import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Send, Paperclip, FileText, Download } from 'lucide-react';

const ChatWindow = ({ task, currentUser, onClose, assignedEmployeeName }) => {
    const { socket, markAsRead } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [chatInfo, setChatInfo] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem('access_token');

    const isTL = currentUser.role === 'Team Lead';

    // 1. Initialize Chat
    useEffect(() => {
        if (!task || !currentUser) return;

        const initChat = async () => {
            try {
                // Determine participants
                // If TL: emp_id is task.assignedTo
                // If Employee: emp_id is currentUser.id
                const emp_id = isTL ? task.assignedTo : currentUser.id;
                const tl_id = isTL ? currentUser.id : currentUser.team_leader_id;
                const dept = task.team || currentUser.team;

                console.log('[CHAT] Initializing chat for task:', task.id, 'emp:', emp_id, 'tl:', tl_id);
                const res = await fetch('/api/chat/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        task_id: task.id,
                        emp_id: emp_id,
                        team_leader_id: tl_id,
                        department: dept
                    })
                });

                if (res.ok) {
                    const chat = await res.json();
                    console.log('[CHAT] Chat initialized:', chat);
                    setChatInfo(chat);
                    fetchHistory(chat.id);
                } else {
                    const error = await res.json();
                    console.error('[CHAT] Init failed:', error);
                }
            } catch (err) {
                console.error("Chat init error:", err);
            }
        };

        initChat();
    }, [task.id, currentUser.id]);

    const fetchHistory = (chatId) => {
        console.log('[CHAT] Fetching history for chat:', chatId);
        fetch(`/api/chat/history/${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                console.log('[CHAT] History loaded:', data.length, 'messages');
                setMessages(data);
            })
            .catch(err => console.error('[CHAT] History fetch error:', err));
    };

    // 2. Join Socket Room
    useEffect(() => {
        if (socket && chatInfo) {
            socket.emit('join_chat', { chat_id: chatInfo.id });

            const handleMsg = (msg) => {
                if (msg.chat_id === chatInfo.id) {
                    setMessages(prev => [...prev, msg]);
                }
            };

            socket.on('new_message', handleMsg);

            // Mark as read when opening
            markAsRead(task.activityCode);

            return () => {
                socket.emit('leave_chat', { chat_id: chatInfo.id });
                socket.off('new_message', handleMsg);
            };
        }
    }, [socket, chatInfo, task.activityCode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatInfo) return;

        const isTL = currentUser.role === 'Team Lead';
        const receiverId = isTL ? chatInfo.emp_id : chatInfo.team_leader_id;

        const messageData = {
            sender_id: currentUser.id,
            receiver_id: receiverId,
            chat_id: chatInfo.id,
            message: newMessage,
            task_code: task.activityCode,
            file_path: null
        };

        console.log('[CHAT] Sending message:', messageData);
        if (socket) {
            socket.emit('send_message', messageData);
            setNewMessage('');
        } else {
            console.error('[CHAT] Socket not connected!');
            alert('Chat connection lost. Please refresh the page.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !chatInfo) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                const receiverId = isTL ? chatInfo.emp_id : chatInfo.team_leader_id;
                const messageData = {
                    sender_id: currentUser.id,
                    receiver_id: receiverId,
                    chat_id: chatInfo.id,
                    message: `Sent a file: ${file.name}`,
                    task_code: task.activityCode,
                    file_path: data.file_path
                };
                if (socket) {
                    socket.emit('send_message', messageData);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isImage = (path) => {
        if (!path) return false;
        const ext = path.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
                {/* Header */}
                <div className="chat-modal-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            {isTL ? (assignedEmployeeName?.[0]?.toUpperCase() || 'E') : 'TL'}
                        </div>
                        <div className="chat-details">
                            {isTL ? (
                                <>
                                    <h3>Employee: {assignedEmployeeName || 'Unknown'} ({task.assignedTo || 'Unassigned'})</h3>
                                    <p>Task ID: {task.id} | Code: {task.activityCode}</p>
                                </>
                            ) : (
                                <>
                                    <h3>Task: {task.id} | {task.activityCode}</h3>
                                    <p>Client: {task.client || 'Internal'}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="chat-close-btn">
                        <X size={24} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="chat-modal-body">
                    {messages.length === 0 && (
                        <div className="chat-empty-state">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`chat-message-row ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                        >
                            <div className="chat-message-bubble">
                                {msg.attachment_path && (
                                    <div className="chat-file-attachment">
                                        {isImage(msg.attachment_path) ? (
                                            <img src={`http://localhost:5000${msg.attachment_path}`} alt="attachment" className="chat-img-preview" />
                                        ) : (
                                            <div className="chat-file-info">
                                                <FileText size={24} />
                                                <span>File Attachment</span>
                                            </div>
                                        )}
                                        <a href={`http://localhost:5000${msg.attachment_path}`} target="_blank" rel="noreferrer" className="chat-download-btn">
                                            <Download size={16} /> Download
                                        </a>
                                    </div>
                                )}
                                <p>{msg.message_text}</p>
                                <span className="chat-timestamp">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <form onSubmit={handleSendMessage} className="chat-modal-footer">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="chat-attach-btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={uploading ? "Uploading..." : "Type a message..."}
                        className="chat-input"
                        disabled={uploading || !chatInfo}
                    />
                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={!newMessage.trim() || uploading || !chatInfo}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            <style jsx="true">{`
                .chat-modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999; backdrop-filter: blur(4px);
                }
                .chat-modal-container {
                    width: 450px; max-width: 95%; height: 600px; max-height: 90vh;
                    background: white; border-radius: 12px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .chat-modal-header {
                    background: #075e54; color: white; padding: 12px 18px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .chat-user-info { display: flex; align-items: center; gap: 12px; }
                .chat-avatar {
                    width: 38px; height: 38px; background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 16px;
                }
                .chat-details h3 { margin: 0; font-size: 15px; font-weight: 600; }
                .chat-details p { margin: 2px 0 0; font-size: 11px; opacity: 0.8; }
                .chat-close-btn {
                    background: none; border: none; color: white; cursor: pointer;
                    padding: 5px; border-radius: 50%; display: flex;
                }
                .chat-modal-body {
                    flex: 1; overflow-y: auto; background: #e5ddd5;
                    padding: 15px; display: flex; flex-direction: column; gap: 8px;
                }
                .chat-message-row { display: flex; width: 100%; }
                .chat-message-row.sent { justify-content: flex-end; }
                .chat-message-row.received { justify-content: flex-start; }
                .chat-message-bubble {
                    max-width: 80%; padding: 8px 12px; border-radius: 8px;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.1); font-size: 14px;
                }
                .sent .chat-message-bubble { background: #dcf8c6; color: #303030; border-top-right-radius: 0; }
                .received .chat-message-bubble { background: white; color: #303030; border-top-left-radius: 0; }
                .chat-timestamp {
                    display: block; font-size: 10px; color: #888; text-align: right; margin-top: 4px;
                }
                .chat-img-preview { width: 100%; max-height: 250px; object-fit: cover; border-radius: 4px; }
                .chat-modal-footer {
                    padding: 10px; background: #f0f0f0; display: flex; align-items: center; gap: 8px;
                }
                .chat-input {
                    flex: 1; padding: 10px 15px; border-radius: 20px;
                    border: 1px solid #ddd; outline: none; font-size: 14px;
                }
                .chat-send-btn {
                    background: #075e54; color: white; border: none; width: 40px; height: 40px;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }
                .chat-send-btn:disabled { background: #ccc; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default ChatWindow;
