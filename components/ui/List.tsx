import React from 'react';

interface ListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  subtitle?: string;
  disabled?: boolean;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  onClick,
  leftContent,
  rightContent,
  subtitle,
  disabled = false,
  className = ''
}) => {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-4 py-3 min-h-[64px] bg-[var(--color-bg-secondary)] transition-all duration-150 ${
        onClick && !disabled ? 'hover:bg-[var(--color-bg-tertiary)] tap-scale cursor-pointer' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {leftContent && (
        <div className="flex-shrink-0">{leftContent}</div>
      )}
      
      <div className="flex-1 text-left">
        <div className="text-base text-[var(--color-text-primary)]">{children}</div>
        {subtitle && (
          <div className="text-sm text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</div>
        )}
      </div>
      
      {rightContent && (
        <div className="flex-shrink-0">{rightContent}</div>
      )}
    </Component>
  );
};

interface ListProps {
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

const List: React.FC<ListProps> = ({
  children,
  divided = true,
  className = ''
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={`bg-[var(--color-bg-secondary)] ${className}`}>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {divided && index < childrenArray.length - 1 && (
            <div className="h-px bg-[var(--color-border-primary)] ml-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Section List with headers
interface SectionListProps {
  sections: {
    title: string;
    data: React.ReactNode[];
  }[];
  className?: string;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  className = ''
}) => {
  return (
    <div className={className}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-6">
          <h3 className="px-4 py-2 text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
            {section.title}
          </h3>
          <List divided>
            {section.data.map((item, itemIndex) => (
              <React.Fragment key={itemIndex}>{item}</React.Fragment>
            ))}
          </List>
        </div>
      ))}
    </div>
  );
};

// Virtual List for performance with large datasets
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  height?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  height = 400
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight)
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const invisibleItemsHeight = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-y-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${invisibleItemsHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Expandable List Item
interface ExpandableListItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  leftContent?: React.ReactNode;
  className?: string;
}

export const ExpandableListItem: React.FC<ExpandableListItemProps> = ({
  title,
  children,
  defaultExpanded = false,
  leftContent,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={className}>
      <ListItem
        onClick={() => setIsExpanded(!isExpanded)}
        leftContent={leftContent}
        rightContent={
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
          </svg>
        }
      >
        {title}
      </ListItem>
      
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-4 py-3 bg-[var(--color-bg-tertiary)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default List;