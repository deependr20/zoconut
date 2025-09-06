'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  MessageCircle,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search,
  ArrowLeft,
  Check,  
  CheckCheck,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
  attachments?: {
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }[];
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Conversation {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  lastMessage: Message;
  unreadCount: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface AvailableUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  hasExistingConversation: boolean;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session?.user) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (showNewChatDialog) {
      fetchAvailableUsers();
    }
  }, [showNewChatDialog, searchUsers]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (searchUsers) params.append('search', searchUsers);
      
      const response = await fetch(`/api/users/available-for-chat?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (conversationWith: string) => {
    try {
      const response = await fetch(`/api/messages?conversationWith=${conversationWith}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', attachments?: any[]) => {
    if ((!content.trim() && !attachments) || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedConversation,
          content: content.trim() || (type === 'image' ? 'Image' : 'File'),
          type,
          attachments
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [data.message, ...prev]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    sendMessage(newMessage);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a service like Cloudinary
      const fakeUrl = URL.createObjectURL(file);
      const attachment = {
        url: fakeUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type
      };
      
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      sendMessage('', type, [attachment]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const selectConversation = (userId: string) => {
    setSelectedConversation(userId);
    fetchMessages(userId);
  };

  const startNewConversation = (user: AvailableUser) => {
    setSelectedConversation(user._id);
    setMessages([]); // Start with empty messages
    setShowNewChatDialog(false);
    
    // Add user to conversations list if not already there
    if (!conversations.find(c => c.user._id === user._id)) {
      const newConversation: Conversation = {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role
        },
        lastMessage: {} as Message,
        unreadCount: 0,
        isOnline: false
      };
      setConversations(prev => [newConversation, ...prev]);
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender._id !== session?.user.id) return null;
    
    return message.isRead ? (
      <CheckCheck className="h-3 w-3 text-blue-400" />
    ) : (
      <Check className="h-3 w-3 text-gray-400" />
    );
  };

  const selectedUser = conversations.find(c => c.user._id === selectedConversation);

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please sign in to view messages.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-green-600 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Zoconut Chat</h1>
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-700">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                    <DialogDescription>
                      Choose someone to start chatting with
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Search Users */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Available Users List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {loadingUsers ? (
                        <div className="flex justify-center py-4">
                          <LoadingSpinner />
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No users found</p>
                      ) : (
                        availableUsers.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => startNewConversation(user)}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {user.role} • {user.email}
                                </p>
                                {user.hasExistingConversation && (
                                  <p className="text-xs text-blue-600">Existing conversation</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Search */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-sm text-gray-400 mb-4">Start a conversation with a client or dietitian</p>
                <Button onClick={() => setShowNewChatDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.user._id}
                  onClick={() => selectConversation(conversation.user._id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
                    selectedConversation === conversation.user._id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.user.avatar} />
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {conversation.user.firstName[0]}{conversation.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user.firstName} {conversation.user.lastName}
                        </p>
                        {conversation.lastMessage?.createdAt && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage?.type === 'image' ? '📷 Image' : 
                           conversation.lastMessage?.type === 'file' ? '📎 File' :
                           conversation.lastMessage?.content || 'Start conversation...'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.user.avatar} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {selectedUser.user.firstName[0]}{selectedUser.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {selectedUser.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {selectedUser.user.firstName} {selectedUser.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedUser.user.role} • {selectedUser.isOnline ? 'Online' : selectedUser.lastSeen ? `Last seen ${selectedUser.lastSeen}` : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50" style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"0.5\" fill=\"%23000\" opacity=\"0.02\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')"}}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Start the conversation!</p>
                  </div>
                ) : (
                  messages.reverse().map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.sender._id === session.user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                          message.sender._id === session.user.id
                            ? 'bg-green-500 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none'
                        }`}
                      >
                        {message.type === 'image' && message.attachments?.[0] && (
                          <div className="mb-2">
                            <img 
                              src={message.attachments[0].url} 
                              alt="Shared image"
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}
                        {message.type === 'file' && message.attachments?.[0] && (
                          <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-100 rounded">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm">{message.attachments[0].filename}</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <p
                            className={`text-xs ${
                              message.sender._id === session.user.id ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </p>
                          {getMessageStatus(message)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="pr-20"
                      disabled={sending}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendText}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {sending ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,*/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Zoconut Chat</h3>
                <p className="text-gray-500 mb-4">Select a conversation to start messaging</p>
                <Button onClick={() => setShowNewChatDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
