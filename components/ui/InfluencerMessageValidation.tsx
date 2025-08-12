'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Modal } from './Modal';
import { Card } from './Card';

// Types
export interface PendingMessage {
  id: string;
  content: string;
  templateId?: string;
  templateTitle?: string;
  targetAudience: string[];
  category: string;
  scheduledFor?: Date;
  createdAt: Date;
  createdBy: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedReach: number;
  context?: string;
}

export interface ValidationAction {
  type: 'approve' | 'reject' | 'edit';
  message?: string;
  edits?: string;
  editedMetadata?: {
    category?: string;
    priority?: PendingMessage['priority'];
    targetAudience?: string[];
    tags?: string[];
  };
}

export interface InfluencerMessageValidationProps {
  pendingMessages: PendingMessage[];
  onValidate: (messageId: string, action: ValidationAction) => void;
  onBulkValidate?: (messageIds: string[], action: ValidationAction) => void;
  className?: string;
}

export const InfluencerMessageValidation: React.FC<InfluencerMessageValidationProps> = ({
  pendingMessages,
  onValidate,
  onBulkValidate,
  className = ''
}) => {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState<PendingMessage | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'reach'>('date');

  // Filter and sort messages
  const filteredMessages = pendingMessages
    .filter(msg => filterPriority === 'all' || msg.priority === filterPriority)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'reach':
          return b.estimatedReach - a.estimatedReach;
        case 'date':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMessages(
      selectedMessages.length === filteredMessages.length
        ? []
        : filteredMessages.map(msg => msg.id)
    );
  };

  const handleBulkAction = (action: ValidationAction) => {
    if (onBulkValidate && selectedMessages.length > 0) {
      onBulkValidate(selectedMessages, action);
      setSelectedMessages([]);
      setShowBulkActions(false);
    }
  };

  const getPriorityColor = (priority: PendingMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getPriorityBadgeVariant = (priority: PendingMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive' as const;
      case 'high': return 'warning' as const;
      case 'medium': return 'outline' as const;
      case 'low': return 'secondary' as const;
    }
  };

  return (
    <div className={`bg-[var(--color-bg-primary)] ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Message Validation
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {filteredMessages.length} messages pending your review
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedMessages.length} selected
            </Badge>
            {selectedMessages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                Bulk Actions
              </Button>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:border-[var(--color-primary-400)]"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:border-[var(--color-primary-400)]"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="reach">Reach</option>
            </select>
          </div>

          {/* Select All */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="ml-auto"
          >
            {selectedMessages.length === filteredMessages.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && selectedMessages.length > 0 && (
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Bulk Actions for {selectedMessages.length} messages:
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkAction({ type: 'approve' })}
              >
                ✓ Approve All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction({ type: 'reject', message: 'Bulk rejection' })}
              >
                ✕ Reject All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="p-6 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              All caught up!
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              No messages pending validation at the moment.
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <PendingMessageCard
              key={message.id}
              message={message}
              isSelected={selectedMessages.includes(message.id)}
              onSelect={() => handleSelectMessage(message.id)}
              onPreview={() => setShowPreview(message)}
              onValidate={(action) => onValidate(message.id, action)}
            />
          ))
        )}
      </div>

      {/* Message Preview Modal */}
      {showPreview && (
        <MessagePreviewModal
          message={showPreview}
          onClose={() => setShowPreview(null)}
          onValidate={(action) => {
            onValidate(showPreview.id, action);
            setShowPreview(null);
          }}
        />
      )}
    </div>
  );
};

// Pending Message Card Component
const PendingMessageCard: React.FC<{
  message: PendingMessage;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onValidate: (action: ValidationAction) => void;
}> = ({ message, isSelected, onSelect, onPreview, onValidate }) => {
  const [showQuickReject, setShowQuickReject] = useState(false);

  const getPriorityColor = (priority: PendingMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
    }
  };

  const getPriorityBadgeVariant = (priority: PendingMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive' as const;
      case 'high': return 'warning' as const;
      case 'medium': return 'outline' as const;
      case 'low': return 'secondary' as const;
    }
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(message.priority)} ${isSelected ? 'ring-2 ring-[var(--color-primary-400)]' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1 w-4 h-4 text-[var(--color-primary-400)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-primary-400)]"
          />

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityBadgeVariant(message.priority)} className="text-xs">
                  {message.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {message.category}
                </Badge>
                {message.templateTitle && (
                  <Badge variant="secondary" className="text-xs">
                    Template: {message.templateTitle}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Message Preview */}
            <p className="text-[var(--color-text-primary)] mb-3 line-clamp-3 leading-relaxed">
              {message.content}
            </p>

            {/* Context */}
            {message.context && (
              <div className="mb-3 p-2 bg-[var(--color-bg-tertiary)] rounded-md border border-[var(--color-border-primary)]">
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Context:</p>
                <p className="text-sm text-[var(--color-text-primary)]">{message.context}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  ~{message.estimatedReach.toLocaleString()} reach
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                  {message.targetAudience.join(', ')}
                </span>
              </div>
              {message.scheduledFor && (
                <span>Scheduled for {message.scheduledFor.toLocaleDateString()}</span>
              )}
            </div>

            {/* Tags */}
            {message.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {message.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-[var(--color-bg-quaternary)] text-[var(--color-text-tertiary)] rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-border-primary)]">
          <Button variant="outline" size="sm" onClick={onPreview}>
            Preview
          </Button>
          
          <div className="flex items-center gap-2">
            {showQuickReject ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Rejection reason..."
                  className="px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded focus:outline-none focus:border-[var(--color-primary-400)]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onValidate({ 
                        type: 'reject', 
                        message: (e.target as HTMLInputElement).value 
                      });
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickReject(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreview}
                  className="flex items-center gap-1"
                >
                  ✏️ Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowQuickReject(true)}
                >
                  ✕ Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onValidate({ type: 'approve' })}
                  className="relative"
                >
                  ✓ Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Message Preview Modal Component
const MessagePreviewModal: React.FC<{
  message: PendingMessage;
  onClose: () => void;
  onValidate: (action: ValidationAction) => void;
}> = ({ message, onClose, onValidate }) => {
  const [editedContent, setEditedContent] = useState(message.content);
  const [editedCategory, setEditedCategory] = useState(message.category);
  const [editedPriority, setEditedPriority] = useState(message.priority);
  const [editedTargetAudience, setEditedTargetAudience] = useState<string[]>(message.targetAudience);
  const [editedTags, setEditedTags] = useState<string[]>(message.tags);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newAudience, setNewAudience] = useState('');

  // Track changes
  React.useEffect(() => {
    const hasChanges = 
      editedContent !== message.content ||
      editedCategory !== message.category ||
      editedPriority !== message.priority ||
      JSON.stringify(editedTargetAudience) !== JSON.stringify(message.targetAudience) ||
      JSON.stringify(editedTags) !== JSON.stringify(message.tags);
    setHasUnsavedChanges(hasChanges);
  }, [editedContent, editedCategory, editedPriority, editedTargetAudience, editedTags, message]);

  const handleApprove = () => {
    onValidate({ type: 'approve' });
  };

  const handleSaveEdit = () => {
    onValidate({ 
      type: 'edit', 
      edits: editedContent,
      editedMetadata: {
        category: editedCategory,
        priority: editedPriority,
        targetAudience: editedTargetAudience,
        tags: editedTags
      }
    });
  };

  const handleReject = () => {
    onValidate({ 
      type: 'reject', 
      message: rejectionReason 
    });
  };

  const handleResetChanges = () => {
    setEditedContent(message.content);
    setEditedCategory(message.category);
    setEditedPriority(message.priority);
    setEditedTargetAudience(message.targetAudience);
    setEditedTags(message.tags);
    setHasUnsavedChanges(false);
  };

  const addTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setEditedTags(prev => prev.filter(t => t !== tag));
  };

  const addAudience = () => {
    if (newAudience.trim() && !editedTargetAudience.includes(newAudience.trim())) {
      setEditedTargetAudience(prev => [...prev, newAudience.trim()]);
      setNewAudience('');
    }
  };

  const removeAudience = (audience: string) => {
    setEditedTargetAudience(prev => prev.filter(a => a !== audience));
  };

  const categories = ['Announcement', 'Reminder', 'Motivation', 'Technical', 'General'];
  const priorities: PendingMessage['priority'][] = ['low', 'medium', 'high', 'urgent'];

  return (
    <Modal onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Message Preview
          </h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Details */}
          <div className="space-y-4">
            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-amber-800">You have unsaved changes</span>
                <Button size="sm" variant="outline" onClick={handleResetChanges}>
                  Reset
                </Button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[var(--color-text-primary)]">
                  Message Content
                </h3>
                {showEdit && (
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                    <span>{editedContent.length} characters</span>
                  </div>
                )}
              </div>
              {showEdit ? (
                <div className="space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-40 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)] resize-none"
                    placeholder="Enter message content..."
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowAdvancedEdit(!showAdvancedEdit)}
                      className="text-xs text-[var(--color-primary-400)] hover:underline flex items-center gap-1"
                    >
                      {showAdvancedEdit ? 'Hide' : 'Show'} Advanced Options
                      <svg 
                        className={`w-3 h-3 transition-transform ${showAdvancedEdit ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      {editedContent.length > 280 && (
                        <span className="text-amber-600">Long message - consider shortening</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg">
                  <p className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
            </div>

            {/* Advanced Edit Options */}
            {showEdit && showAdvancedEdit && (
              <div className="space-y-4 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                <h4 className="font-medium text-[var(--color-text-primary)] text-sm">Advanced Options</h4>
                
                {/* Priority and Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Priority
                    </label>
                    <select
                      value={editedPriority}
                      onChange={(e) => setEditedPriority(e.target.value as PendingMessage['priority'])}
                      className="w-full px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded focus:outline-none focus:border-[var(--color-primary-400)]"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Category
                    </label>
                    <select
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded focus:outline-none focus:border-[var(--color-primary-400)]"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Target Audience
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAudience())}
                      className="flex-1 px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded focus:outline-none focus:border-[var(--color-primary-400)]"
                      placeholder="Add audience..."
                    />
                    <Button size="sm" onClick={addAudience} className="text-xs px-2 py-1">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {editedTargetAudience.map(audience => (
                      <Badge
                        key={audience}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {audience}
                        <button onClick={() => removeAudience(audience)} className="hover:text-red-500">✕</button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded focus:outline-none focus:border-[var(--color-primary-400)]"
                      placeholder="Add tag..."
                    />
                    <Button size="sm" onClick={addTag} className="text-xs px-2 py-1">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {editedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-[var(--color-primary-400)] text-white rounded-full flex items-center gap-1"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-200">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Priority
                </h4>
                <Badge variant="outline" className="text-xs">
                  {message.priority.toUpperCase()}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Category
                </h4>
                <Badge variant="outline" className="text-xs">
                  {message.category}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Est. Reach
                </h4>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {message.estimatedReach.toLocaleString()} users
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Created
                </h4>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {message.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Target Audience
              </h4>
              <div className="flex flex-wrap gap-1">
                {message.targetAudience.map(audience => (
                  <Badge key={audience} variant="secondary" className="text-xs">
                    {audience}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            {message.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {message.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-[var(--color-bg-quaternary)] text-[var(--color-text-tertiary)] rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
                Chat Preview
              </h3>
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4">
                {/* Mock chat header */}
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-primary)] mb-4">
                  <Avatar name="Influencer" size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      Study Group Chat
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {message.estimatedReach} members
                    </p>
                  </div>
                </div>

                {/* Mock message */}
                <div className="flex gap-3">
                  <Avatar name="Influencer" size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Influencer
                      </span>
                      <Badge variant="primary" className="text-xs px-1.5 py-0.5">
                        Influencer
                      </Badge>
                    </div>
                    <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] px-4 py-2 rounded-xl">
                      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                        {showEdit ? editedContent : message.content}
                      </p>
                      {showEdit && hasUnsavedChanges && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-border-primary)] flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-amber-600">Preview shows your edits</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {showReject && (
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Rejection Reason
                </h4>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this message..."
                  className="w-full h-20 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)] resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--color-border-primary)]">
          <div className="flex items-center gap-2">
            {!showEdit && !showReject && (
              <Button variant="outline" onClick={() => setShowEdit(true)}>
                ✏️ Edit Message
              </Button>
            )}
            {showEdit && (
              <div className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-2">
                <span>{editedContent.trim().length === 0 ? 'Empty message' : `${editedContent.length} chars`}</span>
                {hasUnsavedChanges && (
                  <span className="text-amber-600">• Unsaved changes</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showEdit && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEdit(false);
                    setShowAdvancedEdit(false);
                    handleResetChanges();
                  }}
                >
                  Cancel
                </Button>
                {hasUnsavedChanges && (
                  <Button 
                    variant="ghost" 
                    onClick={handleResetChanges}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    Reset
                  </Button>
                )}
                <Button 
                  variant="primary" 
                  onClick={handleSaveEdit}
                  disabled={!editedContent.trim()}
                  className="relative"
                >
                  {hasUnsavedChanges ? (
                    <>
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      Save Changes
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            )}
            
            {showReject && (
              <>
                <Button variant="outline" onClick={() => setShowReject(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Reject with Reason
                </Button>
              </>
            )}

            {!showEdit && !showReject && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowReject(true)}
                >
                  ✕ Reject
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleApprove}
                  className="relative"
                >
                  ✓ Approve & Send
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InfluencerMessageValidation;