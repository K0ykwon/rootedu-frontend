'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Badge from './Badge';

// Interactive Study Buddy Component
interface StudyBuddyProps {
  name?: string;
  mood?: 'happy' | 'excited' | 'focused' | 'sleepy' | 'proud';
  level?: number;
  onInteraction?: (type: string) => void;
  messages?: string[];
  className?: string;
}

export const StudyBuddy: React.FC<StudyBuddyProps> = ({
  name = 'Rooty',
  mood = 'happy',
  level = 1,
  onInteraction,
  messages = [
    "Let's learn something new today! 📚",
    "You're doing great! Keep it up! 💪",
    "Ready for the next challenge? 🚀",
    "I believe in you! You've got this! ✨",
    "Every mistake is a step closer to success! 🌱"
  ],
  className = ''
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<Date>(new Date());

  // Mascot expressions based on mood
  const expressions = {
    happy: { emoji: '😊', color: 'from-green-400 to-blue-500' },
    excited: { emoji: '🤩', color: 'from-yellow-400 to-orange-500' },
    focused: { emoji: '🤓', color: 'from-blue-400 to-indigo-500' },
    sleepy: { emoji: '😴', color: 'from-purple-400 to-pink-500' },
    proud: { emoji: '😎', color: 'from-emerald-400 to-teal-500' }
  };

  // Auto-rotate messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleInteraction = useCallback((type: string) => {
    setIsAnimating(true);
    setLastInteraction(new Date());
    onInteraction?.(type);
    
    setTimeout(() => setIsAnimating(false), 1000);
  }, [onInteraction]);

  const currentExpression = expressions[mood];

  return (
    <div className={`bg-gradient-to-br ${currentExpression.color} rounded-2xl p-4 text-white relative overflow-hidden ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-2 text-4xl">🌟</div>
        <div className="absolute bottom-2 left-2 text-3xl">✨</div>
        <div className="absolute top-1/2 right-1/4 text-2xl">💫</div>
      </div>

      <div className="relative z-10">
        {/* Mascot Avatar */}
        <div className="text-center mb-4">
          <div className={`inline-block text-6xl transition-transform duration-500 ${
            isAnimating ? 'scale-110 animate-bounce' : ''
          }`}>
            {currentExpression.emoji}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <h3 className="font-bold text-lg">{name}</h3>
            <Badge variant="info" className="bg-white/20 text-white border-white/30">
              Lv.{level}
            </Badge>
          </div>
        </div>

        {/* Message Bubble */}
        <div className="bg-white/90 text-gray-800 rounded-2xl p-3 mb-4 relative">
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white/90 transform rotate-45"></div>
          <p className="text-sm font-medium text-center">
            {messages[currentMessage]}
          </p>
        </div>

        {/* Interaction Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleInteraction('pat')}
            className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            title="Pat Rooty"
          >
            <span className="text-2xl">🫳</span>
          </button>
          <button
            onClick={() => handleInteraction('feed')}
            className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            title="Give treat"
          >
            <span className="text-2xl">🍎</span>
          </button>
          <button
            onClick={() => handleInteraction('play')}
            className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            title="Play game"
          >
            <span className="text-2xl">🎾</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Avatar Customization Component
interface AvatarCustomizerProps {
  currentAvatar: {
    face: string;
    accessory: string;
    background: string;
  };
  onAvatarChange: (avatar: any) => void;
  className?: string;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  currentAvatar,
  onAvatarChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'face' | 'accessory' | 'background'>('face');

  const options = {
    face: ['😊', '😎', '🤓', '🥳', '😴', '🤔', '😍', '🤗'],
    accessory: ['🎩', '👑', '🎓', '🕶️', '🎀', '⭐', '🌟', '💎'],
    background: [
      'from-red-400 to-pink-500',
      'from-blue-400 to-purple-500',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-purple-400 to-indigo-500',
      'from-pink-400 to-rose-500'
    ]
  };

  const handleOptionSelect = (category: string, option: string) => {
    onAvatarChange({
      ...currentAvatar,
      [category]: option
    });
  };

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-2xl p-4 border border-[var(--color-border-primary)] ${className}`}>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 text-center">
        🎨 Customize Your Avatar
      </h3>

      {/* Preview */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${currentAvatar.background} relative`}>
          <span className="text-3xl">{currentAvatar.face}</span>
          {currentAvatar.accessory && (
            <span className="absolute -top-1 -right-1 text-lg">
              {currentAvatar.accessory}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg mb-4">
        {(['face', 'accessory', 'background'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${
              activeTab === tab
                ? 'bg-[var(--color-primary-400)] text-white'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab === 'face' && '😊 Face'}
            {tab === 'accessory' && '🎩 Style'}
            {tab === 'background' && '🌈 Theme'}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-4 gap-2">
        {activeTab === 'background' ? (
          options[activeTab].map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(activeTab, option)}
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${option} border-2 transition-all duration-200 hover:scale-105 ${
                currentAvatar[activeTab] === option 
                  ? 'border-[var(--color-primary-400)] ring-2 ring-[var(--color-primary-400)]/30' 
                  : 'border-transparent'
              }`}
            />
          ))
        ) : (
          options[activeTab].map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(activeTab, option)}
              className={`w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] border-2 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-105 hover:bg-[var(--color-bg-quaternary)] ${
                currentAvatar[activeTab] === option 
                  ? 'border-[var(--color-primary-400)] ring-2 ring-[var(--color-primary-400)]/30' 
                  : 'border-transparent'
              }`}
            >
              {option}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// Study Companion Component
