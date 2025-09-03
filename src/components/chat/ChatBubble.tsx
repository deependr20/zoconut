'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

export interface ChatMessage {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file';
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
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isLastInGroup?: boolean;
}

export function ChatBubble({ 
  message, 
  isOwn, 
  showAvatar = true, 
  showTimestamp = true,
  isLastInGroup = false 
}: ChatBubbleProps) {
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative max-w-xs">
            {!imageError ? (
              <img
                src={message.content}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Failed to load image</p>
              </div>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 text-xs font-medium">📎</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500">File</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={cn(
      "flex items-end space-x-2 mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback className="text-xs">
            {message.sender.firstName[0]}{message.sender.lastName[0]}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div className={cn(
        "relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        isOwn 
          ? "bg-blue-500 text-white rounded-br-md" 
          : "bg-white border border-gray-200 text-gray-900 rounded-bl-md",
        isLastInGroup && (isOwn ? "rounded-br-2xl" : "rounded-bl-2xl")
      )}>
        {renderMessageContent()}
        
        {/* Timestamp and status */}
        <div className={cn(
          "flex items-center justify-end space-x-1 mt-1",
          isOwn ? "text-blue-100" : "text-gray-500"
        )}>
          {showTimestamp && (
            <span className="text-xs">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          )}
          {getStatusIcon()}
        </div>
      </div>

      {/* Spacer for sent messages to maintain alignment */}
      {isOwn && <div className="w-8" />}
    </div>
  );
}

// Typing indicator component
export function TypingIndicator({ 
  user, 
  className 
}: { 
  user: { firstName: string; lastName: string; avatar?: string }; 
  className?: string;
}) {
  return (
    <div className={cn("flex items-end space-x-2 mb-4", className)}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="text-xs">
          {user.firstName[0]}{user.lastName[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
