'use client';

/**
 * Structured Data Tabs Component
 * 
 * Displays the extracted structured data in organized, scannable tabs:
 * - Creative Activities (창의적 체험활동상황)
 * - Academic Development (교과학습발달상황) 
 * - Detailed Abilities (세부능력 및 특기사항)
 * 
 * Each tab presents data using cards, tables, and visual elements for better UX.
 */

import React, { useState, useMemo } from 'react';
import { ExtractedData } from '@/types/medsky';
import { 
  processActivities, 
  processAcademics, 
  processDetailedAbilities,
  getActivityStatsByDomain,
  getAcademicStatsByCategory,
  ProcessedActivity,
  ProcessedAcademic,
  ProcessedAbility
} from '@/lib/medsky/analysisUtils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface StructuredDataTabsProps {
  extractedData: ExtractedData;
  className?: string;
}

type TabType = 'activities' | 'academics' | 'abilities';

export function StructuredDataTabs({ extractedData, className }: StructuredDataTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('activities');

  // Process all data using utilities
  const processedData = useMemo(() => ({
    activities: processActivities(extractedData),
    academics: processAcademics(extractedData), 
    abilities: processDetailedAbilities(extractedData)
  }), [extractedData]);

  const tabs = [
    { 
      id: 'activities' as TabType, 
      name: '창의적 체험활동', 
      icon: '🎨', 
      count: processedData.activities.length,
      description: '창의적 체험활동상황'
    },
    { 
      id: 'academics' as TabType, 
      name: '교과학습발달상황', 
      icon: '📚', 
      count: processedData.academics.length,
      description: '교과 성취도 및 학습 발달'
    },
    { 
      id: 'abilities' as TabType, 
      name: '세부능력 및 특기사항', 
      icon: '💡', 
      count: processedData.abilities.length,
      description: '과목별 세부 능력과 특기사항'
    }
  ];

  return (
    <div className={`structured-data-tabs space-y-6 ${className || ''}`}>
      {/* Tab Navigation */}
      <div className="border-b border-[var(--color-border-primary)]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-secondary)]'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
              <Badge variant="default" size="sm">{tab.count}</Badge>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'activities' && (
          <ActivitiesTab activities={processedData.activities} />
        )}
        {activeTab === 'academics' && (
          <AcademicsTab academics={processedData.academics} />
        )}
        {activeTab === 'abilities' && (
          <AbilitiesTab abilities={processedData.abilities} />
        )}
      </div>
    </div>
  );
}

// ===========================
// Creative Activities Tab
// ===========================

interface ActivitiesTabProps {
  activities: ProcessedActivity[];
}

