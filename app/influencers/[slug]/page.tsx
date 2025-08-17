'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { InfluencerProfileHeader } from '../../../components/ui/InfluencerProfile';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import Skeleton from '../../../components/ui/Skeleton';
import CourseCard from '../../../components/ui/CourseCard';

interface Influencer {
  slug: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  subjects: string[];
  tags: string[];
  stats: {
    followers: number;
    rating: number;
    reviews: number;
    students: number;
    courses: number;
  };
  socials: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
  };
  joinDate: number;
  updatedAt: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  level: string;
  thumbnail: string;
  summary: string;
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchInfluencer = async () => {
      try {
        const response = await fetch(`/api/influencers/${slug}`);
        const data = await response.json();
        
        if (response.ok) {
          setInfluencer(data.influencer);
          setProducts(data.products);
        } else {
          console.error('Failed to fetch influencer:', data.error);
        }
      } catch (error) {
        console.error('Error fetching influencer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchInfluencer();
    }
  }, [slug]);

  const handlePurchase = (productId: string) => {
    showToast('구매 기능은 곧 추가될 예정입니다. 조금만 기다려주세요!', 'info');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '초급';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-80 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-60" />
              <Skeleton className="h-40" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-quaternary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            인플루언서를 찾을 수 없습니다
          </h2>
          <p className="text-[var(--color-text-tertiary)]">
            요청하신 인플루언서가 존재하지 않거나 삭제되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Influencer Profile Header */}
        <InfluencerProfileHeader 
          name={influencer.name}
          username={influencer.username}
          avatar={influencer.avatar}
          bio={influencer.bio}
          followers={influencer.stats.followers}
          following={0}
          students={influencer.stats.students}
          courses={influencer.stats.courses}
          rating={influencer.stats.rating}
          reviews={influencer.stats.reviews}
          expertise={influencer.tags}
          verified={true}
          joinDate="2024"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio and Introduction */}
            <Card>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                소개
              </h3>
              <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {influencer.bio}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-[var(--color-text-tertiary)]">전공:</span>
                  {influencer.subjects.map((subject) => (
                    <Badge key={subject} variant="primary" size="sm">
                      {subject}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-[var(--color-text-tertiary)]">태그:</span>
                  {influencer.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Products/Courses */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  강의 및 상품 ({products.length})
                </h3>
              </div>
              
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="p-0 overflow-hidden hover-lift">
                      <div className="aspect-video bg-[var(--color-bg-tertiary)]">
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-quaternary)]">
                          강의 썸네일
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-[var(--color-text-primary)] text-sm">
                            {product.title}
                          </h4>
                          <Badge variant={getLevelColor(product.level)} size="sm">
                            {getLevelText(product.level)}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                          {product.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-[var(--color-primary-500)]">
                            ₩{product.price.toLocaleString()}
                          </span>
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handlePurchase(product.id)}
                          >
                            구매하기
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[var(--color-text-tertiary)]">
                    아직 등록된 강의가 없습니다.
                  </p>
                </div>
              )}
            </Card>

            {/* Reviews Section */}
            <Card>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                리뷰 ({influencer.stats.reviews})
              </h3>
              
              {/* Mock Reviews */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-[var(--color-border-secondary)] pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar 
                        src={`/avatars/reviewer${i}.jpg`}
                        alt={`리뷰어 ${i}`}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[var(--color-text-primary)] text-sm">
                            수강생 {i}
                          </span>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, star) => (
                              <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          정말 유익한 강의였습니다. 실제 경험을 바탕으로 한 설명이 매우 도움이 되었어요.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                통계
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-tertiary)]">팔로워</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {influencer.stats.followers?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-tertiary)]">평점</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    ⭐ {influencer.stats.rating}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-tertiary)]">수강생</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {influencer.stats.students?.toLocaleString()}명
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-tertiary)]">강좌 수</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {influencer.stats.courses}개
                  </span>
                </div>
              </div>
            </Card>

            {/* FAQ Chat Button */}
            <Card>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                FAQ 챗봇
              </h4>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                이 인플루언서에 대한 자주 묻는 질문들을 확인해보세요.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowFAQModal(true)}
              >
                FAQ 확인하기
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      <Modal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        title="FAQ 챗봇"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)]">
            FAQ 챗봇 기능은 현재 개발 중입니다. 
            향후 업데이트에서 인플루언서별 맞춤형 FAQ를 제공할 예정입니다.
          </p>
          <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg">
            <h5 className="font-medium text-[var(--color-text-primary)] mb-2">
              예상 기능:
            </h5>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
              <li>• 강의 일정 및 커리큘럼 문의</li>
              <li>• 수강료 및 할인 정보</li>
              <li>• 개인 맞춤 학습 계획 상담</li>
              <li>• 멘토링 프로그램 안내</li>
            </ul>
          </div>
        </div>
      </Modal>

    </div>
  );
}