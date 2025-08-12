import React, { useState } from 'react';
import { Button } from './Button';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export const AIChat: React.FC<AIChatProps> = ({
  messages = [],
  onSendMessage,
  placeholder = "Ask me anything...",
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] ${className}`}>
      <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
        <div className="flex flex-col gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full min-h-[44px] max-h-[120px] p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-base text-[var(--color-text-primary)] transition-all duration-150 placeholder:text-[var(--color-text-quaternary)] resize-none focus:outline-none focus:border-[var(--color-primary-400)] focus:shadow-[0_0_0_3px_rgba(86,186,125,0.1)]"
            rows={1}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-quaternary)]">Press Enter to send</span>
            <Button size="sm" onClick={handleSend}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      <ChatAvatar role={message.role} />
      <ChatBubble message={message} />
    </div>
  );
};

interface ChatAvatarProps {
  role: 'user' | 'ai';
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ role }) => {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
      role === 'ai' ? 'bg-[var(--color-primary-400)]' : 'bg-[var(--color-bg-quaternary)]'
    }`}>
      {role === 'ai' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM8 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 10a6 6 0 0 1-4.24-1.76A3 3 0 0 1 6 9h4a3 3 0 0 1 2.24 2.24A6 6 0 0 1 8 13z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--color-text-secondary)]">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z"/>
        </svg>
      )}
    </div>
  );
};

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`max-w-[70%] px-4 py-3 rounded-xl border ${
      isUser 
        ? 'bg-[var(--color-bg-quaternary)] border-[var(--color-border-secondary)] ml-auto'
        : 'bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-500)] text-white border-[var(--color-primary-400)]'
    }`}>
      <p className="text-sm">{message.content}</p>
    </div>
  );
};