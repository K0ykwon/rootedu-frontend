'use client';

import React, { useState } from 'react';
import { EnhancedChat, ChatUser, ChatMessage } from '../../components/ui/EnhancedChat';
import { InfluencerMessageValidation, PendingMessage, ValidationAction } from '../../components/ui/InfluencerMessageValidation';
import { ChatTemplateManager, ChatTemplate, TemplateCategory } from '../../components/ui/ChatTemplateManager';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';

export default function ChatDemoPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'validation' | 'templates'>('chat');

  // Mock data for chat
  const [currentUser] = useState<ChatUser>({
    id: 'user-1',
    name: 'John Student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    role: 'student',
    isOnline: true
  });

  const [chatUsers] = useState<ChatUser[]>([
    currentUser,
    {
      id: 'influencer-1',
      name: 'Sarah Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'influencer',
      isOnline: true
    },
    {
      id: 'student-2',
      name: 'Mike Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      role: 'student',
      isOnline: true
    },
    {
      id: 'student-3',
      name: 'Emma Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      role: 'student',
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      senderId: 'influencer-1',
      content: 'Welcome to our study group! 🎉 Ready to learn some amazing techniques today?',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: 'text',
      status: 'read',
      reactions: [
        { emoji: '🎉', userId: 'student-2', timestamp: new Date() },
        { emoji: '👍', userId: 'user-1', timestamp: new Date() }
      ]
    },
    {
      id: 'msg-2',
      senderId: 'student-2',
      content: 'Absolutely! I\'ve been practicing the homework exercises.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-3',
      senderId: 'user-1',
      content: 'Same here! Looking forward to today\'s session.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-4',
      senderId: 'influencer-1',
      content: 'Great! Today we\'ll cover advanced problem-solving strategies. I\'ve prepared some special templates to help you master these concepts faster. 💡',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'template',
      status: 'read',
      isTemplate: true,
      templateId: 'template-1',
      validatedBy: 'influencer-1',
      validatedAt: new Date(Date.now() - 20 * 60 * 1000),
      reactions: [
        { emoji: '💡', userId: 'student-2', timestamp: new Date() },
        { emoji: '🔥', userId: 'user-1', timestamp: new Date() }
      ]
    }
  ]);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Mock data for validation
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([
    {
      id: 'pending-1',
      content: 'Hey everyone! 🚀 Just wanted to share an exciting update about our upcoming masterclass on advanced algorithms. We\'ll be covering dynamic programming, graph theory, and optimization techniques that will level up your coding skills!',
      templateId: 'template-announce',
      templateTitle: 'Course Announcement',
      targetAudience: ['Computer Science Students', 'Programming Enthusiasts'],
      category: 'Announcement',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdBy: 'content-team',
      tags: ['algorithm', 'masterclass', 'programming'],
      priority: 'high',
      estimatedReach: 1250,
      context: 'New course launch - high enrollment expected'
    },
    {
      id: 'pending-2',
      content: 'Quick reminder: Don\'t forget to submit your project proposals by Friday! Need help brainstorming ideas? I\'m here to help. Drop me a message anytime! 💬',
      targetAudience: ['Current Students'],
      category: 'Reminder',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdBy: 'content-team',
      tags: ['deadline', 'project', 'help'],
      priority: 'medium',
      estimatedReach: 890
    },
    {
      id: 'pending-3',
      content: 'URGENT: Server maintenance scheduled for tonight 11 PM - 2 AM EST. Please save your work and log out before then. We apologize for any inconvenience!',
      targetAudience: ['All Users'],
      category: 'Technical',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      createdBy: 'tech-team',
      tags: ['maintenance', 'urgent', 'technical'],
      priority: 'urgent',
      estimatedReach: 3200,
      context: 'Critical system update required'
    }
  ]);

  // Mock data for templates
  const [templates, setTemplates] = useState<ChatTemplate[]>([
    {
      id: 'template-1',
      title: 'Welcome New Students',
      content: 'Welcome to our {course_name} study group! 🎉 I\'m excited to have you join us. We meet {schedule} and focus on {topics}. Feel free to ask questions anytime!',
      category: 'welcome',
      tags: ['welcome', 'introduction', 'course'],
      usageCount: 45,
      createdBy: 'influencer-1',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetAudience: ['New Students'],
      estimatedEngagement: 92,
      variables: [
        {
          name: 'course_name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Advanced Mathematics'
        },
        {
          name: 'schedule',
          type: 'text',
          required: true,
          placeholder: 'e.g. Tuesdays at 3 PM'
        },
        {
          name: 'topics',
          type: 'text',
          required: true,
          placeholder: 'e.g. calculus and algebra'
        }
      ]
    },
    {
      id: 'template-2',
      title: 'Assignment Reminder',
      content: '📚 Friendly reminder: The {assignment_name} assignment is due {due_date}. If you need help or have questions, don\'t hesitate to reach out. You\'ve got this! 💪',
      category: 'reminder',
      tags: ['assignment', 'deadline', 'support'],
      usageCount: 128,
      createdBy: 'influencer-1',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetAudience: ['Current Students'],
      estimatedEngagement: 78,
      variables: [
        {
          name: 'assignment_name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Math Problem Set 3'
        },
        {
          name: 'due_date',
          type: 'date',
          required: true
        }
      ]
    },
    {
      id: 'template-3',
      title: 'Motivation & Encouragement',
      content: '🌟 Remember, every expert was once a beginner. You\'re making great progress in {subject}! Keep pushing forward, and don\'t forget to celebrate your small wins along the way. I believe in you!',
      category: 'motivation',
      tags: ['motivation', 'encouragement', 'progress'],
      usageCount: 67,
      createdBy: 'influencer-1',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetAudience: ['Struggling Students', 'All Students'],
      estimatedEngagement: 95,
      variables: [
        {
          name: 'subject',
          type: 'select',
          options: ['Mathematics', 'Science', 'Programming', 'Languages', 'General Studies'],
          required: true
        }
      ]
    },
    {
      id: 'template-4',
      title: 'Study Session Announcement',
      content: '📅 Upcoming Study Session Alert! Join us for {session_topic} on {date} at {time}. We\'ll be covering {key_points}. Bring your questions and let\'s learn together!',
      category: 'announcement',
      tags: ['study-session', 'announcement', 'learning'],
      usageCount: 34,
      createdBy: 'influencer-1',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetAudience: ['Active Students'],
      estimatedEngagement: 86
    },
    {
      id: 'template-5',
      title: 'Quick Tips',
      content: '💡 Pro Tip: {tip_content} Try this technique and let me know how it works for you! Small improvements add up to big results. 🚀',
      category: 'tips',
      tags: ['tips', 'techniques', 'improvement'],
      usageCount: 89,
      createdBy: 'influencer-1',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isActive: true,
      targetAudience: ['All Students'],
      estimatedEngagement: 73
    }
  ]);

  const [categories] = useState<TemplateCategory[]>([
    {
      id: 'welcome',
      name: 'Welcome Messages',
      description: 'Greeting and introduction messages for new students',
      color: '#10b981',
      templateCount: 8
    },
    {
      id: 'reminder',
      name: 'Reminders',
      description: 'Assignment and deadline reminder messages',
      color: '#f59e0b',
      templateCount: 12
    },
    {
      id: 'motivation',
      name: 'Motivation',
      description: 'Encouraging and motivational messages',
      color: '#8b5cf6',
      templateCount: 15
    },
    {
      id: 'announcement',
      name: 'Announcements',
      description: 'Course and event announcement messages',
      color: '#3b82f6',
      templateCount: 9
    },
    {
      id: 'tips',
      name: 'Tips & Advice',
      description: 'Educational tips and study advice',
      color: '#ef4444',
      templateCount: 11
    }
  ]);

  // Event handlers
  const handleSendMessage = (content: string, type?: string, templateId?: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
      type: (type as any) || 'text',
      status: 'sending',
      ...(templateId && { isTemplate: true, templateId })
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Simulate message status updates
    setTimeout(() => {
      setChatMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    setTimeout(() => {
      setChatMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  };

  const handleValidateMessage = (messageId: string, action: ValidationAction) => {
    console.log('Validating message:', messageId, action);
    
    if (action.type === 'approve') {
      // Move to chat or simulate sending
      const message = pendingMessages.find(m => m.id === messageId);
      if (message) {
        const chatMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'influencer-1',
          content: message.content,
          timestamp: new Date(),
          type: message.templateId ? 'template' : 'text',
          status: 'sent',
          isTemplate: !!message.templateId,
          templateId: message.templateId,
          validatedBy: 'influencer-1',
          validatedAt: new Date()
        };
        setChatMessages(prev => [...prev, chatMessage]);
      }
      
      // Remove from pending
      setPendingMessages(prev => prev.filter(m => m.id !== messageId));
    } else if (action.type === 'reject') {
      console.log('Rejected with reason:', action.message);
      setPendingMessages(prev => prev.filter(m => m.id !== messageId));
    } else if (action.type === 'edit') {
      setPendingMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const updatedMessage = { ...m, content: action.edits || m.content };
          
          // Apply metadata edits if provided
          if (action.editedMetadata) {
            if (action.editedMetadata.category) updatedMessage.category = action.editedMetadata.category;
            if (action.editedMetadata.priority) updatedMessage.priority = action.editedMetadata.priority;
            if (action.editedMetadata.targetAudience) updatedMessage.targetAudience = action.editedMetadata.targetAudience;
            if (action.editedMetadata.tags) updatedMessage.tags = action.editedMetadata.tags;
          }
          
          console.log('Message edited:', updatedMessage);
          return updatedMessage;
        }
        return m;
      }));
    }
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.userId === currentUser.id && r.emoji === emoji);
        
        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: reactions.filter(r => !(r.userId === currentUser.id && r.emoji === emoji))
          };
        } else {
          // Add reaction
          return {
            ...msg,
            reactions: [...reactions, {
              emoji,
              userId: currentUser.id,
              timestamp: new Date()
            }]
          };
        }
      }
      return msg;
    }));
  };

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      setTypingUsers(prev => prev.includes(currentUser.id) ? prev : [...prev, currentUser.id]);
    } else {
      setTypingUsers(prev => prev.filter(id => id !== currentUser.id));
    }
  };

  const handleCreateTemplate = (template: Omit<ChatTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    const newTemplate: ChatTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      usageCount: 0
    };
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleUpdateTemplate = (id: string, updates: Partial<ChatTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleUseTemplate = (template: ChatTemplate, variables?: Record<string, string>) => {
    let content = template.content;
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
    }
    
    handleSendMessage(content, 'template', template.id);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date() }
        : t
    ));
  };

  const tabs = [
    { id: 'chat', label: 'Enhanced Chat', badge: chatMessages.length.toString() },
    { id: 'validation', label: 'Message Validation', badge: pendingMessages.length.toString() },
    { id: 'templates', label: 'Templates', badge: templates.length.toString() }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                Enhanced Chat System
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2">
                Advanced chat interface with influencer validation and template management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="primary" className="px-3 py-1">
                Demo Mode
              </Badge>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-primary-400)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-quaternary)]'
                }`}
              >
                {tab.label}
                <Badge 
                  variant={activeTab === tab.id ? "primary" : "default"} 
                  className="text-xs"
                >
                  {tab.badge}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-[700px]">
              <EnhancedChat
                currentUser={currentUser}
                messages={chatMessages}
                users={chatUsers}
                templates={templates.filter(t => t.isActive)}
                onSendMessage={handleSendMessage}
                onReactToMessage={handleReactToMessage}
                onTyping={handleTyping}
                typingUsers={typingUsers.filter(id => id !== currentUser.id)}
                enableTemplates={true}
                enableReactions={true}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="max-h-[700px] overflow-y-auto">
              <InfluencerMessageValidation
                pendingMessages={pendingMessages}
                onValidate={handleValidateMessage}
                onBulkValidate={(messageIds, action) => {
                  messageIds.forEach(id => handleValidateMessage(id, action));
                }}
              />
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="max-h-[700px] overflow-y-auto">
              <ChatTemplateManager
                templates={templates}
                categories={categories}
                onCreateTemplate={handleCreateTemplate}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onUseTemplate={handleUseTemplate}
              />
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border-primary)]">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Enhanced Chat Experience
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Real-time typing indicators, message reactions, replies, status tracking, and elegant UI design
            </p>
          </div>
          
          <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border-primary)]">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Message Validation
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Influencers can review, approve, edit, or reject pre-made messages before sending to students
            </p>
          </div>
          
          <div className="bg-[var(--color-bg-secondary)] p-6 rounded-xl border border-[var(--color-border-primary)]">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Template Management
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Create, organize, and use message templates with variables for consistent and efficient communication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}