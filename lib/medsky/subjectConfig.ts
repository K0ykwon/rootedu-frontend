/**
 * Subject and Activity Configuration
 *
 * Icon and color mappings for subjects and creative activities
 */

export interface SubjectConfig {
  icon: string;
  color: string;
  borderColor: string;
  textColor: string;
}

export interface ActivityConfig {
  icon: string;
  color: string;
  borderColor: string;
  textColor: string;
}

/**
 * Subject configuration mapping
 * Maps Korean subject names to their visual properties
 */
export const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  '국어': {
    icon: '📚',
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  },
  '수학': {
    icon: '🔢',
    color: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900'
  },
  '영어': {
    icon: '🌍',
    color: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900'
  },
  '한국사': {
    icon: '🏛️',
    color: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900'
  },
  '통합사회': {
    icon: '🌏',
    color: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900'
  },
  '통합과학': {
    icon: '🔬',
    color: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-900'
  },
  '과학탐구실험': {
    icon: '🧪',
    color: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-900'
  },
  '체육': {
    icon: '⚽',
    color: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900'
  },
  '음악': {
    icon: '🎵',
    color: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-900'
  },
  '미술': {
    icon: '🎨',
    color: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-900'
  },
  '생명과학': {
    icon: '🧬',
    color: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900'
  },
  '물리학': {
    icon: '⚛️',
    color: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900'
  },
  '화학': {
    icon: '⚗️',
    color: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-900'
  },
  '지구과학': {
    icon: '🌍',
    color: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-900'
  },
  '사회': {
    icon: '🏘️',
    color: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-900'
  },
  '역사': {
    icon: '📜',
    color: 'bg-stone-50',
    borderColor: 'border-stone-200',
    textColor: 'text-stone-900'
  },
  '지리': {
    icon: '🗺️',
    color: 'bg-lime-50',
    borderColor: 'border-lime-200',
    textColor: 'text-lime-900'
  },
  '윤리': {
    icon: '⚖️',
    color: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-900'
  },
  '기술가정': {
    icon: '🔧',
    color: 'bg-zinc-50',
    borderColor: 'border-zinc-200',
    textColor: 'text-zinc-900'
  },
  '정보': {
    icon: '💻',
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  }
};

/**
 * Activity type configuration mapping
 * Maps creative activity types to their visual properties
 */
export const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
  '자율활동': {
    icon: '🎯',
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900'
  },
  '동아리활동': {
    icon: '🎨',
    color: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900'
  },
  '봉사활동': {
    icon: '❤️',
    color: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900'
  },
  '진로활동': {
    icon: '🚀',
    color: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-900'
  }
};

/**
 * Default configuration for unknown subjects
 */
export const DEFAULT_SUBJECT_CONFIG: SubjectConfig = {
  icon: '📖',
  color: 'bg-gray-50',
  borderColor: 'border-gray-200',
  textColor: 'text-gray-900'
};

/**
 * Default configuration for unknown activity types
 */
export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  icon: '📋',
  color: 'bg-gray-100',
  borderColor: 'border-gray-300',
  textColor: 'text-gray-900'
};

/**
 * Get subject configuration by name
 */
export function getSubjectConfig(subjectName: string): SubjectConfig {
  // Try exact match first
  if (SUBJECT_CONFIG[subjectName]) {
    return SUBJECT_CONFIG[subjectName];
  }

  // Try partial match (for subjects like "전공 기초 스페인어")
  for (const [key, config] of Object.entries(SUBJECT_CONFIG)) {
    if (subjectName.includes(key)) {
      return config;
    }
  }

  return DEFAULT_SUBJECT_CONFIG;
}

/**
 * Get activity configuration by type
 */
export function getActivityConfig(activityType: string): ActivityConfig {
  return ACTIVITY_CONFIG[activityType] || DEFAULT_ACTIVITY_CONFIG;
}
