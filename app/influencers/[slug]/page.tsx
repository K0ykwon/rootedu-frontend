'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import ChatWidget from '../../../components/ChatWidget';
import SimpleChatButton from '../../../components/SimpleChatButton';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Toaster } from 'react-hot-toast';

interface Product {
  productId: string;
  name: string; 
  description: string;
  price: number;
}

interface InfluencerInfo {
  name: string;
  description: string;
  profileImage?: string;
}

export default function InfluencerPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [influencerInfo, setInfluencerInfo] = useState<InfluencerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load influencer info and products
  useEffect(() => {
    loadInfluencerData();
  }, [slug]);

  const loadInfluencerData = async () => {
    try {
      // For now, we'll use mock data. You can replace this with actual API calls
      setInfluencerInfo({
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        description: '안녕하세요! 여러분의 성장을 도와드리는 인플루언서입니다.',
        profileImage: '/default-avatar.png'
      });

      // Load products
      const response = await fetch(`/api/influencer/${slug}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load influencer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-5xl font-bold">
                {influencerInfo?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {influencerInfo?.name}
            </h1>
            <p className="text-xl text-white/90">
              {influencerInfo?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Products Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
            제품 소개
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <Card key={product.productId} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {product.name}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[var(--color-primary-500)]">
                      ₩{product.price?.toLocaleString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/influencer/${slug}/product/${product.productId}`)}
                    >
                      자세히 보기
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-[var(--color-text-secondary)]">
                등록된 제품이 없습니다.
              </p>
            </Card>
          )}
        </div>

        {/* About Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
            소개
          </h2>
          <Card className="p-8">
            <p className="text-[var(--color-text-primary)] leading-relaxed">
              안녕하세요! 저는 여러분의 성장과 발전을 도와드리는 {influencerInfo?.name}입니다.
              제 제품을 통해 많은 분들이 목표를 달성하고 성장하는 모습을 보는 것이 저의 가장 큰 보람입니다.
              궁금하신 점이 있으시면 언제든지 오른쪽 하단의 채팅 버튼을 통해 문의해주세요!
            </p>
          </Card>
        </div>
      </div>

      {/* Chat Widget - Always show, but it will handle auth internally */}
      <ChatWidget 
        influencerSlug={slug} 
        influencerName={influencerInfo?.name}
      />
      
      <Toaster position="top-right" />
    </div>
  );
}