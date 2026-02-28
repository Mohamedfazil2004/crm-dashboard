import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const token = localStorage.getItem('access_token');
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    useEffect(() => {
        if (token && user) {
            const newSocket = io({
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('[SOCKET] Connected to chat socket, ID:', newSocket.id);
                newSocket.emit('connect_user', { user_id: user.id });
                console.log('[SOCKET] Joined user room:', user.id);
            });

            newSocket.on('disconnect', () => {
                console.log('[SOCKET] Disconnected from chat socket');
            });

            newSocket.on('connect_error', (error) => {
                console.error('[SOCKET] Connection error:', error);
            });

            newSocket.on('notification', ({ task_code }) => {
                console.log('[SOCKET] Notification received for task:', task_code);
                setUnreadCounts(prev => ({
                    ...prev,
                    [task_code]: (prev[task_code] || 0) + 1
                }));
            });

            newSocket.on('unread_update', () => {
                fetchUnreadCounts();
            });

            setSocket(newSocket);

            // Fetch initial unread counts
            fetchUnreadCounts();

            return () => newSocket.close();
        }
    }, [token]);

    const fetchUnreadCounts = async () => {
        try {
            const response = await fetch('/api/chat/unread-counts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('[CHAT] Unread counts loaded:', data);
                setUnreadCounts(data);
            }
        } catch (error) {
            console.error('[CHAT] Error fetching unread counts:', error);
        }
    };

    const markAsRead = useCallback((task_code) => {
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[task_code];
            return newCounts;
        });

        fetch(`/api/chat/mark-read/${task_code}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        }).then(() => console.log('[CHAT] Marked as read:', task_code));
    }, []);

    return (
        <ChatContext.Provider value={{ socket, unreadCounts, markAsRead, fetchUnreadCounts }}>
            {children}
        </ChatContext.Provider>
    );
};
