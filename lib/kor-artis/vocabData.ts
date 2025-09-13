import vocabData from '../../database/vocab.json'

export interface VocabItem {
  id: number
  word: string
  pronunciation: string
  category: string
  level: string
  meaning: string
  synonyms: string[]
  example: string
  frequency: string
}

export interface VocabDatabase {
  metadata: {
    title: string
    description: string
    version: string
    created: string
    total_vocab: number
    categories: number
  }
  vocabulary: VocabItem[]
}

// JSON 데이터를 타입에 맞게 변환
const database = vocabData as VocabDatabase

// 랜덤하게 어휘를 가져오는 함수
export function getRandomVocabs(count: number = 10): VocabItem[] {
  const shuffled = [...database.vocabulary].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 특정 레벨의 어휘만 가져오는 함수
export function getVocabsByLevel(level: string, count: number = 10): VocabItem[] {
  const filtered = database.vocabulary.filter(vocab => vocab.level === level)
  const shuffled = [...filtered].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 모든 어휘 가져오기
export function getAllVocabs(): VocabItem[] {
  return database.vocabulary
}

// 특정 카테고리의 어휘 가져오기
export function getVocabsByCategory(category: string, count: number = 10): VocabItem[] {
  const filtered = database.vocabulary.filter(vocab => vocab.category === category)
  const shuffled = [...filtered].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// ID로 특정 어휘 가져오기
export function getVocabById(id: number): VocabItem | undefined {
  return database.vocabulary.find(vocab => vocab.id === id)
}