interface StudyCompanionProps {
  studyTime: number; // in minutes
  tasksCompleted: number;
  onEncouragement?: () => void;
  className?: string;
}

export const StudyCompanion: React.FC<StudyCompanionProps> = ({
  studyTime,
  tasksCompleted,
  onEncouragement,
  className = ''
}) => {
  const [companionState, setCompanionState] = useState<'idle' | 'studying' | 'celebrating'>('idle');

  // Determine companion mood based on activity
  const getCompanionMood = () => {
    if (studyTime > 60) return { emoji: '🤓', message: "Wow! You're on fire today!" };
    if (studyTime > 30) return { emoji: '😊', message: "Great focus! Keep it up!" };
    if (tasksCompleted > 3) return { emoji: '🎉', message: "Task master! Amazing work!" };
    if (tasksCompleted > 0) return { emoji: '👍', message: "Nice progress! I'm proud of you!" };
    return { emoji: '🌱', message: "Ready to start learning together?" };
  };

  const currentMood = getCompanionMood();

  useEffect(() => {
    // Change companion state based on activity
    if (studyTime > 0) {
      setCompanionState('studying');
    } else if (tasksCompleted > 0) {
      setCompanionState('celebrating');
    } else {
      setCompanionState('idle');
    }
  }, [studyTime, tasksCompleted]);

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-2xl p-4 border border-[var(--color-border-primary)] ${className}`}>
      <div className="flex items-start gap-3">
        {/* Companion Avatar */}
        <div className={`text-4xl transition-all duration-500 ${
          companionState === 'studying' ? 'animate-pulse' : 
          companionState === 'celebrating' ? 'animate-bounce' : ''
        }`}>
          {currentMood.emoji}
        </div>

        {/* Message and Stats */}
        <div className="flex-1">
          <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-3 mb-3">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {currentMood.message}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 text-xs text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1">
              ⏰ {studyTime}min today
            </span>
            <span className="flex items-center gap-1">
              ✅ {tasksCompleted} tasks done
            </span>
          </div>
        </div>

        {/* Encouragement Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onEncouragement}
          className="text-2xl px-2"
          title="Get encouragement"
        >
          💬
        </Button>
      </div>
    </div>
  );
};

// Mood Tracker Component
interface MoodTrackerProps {
  currentMood: string;
  moodHistory: Array<{ date: string; mood: string }>;
  onMoodSelect: (mood: string) => void;
  className?: string;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({
  currentMood,
  moodHistory,
  onMoodSelect,
  className = ''
}) => {
  const moods = [
    { emoji: '😊', name: 'Happy', color: 'bg-yellow-200' },
    { emoji: '😢', name: 'Sad', color: 'bg-blue-200' },
    { emoji: '😴', name: 'Tired', color: 'bg-purple-200' },
    { emoji: '😤', name: 'Stressed', color: 'bg-red-200' },
    { emoji: '🤗', name: 'Excited', color: 'bg-orange-200' },
    { emoji: '😌', name: 'Calm', color: 'bg-green-200' }
  ];

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-2xl p-4 border border-[var(--color-border-primary)] ${className}`}>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
        📊 How are you feeling?
      </h3>

      {/* Current Mood Display */}
      <div className="text-center mb-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
        <div className="text-4xl mb-2">{currentMood}</div>
        <p className="text-sm text-[var(--color-text-secondary)]">Current mood</p>
      </div>

      {/* Mood Selection Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => onMoodSelect(mood.emoji)}
            className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              currentMood === mood.emoji 
                ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-400)]/10' 
                : 'border-transparent bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-quaternary)]'
            }`}
          >
            <div className="text-2xl mb-1">{mood.emoji}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">{mood.name}</div>
          </button>
        ))}
      </div>

      {/* Mood History Summary */}
      <div className="text-center text-sm text-[var(--color-text-tertiary)]">
        Tracked {moodHistory.length} mood{moodHistory.length !== 1 ? 's' : ''} this week
      </div>
    </div>
  );
};