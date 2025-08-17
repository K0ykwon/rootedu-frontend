import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const statusColors = {
    online: 'bg-[var(--color-success)]',
    offline: 'bg-[var(--color-text-quaternary)]',
    away: 'bg-[var(--color-warning)]',
    busy: 'bg-[var(--color-error)]'
  };

  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[var(--color-primary-400)] flex items-center justify-center font-medium text-white`}
      >
        {src ? (
          <img src={src} alt={alt || name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-bg-primary)] ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  className = ''
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-quaternary)] border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;