'use client';

import React, { useState } from 'react';
import {
  Button,
  Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter,
  Input, Textarea, Select, Checkbox, Radio,
  AIChat,
  ProgressBar, ProgressRing, LearningProgress, StepsProgress,
  Badge,
  Avatar, AvatarGroup,
  Modal,
  Tabs, TabPanel,
  Alert,
  BottomNav, MobileMenu,
  Drawer,
  ToastProvider, useToast,
  Skeleton, CardSkeleton, ListItemSkeleton, CourseCardSkeleton, ChatMessageSkeleton,
  FloatingActionButton, SpeedDialFAB,
  SwipeableCard, SwipeableStack,
  List, ListItem, SectionList, ExpandableListItem,
  SearchBar, StickySearchHeader,
  InfluencerCard, InfluencerCardCompact, InfluencerCardMini,
  InfluencerProfileHeader, InfluencerStats, InfluencerSocialLinks,
  InfluencerGrid, InfluencerDiscovery, InfluencerCarousel,
  EnhancedChat, InfluencerMessageValidation, ChatTemplateManager
} from '@/components/ui';

// Import Gamification Components
import { 
  AchievementBadge, StreakCounter, XPLevel, MotivationalQuote, DailyChallenge 
} from '@/components/ui/Gamification';
import { Leaderboard, MiniLeaderboard } from '@/components/ui/Leaderboard';
import { QuizCard } from '@/components/ui/QuizCard';
import {
  Confetti, LevelUpAnimation, AchievementUnlock, RewardPopup, CelebrationButton, FloatingHearts
} from '@/components/ui/CelebrationAnimations';
import {
  StudyBuddy, AvatarCustomizer, StudyCompanion, MoodTracker
} from '@/components/ui/InteractiveMascot';

// Import Class101-inspired Components
import { 
  CourseCard, HorizontalScrollSection, CategoryFilter, 
  InstructorCard, CountrySelector, HeroSection, TrendingBadge 
} from '@/components/ui';

// Toast Demo Component
function ToastDemo() {
  const { showToast } = useToast();
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => showToast('Success message!', 'success')}>Success Toast</Button>
      <Button size="sm" onClick={() => showToast('Error occurred!', 'error')}>Error Toast</Button>
      <Button size="sm" onClick={() => showToast('Warning!', 'warning')}>Warning Toast</Button>
      <Button size="sm" onClick={() => showToast('Info message', 'info')}>Info Toast</Button>
    </div>
  );
}

function ArchiveContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('KR');
  
  const mockMessages = [
    { id: '1', role: 'ai' as const, content: 'Hello! I\'m your AI tutor. What would you like to learn about today?', timestamp: new Date() },
    { id: '2', role: 'user' as const, content: 'Can you help me understand linear algebra?', timestamp: new Date() },
    { id: '3', role: 'ai' as const, content: 'Of course! Linear algebra is a branch of mathematics that deals with vectors, vector spaces, linear transformations, and systems of linear equations. Let\'s start with the basics.', timestamp: new Date() }
  ];

  const tabsData = [
    { id: 'overview', label: 'Overview', content: <div className="p-4">Overview content here</div> },
    { id: 'lessons', label: 'Lessons', content: <div className="p-4">Lessons content here</div> },
    { id: 'assignments', label: 'Assignments', content: <div className="p-4">Assignments content here</div> },
    { id: 'resources', label: 'Resources', content: <div className="p-4">Resources content here</div> }
  ];

  const stepsData = [
    { label: 'Setup', completed: true },
    { label: 'Configure', completed: true },
    { label: 'Deploy', completed: false },
    { label: 'Complete', completed: false }
  ];

  const bottomNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6z"/></svg>
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>,
      badge: 3
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    }
  ];

  const speedDialActions = [
    {
      id: 'camera',
      icon: <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V4z"/></svg>,
      label: 'Camera',
      onClick: () => console.log('Camera')
    },
    {
      id: 'document',
      icon: <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"/></svg>,
      label: 'Document',
      onClick: () => console.log('Document')
    },
    {
      id: 'share',
      icon: <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>,
      label: 'Share',
      onClick: () => console.log('Share')
    }
  ];

  const swipeableCards = [
    { id: '1', content: <div className="p-6"><h3 className="text-xl font-semibold mb-2">Introduction to React</h3><p>Learn the fundamentals of React development</p></div> },
    { id: '2', content: <div className="p-6"><h3 className="text-xl font-semibold mb-2">Advanced TypeScript</h3><p>Master TypeScript for better code quality</p></div> },
    { id: '3', content: <div className="p-6"><h3 className="text-xl font-semibold mb-2">Mobile-First Design</h3><p>Build responsive applications for mobile</p></div> }
  ];

  const sectionListData = [
    {
      title: 'Recent Courses',
      data: [
        <ListItem key="1" subtitle="Continue where you left off" rightContent={<Badge variant="primary">New</Badge>}>Introduction to Machine Learning</ListItem>,
        <ListItem key="2" subtitle="2 assignments pending">Data Structures & Algorithms</ListItem>,
        <ListItem key="3" subtitle="Completed">Web Development Fundamentals</ListItem>
      ]
    },
    {
      title: 'Recommended',
      data: [
        <ListItem key="4" leftContent={<Avatar name="AI" size="sm" />} subtitle="Based on your interests">Advanced AI Concepts</ListItem>,
        <ListItem key="5" leftContent={<Avatar name="PY" size="sm" />} subtitle="Popular choice">Python for Data Science</ListItem>
      ]
    }
  ];

  // Class101-inspired sample data
  const categories = [
    { id: 'programming', name: 'Programming', icon: '💻', count: 45 },
    { id: 'design', name: 'Design', icon: '🎨', count: 32 },
    { id: 'business', name: 'Business', icon: '📈', count: 28 },
    { id: 'language', name: 'Language', icon: '🌍', count: 19 },
    { id: 'music', name: 'Music', icon: '🎵', count: 15 },
    { id: 'cooking', name: 'Cooking', icon: '👨‍🍳', count: 22 },
  ];

  const sampleCourses = [
    {
      id: '1',
      title: 'Complete Web Development Bootcamp',
      instructor: { name: 'John Smith', avatar: 'https://i.pravatar.cc/150?img=1', verified: true },
      thumbnail: 'https://picsum.photos/400/300?random=1',
      category: 'Programming',
      rating: 4.8,
      reviewCount: 1250,
      price: 89000,
      originalPrice: 129000,
      duration: '24 hours',
      difficulty: 'beginner' as const,
      trending: true,
      trendingRank: 1,
      studentCount: 15420
    },
    {
      id: '2',
      title: 'UI/UX Design Masterclass',
      instructor: { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=2', verified: true },
      thumbnail: 'https://picsum.photos/400/300?random=2',
      category: 'Design',
      rating: 4.9,
      reviewCount: 890,
      price: 75000,
      duration: '18 hours',
      difficulty: 'intermediate' as const,
      trending: true,
      trendingRank: 2,
      studentCount: 8720
    },
    {
      id: '3',
      title: 'Advanced React Development',
      instructor: { name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?img=3', verified: false },
      thumbnail: 'https://picsum.photos/400/300?random=3',
      category: 'Programming',
      rating: 4.7,
      reviewCount: 654,
      price: 99000,
      duration: '32 hours',
      difficulty: 'advanced' as const,
      studentCount: 5640
    },
    {
      id: '4',
      title: 'Digital Marketing Strategy',
      instructor: { name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?img=4', verified: true },
      thumbnail: 'https://picsum.photos/400/300?random=4',
      category: 'Business',
      rating: 4.6,
      reviewCount: 432,
      price: 69000,
      originalPrice: 89000,
      duration: '16 hours',
      difficulty: 'beginner' as const,
      trending: true,
      trendingRank: 3,
      studentCount: 3280
    }
  ];

  const sampleInstructors = [
    {
      id: '1',
      name: 'Alex Thompson',
      avatar: 'https://i.pravatar.cc/150?img=5',
      title: 'Senior Software Engineer',
      bio: 'Passionate educator with 10+ years of experience in full-stack development. I love teaching complex concepts in simple ways.',
      specialties: ['React', 'Node.js', 'TypeScript', 'AWS'],
      rating: 4.9,
      reviewCount: 2150,
      studentCount: 12500,
      courseCount: 8,
      verified: true,
      followersCount: 25000
    },
    {
      id: '2',
      name: 'Lisa Park',
      avatar: 'https://i.pravatar.cc/150?img=6',
      title: 'UX Design Lead',
      specialties: ['UI/UX Design', 'Figma', 'Design Systems'],
      rating: 4.8,
      reviewCount: 1840,
      studentCount: 9800,
      courseCount: 5,
      verified: true,
      followersCount: 18000
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-20">
      {/* Sticky Search Header */}
      <StickySearchHeader
        title="UI Component Library"
        searchProps={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: 'Search components...',
          suggestions: ['Button', 'Card', 'Modal', 'Toast', 'List']
        }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-[40px] md:text-[64px] leading-[1.1] tracking-tight font-medium mb-4">
            Mobile-First Components
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
            Optimized for mobile EdTech experience with glassmorphism and high-end micro-interactions
          </p>
        </header>

        {/* Advanced Effects Demo */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Advanced Visual Effects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[var(--color-bg-tertiary)]/80 backdrop-blur-xl border-[var(--color-border-primary)]/50 hover:-translate-y-2 transition-all duration-300">
              <CardContent className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[var(--color-primary-400)] to-purple-500 rounded-full" />
                <h3 className="font-semibold mb-2">Hover Float</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">Smooth floating animation on hover</p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-bg-tertiary)]/80 backdrop-blur-xl border-[var(--color-border-primary)]/50 hover:rotate-1 transition-all duration-300">
              <CardContent className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                <h3 className="font-semibold mb-2">Hover Rotate</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">Subtle rotation effect</p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-bg-tertiary)]/80 backdrop-blur-xl border-[var(--color-border-primary)]/50 hover:shadow-[0_0_30px_rgba(86,186,125,0.4)] transition-all duration-300">
              <CardContent className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                <h3 className="font-semibold mb-2">Glow Effect</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">Primary color glow on hover</p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-bg-tertiary)]/80 backdrop-blur-xl border-[var(--color-border-primary)]/50">
              <CardContent className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                <h3 className="font-semibold mb-2">Glassmorphism</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">Backdrop blur with transparency</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Hero Section - Class101 Style */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Hero Section</h2>
          <HeroSection
            subtitle="Learn from the best"
            title="Master New Skills with Expert Instructors"
            description="Join thousands of students learning practical skills from industry professionals. Start your journey today with courses designed for real-world success."
            backgroundImage="https://picsum.photos/1920/1080?random=5"
            ctaButtons={{
              primary: {
                text: "Start Learning Now",
                onClick: () => console.log('Start Learning clicked')
              },
              secondary: {
                text: "Browse Courses",
                onClick: () => console.log('Browse clicked')
              }
            }}
            features={["Expert Instructors", "Practical Projects", "Lifetime Access", "Certificate of Completion"]}
            stats={[
              { label: "Active Students", value: 50000, icon: "👥" },
              { label: "Courses Available", value: 120, icon: "📚" },
              { label: "Expert Instructors", value: 45, icon: "🎓" },
              { label: "Success Rate", value: "94%", icon: "🎯" }
            ]}
            height="large"
            className="mb-8"
          />
        </section>

        {/* Country Selector & Trending Badges */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Global & Trending Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Country Selector</CardTitle>
                <CardSubtitle>Multi-region support with flag indicators</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Style</label>
                    <CountrySelector
                      countries={[
                        { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
                        { code: 'US', name: 'United States', flag: '🇺🇸' },
                        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
                        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
                        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
                      ]}
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                      showFlag={true}
                      showName={true}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Compact Style</label>
                    <CountrySelector
                      countries={[
                        { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
                        { code: 'US', name: 'United States', flag: '🇺🇸' },
                        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
                        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
                        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
                      ]}
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                      compact={true}
                      className="w-24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Badges</CardTitle>
                <CardSubtitle>Visual indicators for popular content</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Badge Variants</label>
                    <div className="flex flex-wrap gap-2">
                      <TrendingBadge variant="rank" rank={1} />
                      <TrendingBadge variant="hot" />
                      <TrendingBadge variant="new" />
                      <TrendingBadge variant="popular" />
                      <TrendingBadge variant="bestseller" />
                      <TrendingBadge variant="trending" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Different Sizes</label>
                    <div className="flex items-center gap-2">
                      <TrendingBadge variant="rank" rank={1} size="sm" />
                      <TrendingBadge variant="rank" rank={1} size="md" />
                      <TrendingBadge variant="rank" rank={1} size="lg" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Category Filter</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tab Style (Recommended)</CardTitle>
                <CardSubtitle>Horizontal scrollable tabs with counts</CardSubtitle>
              </CardHeader>
              <CardContent>
                <CategoryFilter
                  categories={categories}
                  activeCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  variant="tabs"
                  scrollable={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dropdown Style</CardTitle>
                <CardSubtitle>Compact dropdown for limited space</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs">
                  <CategoryFilter
                    categories={categories}
                    activeCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    variant="dropdown"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Course Cards */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Course Cards</h2>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Individual Course Cards</CardTitle>
                <CardSubtitle>Class101-inspired course cards with all features</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sampleCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...course}
                      onWishlistToggle={(id, isWishlisted) => 
                        console.log(`Course ${id} ${isWishlisted ? 'added to' : 'removed from'} wishlist`)
                      }
                      onClick={(id) => console.log(`Course ${id} clicked`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horizontal Scroll Section</CardTitle>
                <CardSubtitle>Netflix-style horizontal scrolling with navigation</CardSubtitle>
              </CardHeader>
              <CardContent className="-mx-6">
                <HorizontalScrollSection
                  title="Trending Courses"
                  subtitle="Most popular courses this week"
                  onSeeAllClick={() => console.log('See all clicked')}
                  cardWidth={320}
                  className="px-6"
                >
                  {sampleCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...course}
                      onWishlistToggle={(id, isWishlisted) => 
                        console.log(`Course ${id} ${isWishlisted ? 'added to' : 'removed from'} wishlist`)
                      }
                      onClick={(id) => console.log(`Course ${id} clicked`)}
                    />
                  ))}
                </HorizontalScrollSection>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Instructor Cards */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Instructor Cards</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Default Variant</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sampleInstructors.map((instructor) => (
                  <InstructorCard
                    key={instructor.id}
                    {...instructor}
                    onFollow={(id, isFollowing) => 
                      console.log(`Instructor ${id} ${isFollowing ? 'followed' : 'unfollowed'}`)
                    }
                    onClick={(id) => console.log(`Instructor ${id} profile clicked`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Compact Variant</h3>
              <div className="space-y-3">
                {sampleInstructors.map((instructor) => (
                  <InstructorCard
                    key={`compact-${instructor.id}`}
                    {...instructor}
                    variant="compact"
                    onFollow={(id, isFollowing) => 
                      console.log(`Instructor ${id} ${isFollowing ? 'followed' : 'unfollowed'}`)
                    }
                    onClick={(id) => console.log(`Instructor ${id} profile clicked`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Minimal Variant</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sampleInstructors.map((instructor) => (
                  <InstructorCard
                    key={`minimal-${instructor.id}`}
                    {...instructor}
                    variant="minimal"
                    onFollow={(id, isFollowing) => 
                      console.log(`Instructor ${id} ${isFollowing ? 'followed' : 'unfollowed'}`)
                    }
                    onClick={(id) => console.log(`Instructor ${id} profile clicked`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Navigation Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Mobile Navigation</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bottom Navigation</CardTitle>
                <CardSubtitle>Fixed bottom navigation for mobile apps</CardSubtitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                  See the bottom of the screen for the bottom navigation demo
                </p>
                <Button size="sm" onClick={() => setMobileMenuOpen(true)}>Open Mobile Menu</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Search Bar Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Search Components</h2>
          <Card>
            <CardContent>
              <SearchBar 
                placeholder="Search courses..."
                suggestions={['Machine Learning', 'Web Development', 'Data Science', 'Mobile Development']}
              />
            </CardContent>
          </Card>
        </section>

        {/* Influencer Components Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Influencer Components</h2>
          
          {/* Influencer Cards */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Influencer Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <InfluencerCard
                name="Sarah Johnson"
                username="sarahteaches"
                avatar="https://i.pravatar.cc/150?img=1"
                coverImage="https://picsum.photos/400/200?random=1"
                bio="Passionate educator specializing in web development and JavaScript. 10+ years of teaching experience."
                followers={125000}
                students={8500}
                courses={12}
                rating={4.8}
                verified={true}
                expertise={['JavaScript', 'React', 'Node.js', 'Web Development']}
                isFollowing={false}
                onFollow={() => console.log('Follow clicked')}
                onClick={() => console.log('Card clicked')}
              />
              
              <InfluencerCard
                name="Alex Chen"
                username="alexdesigns"
                avatar="https://i.pravatar.cc/150?img=2"
                bio="UI/UX designer helping students master design principles and Figma."
                followers={45000}
                students={3200}
                courses={8}
                rating={4.9}
                verified={true}
                expertise={['UI Design', 'Figma', 'Design Systems']}
                isFollowing={true}
                onFollow={() => console.log('Follow clicked')}
                onClick={() => console.log('Card clicked')}
              />
              
              <InfluencerCard
                name="Maria Garcia"
                username="mariadata"
                avatar="https://i.pravatar.cc/150?img=3"
                bio="Data scientist teaching machine learning and Python to beginners."
                followers={78000}
                students={5600}
                courses={15}
                rating={4.7}
                verified={false}
                expertise={['Python', 'Machine Learning', 'Data Science']}
                isFollowing={false}
                onFollow={() => console.log('Follow clicked')}
                onClick={() => console.log('Card clicked')}
              />
            </div>

            {/* Compact Cards */}
            <h4 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Compact View</h4>
            <div className="space-y-3 mb-6">
              <InfluencerCardCompact
                name="John Doe"
                username="johndoe"
                avatar="https://i.pravatar.cc/150?img=4"
                followers={32000}
                rating={4.6}
                verified={true}
                isFollowing={false}
                onFollow={() => console.log('Follow')}
                onClick={() => console.log('Click')}
              />
              <InfluencerCardCompact
                name="Emily Wilson"
                username="emilywilson"
                avatar="https://i.pravatar.cc/150?img=5"
                followers={18500}
                rating={4.9}
                verified={false}
                isFollowing={true}
                onFollow={() => console.log('Follow')}
                onClick={() => console.log('Click')}
              />
            </div>

            {/* Mini Cards */}
            <h4 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Mini Cards</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfluencerCardMini
                name="David Kim"
                avatar="https://i.pravatar.cc/150?img=6"
                expertise="Web3 Expert"
                verified={true}
                onClick={() => console.log('Mini card clicked')}
              />
              <InfluencerCardMini
                name="Lisa Brown"
                avatar="https://i.pravatar.cc/150?img=7"
                expertise="AI Specialist"
                verified={false}
                onClick={() => console.log('Mini card clicked')}
              />
              <InfluencerCardMini
                name="Tom Wilson"
                avatar="https://i.pravatar.cc/150?img=8"
                expertise="DevOps Pro"
                verified={true}
                onClick={() => console.log('Mini card clicked')}
              />
              <InfluencerCardMini
                name="Anna Lee"
                avatar="https://i.pravatar.cc/150?img=9"
                expertise="React Native"
                verified={false}
                onClick={() => console.log('Mini card clicked')}
              />
            </div>
          </div>

          {/* Influencer Profile Header */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Influencer Profile Header</h3>
            <InfluencerProfileHeader
              name="Sarah Johnson"
              username="sarahteaches"
              avatar="https://i.pravatar.cc/300?img=1"
              coverImage="https://picsum.photos/800/300?random=2"
              bio="Passionate educator specializing in web development and JavaScript. I've been teaching programming for over 10 years and have helped thousands of students launch their careers in tech. My courses focus on practical, real-world skills that you can apply immediately."
              location="San Francisco, CA"
              website="sarahjohnson.dev"
              joinDate="January 2020"
              followers={125000}
              following={450}
              students={8500}
              courses={12}
              rating={4.8}
              reviews={1250}
              verified={true}
              expertise={['JavaScript', 'React', 'Node.js', 'TypeScript', 'Web Development', 'API Design']}
              achievements={['Top Instructor 2023', '1M+ Course Views', 'Featured Creator']}
              isFollowing={false}
              onFollow={() => console.log('Follow')}
              onMessage={() => console.log('Message')}
            />
          </div>

          {/* Influencer Stats */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Influencer Stats</h3>
            <InfluencerStats
              totalEarnings={125000}
              monthlyStudents={450}
              completionRate={87}
              responseTime="< 2 hours"
            />
          </div>

          {/* Social Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Social Links</h3>
            <InfluencerSocialLinks
              links={[
                { platform: 'youtube', url: 'https://youtube.com', followers: 250000 },
                { platform: 'instagram', url: 'https://instagram.com', followers: 85000 },
                { platform: 'twitter', url: 'https://twitter.com', followers: 45000 },
                { platform: 'linkedin', url: 'https://linkedin.com', followers: 32000 },
                { platform: 'tiktok', url: 'https://tiktok.com', followers: 125000 }
              ]}
            />
          </div>

          {/* Influencer Discovery */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Influencer Discovery Section</h3>
            <InfluencerDiscovery />
          </div>
        </section>

        {/* Gamification Components Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Gamification & Entertainment</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">Engaging components designed for middle and high school students</p>
          
          {/* Achievement Badges */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Achievement Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AchievementBadge
                title="First Course"
                description="Complete your first course"
                icon="🏆"
                rarity="common"
                unlocked={true}
                unlockedDate={new Date('2024-01-15')}
              />
              <AchievementBadge
                title="Speed Reader"
                description="Read 10 lessons in one day"
                icon="⚡"
                rarity="rare"
                unlocked={true}
                unlockedDate={new Date('2024-02-20')}
              />
              <AchievementBadge
                title="Quiz Master"
                description="Get perfect score on 5 quizzes"
                icon="🧠"
                rarity="epic"
                unlocked={false}
                progress={3}
                maxProgress={5}
              />
              <AchievementBadge
                title="Coding Legend"
                description="Complete advanced programming course"
                icon="👨‍💻"
                rarity="legendary"
                unlocked={false}
                progress={0}
                maxProgress={1}
              />
            </div>
          </div>

          {/* Progress & Stats Cards */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Progress & Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StreakCounter
                currentStreak={12}
                longestStreak={28}
                streakGoal={30}
                lastActivity={new Date()}
              />
              <XPLevel
                currentXP={2850}
                level={8}
                xpToNextLevel={150}
                totalXPForNextLevel={400}
                recentXPGain={50}
              />
              <MotivationalQuote />
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Daily Challenge</h3>
            <div className="max-w-md">
              <DailyChallenge
                title="Math Problem Solver"
                description="Complete 5 algebra problems correctly"
                progress={3}
                maxProgress={5}
                reward={{ xp: 100, coins: 25 }}
                timeLeft={18}
                onStart={() => console.log('Challenge started')}
              />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Leaderboards</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Leaderboard
                  users={[
                    { id: '1', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/50?img=1', score: 15420, rank: 1, change: 2, level: 12, streak: 15, badge: 'Genius' },
                    { id: '2', name: 'Sarah Kim', avatar: 'https://i.pravatar.cc/50?img=2', score: 14890, rank: 2, change: -1, level: 11, streak: 8 },
                    { id: '3', name: 'Miguel Rodriguez', avatar: 'https://i.pravatar.cc/50?img=3', score: 14250, rank: 3, change: 1, level: 10, streak: 22, badge: 'Dedicated' },
                    { id: '4', name: 'Emma Johnson', avatar: 'https://i.pravatar.cc/50?img=4', score: 13780, rank: 4, change: 0, level: 10, streak: 5 },
                    { id: '5', name: 'David Park', avatar: 'https://i.pravatar.cc/50?img=5', score: 13445, rank: 5, change: 3, level: 9, streak: 12 },
                    { id: '6', name: 'Zoe Wilson', avatar: 'https://i.pravatar.cc/50?img=6', score: 13200, rank: 6, change: -2, level: 9, streak: 3 },
                    { id: '7', name: 'James Brown', avatar: 'https://i.pravatar.cc/50?img=7', score: 12950, rank: 7, change: 1, level: 8, streak: 7 },
                    { id: '8', name: 'Lisa Garcia', avatar: 'https://i.pravatar.cc/50?img=8', score: 12680, rank: 8, change: -1, level: 8, streak: 18 },
                  ]}
                  currentUserId="5"
                  timeframe="weekly"
                  onTimeframeChange={(tf) => console.log('Timeframe:', tf)}
                />
              </div>
              <div>
                <MiniLeaderboard
                  users={[
                    { id: '1', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/50?img=1', score: 15420, rank: 1 },
                    { id: '2', name: 'Sarah Kim', avatar: 'https://i.pravatar.cc/50?img=2', score: 14890, rank: 2 },
                    { id: '3', name: 'Miguel Rodriguez', avatar: 'https://i.pravatar.cc/50?img=3', score: 14250, rank: 3 },
                    { id: '4', name: 'Emma Johnson', avatar: 'https://i.pravatar.cc/50?img=4', score: 13780, rank: 4 },
                    { id: '5', name: 'David Park', avatar: 'https://i.pravatar.cc/50?img=5', score: 13445, rank: 5 },
                  ]}
                  currentUserId="2"
                />
              </div>
            </div>
          </div>

          {/* Quiz Components */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Interactive Quizzes</h3>
            <div className="max-w-2xl">
              <QuizCard
                title="JavaScript Fundamentals"
                description="Test your knowledge of JavaScript basics"
                difficulty="medium"
                timeLimit={300}
                questions={[
                  {
                    id: '1',
                    question: 'What is the correct way to declare a variable in JavaScript?',
                    options: ['var myVar;', 'variable myVar;', 'v myVar;', 'declare myVar;'],
                    correctAnswer: 0,
                    explanation: 'In JavaScript, variables are declared using var, let, or const keywords.'
                  },
                  {
                    id: '2',
                    question: 'Which method is used to add an element to the end of an array?',
                    options: ['append()', 'push()', 'add()', 'insert()'],
                    correctAnswer: 1,
                    explanation: 'The push() method adds one or more elements to the end of an array.'
                  },
                  {
                    id: '3',
                    question: 'What does "==" check for in JavaScript?',
                    options: ['Strict equality', 'Value equality', 'Type equality', 'Reference equality'],
                    correctAnswer: 1,
                    explanation: 'The "==" operator checks for value equality with type coercion, while "===" checks for strict equality.'
                  }
                ]}
                rewards={{ xp: 150, coins: 30, badges: ['Quiz Master'] }}
                onComplete={(score, time) => console.log('Quiz completed:', score, time)}
              />
            </div>
          </div>

          {/* Celebration Animations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Celebration Animations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CelebrationButton celebrationType="confetti">
                🎉 Confetti
              </CelebrationButton>
              <CelebrationButton celebrationType="levelup">
                ⬆️ Level Up
              </CelebrationButton>
              <CelebrationButton celebrationType="reward">
                🎁 Rewards
              </CelebrationButton>
              <Button onClick={() => console.log('Hearts!')}>
                ❤️ Hearts
              </Button>
            </div>
          </div>

          {/* Interactive Mascot */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Study Companion</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StudyBuddy
                  name="Rooty"
                  mood="excited"
                  level={5}
                  messages={[
                    "Ready to tackle some new challenges today? 🚀",
                    "You're on a roll! Keep up the amazing work! ⭐",
                    "Learning is an adventure - let's explore together! 🗺️",
                    "Every question you answer makes you stronger! 💪",
                    "I'm so proud of your progress! You're incredible! 🌟"
                  ]}
                  onInteraction={(type) => console.log('Interaction:', type)}
                />
              </div>
              <div>
                <StudyCompanion
                  studyTime={45}
                  tasksCompleted={3}
                  onEncouragement={() => console.log('Encouragement given!')}
                />
              </div>
            </div>
          </div>

          {/* Avatar Customizer */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Avatar Customizer</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AvatarCustomizer
                currentAvatar={{
                  face: '😊',
                  accessory: '🎩',
                  background: 'from-blue-400 to-purple-500'
                }}
                onAvatarChange={(avatar) => console.log('Avatar changed:', avatar)}
              />
              <MoodTracker
                currentMood="😊"
                moodHistory={[
                  { date: '2024-01-20', mood: '😊' },
                  { date: '2024-01-19', mood: '🤓' },
                  { date: '2024-01-18', mood: '😎' }
                ]}
                onMoodSelect={(mood) => console.log('Mood selected:', mood)}
              />
            </div>
          </div>
        </section>

        {/* Buttons Section - Mobile Optimized */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Mobile-Optimized Buttons</h2>
          <Card>
            <CardContent>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                All buttons have minimum 44px touch targets for mobile
              </p>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small (44px)</Button>
                  <Button size="md">Medium (48px)</Button>
                  <Button size="lg">Large (52px)</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Drawer Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Bottom Drawer</h2>
          <Card>
            <CardContent>
              <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
              <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Course Options"
                height="half"
              >
                <List divided>
                  <ListItem onClick={() => setDrawerOpen(false)}>Download for Offline</ListItem>
                  <ListItem onClick={() => setDrawerOpen(false)}>Share Course</ListItem>
                  <ListItem onClick={() => setDrawerOpen(false)}>Add to Favorites</ListItem>
                  <ListItem onClick={() => setDrawerOpen(false)}>Report Issue</ListItem>
                </List>
              </Drawer>
            </CardContent>
          </Card>
        </section>

        {/* Toast Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Toast Notifications</h2>
          <Card>
            <CardContent>
              <ToastDemo />
            </CardContent>
          </Card>
        </section>

        {/* Skeleton Loaders Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Skeleton Loaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Card Skeleton</h3>
              <CardSkeleton />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Course Card Skeleton</h3>
              <CourseCardSkeleton />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">List Item Skeleton</h3>
              <Card>
                <ListItemSkeleton />
                <div className="h-px bg-[var(--color-border-primary)]" />
                <ListItemSkeleton />
              </Card>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Chat Skeleton</h3>
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    <ChatMessageSkeleton />
                    <ChatMessageSkeleton isUser />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Swipeable Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Swipeable Cards</h2>
          <Card>
            <CardContent>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                Swipe left to skip, swipe right to like (mobile only)
              </p>
              <SwipeableStack
                cards={swipeableCards}
                onSwipeLeft={(card) => console.log('Skipped:', card)}
                onSwipeRight={(card) => console.log('Liked:', card)}
              />
            </CardContent>
          </Card>
        </section>

        {/* List Components Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">List Components</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Section List</CardTitle>
              </CardHeader>
              <CardContent className="-mx-6">
                <SectionList sections={sectionListData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expandable List</CardTitle>
              </CardHeader>
              <CardContent className="-mx-6">
                <List divided>
                  <ExpandableListItem 
                    title="Course Requirements"
                    leftContent={<Badge variant="info">Info</Badge>}
                  >
                    <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
                      <li>Basic programming knowledge</li>
                      <li>Computer with internet connection</li>
                      <li>4-6 hours per week commitment</li>
                    </ul>
                  </ExpandableListItem>
                  <ExpandableListItem title="What You\'ll Learn">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      This course covers fundamental concepts including variables, functions, 
                      object-oriented programming, and more.
                    </p>
                  </ExpandableListItem>
                </List>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* AI Chat Section - Mobile Optimized */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">AI Chat Interface</h2>
          <div className="max-w-full md:max-w-3xl">
            <AIChat
              messages={mockMessages}
              onSendMessage={(message) => console.log('Send:', message)}
              placeholder="Ask me anything about your studies..."
            />
          </div>
        </section>

        {/* Enhanced Chat System Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Enhanced Chat System</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Advanced chat interface with influencer validation, templates, and modern UX features
          </p>
          
          <div className="space-y-8">
            {/* Enhanced Chat Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Chat Interface</CardTitle>
                <CardSubtitle>Real-time chat with reactions, replies, templates, and typing indicators</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                  <EnhancedChat
                    currentUser={{
                      id: 'demo-user',
                      name: 'Demo Student',
                      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                      role: 'student',
                      isOnline: true
                    }}
                    messages={[
                      {
                        id: 'demo-1',
                        senderId: 'influencer-demo',
                        content: 'Welcome to our enhanced chat! 🚀 This is a message from an influencer with validation features.',
                        timestamp: new Date(Date.now() - 30 * 60 * 1000),
                        type: 'template',
                        status: 'read',
                        isTemplate: true,
                        validatedBy: 'influencer-demo',
                        validatedAt: new Date(Date.now() - 35 * 60 * 1000),
                        reactions: [
                          { emoji: '🚀', userId: 'demo-user', timestamp: new Date() },
                          { emoji: '👍', userId: 'student-2', timestamp: new Date() }
                        ]
                      },
                      {
                        id: 'demo-2',
                        senderId: 'demo-user',
                        content: 'This is amazing! I love the reactions and template features.',
                        timestamp: new Date(Date.now() - 15 * 60 * 1000),
                        type: 'text',
                        status: 'read'
                      },
                      {
                        id: 'demo-3',
                        senderId: 'influencer-demo',
                        content: 'Try using the template button below to see pre-made messages! You can also react to messages and reply to specific ones. 💡',
                        timestamp: new Date(Date.now() - 5 * 60 * 1000),
                        type: 'text',
                        status: 'read'
                      }
                    ]}
                    users={[
                      {
                        id: 'demo-user',
                        name: 'Demo Student',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                        role: 'student',
                        isOnline: true
                      },
                      {
                        id: 'influencer-demo',
                        name: 'Sarah Instructor',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
                        role: 'influencer',
                        isOnline: true
                      },
                      {
                        id: 'student-2',
                        name: 'Mike Student',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
                        role: 'student',
                        isOnline: false
                      }
                    ]}
                    templates={[
                      {
                        id: 'demo-template-1',
                        title: 'Ask for Help',
                        content: 'Hi! I need help understanding this topic. Could you please explain it in more detail? Thanks! 🙋‍♂️',
                        category: 'help',
                        tags: ['help', 'question'],
                        usageCount: 42,
                        createdBy: 'system'
                      },
                      {
                        id: 'demo-template-2',
                        title: 'Share Progress',
                        content: 'Great news! I just completed a milestone in my studies. Feeling accomplished! 🎉',
                        category: 'progress',
                        tags: ['progress', 'achievement'],
                        usageCount: 28,
                        createdBy: 'system'
                      }
                    ]}
                    onSendMessage={(content, type, templateId) => {
                      console.log('Demo chat - Send message:', { content, type, templateId });
                    }}
                    onReactToMessage={(messageId, emoji) => {
                      console.log('Demo chat - React:', { messageId, emoji });
                    }}
                    onTyping={(isTyping) => {
                      console.log('Demo chat - Typing:', isTyping);
                    }}
                    enableTemplates={true}
                    enableReactions={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Message Validation Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Influencer Message Validation</CardTitle>
                <CardSubtitle>Pre-approve messages before sending to students with bulk actions and preview</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                  <InfluencerMessageValidation
                    pendingMessages={[
                      {
                        id: 'validation-demo-1',
                        content: '🎉 Exciting news! We\'re launching a new advanced React course next week. This comprehensive course will cover hooks, context, performance optimization, and real-world project building. Perfect for intermediate developers looking to level up!',
                        templateId: 'course-announcement',
                        templateTitle: 'Course Launch',
                        targetAudience: ['React Students', 'Intermediate Developers'],
                        category: 'Announcement',
                        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        createdBy: 'content-team',
                        tags: ['react', 'course', 'launch'],
                        priority: 'high',
                        estimatedReach: 1850,
                        context: 'Major course launch - high engagement expected'
                      },
                      {
                        id: 'validation-demo-2',
                        content: '💡 Pro tip: When learning algorithms, always start with understanding the problem before jumping into code. Draw it out, trace through examples, and then implement. This approach will save you hours of debugging!',
                        targetAudience: ['Programming Students'],
                        category: 'Tips',
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        createdBy: 'content-team',
                        tags: ['programming', 'tips', 'algorithms'],
                        priority: 'medium',
                        estimatedReach: 950
                      },
                      {
                        id: 'validation-demo-3',
                        content: '🚨 Quick reminder: The midterm project submissions are due this Friday at 11:59 PM. Make sure to test your code thoroughly and include a README file. Need help? Office hours are tomorrow 2-4 PM!',
                        targetAudience: ['Current Course Students'],
                        category: 'Reminder',
                        createdAt: new Date(Date.now() - 30 * 60 * 1000),
                        createdBy: 'instructor',
                        tags: ['deadline', 'project', 'reminder'],
                        priority: 'urgent',
                        estimatedReach: 320,
                        context: 'Important deadline approaching'
                      }
                    ]}
                    onValidate={(messageId, action) => {
                      console.log('Demo validation:', { messageId, action });
                    }}
                    onBulkValidate={(messageIds, action) => {
                      console.log('Demo bulk validation:', { messageIds, action });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Manager Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Chat Template Manager</CardTitle>
                <CardSubtitle>Create, organize, and manage message templates with variables and analytics</CardSubtitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                  <ChatTemplateManager
                    templates={[
                      {
                        id: 'template-demo-1',
                        title: 'Welcome New Students',
                        content: 'Welcome to {course_name}! 🎉 I\'m excited to have you join us. We\'ll be covering {topics} over the next {duration}. Don\'t hesitate to ask questions - I\'m here to help you succeed!',
                        category: 'welcome',
                        tags: ['welcome', 'introduction', 'course'],
                        usageCount: 156,
                        createdBy: 'demo-instructor',
                        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        isActive: true,
                        targetAudience: ['New Students'],
                        estimatedEngagement: 94,
                        variables: [
                          {
                            name: 'course_name',
                            type: 'text',
                            required: true,
                            placeholder: 'e.g. Advanced JavaScript'
                          },
                          {
                            name: 'topics',
                            type: 'text',
                            required: true,
                            placeholder: 'e.g. ES6, React, Node.js'
                          },
                          {
                            name: 'duration',
                            type: 'text',
                            required: true,
                            placeholder: 'e.g. 8 weeks'
                          }
                        ]
                      },
                      {
                        id: 'template-demo-2',
                        title: 'Assignment Reminder',
                        content: '📚 Friendly reminder: Your {assignment_name} assignment is due on {due_date}. If you need help or have questions, don\'t hesitate to reach out. You\'ve got this! 💪',
                        category: 'reminder',
                        tags: ['assignment', 'deadline', 'support'],
                        usageCount: 89,
                        createdBy: 'demo-instructor',
                        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                        isActive: true,
                        targetAudience: ['Current Students'],
                        estimatedEngagement: 78,
                        variables: [
                          {
                            name: 'assignment_name',
                            type: 'text',
                            required: true,
                            placeholder: 'e.g. Week 3 Project'
                          },
                          {
                            name: 'due_date',
                            type: 'date',
                            required: true
                          }
                        ]
                      },
                      {
                        id: 'template-demo-3',
                        title: 'Encouragement Message',
                        content: '🌟 You\'re doing amazing work in {subject}! Remember, every expert was once a beginner. Keep pushing forward, celebrate your progress, and don\'t forget that I believe in you! 🚀',
                        category: 'motivation',
                        tags: ['encouragement', 'motivation', 'progress'],
                        usageCount: 234,
                        createdBy: 'demo-instructor',
                        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
                        lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        isActive: true,
                        targetAudience: ['All Students', 'Struggling Students'],
                        estimatedEngagement: 96,
                        variables: [
                          {
                            name: 'subject',
                            type: 'select',
                            options: ['Mathematics', 'Programming', 'Science', 'Languages', 'General Studies'],
                            required: true
                          }
                        ]
                      },
                      {
                        id: 'template-demo-4',
                        title: 'Study Session Invite',
                        content: '📅 Join us for a special study session on {topic} this {day} at {time}! We\'ll be going deep into {focus_areas}. Bring your questions and let\'s learn together! 📖',
                        category: 'announcement',
                        tags: ['study-session', 'group-study', 'invitation'],
                        usageCount: 67,
                        createdBy: 'demo-instructor',
                        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                        lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        isActive: true,
                        targetAudience: ['Active Students'],
                        estimatedEngagement: 82
                      },
                      {
                        id: 'template-demo-5',
                        title: 'Quick Learning Tip',
                        content: '💡 Today\'s tip: {tip_content} Try this out and let me know how it works for you! Small improvements lead to big results. 🎯',
                        category: 'tips',
                        tags: ['tips', 'daily-tip', 'learning'],
                        usageCount: 143,
                        createdBy: 'demo-instructor',
                        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                        isActive: true,
                        targetAudience: ['All Students'],
                        estimatedEngagement: 73,
                        variables: [
                          {
                            name: 'tip_content',
                            type: 'text',
                            required: true,
                            placeholder: 'Your helpful tip here...'
                          }
                        ]
                      }
                    ]}
                    categories={[
                      {
                        id: 'welcome',
                        name: 'Welcome Messages',
                        description: 'Greeting messages for new students',
                        color: '#10b981',
                        templateCount: 8
                      },
                      {
                        id: 'reminder',
                        name: 'Reminders',
                        description: 'Assignment and deadline reminders',
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
                        description: 'Course and event announcements',
                        color: '#3b82f6',
                        templateCount: 9
                      },
                      {
                        id: 'tips',
                        name: 'Tips & Advice',
                        description: 'Educational tips and study advice',
                        color: '#ef4444',
                        templateCount: 18
                      }
                    ]}
                    onCreateTemplate={(template) => {
                      console.log('Demo - Create template:', template);
                    }}
                    onUpdateTemplate={(id, updates) => {
                      console.log('Demo - Update template:', { id, updates });
                    }}
                    onDeleteTemplate={(id) => {
                      console.log('Demo - Delete template:', id);
                    }}
                    onUseTemplate={(template, variables) => {
                      console.log('Demo - Use template:', { template: template.title, variables });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Chat Features Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="text-center pt-6">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Enhanced UX</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Real-time typing, reactions, replies, message status, and elegant interface
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="text-center pt-6">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Message Validation</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Influencers approve, edit, or reject messages with bulk actions and preview
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="text-center pt-6">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Smart Templates</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Pre-made messages with variables, categories, and usage analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Progress Components */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Progress Indicators</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-4">Progress Bars</h3>
                  <div className="space-y-3">
                    <ProgressBar value={25} showPercentage color="primary" />
                    <ProgressBar value={50} showPercentage color="success" />
                    <ProgressBar value={75} showPercentage color="warning" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-4">Steps Progress</h3>
                  <StepsProgress steps={stepsData} currentStep={2} />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-4">Learning Progress Cards</h3>
                  <div className="space-y-2">
                    <LearningProgress title="Video Lessons" progress={8} total={12} />
                    <LearningProgress title="Assignments" progress={3} total={5} />
                    <LearningProgress title="Quiz Score" progress={85} total={100} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Forms - Mobile Optimized */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Mobile-Optimized Forms</h2>
          <Card>
            <CardContent>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                All inputs have 16px font size to prevent iOS zoom
              </p>
              <div className="space-y-4">
                <Input label="Email" type="email" placeholder="your@email.com" />
                <Select
                  label="Course Category"
                  options={[
                    { value: '', label: 'Select category' },
                    { value: 'tech', label: 'Technology' },
                    { value: 'design', label: 'Design' },
                    { value: 'business', label: 'Business' }
                  ]}
                />
                <Textarea label="Feedback" placeholder="Share your thoughts..." rows={3} />
                <div className="space-y-2">
                  <Checkbox label="Subscribe to updates" />
                  <Checkbox label="Accept terms" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Tabs</h2>
          <Card>
            <CardContent>
              <Tabs tabs={tabsData} defaultTab="overview" />
            </CardContent>
          </Card>
        </section>

        {/* Alerts */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Alerts</h2>
          <div className="space-y-3">
            <Alert variant="info" title="Information">
              Your course starts in 2 days. Make sure to review the prerequisites.
            </Alert>
            <Alert variant="success">
              Assignment submitted successfully!
            </Alert>
            <Alert variant="warning" onClose={() => {}}>
              Your subscription expires in 5 days. Renew now to continue learning.
            </Alert>
          </div>
        </section>

        {/* Badges & Avatars */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Badges & Avatars</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Avatars</h3>
                  <div className="flex items-center gap-3">
                    <Avatar name="John Doe" status="online" />
                    <Avatar name="Jane Smith" status="away" />
                    <Avatar name="Bob Wilson" status="busy" />
                    <Avatar name="Alice Brown" status="offline" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-3">Avatar Group</h3>
                  <AvatarGroup max={4}>
                    <Avatar name="User 1" />
                    <Avatar name="User 2" />
                    <Avatar name="User 3" />
                    <Avatar name="User 4" />
                    <Avatar name="User 5" />
                  </AvatarGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-[32px] font-semibold mb-6">Modal</h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Course Enrollment"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Enroll Now</Button>
              </>
            }
          >
            <p className="text-[var(--color-text-secondary)] mb-4">
              You\'re about to enroll in "Introduction to Machine Learning". This course includes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>12 video lessons</li>
              <li>5 coding assignments</li>
              <li>Certificate upon completion</li>
              <li>Lifetime access</li>
            </ul>
          </Modal>
        </section>
      </div>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        items={bottomNavItems}
        activeItem="home"
        onItemClick={(id) => console.log('Navigate to:', id)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        position="left"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Menu</h2>
          <List divided>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Dashboard</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>My Courses</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Progress</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Certificates</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Settings</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Help & Support</ListItem>
            <ListItem onClick={() => setMobileMenuOpen(false)}>Sign Out</ListItem>
          </List>
        </div>
      </MobileMenu>

      {/* Floating Action Buttons */}
      <FloatingActionButton
        icon={
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        }
        position="bottom-right"
        onClick={() => console.log('FAB clicked')}
      />

      {/* Speed Dial FAB (uncomment to see)
      <SpeedDialFAB
        actions={speedDialActions}
        position="bottom-right"
      />
      */}
    </div>
  );
}

export default function ArchivePage() {
  return (
    <ToastProvider>
      <ArchiveContent />
    </ToastProvider>
  );
}