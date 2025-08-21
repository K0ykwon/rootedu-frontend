'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StudyProofCard from '../../components/study/StudyProofCard';
import StudyRankingCard from '../../components/study/StudyRankingCard';
import StudyStreakDisplay from '../../components/study/StudyStreakDisplay';
import DailyChallengeCard from '../../components/study/DailyChallengeCard';
import StudyStats from '../../components/study/StudyStats';
import AuthModal from '../../components/auth/AuthModal';
import { useAuth } from '../../hooks/useAuth';
import { StudyProof, StudySubject, StudyMood, StudyMethod } from '@/types/study-proof';

// Mock data for demonstration
const mockProofs: StudyProof[] = [
  {
    id: '1',
    userId: 'user1',
    sessionId: 'session1',
    photo: '/study-proof/planner1.jpg',
    description: '오늘도 계획대로 완료! 수학 미적분 3단원 끝냈어요 💪',
    subjects: [StudySubject.MATH, StudySubject.ENGLISH],
    studyHours: 6,
    location: '독서실',
    mood: StudyMood.FOCUSED,
    achievements: [],
    likes: ['user2', 'user3', 'user4', 'user5', 'user6'],
    cheers: [
      {
        id: 'cheer1',
        userId: 'user2',
        userName: '김철수',
        message: '플래너 깔끔하네요! 저도 따라해봐야겠어요',
        emoji: '🔥',
        createdAt: Date.now() - 1000 * 60 * 30
      },
      {
        id: 'cheer2',
        userId: 'user3',
        userName: '이영희',
        message: '색깔별로 과목 구분한거 좋은 아이디어!',
        emoji: '👍',
        createdAt: Date.now() - 1000 * 60 * 45
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    tags: ['스터디플래너', '6시간완료', '미적분'],
    isPublic: true,
    studyMethod: StudyMethod.SELF_STUDY
  },
  {
    id: '2',
    userId: 'user2',
    sessionId: 'session2',
    photo: '/study-proof/planner2.jpg',
    description: '국영수 골고루! 내일 모의고사 화이팅이야 🎯',
    subjects: [StudySubject.KOREAN, StudySubject.ENGLISH, StudySubject.MATH],
    studyHours: 7,
    location: '스터디카페',
    mood: StudyMood.MOTIVATED,
    achievements: [
      {
        id: 'ach1',
        type: 'perfect_week',
        name: '완벽한 일주일',
        description: '7일 연속 플래너 100% 달성',
        icon: '🏆',
        unlockedAt: Date.now()
      }
    ],
    likes: ['user1', 'user3', 'user4'],
    cheers: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    tags: ['모의고사준비', '주말공부', '스카'],
    isPublic: true,
    studyMethod: StudyMethod.SELF_STUDY
  }
];

const mockRanking = [
  { rank: 1, userId: 'user3', userName: '박지민', userAvatar: '', school: '대원외고', grade: '2학년', totalMinutes: 2400, streakDays: 45, level: 23, badges: [] },
  { rank: 2, userId: 'user4', userName: '이서연', userAvatar: '', school: '한영외고', grade: '3학년', totalMinutes: 2280, streakDays: 30, level: 20, badges: [] },
  { rank: 3, userId: 'user5', userName: '최민준', userAvatar: '', school: '민사고', grade: '2학년', totalMinutes: 2100, streakDays: 28, level: 19, badges: [] },
];

export default function StudyProofPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'feed' | 'ranking'>('feed');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [proofs, setProofs] = useState<StudyProof[]>(mockProofs);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({
    description: '',
    studyHours: 0,
    subjects: [] as StudySubject[],
    location: '독서실',
    mood: StudyMood.FOCUSED,
    tags: ''
  });

  // 로그인 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      requireAuth();
    }
  }, [session, status, requireAuth]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProofSubmit = () => {
    if (!session?.user) return;
    
    const newProof: StudyProof = {
      id: Date.now().toString(),
      userId: session.user.id || 'user',
      sessionId: Date.now().toString(),
      photo: selectedImage || undefined,
      description: uploadData.description,
      subjects: uploadData.subjects,
      studyHours: uploadData.studyHours,
      location: uploadData.location,
      mood: uploadData.mood,
      achievements: [],
      likes: [],
      cheers: [],
      createdAt: Date.now(),
      tags: uploadData.tags.split(',').map(t => t.trim()).filter(t => t),
      isPublic: true,
      studyMethod: StudyMethod.SELF_STUDY
    };
    
    setProofs([newProof, ...proofs]);
    setShowUploadForm(false);
    setSelectedImage(null);
    setUploadData({
      description: '',
      studyHours: 0,
      subjects: [],
      location: '독서실',
      mood: StudyMood.FOCUSED,
      tags: ''
    });
  };

  const handleLikeProof = (proofId: string) => {
    if (!session?.user) {
      requireAuth();
      return;
    }
    
    setProofs(proofs.map(proof => {
      if (proof.id === proofId) {
        const userId = session.user.id || 'user';
        const likes = proof.likes.includes(userId)
          ? proof.likes.filter(id => id !== userId)
          : [...proof.likes, userId];
        return { ...proof, likes };
      }
      return proof;
    }));
  };

  const handleAddCheer = (proofId: string, message: string, emoji: string) => {
    if (!session?.user) {
      requireAuth();
      return;
    }
    
    setProofs(proofs.map(proof => {
      if (proof.id === proofId) {
        const newCheer = {
          id: Date.now().toString(),
          userId: session.user.id || 'user',
          userName: session.user.name || '익명',
          message,
          emoji,
          createdAt: Date.now()
        };
        return { ...proof, cheers: [...proof.cheers, newCheer] };
      }
      return proof;
    }));
  };

  // 로그인되지 않은 경우 표시
  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] premium-gradient noise-texture flex items-center justify-center">
        <Card glass className="p-8 max-w-md w-full text-center">
          <span className="text-6xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            로그인이 필요한 서비스입니다
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            플래너 인증과 레벨업을 위해 로그인해주세요!
          </p>
          <Button variant="primary" size="lg" onClick={() => requireAuth()}>
            로그인하고 시작하기
          </Button>
        </Card>
        <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] premium-gradient noise-texture">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-500)]/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-primary-400)] bg-clip-text">
              📚 스터디 플래너 인증
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)]">
              오늘의 공부 계획과 완료를 인증하고, 친구들과 동기부여를 나눠요!
            </p>
          </div>

          {/* User Level & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card glass className="p-6 text-center">
              <div className="mb-3">
                <span className="text-4xl">⭐</span>
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-1">나의 레벨</p>
              <p className="text-2xl font-bold text-[var(--color-primary-400)]">Lv.12</p>
              <div className="mt-2 w-full h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-400)]"
                  style={{ width: '65%' }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">350/500 EXP</p>
            </Card>
            
            <StudyStreakDisplay 
              currentStreak={7}
              longestStreak={15}
              freezeTokens={2}
            />
            
            <DailyChallengeCard />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-40 glass-card-heavy border-y border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 py-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-4 font-medium transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'text-[var(--color-primary-400)] border-b-2 border-[var(--color-primary-400)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                📸 플래너 인증
              </span>
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`pb-2 px-4 font-medium transition-all duration-200 ${
                activeTab === 'feed'
                  ? 'text-[var(--color-primary-400)] border-b-2 border-[var(--color-primary-400)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                📖 인증 피드
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`pb-2 px-4 font-medium transition-all duration-200 ${
                activeTab === 'ranking'
                  ? 'text-[var(--color-primary-400)] border-b-2 border-[var(--color-primary-400)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                🏆 랭킹
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card glass className="p-8">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                오늘의 스터디 플래너 인증하기
              </h3>
              
              {/* Image Upload Area */}
              <div className="mb-6">
                <label className="block mb-4">
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    selectedImage 
                      ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-500)]/5' 
                      : 'border-[var(--glass-border)] hover:border-[var(--color-primary-400)]/50'
                  }`}>
                    {selectedImage ? (
                      <div>
                        <img src={selectedImage} alt="플래너" className="max-h-64 mx-auto mb-4 rounded-lg" />
                        <p className="text-sm text-[var(--color-primary-400)]">다시 선택하려면 클릭하세요</p>
                      </div>
                    ) : (
                      <>
                        <span className="text-5xl mb-4 block">📷</span>
                        <p className="text-[var(--color-text-primary)] mb-2">
                          플래너 사진을 업로드하세요
                        </p>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                          클릭하거나 드래그하여 업로드
                        </p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    오늘의 소감
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary-400)]"
                    placeholder="오늘 공부는 어땠나요? 플래너 인증과 함께 소감을 남겨주세요!"
                    rows={3}
                    value={uploadData.description}
                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      공부 시간
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)]"
                      value={uploadData.studyHours}
                      onChange={(e) => setUploadData({...uploadData, studyHours: Number(e.target.value)})}
                    >
                      <option value={0}>선택하세요</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                        <option key={h} value={h}>{h}시간</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      공부 장소
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-400)]"
                      value={uploadData.location}
                      onChange={(e) => setUploadData({...uploadData, location: e.target.value})}
                    >
                      <option value="독서실">독서실</option>
                      <option value="도서관">도서관</option>
                      <option value="스터디카페">스터디카페</option>
                      <option value="학교">학교</option>
                      <option value="학원">학원</option>
                      <option value="집">집</option>
                      <option value="카페">카페</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    오늘의 기분
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.values(StudyMood).map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setUploadData({...uploadData, mood})}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          uploadData.mood === mood
                            ? 'bg-[var(--color-primary-500)]/20 border-[var(--color-primary-400)]'
                            : 'glass-card border-[var(--glass-border)]'
                        }`}
                      >
                        <span className="text-sm">{mood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary-400)]"
                    placeholder="예: 수능준비, 중간고사, 주말공부"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProofSubmit}
                    disabled={!selectedImage || !uploadData.description || uploadData.studyHours === 0}
                    className="flex-1"
                  >
                    🎯 인증하고 경험치 받기
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card glass className="p-6 bg-gradient-to-r from-[var(--color-primary-500)]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    오늘의 인증 현황
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    전국 {proofs.length * 100}명의 학생이 오늘 플래너를 인증했어요!
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-primary-400)]">
                    {proofs.reduce((acc, p) => acc + p.likes.length, 0)}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">총 응원수</p>
                </div>
              </div>
            </Card>

            {/* Proof Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proofs.map((proof) => (
                <StudyProofCard
                  key={proof.id}
                  proof={proof}
                  onLike={() => handleLikeProof(proof.id)}
                  onCheer={(message, emoji) => handleAddCheer(proof.id, message, emoji)}
                  currentUserId={session.user?.id || 'user'}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StudyRankingCard
                title="🏆 이번 주 플래너 인증왕"
                rankings={mockRanking}
                type="weekly"
              />
            </div>
            <div className="space-y-6">
              <Card glass className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  🎖️ 나의 순위
                </h3>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--color-primary-500)]/20 to-[var(--color-primary-400)]/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--color-primary-400)]">24</span>
                  </div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{session.user?.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">상위 15%</p>
                  <div className="mt-4 p-3 bg-[var(--glass-bg)] rounded-lg">
                    <p className="text-xs text-[var(--color-text-tertiary)]">이번 주 인증</p>
                    <p className="text-lg font-semibold text-[var(--color-primary-400)]">5/7일</p>
                  </div>
                </div>
              </Card>

              <Card glass className="p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  🏅 획득 가능 배지
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌟</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">일주일 개근</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">2일 더 인증하면 획득!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">30일 연속</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">23일 남음</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </div>
  );
}