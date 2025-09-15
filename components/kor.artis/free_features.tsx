'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getRandomVocabs, VocabItem } from '../../lib/kor-artis/vocabData';

interface KICEText {
  id: number
  title: string
  category: string
  word_count: number
  content: string
}

interface KICEData {
  metadata: {
    title: string
    description: string
    version: string
    created: string
    total_texts: number
  }
  texts: KICEText[]
}

export default function GilpumKoreanAIFeatures() {
  const { data: session } = useSession();

  // 어휘 챌린지 상태 (kor.artis의 실제 기능)
  const [currentStep, setCurrentStep] = useState(0); // 0: 단어 보기, 1: 퀴즈, 2: 결과
  const [showVocabChallenge, setShowVocabChallenge] = useState(false);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5분
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuizType, setCurrentQuizType] = useState<'basic' | 'blank' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [preGeneratedQuizzes, setPreGeneratedQuizzes] = useState<any[]>([]);
  const [currentQuizData, setCurrentQuizData] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [wrongWords, setWrongWords] = useState<VocabItem[]>([]);
  const [learnedWords, setLearnedWords] = useState<VocabItem[]>([]);
  const [srsData, setSrsData] = useState<{[key: string]: {level: number, nextReview: Date}}>({});

  // 문맥 챌린지 상태 (kor.artis의 실제 기능)
  const [kiceData, setKiceData] = useState<KICEData | null>(null);
  const [currentText, setCurrentText] = useState<KICEText | null>(null);
  const [userSummary, setUserSummary] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [improvedSummary, setImprovedSummary] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 파생 문제 생성 상태
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuestionAnswer, setShowQuestionAnswer] = useState(false);
  const [questionScore, setQuestionScore] = useState(0);
  const [questionCompleted, setQuestionCompleted] = useState(false);

  // SRS 간격 (일 단위)
  const SRS_INTERVALS = [0, 1, 3, 7]; // D0, D1, D3, D7

  // 컴포넌트 마운트 시 랜덤 어휘 로드
  useEffect(() => {
    const randomVocabs = getRandomVocabs(15);
    setVocabList(randomVocabs);
  }, []);

  // KICE 데이터 로드
  useEffect(() => {
    const loadKICEData = async () => {
      try {
        const response = await fetch('/api/kor-artis/kice-data');
        const data = await response.json();
        setKiceData(data);
        
        // 초기에는 currentText를 설정하지 않음 (사용자가 선택할 때만 설정)
      } catch (error) {
        console.error('KICE 데이터 로드 실패:', error);
      }
    };
    
    loadKICEData();
  }, []);

  // 타이머
  useEffect(() => {
    if (isQuizActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isQuizActive) {
      setIsQuizActive(false);
      setQuizCompleted(true);
    }
  }, [isQuizActive, timeLeft]);

  // SRS 레벨 업데이트
  const updateSRSLevel = (word: string, isCorrect: boolean) => {
    setSrsData(prev => {
      const current = prev[word] || { level: 0, nextReview: new Date() };
      
      if (isCorrect) {
        // 정답이면 레벨 업
        const newLevel = Math.min(current.level + 1, SRS_INTERVALS.length - 1);
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[newLevel]);
        
        return {
          ...prev,
          [word]: { level: newLevel, nextReview }
        };
      } else {
        // 틀리면 레벨 다운 (최소 0)
        const newLevel = Math.max(current.level - 1, 0);
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[newLevel]);
        
        return {
          ...prev,
          [word]: { level: newLevel, nextReview }
        };
      }
    });
  };

  // 퀴즈 타입 랜덤 선택 (기본 50%, 빈칸 50%)
  const getRandomQuizType = (): 'basic' | 'blank' => {
    return Math.random() < 0.5 ? 'basic' : 'blank';
  };

  // 4지선다형 옵션 생성 (정답 위치 랜덤)
  const generateOptions = (correctWord: string, allWords: VocabItem[]) => {
    const correctAnswer = correctWord;
    const wrongAnswers = allWords
      .filter(word => word.word !== correctAnswer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(word => word.word);
    
    const allOptions = [correctAnswer, ...wrongAnswers];
    const shuffled = allOptions.sort(() => 0.5 - Math.random());
    
    return {
      options: shuffled,
      correctIndex: shuffled.indexOf(correctAnswer)
    };
  };

  // 모든 퀴즈 미리 생성
  const generateAllQuizzes = async () => {
    const quizzes = [];
    const usedWords = new Set();
    
    for (let i = 0; i < 15; i++) {
      // 중복되지 않은 단어 선택
      let word;
      let attempts = 0;
      do {
        word = vocabList[Math.floor(Math.random() * vocabList.length)];
        attempts++;
      } while (usedWords.has(word.word) && attempts < 50);
      
      if (attempts >= 50) {
        usedWords.clear();
        word = vocabList[Math.floor(Math.random() * vocabList.length)];
      }
      
      usedWords.add(word.word);
      const quizType = getRandomQuizType();
      
      // 진행률 업데이트
      setGenerationProgress(Math.round(((i + 1) / 15) * 100));
      
      let quizData: any = {
        type: quizType,
        word: word,
        correctAnswer: word.word,
        correctIndex: 0,
        options: [] as string[],
        sentence: ''
      };
      
      if (quizType === 'basic') {
        // 기본 퀴즈: 의미 → 단어
        const optionData = generateOptions(word.word, vocabList);
        quizData.options = optionData.options;
        quizData.correctIndex = optionData.correctIndex;
      } else if (quizType === 'blank') {
        // 빈칸 퀴즈: AI로 문장 생성
        // 오답 3개 생성
        const wrongAnswers = vocabList
          .filter(w => w.word !== word.word)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(w => w.word);
        
        try {
          const response = await fetch('/api/kor-artis/ai-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generateBlank',
              word: word.word,
              meaning: word.meaning,
              example: word.example,
              wrongOptions: wrongAnswers
            })
          });
          
          const result = await response.json();
          if (result.success) {
            const data = JSON.parse(result.data);
            quizData.sentence = data.sentence;
            
            // 선택지 구성 (정답 + 오답)
            const allOptions = [word.word, ...wrongAnswers];
            const shuffled = allOptions.sort(() => 0.5 - Math.random());
            quizData.options = shuffled;
            quizData.correctIndex = shuffled.indexOf(word.word);
          }
        } catch (error) {
          console.error('빈칸 퀴즈 생성 실패:', error);
          // API 실패 시 기본 선택지 생성
          const allOptions = [word.word, ...wrongAnswers];
          const shuffled = allOptions.sort(() => 0.5 - Math.random());
          quizData.options = shuffled;
          quizData.correctIndex = shuffled.indexOf(word.word);
          quizData.sentence = `이 문장에서 [빈칸]에 들어갈 단어를 선택하세요: "${word.meaning}"의 의미를 가진 단어는?`;
        }
      }
      
      quizzes.push(quizData);
    }
    
    return quizzes;
  };

  // 퀴즈 시작
  const startQuiz = async () => {
    setIsLoading(true);
    setCurrentStep(1);
    
    try {
      // 모든 퀴즈 미리 생성
      const quizzes = await generateAllQuizzes();
      setPreGeneratedQuizzes(quizzes);
      
      // 첫 번째 퀴즈 설정
      setCurrentQuizData(quizzes[0]);
      setCurrentQuizType(quizzes[0].type);
      setCurrentWordIndex(0);
      setShowAnswer(false);
      setSelectedOption(null);
      setScore(0);
      setQuizCompleted(false);
      setIsCorrect(null);
      setWrongWords([]);
      setLearnedWords([]);
      
      setIsQuizActive(true);
      setTimeLeft(300);
    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 답안 확인
  const checkAnswer = () => {
    if (!showAnswer) {
      if (!selectedOption) {
        alert('답을 선택해주세요!');
        return;
      }
      
      const currentQuiz = preGeneratedQuizzes[currentWordIndex];
      if (currentQuiz) {
        const selectedIndex = currentQuiz.options.indexOf(selectedOption);
        const correct = selectedIndex === currentQuiz.correctIndex;
        
        setIsCorrect(correct);
        setShowAnswer(true);
        
        if (correct) {
          setScore(score + 1);
          setLearnedWords(prev => [...prev, currentQuiz.word]);
        } else {
          setWrongWords(prev => [...prev, currentQuiz.word]);
        }
        
        // SRS 레벨 업데이트
        updateSRSLevel(currentQuiz.word.word, correct);
      }
      return;
    }

    // 다음 문제로
    if (currentWordIndex < preGeneratedQuizzes.length - 1) {
      const nextIndex = currentWordIndex + 1;
      const nextQuiz = preGeneratedQuizzes[nextIndex];
      
      setCurrentWordIndex(nextIndex);
      setCurrentQuizData(nextQuiz);
      setCurrentQuizType(nextQuiz.type);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // 퀴즈 완료
      setIsQuizActive(false);
      setQuizCompleted(true);
    }
  };

  // 문맥 챌린지 시작
  const startContextChallenge = () => {
    // KICE 데이터가 로드되지 않았다면 로드
    if (!kiceData) {
      const loadKICEData = async () => {
        try {
          const response = await fetch('/api/kor-artis/kice-data');
          const data = await response.json();
          setKiceData(data);
          
          // 랜덤 텍스트 선택
          if (data.texts && data.texts.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.texts.length);
            setCurrentText(data.texts[randomIndex]);
          }
        } catch (error) {
          console.error('KICE 데이터 로드 실패:', error);
        }
      };
      
      loadKICEData();
    } else {
      // 이미 로드된 경우 랜덤 텍스트 선택
      const randomIndex = Math.floor(Math.random() * kiceData.texts.length);
      setCurrentText(kiceData.texts[randomIndex]);
    }
    
    setUserSummary('');
    setAiFeedback('');
    setImprovedSummary('');
    setShowResults(false);
    setShowQuestions(false);
    setGeneratedQuestions([]);
  };

  // 요약 평가 및 피드백 생성
  const evaluateSummary = async () => {
    if (!userSummary.trim() || !currentText) return;
    
    setIsEvaluating(true);
    
    try {
      const response = await fetch('/api/kor-artis/context-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: currentText.content,
          userSummary: userSummary,
          title: currentText.title,
          category: currentText.category
        })
      });
      
      const result = await response.json();
      if (result.success) {
        const data = JSON.parse(result.data);
        setAiFeedback(data.feedback);
        setImprovedSummary(data.improvedSummary);
        setShowResults(true);
      }
    } catch (error) {
      console.error('요약 평가 실패:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 새로운 텍스트로 다시 시작
  const startNewChallenge = () => {
    if (!kiceData) return;
    
    const randomIndex = Math.floor(Math.random() * kiceData.texts.length);
    setCurrentText(kiceData.texts[randomIndex]);
    setUserSummary('');
    setAiFeedback('');
    setImprovedSummary('');
    setShowResults(false);
    setShowQuestions(false);
    setGeneratedQuestions([]);
  };

  // 파생 문제 생성
  const generateQuestions = async () => {
    if (!currentText) return;
    
    setIsGeneratingQuestions(true);
    
    try {
      const response = await fetch('/api/kor-artis/question-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: currentText.content,
          title: currentText.title,
          category: currentText.category
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setGeneratedQuestions(result.data.questions);
        setShowQuestions(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowQuestionAnswer(false);
        setQuestionScore(0);
        setQuestionCompleted(false);
      }
    } catch (error) {
      console.error('파생 문제 생성 실패:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 파생 문제 답안 확인
  const checkQuestionAnswer = () => {
    if (!showQuestionAnswer) {
      if (selectedAnswer === null) {
        alert('답을 선택해주세요!');
        return;
      }
      
      const currentQuestion = generatedQuestions[currentQuestionIndex];
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        setQuestionScore(questionScore + 1);
      }
      
      setShowQuestionAnswer(true);
      return;
    }

    // 다음 문제로
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowQuestionAnswer(false);
    } else {
      // 모든 문제 완료
      setQuestionCompleted(true);
    }
  };

  // 메인 화면으로 돌아가기
  const backToMain = () => {
    setShowVocabChallenge(false);
    setCurrentStep(0);
    setCurrentText(null);
    setUserSummary('');
    setAiFeedback('');
    setImprovedSummary('');
    setShowResults(false);
    setShowQuestions(false);
    setGeneratedQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowQuestionAnswer(false);
    setQuestionScore(0);
    setQuestionCompleted(false);
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  // 어휘 챌린지가 활성화된 경우
  if (showVocabChallenge) {
    return (
      <div className="space-y-6">
        {/* 어휘 챌린지 헤더 */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-200 dark:border-blue-500/30">
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📝 수능 어휘 마스터 챌린지</h2>
            <p className="text-blue-600 dark:text-blue-100">KICE 필수 어휘 150개 중 랜덤 15개</p>
          </div>
        </Card>

        {/* 단계 0: 단어 미리보기 */}
        {currentStep === 0 && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">🎯 오늘의 어휘 15개</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {vocabList.map((word, index) => (
                  <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{word.word}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{word.meaning}</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">{word.level}</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 text-xs rounded-full">{word.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button 
                  onClick={startQuiz}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  🚀 퀴즈 시작
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 로딩 화면 */}
        {isLoading && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">퀴즈를 생성하고 있습니다...</h2>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{generationProgress}%</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">잠시만 기다려주세요!</p>
            </div>
          </Card>
        )}

        {/* 단계 1: 퀴즈 */}
        {currentStep === 1 && !isLoading && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* 기본 퀴즈 (의미 → 단어) */}
              {currentQuizType === 'basic' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-gray-900 dark:text-white">
                      <span>문제 {currentWordIndex + 1}/15 ({Math.round(((currentWordIndex + 1) / 15) * 100)}%)</span>
                      <span className="ml-4">점수: {score}</span>
                    </div>
                    <div className="text-yellow-600 dark:text-yellow-400 font-mono">
                      ⏰ {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentQuizData?.word.meaning}</h3>
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-600 dark:text-blue-300 text-sm rounded-full">{currentQuizData?.word.level}</span>
                    </div>
                    
                    <div className="max-w-2xl mx-auto">
                      {!showAnswer ? (
                        <div className="space-y-4">
                          <h4 className="text-lg text-gray-600 dark:text-gray-300 mb-4">이 뜻에 해당하는 단어를 선택하세요:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentQuizData?.options.map((option: string, index: number) => (
                              <button
                                key={index}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  selectedOption === option 
                                    ? 'border-blue-500 bg-blue-500/20 text-gray-900 dark:text-white' 
                                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                onClick={() => setSelectedOption(option)}
                              >
                                {String.fromCharCode(65 + index)}. {option}
                              </button>
                            ))}
                          </div>
                          <Button 
                            onClick={checkAnswer}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            확인
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' : 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                            </div>
                            <p className="text-gray-900 dark:text-white font-semibold text-center">
                              {isCorrect ? '정답입니다!' : '틀렸습니다!'}
                            </p>
                          </div>
                          
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-gray-900 dark:text-white font-semibold text-center">
                              정답: {currentQuizData?.word.word}
                            </p>
                          </div>
                          
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">📝 예문</h4>
                            <p className="text-gray-600 dark:text-gray-300">"{currentQuizData?.word.example}"</p>
                          </div>
                          
                          <Button 
                            onClick={checkAnswer}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {currentWordIndex < 14 ? '다음 문제' : '퀴즈 완료'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 빈칸 채우기 퀴즈 */}
              {currentQuizType === 'blank' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-gray-900 dark:text-white">
                      <span>문제 {currentWordIndex + 1}/15 ({Math.round(((currentWordIndex + 1) / 15) * 100)}%)</span>
                      <span className="ml-4">점수: {score}</span>
                    </div>
                    <div className="text-yellow-600 dark:text-yellow-400 font-mono">
                      ⏰ {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 빈칸에 들어갈 단어를 선택하세요</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{currentQuizData?.sentence}</p>
                    
                    <div className="max-w-2xl mx-auto">
                      {!showAnswer ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentQuizData?.options.map((option: string, index: number) => (
                              <button
                                key={index}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  selectedOption === option 
                                    ? 'border-orange-500 bg-orange-500/20 text-gray-900 dark:text-white' 
                                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                onClick={() => setSelectedOption(option)}
                              >
                                {String.fromCharCode(65 + index)}. {option}
                              </button>
                            ))}
                          </div>
                          <Button 
                            onClick={checkAnswer}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            확인
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' : 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500'}`}>
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                            </div>
                            <p className="text-gray-900 dark:text-white font-semibold text-center">
                              {isCorrect ? '정답입니다!' : '틀렸습니다!'}
                            </p>
                          </div>
                          
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-gray-900 dark:text-white font-semibold text-center">
                              정답: {currentQuizData?.options[currentQuizData?.correctIndex]}
                            </p>
                          </div>
                          
                          <Button 
                            onClick={checkAnswer}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {currentWordIndex < 14 ? '다음 문제' : '퀴즈 완료'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 퀴즈 완료 화면 */}
        {quizCompleted && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎉 퀴즈 완료!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">수고하셨습니다!</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{score}</div>
                  <div className="text-gray-600 dark:text-gray-300">정답</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{15 - score}</div>
                  <div className="text-gray-600 dark:text-gray-300">오답</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round((score / 15) * 100)}%</div>
                  <div className="text-gray-600 dark:text-gray-300">정답률</div>
                </div>
              </div>

              {/* 틀린 단어들 */}
              {wrongWords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">❌ 틀린 단어들 ({wrongWords.length}개)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wrongWords.map((word, index) => (
                      <div key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-left">
                        <h5 className="text-gray-900 dark:text-white font-semibold">{word.word}</h5>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{word.meaning}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">"{word.example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-x-4">
                <Button 
                  onClick={() => {
                    setQuizCompleted(false);
                    setCurrentStep(0);
                    const newVocabs = getRandomVocabs(15);
                    setVocabList(newVocabs);
                    setCurrentWordIndex(0);
                    setScore(0);
                    setSelectedOption(null);
                    setIsCorrect(null);
                    setWrongWords([]);
                    setLearnedWords([]);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  다시 도전하기
                </Button>
                <Button 
                  onClick={backToMain}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  그만하기
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 파생 문제 화면
  if (showQuestions && generatedQuestions.length > 0) {
    const currentQuestion = generatedQuestions[currentQuestionIndex];
    
    return (
      <div className="space-y-6">
        {/* 파생 문제 헤더 */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/50 dark:to-blue-900/50 border-purple-200 dark:border-purple-500/30">
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎯 파생 문제 생성</h2>
            <p className="text-purple-600 dark:text-purple-100">지문을 바탕으로 한 수능 스타일 문제 3개</p>
          </div>
        </Card>

        {/* 지문 표시 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{currentText?.title}</h3>
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-purple-600/20 text-purple-600 dark:text-purple-300 rounded-full">{currentText?.category}</span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-600 dark:text-blue-300 rounded-full">{currentText?.word_count}자</span>
              </div>
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentText?.content}
            </div>
          </div>
        </Card>

        {/* 문제 진행 중 */}
        {!questionCompleted && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-gray-900 dark:text-white">
                  <span>문제 {currentQuestionIndex + 1}/3</span>
                  <span className="ml-4">점수: {questionScore}</span>
                </div>
                <div className="text-purple-600 dark:text-purple-400">
                  {currentQuestion.type === 'theme' && '주제 파악'}
                  {currentQuestion.type === 'appreciation' && '지문 감상'}
                  {currentQuestion.type === 'example' && '사례 매칭'}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedAnswer === index 
                          ? 'border-purple-500 bg-purple-500/20 text-gray-900 dark:text-white' 
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedAnswer(index)}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={checkQuestionAnswer}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {!showQuestionAnswer ? '확인' : (currentQuestionIndex < 2 ? '다음 문제' : '완료')}
                </Button>

                {showQuestionAnswer && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      selectedAnswer === currentQuestion.correctAnswer 
                        ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' 
                        : 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500'
                    }`}>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-2xl">
                          {selectedAnswer === currentQuestion.correctAnswer ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-semibold text-center">
                        {selectedAnswer === currentQuestion.correctAnswer ? '정답입니다!' : '틀렸습니다!'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <h4 className="text-gray-900 dark:text-white font-semibold mb-2">정답: {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* 문제 완료 화면 */}
        {questionCompleted && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎉 파생 문제 완료!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">수고하셨습니다!</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{questionScore}</div>
                  <div className="text-gray-600 dark:text-gray-300">정답</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{3 - questionScore}</div>
                  <div className="text-gray-600 dark:text-gray-300">오답</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{Math.round((questionScore / 3) * 100)}%</div>
                  <div className="text-gray-600 dark:text-gray-300">정답률</div>
                </div>
              </div>

              <div className="space-x-4">
                <Button 
                  onClick={() => {
                    setShowQuestions(false);
                    setGeneratedQuestions([]);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer(null);
                    setShowQuestionAnswer(false);
                    setQuestionScore(0);
                    setQuestionCompleted(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  다시 도전하기
                </Button>
                <Button 
                  onClick={backToMain}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  그만하기
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 문맥 챌린지가 활성화된 경우
  if (currentText) {
    return (
      <div className="space-y-6">
        {/* 문맥 챌린지 헤더 */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/50 dark:to-red-900/50 border-orange-200 dark:border-orange-500/30">
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">① '문맥 파악' 스킬업</h2>
            <p className="text-orange-600 dark:text-orange-100">▼ 문해력 향상 챌린지</p>
          </div>
        </Card>

        {/* 지문 표시 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{currentText.title}</h2>
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-orange-600/20 text-orange-600 dark:text-orange-300 rounded-full">{currentText.category}</span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-600 dark:text-blue-300 rounded-full">{currentText.word_count}자</span>
              </div>
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentText.content}
            </div>
          </div>
        </Card>

        {/* 사용자 요약 입력 */}
        {!showResults && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 지문을 한 문장으로 요약해보세요</h3>
              <div className="space-y-4">
                <textarea
                  value={userSummary}
                  onChange={(e) => setUserSummary(e.target.value)}
                  placeholder="지문의 핵심 내용을 한 문장으로 요약해주세요..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:outline-none"
                  rows={4}
                />
                <div className="flex space-x-4">
                  <Button 
                    onClick={evaluateSummary}
                    disabled={!userSummary.trim() || isEvaluating}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                  >
                    {isEvaluating ? 'AI가 평가 중...' : '요약 평가하기'}
                  </Button>
                  <Button 
                    onClick={backToMain}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6"
                  >
                    그만하기
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 결과 표시 */}
        {showResults && (
          <div className="space-y-6">
            {/* 사용자 요약 */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📝 당신의 요약</h4>
                <p className="text-gray-700 dark:text-gray-300">{userSummary}</p>
              </div>
            </Card>

            {/* AI 피드백 */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🤖 AI 피드백</h4>
                <p className="text-gray-700 dark:text-gray-300">{aiFeedback}</p>
              </div>
            </Card>

            {/* 개선된 요약 */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">✨ 보완한 요약문 제안</h4>
                <p className="text-gray-700 dark:text-gray-300">{improvedSummary}</p>
              </div>
            </Card>

            {/* 설명 */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💡 개선 포인트</h4>
                <p className="text-gray-700 dark:text-gray-300">이렇게 하면 단순히 핵심 내용만 나열하지 않고, 지문이 강조하는 갈등 구조와 가치 논의까지 담을 수 있어요.</p>
              </div>
            </Card>

            {/* 새로운 챌린지 버튼 */}
            <div className="text-center space-x-4">
              <Button 
                onClick={generateQuestions}
                disabled={isGeneratingQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 disabled:opacity-50"
              >
                {isGeneratingQuestions ? '문제 생성 중...' : '🎯 이 지문으로 파생 문제 생성하기'}
              </Button>
              <Button 
                onClick={startNewChallenge}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                🚀 새로운 지문으로 도전하기
              </Button>
              <Button 
                onClick={backToMain}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
              >
                그만하기
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-4">
          <span className="text-6xl">🔒</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            로그인이 필요합니다
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            길품국어의 무료 AI 학습 도구를 이용하려면 먼저 로그인해주세요.
          </p>
          <Button 
            onClick={() => signIn()}
            variant="primary"
            size="lg"
          >
            로그인하기
          </Button>
        </div>
      </Card>
    );
  }

  // 메인 화면
  return (
    <div className="space-y-6">
      {/* 길품국어 AI 학습 도구 헤더 */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/50 dark:to-orange-900/50 border-red-200 dark:border-red-500/30">
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">길품국어 AI 학습 도구</h2>
          <p className="text-gray-700 dark:text-red-100 max-w-2xl mx-auto mb-4">
            고려대 국어국문학과 길품국어쌤과<br />
            <span className="font-semibold text-yellow-600 dark:text-yellow-300">수능국어 능력치 UP!</span>
          </p>
          <p className="text-gray-600 dark:text-red-200 text-sm mb-6">
            • 길품쌤과 수능업!, 국어 파헤치고 등급업!
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="success" size="sm" className="bg-green-100 dark:bg-green-600 text-green-800 dark:text-white border border-green-200 dark:border-green-500">무료 제공</Badge>
            <Badge variant="primary" size="sm" className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white border border-blue-200 dark:border-blue-500">AI 자동 생성</Badge>
            <Badge variant="warning" size="sm" className="bg-yellow-100 dark:bg-yellow-600 text-yellow-800 dark:text-white border border-yellow-200 dark:border-yellow-500">고려대 전문</Badge>
          </div>
        </div>
      </Card>

      {/* 두 개 카드를 한 줄에 나란히 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 어휘 암기 챌린지 카드 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">어휘 암기 챌린지</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                수능 필수 어휘를 퀴즈로 재미있게 학습해보세요
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">빈칸 채우기</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 text-xs rounded-full">뜻 맞추기</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-300 text-xs rounded-full">문맥 이해</span>
            </div>
            <Button 
              onClick={() => {
                setShowVocabChallenge(true);
                setCurrentStep(0);
                // 어휘 챌린지 상태 초기화
                setCurrentWordIndex(0);
                setShowAnswer(false);
                setSelectedOption(null);
                setScore(0);
                setIsQuizActive(false);
                setQuizCompleted(false);
                setCurrentQuizType(null);
                setIsLoading(false);
                setIsCorrect(null);
                setPreGeneratedQuizzes([]);
                setCurrentQuizData(null);
                setGenerationProgress(0);
                setWrongWords([]);
                setLearnedWords([]);
                setSrsData({});
                // 랜덤 어휘 다시 로드
                const randomVocabs = getRandomVocabs(15);
                setVocabList(randomVocabs);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="mr-2">📚</span>
              어휘 챌린지 시작하기
            </Button>
          </div>
        </Card>

        {/* 문맥 파악 스킬업 카드 */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">문맥 파악 스킬업</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                문해력 향상을 위한 체계적인 훈련 프로그램
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-600/20 text-orange-700 dark:text-orange-300 text-xs rounded-full">문단 분석</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-300 text-xs rounded-full">논리 구조</span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">핵심 파악</span>
            </div>
            <Button 
              onClick={startContextChallenge}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <span className="mr-2">🎯</span>
              문맥 파악 챌린지 시작하기
            </Button>
          </div>
        </Card>
      </div>

      {/* 추가 정보 카드 */}
      <Card className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎓 길품국어쌤의 특별한 AI 학습 시스템</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-400">✓</span>
              <span>고려대 국어국문학과 전문 지식</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-blue-400">✓</span>
              <span>수능 출제 경향 완벽 분석</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✓</span>
              <span>개인별 맞춤 학습 경로</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
