import React, { useRef, useState } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const x = e.touches[0].clientX;
    setCurrentX(x);
    const diff = x - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeRight) {
        // Swiped right
        setTranslateX(window.innerWidth);
        setTimeout(() => {
          onSwipeRight();
          resetPosition();
        }, 300);
      } else if (diff < 0 && onSwipeLeft) {
        // Swiped left
        setTranslateX(-window.innerWidth);
        setTimeout(() => {
          onSwipeLeft();
          resetPosition();
        }, 300);
      } else {
        resetPosition();
      }
    } else {
      resetPosition();
    }
    
    setIsDragging(false);
  };

  const resetPosition = () => {
    setTranslateX(0);
    setCurrentX(0);
    setStartX(0);
  };

  const opacity = 1 - Math.min(Math.abs(translateX) / (threshold * 2), 0.5);
  const scale = 1 - Math.min(Math.abs(translateX) / (threshold * 10), 0.05);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {leftAction && (
        <div className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-opacity ${
          translateX > 0 ? 'opacity-100' : 'opacity-0'
        }`}>
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className={`absolute inset-y-0 right-0 flex items-center pr-4 transition-opacity ${
          translateX < 0 ? 'opacity-100' : 'opacity-0'
        }`}>
          {rightAction}
        </div>
      )}
      
      {/* Swipeable Card */}
      <div
        ref={cardRef}
        className="relative bg-[var(--color-bg-tertiary)] rounded-xl transition-none touch-pan-y"
        style={{
          transform: `translateX(${translateX}px) scale(${scale})`,
          opacity,
          transition: isDragging ? 'none' : 'all 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// Tinder-style stacked cards
interface StackedCard {
  id: string;
  content: React.ReactNode;
}

interface SwipeableStackProps {
  cards: StackedCard[];
  onSwipeLeft?: (card: StackedCard) => void;
  onSwipeRight?: (card: StackedCard) => void;
  className?: string;
}

export const SwipeableStack: React.FC<SwipeableStackProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState<Set<string>>(new Set());

  const handleSwipeLeft = (card: StackedCard) => {
    setSwipedCards(prev => new Set(prev).add(card.id));
    onSwipeLeft?.(card);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleSwipeRight = (card: StackedCard) => {
    setSwipedCards(prev => new Set(prev).add(card.id));
    onSwipeRight?.(card);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  return (
    <div className={`relative ${className}`} style={{ height: '400px' }}>
      {visibleCards.map((card, index) => {
        const isTop = index === 0;
        const scale = 1 - (index * 0.05);
        const translateY = index * 10;
        const zIndex = 30 - index;
        
        return (
          <div
            key={card.id}
            className="absolute inset-0"
            style={{
              transform: `scale(${scale}) translateY(${translateY}px)`,
              zIndex,
              pointerEvents: isTop ? 'auto' : 'none'
            }}
          >
            {isTop ? (
              <SwipeableCard
                onSwipeLeft={() => handleSwipeLeft(card)}
                onSwipeRight={() => handleSwipeRight(card)}
                leftAction={
                  <div className="text-red-500 font-bold text-xl">SKIP</div>
                }
                rightAction={
                  <div className="text-green-500 font-bold text-xl">LIKE</div>
                }
              >
                {card.content}
              </SwipeableCard>
            ) : (
              <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-6 h-full">
                {card.content}
              </div>
            )}
          </div>
        );
      })}
      
      {currentIndex >= cards.length && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[var(--color-text-tertiary)]">No more cards</p>
        </div>
      )}
    </div>
  );
};