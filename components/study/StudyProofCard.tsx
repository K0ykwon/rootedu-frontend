'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { StudyProof } from '@/types/study-proof';

interface StudyProofCardProps {
  proof: StudyProof;
  onLike: () => void;
  onCheer?: (message: string, emoji: string) => void;
  currentUserId: string;
}

export default function StudyProofCard({ proof, onLike, onCheer, currentUserId }: StudyProofCardProps) {
  const [showCheerInput, setShowCheerInput] = useState(false);
  const [cheerMessage, setCheerMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  
  const isLiked = proof.likes.includes(currentUserId);
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      '집중됨': '🎯',
      '의욕충만': '🔥',
      '피곤함': '😴',
      '스트레스': '😰',
      '편안함': '😌',
      '결연함': '💪'
    };
    return moodMap[mood] || '😊';
  };

  const handleCheerSubmit = () => {
    if (cheerMessage.trim() && onCheer) {
      onCheer(cheerMessage, selectedEmoji);
      setCheerMessage('');
      setShowCheerInput(false);
    }
  };

  const cheerEmojis = ['🔥', '💪', '👍', '❤️', '⭐', '🎉', '✨', '🙌'];

  return (
    <Card glass className="overflow-hidden hover:shadow-[0_8px_32px_rgba(86,186,125,0.15)] transition-all duration-300">
      {/* User Info Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-500)]/20 to-[var(--color-primary-400)]/10 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">익명의 학생</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {formatTime(proof.createdAt)} · {proof.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{getMoodEmoji(proof.mood)}</span>
          </div>
        </div>
      </div>

      {/* Planner Photo */}
      {proof.photo && (
        <div className="aspect-[4/3] bg-[var(--glass-bg)] relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-quaternary)]">
            📝 플래너 사진
          </div>
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm font-medium">
              오늘 {proof.studyHours}시간 공부 완료!
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        <p className="text-[var(--color-text-primary)]">
          {proof.description}
        </p>

        {/* Study Stats */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex items-center gap-1">
            <span className="text-lg">⏱️</span>
            <span className="font-semibold text-[var(--color-primary-400)]">
              {proof.studyHours}시간
            </span>
          </div>
          {proof.subjects.length > 0 && (
            <div className="flex items-center gap-2">
              {proof.subjects.slice(0, 3).map((subject, idx) => (
                <Badge key={idx} variant="primary" size="sm">
                  {subject}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        {proof.achievements.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg">
            <span className="text-lg">🏅</span>
            <div className="flex-1">
              {proof.achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>{achievement.icon}</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {achievement.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {proof.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {proof.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-[var(--color-text-secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 transition-colors duration-200 ${
                isLiked
                  ? 'text-red-500'
                  : 'text-[var(--color-text-tertiary)] hover:text-red-500'
              }`}
            >
              <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
              <span className="text-sm font-medium">{proof.likes.length}</span>
            </button>
            <button
              onClick={() => setShowCheerInput(!showCheerInput)}
              className="flex items-center gap-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-400)] transition-colors duration-200"
            >
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium">{proof.cheers.length}</span>
            </button>
            <button className="flex items-center gap-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-400)] transition-colors duration-200">
              <span className="text-lg">📤</span>
              <span className="text-sm">공유</span>
            </button>
          </div>
        </div>

        {/* Cheer Messages */}
        {proof.cheers.length > 0 && (
          <div className="space-y-2 pt-3">
            {proof.cheers.slice(0, 3).map((cheer) => (
              <div key={cheer.id} className="flex items-start gap-2">
                <span className="text-lg">{cheer.emoji}</span>
                <div className="flex-1 bg-[var(--glass-bg)] rounded-lg p-2">
                  <span className="font-medium text-sm text-[var(--color-text-primary)]">
                    {cheer.userName}
                  </span>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                    {cheer.message}
                  </p>
                </div>
              </div>
            ))}
            {proof.cheers.length > 3 && (
              <button className="text-xs text-[var(--color-primary-400)] hover:underline pl-10">
                댓글 {proof.cheers.length - 3}개 더보기
              </button>
            )}
          </div>
        )}

        {/* Cheer Input */}
        {showCheerInput && onCheer && (
          <div className="pt-3 space-y-2">
            <div className="flex gap-1">
              {cheerEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`p-2 rounded transition-all duration-200 ${
                    selectedEmoji === emoji
                      ? 'bg-[var(--color-primary-500)]/20 scale-110'
                      : 'hover:bg-[var(--glass-bg)]'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cheerMessage}
                onChange={(e) => setCheerMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCheerSubmit()}
                placeholder="응원 메시지를 남겨주세요..."
                className="flex-1 px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary-400)]"
              />
              <button 
                onClick={handleCheerSubmit}
                className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg text-sm hover:bg-[var(--color-primary-600)] transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}