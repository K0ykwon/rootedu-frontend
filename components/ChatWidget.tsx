'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'customer' | 'influencer' | 'ai' | 'system';
  content: string;
  timestamp: string;
  status?: 'sent' | 'pending' | 'delivered' | 'read';
  responseSource?: 'ai' | 'influencer';
  canRequestReview?: boolean;
  reviewRequested?: boolean;
  reviewResponseFor?: string;
}

interface ChatWidgetProps {
  influencerSlug: string;
  influencerName?: string;
}

export default function ChatWidget({ influencerSlug, influencerName }: ChatWidgetProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && session) {
      checkAccess();
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (isOpen && hasAccess) {
      loadMessages();
      // Poll for new messages every 3 seconds when chat is open
      const interval = setInterval(() => {
        loadMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, hasAccess]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAccess = async () => {
    setCheckingAccess(true);
    try {
      const response = await fetch(`/api/influencer/${influencerSlug}/check-access`);
      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAccess);
        
        if (!data.hasAccess) {
          setMessages([{
            id: 'system-1',
            role: 'system',
            content: '이 채팅을 이용하시려면 제품을 구매하셔야 합니다.',
            timestamp: new Date().toISOString()
          }]);
        } else {
          // Add welcome message
          setMessages([{
            id: 'welcome',
            role: 'influencer',
            content: `안녕하세요! ${influencerName || influencerSlug}입니다. 무엇을 도와드릴까요? 😊`,
            timestamp: new Date().toISOString(),
            status: 'delivered'
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to check access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/influencer/${influencerSlug}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          
          // Check if there are any pending messages to show typing indicator
          const hasPending = data.messages.some((m: Message) => 
            m.role === 'customer' && m.status === 'pending'
          );
          setIsTyping(hasPending);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !hasAccess) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'customer',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageContent = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`/api/influencer/${influencerSlug}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          userId: (session?.user as any)?.userId,
          userEmail: session?.user?.email
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.responseType === 'immediate' && data.aiResponse) {
          // Handle immediate AI response
          const aiMessage: Message = {
            id: data.aiMessageId,
            role: 'ai',
            content: data.aiResponse,
            timestamp: new Date().toISOString(),
            status: 'delivered',
            responseSource: 'ai',
            canRequestReview: true
          };

          // Update messages with both user message and AI response
          setMessages(prev => prev.map(m => 
            m.id === tempMessage.id 
              ? { ...m, id: data.messageId }  // Update temp message with real ID
              : m
          ).concat([aiMessage]));
        } else {
          // Fallback to old behavior (shouldn't happen with new implementation)
          setMessages(prev => prev.map(m => 
            m.id === tempMessage.id 
              ? { ...m, status: 'pending' as const }
              : m
          ));
          
          setTimeout(() => {
            loadMessages();
          }, 1500);
        }
      } else {
        // Remove the temporary message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        toast.error('메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      toast.error('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const requestInfluencerReview = async (aiMessage: Message, originalMessage: Message) => {
    try {
      const response = await fetch(`/api/influencer/${influencerSlug}/request-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiMessageId: aiMessage.id,
          originalMessage: originalMessage.content,
          aiResponse: aiMessage.content,
          reviewReason: ''
        }),
      });

      if (response.ok) {
        // Update the AI message to show review has been requested
        setMessages(prev => prev.map(m => 
          m.id === aiMessage.id 
            ? { ...m, canRequestReview: false, reviewRequested: true }
            : m
        ));
        
        toast.success(`${influencerName || influencerSlug}에게 검토 요청을 보냈습니다!`);
      } else {
        toast.error('검토 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to request review:', error);
      toast.error('검토 요청 중 오류가 발생했습니다.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 
                   rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 
                   flex items-center justify-center text-white z-[9999] animate-pulse-slow"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-[var(--color-bg-primary)] 
                      rounded-2xl shadow-2xl flex flex-col z-50 border border-[var(--color-border-primary)]
                      animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-primary)] 
                        text-white rounded-t-2xl"
               style={{
                 background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
               }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">
                  {(influencerName || influencerSlug || 'I').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{influencerName || influencerSlug}</h3>
                <p className="text-xs text-white/80">
                  {isTyping ? '입력 중...' : '온라인'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {checkingAccess ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)]"></div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.role === 'customer' ? 'justify-end' : 'justify-start'} 
                                ${message.role === 'system' ? 'justify-center' : ''}`}
                    >
                      {message.role === 'system' ? (
                        <div className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)] 
                                      px-3 py-1 rounded-full">
                          {message.content}
                        </div>
                      ) : (
                        <div className={`group relative max-w-[75%]`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              message.role === 'customer'
                                ? 'bg-[var(--color-primary-500)] text-white rounded-br-sm'
                                : message.role === 'ai'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[var(--color-text-primary)] border border-blue-200 dark:border-blue-800 rounded-bl-sm'
                                : message.role === 'influencer'
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 dark:border-amber-500 text-[var(--color-text-primary)] rounded-bl-sm shadow-md hover:shadow-lg transition-all duration-200'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-bl-sm'
                            }`}
                          >
                            {/* Review Response Indicator for Influencer Messages */}
                            {message.role === 'influencer' && message.reviewResponseFor && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                🔍 <span>AI 답변에 대한 전문가 검토</span>
                              </div>
                            )}
                            <p className={`whitespace-pre-wrap break-words ${
                              message.role === 'influencer' 
                                ? 'text-sm font-medium leading-relaxed' 
                                : 'text-sm'
                            }`}>
                              {message.content}
                            </p>
                            {message.role === 'ai' && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                AI 답변
                              </div>
                            )}
                            {message.role === 'influencer' && (
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                                    👤 {influencerName || influencerSlug} 전문가 답변
                                  </span>
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                  ⏱️ <span>전문가 직접 답변</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${
                            message.role === 'customer' ? 'text-right' : 'text-left'
                          }`}>
                            <span className="text-[var(--color-text-tertiary)]">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.role === 'customer' && message.status && (
                              <span className="ml-2">
                                {message.status === 'sent' && '✓'}
                                {message.status === 'delivered' && '✓✓'}
                                {message.status === 'pending' && '⏱'}
                                {message.status === 'read' && (
                                  <span className="text-blue-500">✓✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Request Review Button for AI messages */}
                    {message.role === 'ai' && message.canRequestReview && !message.reviewRequested && (
                      <div className="flex justify-start mt-2 mb-2">
                        <button
                          onClick={() => {
                            const originalMessage = messages[index - 1]; // Previous message should be the customer message
                            if (originalMessage && originalMessage.role === 'customer') {
                              requestInfluencerReview(message, originalMessage);
                            }
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 
                                   border border-blue-200 dark:border-blue-600 rounded-full px-3 py-1 
                                   hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          💬 인플루언서 검토 요청
                        </button>
                      </div>
                    )}
                    
                    {/* Review Requested Status */}
                    {message.role === 'ai' && message.reviewRequested && (
                      <div className="flex justify-start mt-2 mb-2">
                        <div className="text-xs text-green-600 dark:text-green-400 
                                      border border-green-200 dark:border-green-600 rounded-full px-3 py-1 
                                      bg-green-50 dark:bg-green-900/20">
                          ✅ 검토 요청됨 - {influencerName || influencerSlug}의 답변을 기다리는 중...
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-bg-secondary)] rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" 
                             style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" 
                             style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          {hasAccess ? (
            <div className="p-4 border-t border-[var(--color-border-primary)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 resize-none rounded-xl border border-[var(--color-border-primary)] 
                           bg-[var(--color-bg-secondary)] px-4 py-2 text-sm text-[var(--color-text-primary)]
                           placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 
                           focus:ring-[var(--color-primary-500)] min-h-[40px] max-h-[120px]"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`p-2 rounded-xl transition-all ${
                    inputMessage.trim() && !isLoading
                      ? 'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-[var(--color-border-primary)] text-center">
              <button
                onClick={() => window.location.href = `/influencer/${influencerSlug}/products`}
                className="text-sm text-[var(--color-primary-500)] hover:underline"
              >
                제품 구매하고 채팅 시작하기 →
              </button>
            </div>
          )}
        </div>
      )}

    </>
  );
}