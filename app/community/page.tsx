'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Form from '../../components/ui/Form';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import CommunityNav from '../../components/community/CommunityNav';
import AuthModal from '../../components/auth/AuthModal';
import { useAuth } from '../../hooks/useAuth';
import type { CommunityType } from '@/lib/redis';

interface Post {
  id: string;
  title: string;
  body: string;
  communityType: CommunityType;
  author: { 
    id: string;
    name: string; 
    avatar: string;
  };
  tags: string[];
  createdAt: number;
  stats: { 
    likes: number; 
    comments: number;
  };
}

// Community labels for display
const communityLabels: Record<CommunityType, { label: string; color: string }> = {
  'elementary': { label: '초등학생', color: 'bg-blue-500/10 text-blue-400' },
  'middle': { label: '중학생', color: 'bg-green-500/10 text-green-400' },
  'high': { label: '고등학생', color: 'bg-purple-500/10 text-purple-400' },
  'elementary-parent': { label: '초등 학부모', color: 'bg-amber-500/10 text-amber-400' },
  'middle-parent': { label: '중등 학부모', color: 'bg-teal-500/10 text-teal-400' },
  'high-parent': { label: '고등 학부모', color: 'bg-rose-500/10 text-rose-400' }
};

// Enhanced mock data with community types
const mockPosts: Post[] = [
  {
    id: 'post1',
    title: '초등 수학 문제집 추천 부탁드려요',
    body: '안녕하세요! 초등 4학년 아이가 수학에 흥미를 보이는데, 적절한 문제집을 추천해주실 수 있나요? 기초부터 심화까지 단계별로 학습할 수 있는 교재를 찾고 있습니다...',
    communityType: 'elementary-parent',
    author: { id: 'user1', name: '학부모A', avatar: '/avatars/user1.jpg' },
    tags: ['초등수학', '문제집추천', '4학년'],
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    stats: { likes: 15, comments: 8 }
  },
  {
    id: 'post2',
    title: 'SKY 합격 후기 - 수시 전형 준비법',
    body: '안녕하세요! 올해 SKY 대학에 합격한 학생입니다. 수시 전형 준비 과정에서 도움이 되었던 경험들을 공유하고자 합니다...',
    communityType: 'high',
    author: { id: 'user2', name: '합격생A', avatar: '/avatars/user2.jpg' },
    tags: ['수시', '합격후기', 'SKY'],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    stats: { likes: 42, comments: 12 }
  },
  {
    id: 'post3',
    title: '중학교 내신 관리 팁 공유합니다',
    body: '중학교 2학년 학생입니다. 1학년부터 꾸준히 내신 관리해서 전과목 A를 받고 있는데, 제가 사용한 공부법을 공유하려고 합니다...',
    communityType: 'middle',
    author: { id: 'user3', name: '중학생B', avatar: '/avatars/user3.jpg' },
    tags: ['내신관리', '공부법', '중2'],
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    stats: { likes: 28, comments: 15 }
  },
  {
    id: 'post4',
    title: '의대 입시 준비 - 생명과학 공부법',
    body: '의대 입시를 준비하는 학생들을 위한 생명과학 효율적 공부법을 소개합니다...',
    communityType: 'high',
    author: { id: 'user4', name: '예비의대생', avatar: '/avatars/user4.jpg' },
    tags: ['의대', '생명과학', '입시'],
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    stats: { likes: 35, comments: 20 }
  },
  {
    id: 'post5',
    title: '초등학생 영어 학원 선택 고민이에요',
    body: '초등 3학년 아이 영어 학원을 알아보고 있는데, 회화 중심이 좋을지 문법 중심이 좋을지 고민입니다. 경험 있으신 분들의 조언 부탁드려요...',
    communityType: 'elementary-parent',
    author: { id: 'user5', name: '학부모C', avatar: '/avatars/user5.jpg' },
    tags: ['영어학원', '초등영어', '학원선택'],
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    stats: { likes: 22, comments: 18 }
  },
  {
    id: 'post6',
    title: '즐거운 과학 실험 했어요!',
    body: '오늘 학교에서 정말 재미있는 과학 실험을 했어요! 베이킹소다와 식초로 화산 폭발 실험을 했는데 너무 신기했어요...',
    communityType: 'elementary',
    author: { id: 'user6', name: '초등학생D', avatar: '/avatars/user6.jpg' },
    tags: ['과학실험', '초등과학', '재미있는수업'],
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    stats: { likes: 18, comments: 6 }
  }
];

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'comments', label: '댓글순' }
];

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuth();
  const [showPostForm, setShowPostForm] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityType>('high');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: '',
    communityType: 'high' as CommunityType
  });

  // Fetch posts from database
  useEffect(() => {
    fetchPosts();
  }, [selectedCommunity, sortBy]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?communityType=${selectedCommunity}&sort=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };


  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}분 전`;
    }
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    return `${diffInDays}일 전`;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          tags: formData.tags,
          communityType: selectedCommunity,
          authorId: session.user.id
        })
      });

      if (response.ok) {
        setShowPostForm(false);
        setFormData({ title: '', body: '', tags: '', communityType: selectedCommunity });
        fetchPosts(); // Refresh posts
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteClick = () => {
    if (requireAuth()) {
      setShowPostForm(!showPostForm);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] premium-gradient noise-texture">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-transparent via-[var(--color-primary-500)]/5 to-transparent blur-xl" />
          <h1 className="relative text-3xl font-semibold text-[var(--color-text-primary)] mb-2 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-primary-400)] bg-clip-text">
            루트에듀 커뮤니티
          </h1>
          <p className="relative text-[var(--color-text-secondary)]">
            학년별, 학부모별로 구분된 커뮤니티에서 정보를 공유하고 소통해요
          </p>
        </div>

        {/* Community Navigation */}
        <CommunityNav 
          selectedCommunity={selectedCommunity}
          onCommunityChange={setSelectedCommunity}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
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
          <Button 
            variant="primary"
            onClick={handleWriteClick}
          >
            {showPostForm ? '취소' : '✏️ 글쓰기'}
          </Button>
        </div>

        {/* Post Form */}
        {showPostForm && (
          <Card glass className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              새 글 작성
            </h3>
            <Form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-[var(--glass-border)] rounded-lg backdrop-blur-sm">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <strong>{communityLabels[selectedCommunity].label}</strong> 커뮤니티에 글을 작성합니다
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--glass-border)] rounded-lg bg-[var(--glass-bg)] backdrop-blur-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]/20 transition-all duration-200"
                  placeholder="게시글 제목을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  내용
                </label>
                <textarea
                  rows={6}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--glass-border)] rounded-lg bg-[var(--glass-bg)] backdrop-blur-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]/20 transition-all duration-200"
                  placeholder="내용을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  태그
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--glass-border)] rounded-lg bg-[var(--glass-bg)] backdrop-blur-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]/20 transition-all duration-200"
                  placeholder="태그를 쉼표로 구분하여 입력하세요"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="primary">게시하기</Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowPostForm(false)}
                >
                  취소
                </Button>
              </div>
            </Form>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            <Card glass className="text-center py-12">
              <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
            </Card>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Card 
                key={post.id} 
                glass
                className="hover-lift cursor-pointer hover:shadow-[0_8px_24px_rgba(86,186,125,0.1)] transition-all duration-300"
                onClick={() => handlePostClick(post.id)}
              >
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm border border-[var(--glass-border)] ${communityLabels[post.communityType].color}`}>
                          {communityLabels[post.communityType].label}
                        </span>
                        <span className="text-sm text-[var(--color-text-tertiary)]">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      {session?.user?.id === post.author.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      )}
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
                        <span className="flex items-center gap-1 hover:text-[var(--color-primary-400)] transition-colors duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.stats.likes}
                        </span>
                        <span className="flex items-center gap-1 hover:text-[var(--color-primary-400)] transition-colors duration-200">
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
            ))
          ) : (
            <Card glass className="text-center py-12">
              <p className="text-[var(--color-text-secondary)]">
                {communityLabels[selectedCommunity].label} 커뮤니티에 아직 게시글이 없습니다.
              </p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={handleWriteClick}
              >
                첫 번째 글 작성하기
              </Button>
            </Card>
          )}
        </div>

        {/* Load More */}
        {posts.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              더 보기
            </Button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />
    </div>
  );
}