'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Form from '../../../components/ui/Form';
import AuthModal from '../../../components/auth/AuthModal';
import { useAuth } from '../../../hooks/useAuth';
import type { CommunityType } from '@/lib/redis';

interface Props {
  params: Promise<{ postId: string }>;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  body: string;
  createdAt: number;
  likes: number;
}

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
    views: number;
  };
}

const communityLabels: Record<CommunityType, { label: string; color: string }> = {
  'elementary': { label: '초등학생', color: 'bg-blue-100 text-blue-800' },
  'middle': { label: '중학생', color: 'bg-green-100 text-green-800' },
  'high': { label: '고등학생', color: 'bg-purple-100 text-purple-800' },
  'elementary-parent': { label: '초등 학부모', color: 'bg-amber-100 text-amber-800' },
  'middle-parent': { label: '중등 학부모', color: 'bg-teal-100 text-teal-800' },
  'high-parent': { label: '고등 학부모', color: 'bg-rose-100 text-rose-800' }
};

// Mock data for demonstration
const mockPost: Post = {
  id: 'post1',
  title: 'SKY 합격 후기 - 수시 전형 준비법',
  body: `안녕하세요! 올해 SKY 대학에 합격한 학생입니다. 
  
수시 전형 준비 과정에서 도움이 되었던 경험들을 공유하고자 합니다.

1. 내신 관리
- 1학년부터 꾸준히 내신 관리를 했습니다
- 특히 주요 과목은 절대 놓치지 않으려고 노력했어요
- 시험 2주 전부터는 계획표를 짜서 체계적으로 공부했습니다

2. 생활기록부 관리
- 진로와 관련된 활동을 꾸준히 했습니다
- 동아리 활동, 봉사활동, 독서 활동 등을 체계적으로 기록했어요
- 선생님들과 상담을 자주 하면서 피드백을 받았습니다

3. 자기소개서 작성
- 여름방학부터 자기소개서 초안을 작성하기 시작했습니다
- 여러 번 수정하면서 완성도를 높였어요
- 구체적인 경험과 느낀 점을 중심으로 작성했습니다

4. 면접 준비
- 예상 질문을 만들어서 연습했습니다
- 스터디를 만들어서 모의 면접을 진행했어요
- 시사 이슈도 꾸준히 체크했습니다

도움이 되셨으면 좋겠습니다. 궁금한 점이 있으면 댓글로 질문해주세요!`,
  communityType: 'high',
  author: {
    id: 'user1',
    name: '합격생A',
    avatar: '/avatars/user1.jpg'
  },
  tags: ['수시', '합격후기', 'SKY', '입시', '대학'],
  createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  stats: {
    likes: 42,
    comments: 8,
    views: 324
  }
};

const mockComments: Comment[] = [
  {
    id: 'comment1',
    author: {
      name: '예비고3',
      avatar: '/avatars/user2.jpg'
    },
    body: '정말 도움이 많이 되는 글이네요! 혹시 내신이 몇 등급이셨는지 알 수 있을까요?',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    likes: 5
  },
  {
    id: 'comment2',
    author: {
      name: '학부모B',
      avatar: '/avatars/user3.jpg'
    },
    body: '우리 아이도 이 글을 보고 많은 도움을 받았으면 좋겠네요. 좋은 정보 감사합니다!',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    likes: 3
  },
  {
    id: 'comment3',
    author: {
      name: '고2학생',
      avatar: '/avatars/user4.jpg'
    },
    body: '생활기록부 관리 팁이 특히 도움이 되었어요. 저도 지금부터라도 체계적으로 관리해야겠습니다.',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    likes: 7
  }
];

export default function PostDetailPage({ params }: Props) {
  const router = useRouter();
  const { postId } = use(params);
  const { data: session } = useSession();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
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
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    
    if (!post) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' })
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setPost(prev => prev ? ({
          ...prev,
          stats: {
            ...prev.stats,
            likes: isLiked ? prev.stats.likes - 1 : prev.stats.likes + 1
          }
        }) : null);
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentText,
          authorId: session.user.id
        })
      });
      
      if (response.ok) {
        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setCommentText('');
        setShowCommentForm(false);
        if (post) {
          setPost({
            ...post,
            stats: {
              ...post.stats,
              comments: post.stats.comments + 1
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleCommentClick = () => {
    if (requireAuth()) {
      setShowCommentForm(!showCommentForm);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        router.push('/community');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">게시글을 찾을 수 없습니다.</p>
            <Button 
              variant="primary"
              className="mt-4"
              onClick={() => router.push('/community')}
            >
              목록으로
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/community')}
          className="mb-6"
        >
          ← 목록으로
        </Button>

        {/* Post Content */}
        <Card className="mb-8">
          <div className="mb-6">
            {/* Post Header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar
                src={post.author.avatar}
                alt={post.author.name}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {post.author.name}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${communityLabels[post.communityType].color}`}>
                    {communityLabels[post.communityType].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>·</span>
                  <span>조회 {post.stats.views}</span>
                </div>
              </div>
            </div>

            {/* Post Title */}
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              {post.title}
            </h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Post Body */}
            <div className="prose prose-gray max-w-none text-[var(--color-text-primary)] whitespace-pre-wrap">
              {post.body}
            </div>
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-primary)]">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{post.stats.likes}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{post.stats.comments}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                공유
              </Button>
              {session?.user?.id === post.author.id ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeletePost}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  신고
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Comments Section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              댓글 {comments.length}
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCommentClick}
            >
              댓글 작성
            </Button>
          </div>

          {/* Comment Form */}
          {showCommentForm && (
            <Form onSubmit={handleCommentSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg bg-white text-[var(--color-text-primary)] resize-none"
                placeholder="댓글을 입력하세요..."
                required
              />
              <div className="flex gap-2 mt-3">
                <Button type="submit" variant="primary" size="sm">
                  등록
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentText('');
                  }}
                >
                  취소
                </Button>
              </div>
            </Form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {comment.author.name}
                        </span>
                        <span className="text-sm text-[var(--color-text-tertiary)]">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-secondary)] mb-3">
                        {comment.body}
                      </p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{comment.likes}</span>
                        </button>
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                          답글
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[var(--color-text-tertiary)] py-8">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />
    </div>
  );
}