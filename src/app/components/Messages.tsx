import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { database, storage } from '../../lib/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    MoreVertical,
    Edit2,
    Trash2,
    File,
    X,
    Check,
    Search
} from 'lucide-react';

type User = {
    id: string;
    name: string;
    role: string;
    status: 'Active' | 'Inactive';
};

type Message = {
    id: string;
    senderId: string;
    senderName: string;
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: 'image' | 'file';
    timestamp: number;
    edited?: boolean;
};

export function Messages() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Delete State
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null); // Stores ID of message to delete

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Users
    useEffect(() => {
        const usersRef = ref(database, 'accounts');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedUsers = Object.entries(data)
                    .map(([key, value]: [string, any]) => ({
                        id: key,
                        name: value.username,
                        role: value.role,
                        status: value.status
                    }))
                    .filter(u => u.id !== currentUser?.id); // Exclude self
                setUsers(loadedUsers as User[]);
            }
        });

        return () => unsubscribe();
    }, [currentUser?.id]);

    // Fetch Messages for selected chat
    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const chatId = [currentUser.id, selectedUser.id].sort().join('_');
        const messagesRef = ref(database, `messages/${chatId}`);

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedMessages = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value
                }));
                setMessages(loadedMessages);
            } else {
                setMessages([]);
            }
        });

        return () => unsubscribe();
    }, [selectedUser, currentUser]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !isUploading) || !selectedUser || !currentUser) return;

        const chatId = [currentUser.id, selectedUser.id].sort().join('_');
        const messagesRef = ref(database, `messages/${chatId}`);

        await push(messagesRef, {
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: newMessage,
            timestamp: Date.now(),
            type: 'text'
        });

        setNewMessage('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !selectedUser || !currentUser) return;

        const file = e.target.files[0];
        const chatId = [currentUser.id, selectedUser.id].sort().join('_');
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';

        setIsUploading(true);
        try {
            const fileRef = storageRef(storage, `chat_uploads/${chatId}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            const messagesRef = ref(database, `messages/${chatId}`);
            await push(messagesRef, {
                senderId: currentUser.id,
                senderName: currentUser.name,
                fileUrl: url,
                fileName: file.name,
                fileType: fileType,
                timestamp: Date.now(),
                type: fileType
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startEdit = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditText(msg.text || '');
    };

    const saveEdit = async (msgId: string) => {
        if (!selectedUser || !currentUser) return;
        const chatId = [currentUser.id, selectedUser.id].sort().join('_');
        const msgRef = ref(database, `messages/${chatId}/${msgId}`);

        await update(msgRef, {
            text: editText,
            edited: true
        });

        setEditingMessageId(null);
    };

    const handleDelete = (msgId: string) => {
        setDeleteConfirmation(msgId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation || !selectedUser || !currentUser) return;

        try {
            const chatId = [currentUser.id, selectedUser.id].sort().join('_');
            const msgRef = ref(database, `messages/${chatId}/${deleteConfirmation}`);
            await remove(msgRef);
            setDeleteConfirmation(null); // Close modal
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message");
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6">
            {/* Users List Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="Search users..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedUser?.id === user.id
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className={`font-medium truncate ${selectedUser?.id === user.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user.role}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                                    {selectedUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser?.id;
                                const isEditing = editingMessageId === msg.id;

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm relative ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-700'
                                            }`}>
                                            {/* Edit/Delete Actions (Sender Only) */}
                                            {isMe && !isEditing && (
                                                <div className="absolute -top-8 right-0 hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                                                    <button onClick={() => startEdit(msg)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleDelete(msg.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Message Content */}
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="bg-white/20 text-white border-none rounded px-2 py-1 outline-none w-full"
                                                    />
                                                    <button onClick={() => saveEdit(msg.id)}><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingMessageId(null)}><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                                                    {msg.fileUrl && (
                                                        <div className="mt-2">
                                                            {msg.fileType === 'image' ? (
                                                                <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                                                    <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity" />
                                                                </a>
                                                            ) : (
                                                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-blue-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                                    <File className="w-4 h-4" />
                                                                    <span className="text-sm underline break-all">{msg.fileName}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Metadata */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {msg.edited && <span>(edited)</span>}
                                                <span>{formatTime(msg.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-end gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                // accept="image/*, application/pdf" // Optional restriction
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? <div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <Paperclip className="w-5 h-5" />}
                                </button>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full px-4 py-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && !isUploading}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <img src="/placeholder-chat.svg" className="w-8 h-8 opacity-50" alt="" /> {/* Just a placeholder, or use Icon */}
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Conversation</h3>
                        <p className="max-w-xs mx-auto">Choose a user from the sidebar to start chatting, sending files, and collaborating in real-time.</p>
                    </div>
                )}

            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Message?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete this message?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
