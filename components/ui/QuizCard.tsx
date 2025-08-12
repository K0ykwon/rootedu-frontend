import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { ProgressBar } from './Progress';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizCardProps {
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in seconds
  difficulty?: 'easy' | 'medium' | 'hard';
  rewards?: {
    xp: number;
    coins?: number;
    badges?: string[];
  };
  onComplete?: (score: number, timeUsed: number) => void;
  className?: string;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  description,
  questions,
  timeLimit,
  difficulty = 'medium',
  rewards,
  onComplete,
  className = ''
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const difficultyStyles = {
    easy: 'border-green-400 bg-gradient-to-br from-green-50 to-green-100',
    medium: 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100',
    hard: 'border-red-400 bg-gradient-to-br from-red-50 to-red-100'
  };

  const difficultyTextColors = {
    easy: 'text-green-800',
    medium: 'text-yellow-800', 
    hard: 'text-red-800'
  };

  const difficultySubtextColors = {
    easy: 'text-green-700',
    medium: 'text-yellow-700',
    hard: 'text-red-700'
  };

  const difficultyIcons = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴'
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isCompleted && timeLimit && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isCompleted, timeLimit, timeLeft]);

  const startQuiz = () => {
    setIsStarted(true);
    setTimeLeft(timeLimit || 0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    const correctAnswers = questions.reduce((acc, question, index) => {
      return acc + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setIsCompleted(true);
    
    const timeUsed = timeLimit ? timeLimit - timeLeft : 0;
    onComplete?.(finalScore, timeUsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className={`border-2 ${difficultyStyles[difficulty]} rounded-2xl p-6 ${className}`}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🧠</div>
          <h2 className={`text-xl font-bold mb-2 ${difficultyTextColors[difficulty]}`}>{title}</h2>
          <p className={difficultySubtextColors[difficulty]}>{description}</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <Badge variant="primary">
            {difficultyIcons[difficulty]} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          <Badge variant="default">
            📝 {questions.length} Questions
          </Badge>
          {timeLimit && (
            <Badge variant="default">
              ⏱️ {formatTime(timeLimit)}
            </Badge>
          )}
        </div>

        {rewards && (
          <div className="bg-white/50 rounded-xl p-4 mb-6">
            <h3 className={`font-semibold mb-2 ${difficultyTextColors[difficulty]}`}>🎁 Rewards</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">⭐ {rewards.xp} XP</Badge>
              {rewards.coins && <Badge variant="warning">🪙 {rewards.coins} Coins</Badge>}
              {rewards.badges?.map(badge => (
                <Badge key={badge} variant="success">🏆 {badge}</Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={startQuiz} className="w-full" size="lg">
          Start Quiz 🚀
        </Button>
      </div>
    );
  }

  if (isCompleted) {
    const getScoreMessage = () => {
      if (score >= 90) return { emoji: '🎉', message: 'Amazing! You\'re a genius!', color: 'text-green-600' };
      if (score >= 80) return { emoji: '🌟', message: 'Great job! Well done!', color: 'text-blue-600' };
      if (score >= 70) return { emoji: '👍', message: 'Good work! Keep it up!', color: 'text-yellow-600' };
      if (score >= 60) return { emoji: '📚', message: 'Not bad! Study more to improve!', color: 'text-orange-600' };
      return { emoji: '💪', message: 'Keep practicing! You\'ll get better!', color: 'text-red-600' };
    };

    const result = getScoreMessage();

    return (
      <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-2xl p-6 text-center ${className}`}>
        <div className="text-6xl mb-4">{result.emoji}</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Quiz Complete!</h2>
        <p className={`text-lg font-medium mb-4 ${result.color}`}>{result.message}</p>
        
        <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4 mb-6">
          <div className="text-4xl font-bold text-[var(--color-primary-400)] mb-2">{score}%</div>
          <p className="text-[var(--color-text-secondary)]">
            {questions.reduce((acc, _, index) => acc + (selectedAnswers[index] === questions[index].correctAnswer ? 1 : 0), 0)} out of {questions.length} correct
          </p>
        </div>

        {rewards && score >= 60 && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">🎁 Rewards Earned!</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="primary">⭐ +{Math.round(rewards.xp * (score / 100))} XP</Badge>
              {rewards.coins && <Badge variant="warning">🪙 +{Math.round(rewards.coins * (score / 100))} Coins</Badge>}
            </div>
          </div>
        )}

        <Button onClick={() => window.location.reload()} variant="primary">
          Take Quiz Again
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        {timeLimit && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            timeLeft < 30 ? 'bg-red-100 text-red-700' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
          }`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <ProgressBar value={progress} max={100} className="mb-6" />

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
          {currentQ.question}
        </h4>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => selectAnswer(index)}
              disabled={showExplanation}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedAnswers[currentQuestion] === index
                  ? showExplanation
                    ? index === currentQ.correctAnswer
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : 'border-red-400 bg-red-50 text-red-800'
                    : 'border-[var(--color-primary-400)] bg-[var(--color-primary-400)]/10 text-[var(--color-text-primary)]'
                  : showExplanation && index === currentQ.correctAnswer
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-400)] hover:bg-[var(--color-bg-quaternary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {showExplanation && (
                  <span className="ml-auto">
                    {index === currentQ.correctAnswer ? '✅' : selectedAnswers[currentQuestion] === index ? '❌' : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && currentQ.explanation && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <h5 className="font-semibold text-blue-800 mb-2">💡 Explanation</h5>
          <p className="text-blue-700">{currentQ.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {selectedAnswers[currentQuestion] !== -1 && !showExplanation && (
          <Button 
            onClick={() => setShowExplanation(true)}
            variant="outline"
            className="flex-1"
          >
            Check Answer
          </Button>
        )}
        {showExplanation && (
          <Button 
            onClick={nextQuestion}
            className="flex-1"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'} →
          </Button>
        )}
      </div>
    </div>
  );
};