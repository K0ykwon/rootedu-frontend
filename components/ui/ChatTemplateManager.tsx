'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Card } from './Card';
import { SearchBar } from './SearchBar';

// Types
export interface ChatTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  targetAudience: string[];
  estimatedEngagement: number;
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  templateCount: number;
}

export interface ChatTemplateManagerProps {
  templates: ChatTemplate[];
  categories: TemplateCategory[];
  onCreateTemplate: (template: Omit<ChatTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<ChatTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: ChatTemplate, variables?: Record<string, string>) => void;
  className?: string;
}

export const ChatTemplateManager: React.FC<ChatTemplateManagerProps> = ({
  templates,
  categories,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'usage' | 'date' | 'engagement'>('usage');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChatTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<ChatTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'engagement':
          return b.estimatedEngagement - a.estimatedEngagement;
        case 'date':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const handleUseTemplate = (template: ChatTemplate) => {
    if (template.variables && template.variables.length > 0) {
      setShowTemplateModal(template);
    } else {
      onUseTemplate(template);
    }
  };

  return (
    <div className={`bg-[var(--color-bg-primary)] ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Message Templates
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Manage and organize your pre-made message templates
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create Template
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search templates..."
              className="w-full"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.templateCount})
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)]"
            >
              <option value="usage">Most Used</option>
              <option value="date">Newest</option>
              <option value="engagement">Best Engagement</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[var(--color-primary-400)] text-white' 
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[var(--color-primary-400)] text-white' 
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              No templates found
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Create your first message template to get started'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create Template
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => onDeleteTemplate(template.id)}
                onToggleActive={() => onUpdateTemplate(template.id, { isActive: !template.isActive })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateEditor
          template={editingTemplate}
          categories={categories}
          onSave={(template) => {
            if (editingTemplate) {
              onUpdateTemplate(editingTemplate.id, template);
              setEditingTemplate(null);
            } else {
              onCreateTemplate(template);
              setShowCreateModal(false);
            }
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Template Use Modal */}
      {showTemplateModal && (
        <TemplateUseModal
          template={showTemplateModal}
          onUse={(variables) => {
            onUseTemplate(showTemplateModal, variables);
            setShowTemplateModal(null);
          }}
          onClose={() => setShowTemplateModal(null)}
        />
      )}
    </div>
  );
};

// Template Card Component
const TemplateCard: React.FC<{
  template: ChatTemplate;
  viewMode: 'grid' | 'list';
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}> = ({ template, viewMode, onUse, onEdit, onDelete, onToggleActive }) => {
  const [showActions, setShowActions] = useState(false);

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-500';
    if (engagement >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (viewMode === 'list') {
    return (
      <div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Card className={`p-4 ${!template.isActive ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className={`w-3 h-3 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                  {template.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-2">
                  {template.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
                  <span>Used {template.usageCount} times</span>
                  <span className={getEngagementColor(template.estimatedEngagement)}>
                    {template.estimatedEngagement}% engagement
                  </span>
                  <span>
                    {template.lastUsed 
                      ? `Last used ${template.lastUsed.toLocaleDateString()}`
                      : 'Never used'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="default" className="text-xs">
                  {template.category}
                </Badge>
                {template.variables && template.variables.length > 0 && (
                  <Badge variant="info" className="text-xs">
                    Variables
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={onUse}>
                Use
              </Button>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggleActive}>
                {template.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-500 hover:text-red-600">
                Delete
              </Button>
            </div>
          )}
        </div>
        </Card>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card className={`p-4 ${!template.isActive ? 'opacity-60' : ''} group hover:shadow-lg transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Badge variant="default" className="text-xs">
            {template.category}
          </Badge>
        </div>
        {template.variables && template.variables.length > 0 && (
          <Badge variant="info" className="text-xs">
            Variables
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="font-medium text-[var(--color-text-primary)] mb-2 line-clamp-1">
          {template.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
          {template.content}
        </p>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-[var(--color-bg-quaternary)] text-[var(--color-text-tertiary)] rounded-full"
            >
              #{tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-[var(--color-bg-quaternary)] text-[var(--color-text-tertiary)] rounded-full">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-4">
        <span>Used {template.usageCount}×</span>
        <span className={getEngagementColor(template.estimatedEngagement)}>
          {template.estimatedEngagement}% engagement
        </span>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-2 transition-opacity duration-200 ${
        showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <Button size="sm" onClick={onUse} className="flex-1">
          Use Template
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          ✏️
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleActive}>
          {template.isActive ? '⏸️' : '▶️'}
        </Button>
      </div>
      </Card>
    </div>
  );
};

// Template Editor Modal
const TemplateEditor: React.FC<{
  template?: ChatTemplate | null;
  categories: TemplateCategory[];
  onSave: (template: Omit<ChatTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  onClose: () => void;
}> = ({ template, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    content: template?.content || '',
    category: template?.category || categories[0]?.id || '',
    tags: template?.tags || [],
    targetAudience: template?.targetAudience || [],
    estimatedEngagement: template?.estimatedEngagement || 75,
    isActive: template?.isActive ?? true,
    variables: template?.variables || []
  });

  const [newTag, setNewTag] = useState('');
  const [newAudience, setNewAudience] = useState('');

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    onSave({
      ...formData,
      createdBy: 'current-user', // This should come from auth context
      lastUsed: template?.lastUsed
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addAudience = () => {
    if (newAudience.trim() && !formData.targetAudience.includes(newAudience.trim())) {
      setFormData(prev => ({
        ...prev,
        targetAudience: [...prev.targetAudience, newAudience.trim()]
      }));
      setNewAudience('');
    }
  };

  const removeAudience = (audience: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.filter(a => a !== audience)
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
                placeholder="Template title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Message Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full h-32 px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)] resize-none"
              placeholder="Enter your message template..."
            />
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Use {'{variable_name}'} for dynamic content
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
                placeholder="Add tag..."
              />
              <Button onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-[var(--color-primary-400)] text-white rounded-full flex items-center gap-1"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-200">✕</button>
                </span>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Target Audience
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAudience())}
                className="flex-1 px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
                placeholder="Add audience..."
              />
              <Button onClick={addAudience} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.targetAudience.map(audience => (
                <Badge
                  key={audience}
                  variant="info"
                  className="flex items-center gap-1"
                >
                  {audience}
                  <button onClick={() => removeAudience(audience)} className="hover:text-red-500">✕</button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Est. Engagement Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.estimatedEngagement}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedEngagement: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[var(--color-primary-400)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-primary-400)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">
                  Active template
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-[var(--color-border-primary)]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title.trim() || !formData.content.trim()}
          >
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Template Use Modal (for templates with variables)
const TemplateUseModal: React.FC<{
  template: ChatTemplate;
  onUse: (variables: Record<string, string>) => void;
  onClose: () => void;
}> = ({ template, onUse, onClose }) => {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables?.forEach(variable => {
      initial[variable.name] = variable.defaultValue || '';
    });
    return initial;
  });

  const handleUse = () => {
    onUse(variables);
  };

  const isValid = template.variables?.every(variable => 
    !variable.required || variables[variable.name]?.trim()
  ) ?? true;

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Use Template
          </h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
              {template.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Fill in the variables below to customize your message
            </p>
          </div>

          {template.variables?.map(variable => (
            <div key={variable.name}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                {variable.name.replace(/_/g, ' ')} {variable.required && '*'}
              </label>
              {variable.type === 'select' ? (
                <select
                  value={variables[variable.name] || ''}
                  onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
                >
                  <option value="">Select {variable.name}</option>
                  {variable.options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={variable.type}
                  value={variables[variable.name] || ''}
                  onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                  placeholder={variable.placeholder}
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-400)] text-[var(--color-text-primary)]"
                />
              )}
            </div>
          ))}

          {/* Preview */}
          <div>
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Preview
            </h4>
            <div className="p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg">
              <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                {template.content.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-border-primary)]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUse} disabled={!isValid}>
            Use Template
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChatTemplateManager;