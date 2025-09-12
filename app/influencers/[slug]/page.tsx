'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import Skeleton from '../../../components/ui/Skeleton';
import { MedskyAnalyzer } from '../../../components/medsky/MedskyAnalyzer';
import { EnglishMemorizationTool } from '../../../components/terry/EnglishMemorizationTool';
import { VocabularyMemoizer } from '../../../components/terry/VocabularyMemoizer';
import ChatWidget from '../../../components/ChatWidget';

interface Influencer {
  id: string;
  slug: string;
  name: string;
  username: string;
  instagram: string;
  avatar: string;
  bio: string;
  description: string;
  tags: string[];
  stats: {
    followers: number;
    free_courses: number;
    paid_courses: number;
  };
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
  
  const { data: session } = useSession();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'courses' | 'reviews' | 'about' | 'ai_features' | 'learning_space'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
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

  // Fetch user purchases
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!session) {
        setPurchasesLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/purchases/track');
        const data = await response.json();
        
        if (response.ok && data.success) {
          const purchaseIds = data.purchases.map((purchase: any) => purchase.productId);
          setUserPurchases(purchaseIds);
        }
      } catch (error) {
        console.error('Error fetching user purchases:', error);
      } finally {
        setPurchasesLoading(false);
      }
    };

    fetchUserPurchases();
  }, [session]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    showToast(isFollowing ? '팔로우를 취소했습니다' : '팔로우했습니다', 'success');
  };

  const handlePurchase = async (productId: string) => {
    if (!session) {
      showToast('구매하려면 먼저 로그인해주세요', 'error');
      return;
    }

    // Check if already purchased
    if (userPurchases.includes(productId)) {
      showToast('이미 구매한 상품입니다', 'info');
      return;
    }

    try {
      const response = await fetch('/api/purchases/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          influencerSlug: slug,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserPurchases(prev => [...prev, productId]);
        showToast(data.message, 'success');
      } else {
        showToast(data.error || '구매 처리 중 오류가 발생했습니다', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showToast('구매 처리 중 오류가 발생했습니다', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
        <Skeleton className="h-96" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <div>
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">인플루언서를 찾을 수 없습니다</h2>
          <Link href="/influencers">
            <Button variant="outline">돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Cover Image Section */}
      <div className="relative h-80 md:h-96 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-32" />
      </div>

      {/* Profile Header */}
      <div className="relative -mt-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-900 dark:text-white">
                  {influencer.name.charAt(0)}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-black rounded-full" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-gray-900 dark:text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{influencer.name}</h1>
                <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">@{influencer.username}</p>
              <p className="text-gray-700 dark:text-gray-200 max-w-2xl">{influencer.bio}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant={isFollowing ? "outline" : "primary"}
                onClick={handleFollow}
                className={isFollowing ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMessageModal(true)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                메시지
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-8 mt-8 py-6 border-t border-b border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">콘텐츠</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{influencer.stats.followers.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">4.9</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">평점</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">리뷰</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 md:gap-4 lg:gap-6 mt-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            {[
              { id: 'posts', label: '포스트', icon: '📝' },
              { id: 'courses', label: '강의', icon: '📚' },
              { id: 'reviews', label: '리뷰', icon: '⭐' },
              { id: 'about', label: '소개', icon: 'ℹ️' },
              { id: 'ai_features', label: '무료 AI 기능', icon: '🤖' },
              { id: 'learning_space', label: '학습공간', icon: '📖' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-3 md:px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'text-purple-600 dark:text-white border-b-2 border-purple-500 scale-105' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-white hover:scale-105'
                }`}
              >
                <span className="hidden md:inline">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {/* Featured Post */}
                  <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm dark:shadow-none">
                    <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="primary" size="sm">NEW</Badge>
                        <span className="text-xs text-gray-400">2시간 전</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        2025 수능 대비 완벽 가이드
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                        올해 수능을 준비하는 학생들을 위한 특별 콘텐츠입니다. 
                        제가 직접 경험한 노하우와 전략을 모두 담았습니다.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm">234</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">45</span>
                          </button>
                        </div>
                        <Button size="sm" variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400">
                          자세히 보기
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Post Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="relative group cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg overflow-hidden">
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-center">
                              <p className="font-semibold">포스트 {i}</p>
                              <p className="text-sm">❤️ 123</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <Link key={product.id} href={`/influencers/${slug}/product/${product.id}`}>
                      <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer h-full shadow-sm dark:shadow-none">
                        <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative">
                          <div className="absolute top-3 right-3">
                            <Badge variant="warning" size="sm">
                              {product.level === 'beginner' ? '초급' : product.level === 'intermediate' ? '중급' : '고급'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{product.title}</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{product.summary}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                              ₩{product.price.toLocaleString()}
                            </span>
                            <Button 
                              size="sm" 
                              variant={userPurchases.includes(product.id) ? "success" : "primary"}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePurchase(product.id);
                              }}
                              className={userPurchases.includes(product.id) 
                                ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                              }
                              disabled={userPurchases.includes(product.id)}
                            >
                              {userPurchases.includes(product.id) ? '구매완료' : '구매하기'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-gray-900/50 border-gray-800">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          U{i}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">수강생 {i}</span>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, star) => (
                                <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            정말 유익한 강의였습니다. 실제 경험을 바탕으로 한 설명이 매우 도움이 되었어요.
                            특히 실전 문제 풀이 부분이 인상적이었습니다.
                          </p>
                          <p className="text-xs text-gray-500 mt-2">2024.03.15</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">소개</h3>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p>{influencer.description}</p>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">전문 분야</h4>
                      <div className="flex flex-wrap gap-2">
                        {influencer.tags.map((tag) => (
                          <Badge key={tag} variant="primary" className="border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">경력 및 자격</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• SKY 대학 재학/졸업</li>
                        <li>• 전공 분야 상위 1% 성적</li>
                        <li>• 관련 자격증 다수 보유</li>
                        <li>• 멘토링 경력 2년 이상</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">연락처</h4>
                      <div className="flex items-center gap-4">
                        <a 
                          href={`https://instagram.com/${influencer.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                          </svg>
                          @{influencer.instagram}
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* AI Features Tab - Show Terry's memorization tool or coming soon */}
              {activeTab === 'ai_features' && influencer.slug === 'terry' && (
                <div className="space-y-6">
                  <EnglishMemorizationTool />
                  <VocabularyMemoizer />
                </div>
              )}

              {/* AI Features Tab - Coming Soon for other influencers */}
              {activeTab === 'ai_features' && influencer.slug !== 'terry' && (
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                    <div className="text-center py-16">
                      <div className="mb-6">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <span className="text-5xl">🤖</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">무료 AI 기능</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        곧 다양한 AI 기능이 추가될 예정입니다.
                        조금만 기다려주세요!
                      </p>
                      <div className="mt-8 flex justify-center gap-4">
                        <Badge variant="primary" size="sm">Coming Soon</Badge>
                        <Badge variant="warning" size="sm">AI Powered</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Learning Space Tab - Show content only for 알약툰 */}
              {activeTab === 'learning_space' && influencer.slug === 'yaktoon' && (
                <div className="space-y-6">
                  {/* Special Header for 알약툰 */}
                  <Card className="bg-gradient-to-br from-green-900/50 to-blue-900/50 border-green-500/30">
                    <div className="text-center py-6">
                      <div className="flex justify-center items-center gap-3 mb-3">
                        <span className="text-3xl">🏥</span>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">알약툰 생기부 AI 분석</h2>
                        <span className="text-3xl">📊</span>
                      </div>
                      <p className="text-green-700 dark:text-green-200 mb-4">
                        의대 진학 전문가 알약툰과 함께하는 학생생활기록부 맞춤 분석
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="success" size="sm">Medical 전문</Badge>
                        <Badge variant="primary" size="sm">SKY 출신</Badge>
                        <Badge variant="warning" size="sm">AI 분석</Badge>
                        <Badge variant="default" size="sm">1:1 맞춤</Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Purchase Verification for Learning Space */}
                  {!session ? (
                    <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                      <div className="text-center py-16">
                        <div className="mb-6">
                          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                            <span className="text-5xl">🔒</span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">로그인이 필요합니다</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                          학습공간을 이용하려면 먼저 로그인해주세요
                        </p>
                        <Button variant="primary" size="sm">
                          로그인하기
                        </Button>
                      </div>
                    </Card>
                  ) : userPurchases.length === 0 ? (
                    <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                      <div className="text-center py-16">
                        <div className="mb-6">
                          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                            <span className="text-5xl">💳</span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">구매가 필요합니다</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                          학습공간을 이용하려면 먼저 알약툰의 상품을 구매해주세요
                        </p>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => setActiveTab('courses')}
                        >
                          상품 보러가기
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                      {/* Medsky Analyzer Component - Only show if user has purchased */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <MedskyAnalyzer 
                          onComplete={() => {
                            showToast('생기부 분석이 완료되었습니다!', 'success');
                          }}
                          onStatusChange={(status) => {
                            console.log('Status update:', status);
                          }}
                        />
                      </div>

                      {/* 알약툰 Special Features - Only show if user has purchased */}
                  <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>💊</span> 알약툰만의 특별 서비스
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                          <h4 className="font-medium text-blue-700 dark:text-blue-200 mb-2">🎯 의대 진학 전략</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-100/80">
                            분석 결과를 바탕으로 의대 입시에 특화된 맞춤 전략을 제공합니다
                          </p>
                        </div>
                        <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                          <h4 className="font-medium text-green-700 dark:text-green-200 mb-2">📈 역량 강화 로드맵</h4>
                          <p className="text-sm text-green-600 dark:text-green-100/80">
                            부족한 부분을 체계적으로 보완할 수 있는 구체적인 계획을 제시합니다
                          </p>
                        </div>
                        <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                          <h4 className="font-medium text-purple-700 dark:text-purple-200 mb-2">🏥 의료진 멘토링</h4>
                          <p className="text-sm text-purple-600 dark:text-purple-100/80">
                            현직 의료진 출신 멘토들의 실질적인 조언과 가이드를 받을 수 있습니다
                          </p>
                        </div>
                        <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                          <h4 className="font-medium text-orange-700 dark:text-orange-200 mb-2">📝 1:1 맞춤 피드백</h4>
                          <p className="text-sm text-orange-600 dark:text-orange-100/80">
                            AI 분석 결과를 바탕으로 개인별 맞춤 피드백을 제공합니다
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                    </>
                  )}
                </div>
              )}

              {/* Learning Space Tab - Empty for other influencers */}
              {activeTab === 'learning_space' && influencer.slug !== 'yaktoon' && (
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                    <div className="text-center py-16">
                      <div className="mb-6">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-5xl">📖</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">학습공간</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        이 인플루언서의 학습 콘텐츠가 곧 추가될 예정입니다.
                        더 나은 학습 경험을 위해 준비 중입니다!
                      </p>
                      <div className="mt-8 flex justify-center gap-4">
                        <Badge variant="primary" size="sm">준비 중</Badge>
                        <Badge variant="success" size="sm">곧 오픈</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">활동 통계</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">이번 달 포스트</span>
                    <span className="text-gray-900 dark:text-white font-medium">24개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">총 좋아요</span>
                    <span className="text-gray-900 dark:text-white font-medium">3.2K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">응답 시간</span>
                    <span className="text-gray-900 dark:text-white font-medium">~2시간</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">가입일</span>
                    <span className="text-gray-900 dark:text-white font-medium">2024.01</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="메시지 보내기"
      >
        <div className="space-y-4">
          <textarea
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            rows={4}
            placeholder="메시지를 입력하세요..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowMessageModal(false)}>
              취소
            </Button>
            <Button variant="primary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              전송
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Chat Widget */}
      <ChatWidget 
        influencerSlug={slug} 
        influencerName={influencer.name}
      />
    </div>
  );
}