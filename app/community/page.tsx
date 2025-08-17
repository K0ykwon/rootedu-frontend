'use client';

import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Form from '../../components/ui/Form';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

const mockPosts = [
  {
    id: 'post1',
    title: 'SKY 합격 후기 - 수시 전형 준비법',
    body: '안녕하세요! 올해 SKY 대학에 합격한 학생입니다. 수시 전형 준비 과정에서 도움이 되었던 경험들을 공유하고자 합니다...',
    author: { name: '합격생A', avatar: '/avatars/user1.jpg' },
    tags: ['수시', '합격후기', 'SKY'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    stats: { likes: 42, comments: 8 }
  },
  {
    id: 'post2',
    title: '의대 입시 준비 - 생명과학 공부법',
    body: '의대 입시를 준비하는 학생들을 위한 생명과학 효율적 공부법을 소개합니다...',
    author: { name: '예비의대생', avatar: '/avatars/user2.jpg' },
    tags: ['의대', '생명과학', '입시'],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    stats: { likes: 28, comments: 12 }
  }
];

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'comments', label: '댓글순' }
];

export default function CommunityPage() {
  const [showPostForm, setShowPostForm] = useState(false);
  const [sortBy, setSortBy] = useState('latest');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    return `${diffInDays}일 전`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
              커뮤니티
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              동료 학습자들과 경험을 공유하고 함께 성장해요
            </p>
          </div>
          <Button 
            variant="primary"
            onClick={() => setShowPostForm(!showPostForm)}
          >
            {showPostForm ? '취소' : '글쓰기'}
          </Button>
        </div>

        {/* Post Form */}
        {showPostForm && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              새 글 작성
            </h3>
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  제목
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  placeholder="게시글 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  내용
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  placeholder="내용을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  태그
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  placeholder="태그를 쉼표로 구분하여 입력하세요"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="primary">게시하기</Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowPostForm(false)}
                >
                  취소
                </Button>
              </div>
            </Form>
          </Card>
        )}

        {/* Sort Options */}
        <div className="mb-6">
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "primary" : "outline"}
                size="sm"
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {mockPosts.map((post) => (
            <Card key={post.id} className="hover-lift cursor-pointer">
              <div className="flex items-start gap-4">
                <Avatar 
                  src={post.author.avatar}
                  alt={post.author.name}
                  size="md"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {post.author.name}
                      </span>
                      <span className="text-sm text-[var(--color-text-tertiary)]">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-[var(--color-text-secondary)] mb-4 line-clamp-3">
                    {post.body}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {post.stats.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.stats.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline">
            더 보기
          </Button>
        </div>
      </div>
    </div>
  );
}