function ActivitiesTab({ activities }: ActivitiesTabProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  
  const domainStats = useMemo(() => getActivityStatsByDomain(activities), [activities]);
  const domains = Object.keys(domainStats);
  
  const filteredActivities = selectedDomain === 'all' 
    ? activities 
    : activities.filter(a => a.domain === selectedDomain);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          창의적 체험활동 데이터 없음
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          추출된 창의적 체험활동 정보가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Filter */}
      <Card className="p-4" glass={false}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDomain === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedDomain('all')}
          >
            전체 ({activities.length})
          </Button>
          {domains.map(domain => (
            <Button
              key={domain}
              variant={selectedDomain === domain ? 'primary' : 'outline'}
              size="sm"  
              onClick={() => setSelectedDomain(domain)}
            >
              {domain} ({domainStats[domain].count})
            </Button>
          ))}
        </div>
      </Card>

      {/* Domain Statistics */}
      {selectedDomain === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map(domain => {
            const stats = domainStats[domain];
            return (
              <Card key={domain} className="p-4 text-center" glass={false}>
                <div className="space-y-2">
                  <div className="font-semibold text-[var(--color-text-primary)]">{domain}</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.count}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {stats.hours}시간
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activities Grid */}
      <div className="grid gap-6">
        {filteredActivities.map((activity, index) => (
          <Card key={index} className="p-6" glass={false}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {activity.영역.substring(0, 1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {activity.영역}
                    </h3>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {activity.시간}시간
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {activity.domain}
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">특기사항</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {activity.특기사항}
                  </p>
                </div>

                {/* Highlights */}
                {activity.highlights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-2">주요 성과</h4>
                    <div className="flex flex-wrap gap-2">
                      {activity.highlights.map((highlight, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competency Areas */}
                {activity.competencyAreas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-2">역량 영역</h4>
                    <div className="flex flex-wrap gap-2">
                      {activity.competencyAreas.map((competency, idx) => (
                        <Badge key={idx} variant="default" size="sm" className="bg-green-100 text-green-800">
                          {competency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===========================
// Academic Development Tab
// ===========================

interface AcademicsTabProps {
  academics: ProcessedAcademic[];
}

function AcademicsTab({ academics }: AcademicsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const categoryStats = useMemo(() => getAcademicStatsByCategory(academics), [academics]);
  const categories = Object.keys(categoryStats);

  // Extract unique semesters
  const semesters = useMemo(() => {
    const semesterSet = new Set(
      academics
        .map(a => a.학기)
        .filter((s): s is string => s !== null && s !== undefined && s !== '')
    );
    return Array.from(semesterSet).sort();
  }, [academics]);

  // Apply both category and semester filters
  const filteredAcademics = useMemo(() => {
    return academics.filter(a => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (selectedSemester !== 'all' && a.학기 !== selectedSemester) return false;
      return true;
    });
  }, [academics, selectedCategory, selectedSemester]);

  if (academics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          교과학습발달 데이터 없음
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          추출된 교과학습발달상황 정보가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card className="p-4" glass={false}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            전체 ({academics.length})
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({categoryStats[category].count})
            </Button>
          ))}
        </div>
      </Card>

      {/* Semester Filter */}
      {semesters.length > 0 && (
        <Card className="p-4" glass={false}>
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">학기 필터</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSemester === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedSemester('all')}
            >
              전체
            </Button>
            {semesters.map(semester => (
              <Button
                key={semester}
                variant={selectedSemester === semester ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedSemester(semester)}
              >
                {semester}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Academic Performance Table */}
      <Card className="overflow-hidden" glass={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border-primary)]">
            <thead className="bg-[var(--color-bg-secondary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  학기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  과목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  학점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  성취도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  점수/평균
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  평가
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--color-bg-primary)] divide-y divide-[var(--color-border-primary)]">
              {filteredAcademics.map((academic, index) => (
                <tr key={index} className="hover:bg-[var(--color-bg-secondary)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default" size="sm">
                      {academic.학기 || '-'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {academic.과목}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default" size="sm">
                      {academic.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {academic.학점수}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AchievementBadge achievement={academic.성취도} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {academic.석차등급}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                    {academic.score_over_average}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PerformanceBadge level={academic.performanceLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ===========================
// Detailed Abilities Tab
// ===========================

interface AbilitiesTabProps {
  abilities: ProcessedAbility[];
}

function AbilitiesTab({ abilities }: AbilitiesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = useMemo(() => {
    const cats = [...new Set(abilities.map(a => a.category))];
    return cats.filter(Boolean);
  }, [abilities]);

  const filteredAbilities = useMemo(() => {
    let filtered = abilities;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.과목.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.특기사항.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [abilities, selectedCategory, searchTerm]);

  if (abilities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💡</div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
          세부능력 데이터 없음
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          추출된 세부능력 및 특기사항 정보가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4" glass={false}>
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="과목명 또는 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              전체 ({abilities.length})
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({abilities.filter(a => a.category === category).length})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Abilities Grid */}
      <div className="grid gap-6">
        {filteredAbilities.map((ability, index) => (
          <Card key={index} className="p-6" glass={false}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {ability.과목.substring(0, 1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {ability.과목}
                    </h3>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {ability.category}
                    </div>
                  </div>
                </div>
                <CompetencyLevelBadge level={ability.competencyLevel} />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">특기사항</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {ability.특기사항}
                  </p>
                </div>

                {/* Key Strengths */}
                {ability.keyStrengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-2">주요 강점</h4>
                    <div className="flex flex-wrap gap-2">
                      {ability.keyStrengths.map((strength, idx) => (
                        <Badge key={idx} variant="default" size="sm" className="bg-blue-100 text-blue-800">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Areas */}
                {ability.skillAreas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-2">역량 영역</h4>
                    <div className="flex flex-wrap gap-2">
                      {ability.skillAreas.map((skill, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredAbilities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-secondary)]">
            검색 조건에 맞는 결과가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

// ===========================
// Helper Components
// ===========================

function AchievementBadge({ achievement }: { achievement: string }) {
  const getColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge variant="default" size="sm" className={getColor(achievement)}>
      {achievement}
    </Badge>
  );
}

function PerformanceBadge({ level }: { level: ProcessedAcademic['performanceLevel'] }) {
  const config = {
    excellent: { label: '우수', color: 'bg-green-100 text-green-800' },
    good: { label: '양호', color: 'bg-blue-100 text-blue-800' },
    average: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
    needs_improvement: { label: '미흡', color: 'bg-red-100 text-red-800' }
  };

  const { label, color } = config[level];

  return (
    <Badge variant="default" size="sm" className={color}>
      {label}
    </Badge>
  );
}

function CompetencyLevelBadge({ level }: { level: ProcessedAbility['competencyLevel'] }) {
  const config = {
    high: { label: '높음', color: 'bg-green-100 text-green-800' },
    medium: { label: '보통', color: 'bg-blue-100 text-blue-800' },
    basic: { label: '기초', color: 'bg-gray-100 text-gray-800' }
  };

  const { label, color } = config[level];

  return (
    <Badge variant="default" size="sm" className={color}>
      {label}
    </Badge>
  );
}