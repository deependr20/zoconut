'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBubble, TypingIndicator, type ChatMessage } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';

interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface ChatInterfaceProps {
  recipient: ChatUser;
  onBack?: () => void;
  className?: string;
}

export function ChatInterface({ recipient, onBack, className }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Real-time connection
  const { isConnected, onlineUsers, sendTyping } = useRealtime({
    onMessage: (event) => {
      if (event.type === 'new_message') {
        const newMessage = event.data.message;
        if (newMessage.sender._id === recipient._id || newMessage.receiver._id === recipient._id) {
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      }
    },
    onTyping: ({ userId, isTyping }) => {
      if (userId === recipient._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    }
  });

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?conversationWith=${recipient._id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [recipient._id, scrollToBottom]);

  // Send message
  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!content.trim() || sending) return;

    try {
      setSending(true);
      
      // Optimistically add message
      const tempMessage: ChatMessage = {
        _id: `temp-${Date.now()}`,
        content,
        type,
        sender: {
          _id: session!.user.id,
          firstName: session!.user.firstName,
          lastName: session!.user.lastName,
          avatar: session!.user.avatar
        },
        receiver: recipient,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: recipient._id,
          content,
          type
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...sentMessage, status: 'sent' }
              : msg
          )
        );
      } else {
        // Mark message as failed
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...msg, status: 'failed' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id.startsWith('temp-') 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (isTyping: boolean) => {
    sendTyping(recipient._id, isTyping);
  };

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups: ChatMessage[][], message, index) => {
    const prevMessage = messages[index - 1];
    const isSameSender = prevMessage?.sender._id === message.sender._id;
    const timeDiff = prevMessage 
      ? new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
      : Infinity;
    const isWithinTimeWindow = timeDiff < 5 * 60 * 1000; // 5 minutes

    if (isSameSender && isWithinTimeWindow) {
      groups[groups.length - 1].push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, []);

  const isRecipientOnline = onlineUsers.includes(recipient._id);
  const isRecipientTyping = typingUsers.has(recipient._id);

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Chat header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={recipient.avatar} />
              <AvatarFallback>
                {recipient.firstName[0]}{recipient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {isRecipientOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {recipient.firstName} {recipient.lastName}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs capitalize">
                {recipient.role}
              </Badge>
              {isRecipientTyping ? (
                <span className="text-xs text-blue-600">typing...</span>
              ) : isRecipientOnline ? (
                <span className="text-xs text-green-600">online</span>
              ) : (
                <span className="text-xs text-gray-500">offline</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-1">
                {group.map((message, messageIndex) => (
                  <ChatBubble
                    key={message._id}
                    message={message}
                    isOwn={message.sender._id === session?.user.id}
                    showAvatar={messageIndex === 0}
                    showTimestamp={messageIndex === group.length - 1}
                    isLastInGroup={messageIndex === group.length - 1}
                  />
                ))}
              </div>
            ))}
            
            {isRecipientTyping && (
              <TypingIndicator user={recipient} />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sending || !isConnected}
        placeholder={`Message ${recipient.firstName}...`}
      />
    </div>
  );
}
