'use client';

import { motion } from 'framer-motion';
import { Bot, User, Clock } from 'lucide-react';
import type { ReflectionMessage } from '@/lib/types/study-plan';

interface MessageBubbleProps {
  message: ReflectionMessage;
  isTyping?: boolean;
  index: number;
}

export default function MessageBubble({ message, isTyping = false, index }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}
    >
      {/* 아바타 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: (index * 0.1) + 0.2 }}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                   ${isUser
                     ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                     : 'bg-gradient-to-br from-green-500 to-blue-600'
                   } shadow-lg`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </motion.div>

      {/* 메시지 컨테이너 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* 발신자 정보 */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500 font-medium">
            {isUser ? '나' : 'AI 컨설턴트'}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* 메시지 버블 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: (index * 0.1) + 0.3 }}
          className={`relative px-4 py-3 rounded-2xl shadow-md
                     ${isUser
                       ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                       : 'bg-white border border-gray-200 text-gray-800'
                     }`}
        >
          {/* 메시지 내용 */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}

            {/* 타이핑 인디케이터 */}
            {isTyping && isAssistant && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block ml-1"
              >
                ▊
              </motion.span>
            )}
          </div>

          {/* 말풍선 꼬리 */}
          <div
            className={`absolute top-3 w-0 h-0 border-t-8 border-b-8 border-t-transparent border-b-transparent
                       ${isUser
                         ? 'right-[-8px] border-l-8 border-l-blue-500'
                         : 'left-[-8px] border-r-8 border-r-white'
                       }`}
          />
        </motion.div>

        {/* AI 메시지인 경우 추가 정보 */}
        {isAssistant && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (index * 0.1) + 0.5 }}
            className="mt-1 text-xs text-gray-400 flex items-center gap-1"
          >
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span>AI 생성됨</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}