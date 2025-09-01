'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Send, 
  MessageCircle,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  recipient: {
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
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        let conversationsToSet = data.conversations || [];

        // If no conversations, get available users
        if (conversationsToSet.length === 0) {
          const usersResponse = await fetch('/api/users/available');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            // Convert available users to conversation format
            conversationsToSet = (usersData.users || []).map((user: any) => ({
              user,
              lastMessage: null,
              unreadCount: 0
            }));
          }
        }

        setConversations(conversationsToSet);

        // Auto-select first conversation if available
        if (conversationsToSet.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsToSet[0].user._id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationWith=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedConversation,
          content: newMessage.trim(),
          type: 'text'
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update conversations list
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const selectedUser = conversations.find(conv => conv.user._id === selectedConversation)?.user;

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
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Conversations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversations</h3>
                  <p className="text-gray-600">
                    Start a conversation with your {session?.user?.role === 'client' ? 'dietitian' : 'clients'}.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.user._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation === conversation.user._id ? 'bg-green-50 border-green-200' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.user._id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.user.avatar} />
                          <AvatarFallback>
                            {conversation.user.firstName[0]}{conversation.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.user.role === 'dietitian' ? 'Dr. ' : ''}
                              {conversation.user.firstName} {conversation.user.lastName}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          {conversation.lastMessage ? (
                            <>
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage.content}
                              </p>

                              <p className="text-xs text-gray-500">
                                {format(new Date(conversation.lastMessage.createdAt), 'MMM d, h:mm a')}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-green-600">
                              Click to start conversation
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedUser.role === 'dietitian' ? 'Dr. ' : ''}
                        {selectedUser.firstName} {selectedUser.lastName}
                      </CardTitle>
                      <CardDescription>
                        {selectedUser.role === 'dietitian' ? 'Dietitian' : 'Client'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender._id === session?.user?.id;
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()}>
                      {sending ? (
                        <LoadingSpinner className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
