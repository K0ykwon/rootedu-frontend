'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Modal } from './Modal';

// Types
export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'student' | 'influencer' | 'admin';
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'template' | 'system' | 'media';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  reactions?: MessageReaction[];
  isTemplate?: boolean;
  templateId?: string;
  needsValidation?: boolean;
  validatedBy?: string;
  validatedAt?: Date;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdBy: string;
}

export interface EnhancedChatProps {
  currentUser: ChatUser;
  messages: ChatMessage[];
  users: ChatUser[];
  templates?: MessageTemplate[];
  onSendMessage: (content: string, type?: string, templateId?: string) => void;
  onValidateMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onTyping?: (isTyping: boolean) => void;
  typingUsers?: string[];
  className?: string;
  enableTemplates?: boolean;
  enableValidation?: boolean;
  enableReactions?: boolean;
}

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  currentUser,
  messages,
  users,
  templates = [],
  onSendMessage,
  onValidateMessage,
  onReactToMessage,
  onTyping,
  typingUsers = [],
  className = '',
  enableTemplates = true,
  enableValidation = true,
  enableReactions = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      onTyping?.(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping?.(false);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTyping]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
    }
  };

  const handleSend = (content?: string, templateId?: string) => {
    const messageContent = content || inputValue.trim();
    if (messageContent && onSendMessage) {
      onSendMessage(messageContent, templateId ? 'template' : 'text', templateId);
      setInputValue('');
      setReplyToMessage(null);
      setIsTyping(false);
      onTyping?.(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    handleSend(template.content, template.id);
    setShowTemplates(false);
  };

  const getUserById = (id: string) => users.find(user => user.id === id) || currentUser;

  return (
    <div className={`flex flex-col h-full bg-[var(--color-bg-primary)] ${className}`}>
      {/* Chat Header */}
      <ChatHeader users={users} typingUsers={typingUsers} />
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((message) => (
          <EnhancedChatMessage
            key={message.id}
            message={message}
            user={getUserById(message.senderId)}
            currentUserId={currentUser.id}
            onValidate={enableValidation ? () => onValidateMessage?.(message.id) : undefined}
            onReact={enableReactions ? (emoji) => onReactToMessage?.(message.id, emoji) : undefined}
            onReply={() => setReplyToMessage(message)}
            showValidationButton={enableValidation && message.needsValidation && currentUser.role === 'influencer'}
          />
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator userNames={typingUsers.map(id => getUserById(id).name)} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <ReplyPreview
          message={replyToMessage}
          user={getUserById(replyToMessage.senderId)}
          onClose={() => setReplyToMessage(null)}
        />
      )}

      {/* Message Input */}
      <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4">
        <div className="flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {enableTemplates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(true)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Templates
              </Button>
            )}
          </div>

          {/* Input Area */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full min-h-[44px] max-h-[120px] p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-base text-[var(--color-text-primary)] transition-all duration-200 placeholder:text-[var(--color-text-quaternary)] resize-none focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-400)]/20"
                rows={1}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className="px-4 py-3 rounded-lg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Message Templates Modal */}
      {showTemplates && (
        <MessageTemplatesModal
          templates={templates}
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

// Chat Header Component
const ChatHeader: React.FC<{
  users: ChatUser[];
  typingUsers: string[];
}> = ({ users, typingUsers }) => {
  const onlineCount = users.filter(user => user.isOnline).length;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user) => (
            <Avatar
              key={user.id}
              name={user.name}
              src={user.avatar}
              size="sm"
              className="border-2 border-[var(--color-bg-secondary)]"
            />
          ))}
        </div>
        <div>
          <h3 className="font-medium text-[var(--color-text-primary)]">Study Group</h3>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {onlineCount} online • {users.length} members
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="default" className="text-xs">
          Active
        </Badge>
      </div>
    </div>
  );
};

// Enhanced Chat Message Component
const EnhancedChatMessage: React.FC<{
  message: ChatMessage;
  user: ChatUser;
  currentUserId: string;
  showValidationButton?: boolean;
  onValidate?: () => void;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
}> = ({ message, user, currentUserId, showValidationButton, onValidate, onReact, onReply }) => {
  const [showActions, setShowActions] = useState(false);
  const isOwn = message.senderId === currentUserId;
  const isInfluencer = user.role === 'influencer';

  const getMessageStatusIcon = () => {
    switch (message.status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '👁';
      default: return '';
    }
  };

  return (
    <div 
      className={`flex gap-3 items-start group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <Avatar 
          name={user.name} 
          src={user.avatar} 
          size="sm"
          className="flex-shrink-0"
        />
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {user.name}
            </span>
            {isInfluencer && (
              <Badge variant="primary" className="text-xs px-1.5 py-0.5">
                Influencer
              </Badge>
            )}
          </div>
        )}
        
        <div className={`relative px-4 py-2 rounded-xl ${
          isOwn 
            ? 'bg-[var(--color-primary-400)] text-white' 
            : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]'
        } ${message.needsValidation ? 'ring-2 ring-orange-400/50' : ''}`}>
          
          {/* Template Badge */}
          {message.isTemplate && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -left-2 text-xs bg-[var(--color-bg-primary)]"
            >
              Template
            </Badge>
          )}

          {/* Message Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          {/* Message Footer */}
          <div className="flex items-center justify-between mt-1 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.validatedBy && (
                <span className="text-xs opacity-70">• Validated</span>
              )}
            </div>
            {isOwn && (
              <span className="text-xs opacity-70">
                {getMessageStatusIcon()}
              </span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                const count = message.reactions!.filter(r => r.emoji === emoji).length;
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(emoji)}
                    className="text-xs px-2 py-1 bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-quaternary)] transition-colors"
                  >
                    {emoji} {count}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {showActions && (
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {showValidationButton && (
              <Button size="sm" variant="outline" onClick={onValidate} className="text-xs">
                ✓ Validate
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onReply} className="text-xs">
              Reply
            </Button>
            {onReact && (
              <div className="flex gap-1">
                {['👍', '❤️', '😂', '😮'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="text-xs hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC<{ userNames: string[] }> = ({ userNames }) => {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="..." size="sm" className="animate-pulse" />
      <div className="bg-[var(--color-bg-tertiary)] px-4 py-2 rounded-xl border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {userNames.join(', ')} {userNames.length > 1 ? 'are' : 'is'} typing
          </span>
          <div className="flex gap-1 ml-2">
            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reply Preview Component
const ReplyPreview: React.FC<{
  message: ChatMessage;
  user: ChatUser;
  onClose: () => void;
}> = ({ message, user, onClose }) => {
  return (
    <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)]">
      <div className="flex items-center gap-2">
        <div className="flex-1 p-2 bg-[var(--color-bg-tertiary)] rounded-lg border-l-4 border-[var(--color-primary-400)]">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">
            Replying to {user.name}
          </p>
          <p className="text-sm text-[var(--color-text-primary)] truncate">
            {message.content}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>
    </div>
  );
};

// Message Templates Modal Component
const MessageTemplatesModal: React.FC<{
  templates: MessageTemplate[];
  onSelect: (template: MessageTemplate) => void;
  onClose: () => void;
}> = ({ templates, onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Message Templates
          </h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg hover:border-[var(--color-primary-400)] cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[var(--color-text-primary)]">
                  {template.title}
                </h3>
                <Badge variant="default" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2 line-clamp-2">
                {template.content}
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Used {template.usageCount} times</span>
                <div className="flex gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-[var(--color-bg-quaternary)] rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default EnhancedChat;