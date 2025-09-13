import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

interface ProcessingStatus {
  stage: 'uploading' | 'parsing' | 'extracting' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface QuizData {
  originalText: string;
  sentences: string[];
  fillInBlankQuiz: Array<{
    sentence: string;
    blanks: string[];
    options: string[][];
    correct: number[];
  }>;
  wordOrderQuiz: Array<{
    originalSentence: string;
    scrambledWords: string[];
    correctOrder: number[];
  }>;
  vocabularyQuiz: Array<{
    word: string;
    meaning: string;
    context: string;
    options: string[];
    correct: number;
  }>;
}

interface LLMQuizResponse {
  fillInBlankQuiz: Array<{
    sentence: string;
    blankWords: string[];
    options: string[][];
  }>;
  importantSentences: string[];
  vocabularyWords: Array<{
    word: string;
    meaning: string;
    context: string;
    distractors: string[];
  }>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SESSION_PREFIX = 'terry:session:';
const PROCESSING_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export async function POST(request: NextRequest) {
  const sessionId = uuidv4();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    // Initialize processing status
    const redis = await getRedisClient();
    const initialStatus: ProcessingStatus = {
      stage: 'uploading',
      progress: 10,
      message: '파일 업로드 중...'
    };

    await redis.setEx(`${SESSION_PREFIX}${sessionId}:status`, PROCESSING_TIMEOUT / 1000, JSON.stringify(initialStatus));

    // Process PDF in background
    processEnglishPDF(file, sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      status: initialStatus
    });

  } catch (error) {
    console.error('Terry PDF processing error:', error);
    return NextResponse.json({
      error: 'PDF 처리 중 오류가 발생했습니다.',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    // Get current status
    const statusStr = await redis.get(`${SESSION_PREFIX}${sessionId}:status`);
    if (!statusStr) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const status = JSON.parse(statusStr) as ProcessingStatus;

    // If completed, also return the quiz data
    if (status.stage === 'completed') {
      const quizDataStr = await redis.get(`${SESSION_PREFIX}${sessionId}:quiz`);
      if (quizDataStr) {
        const quizData = JSON.parse(quizDataStr) as QuizData;
        return NextResponse.json({
          success: true,
          status,
          quizData
        });
      }
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Terry status check error:', error);
    return NextResponse.json({
      error: '상태 확인 중 오류가 발생했습니다.',
      success: false
    }, { status: 500 });
  }
}

async function processEnglishPDF(file: File, sessionId: string) {
  const redis = await getRedisClient();

  try {
    // Update status: parsing
    await updateStatus(redis, sessionId, {
      stage: 'parsing',
      progress: 30,
      message: 'PDF에서 영어 텍스트 추출 중...'
    });

    // Extract text from PDF using pdfjs-dist
    const arrayBuffer = await file.arrayBuffer();
    const extractedText = await extractTextFromPDFBuffer(arrayBuffer);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('PDF에서 충분한 텍스트를 추출할 수 없습니다. 텍스트가 포함된 PDF인지 확인해주세요.');
    }

    // Update status: extracting
    await updateStatus(redis, sessionId, {
      stage: 'extracting',
      progress: 50,
      message: '영어 문장 분석 중...'
    });

    // Process English text
    const sentences = extractEnglishSentences(extractedText);

    if (sentences.length === 0) {
      throw new Error('PDF에서 영어 문장을 찾을 수 없습니다. 영어 텍스트가 포함된 PDF를 업로드해주세요.');
    }

    // Update status: generating
    await updateStatus(redis, sessionId, {
      stage: 'generating',
      progress: 70,
      message: 'AI가 퀴즈 문제 생성 중... (이 과정은 1-2분 소요됩니다)'
    });

    // Generate quizzes using OpenAI
    const quizData = await generateQuizzesWithAI(sentences, extractedText);

    // Save quiz data
    await redis.setEx(`${SESSION_PREFIX}${sessionId}:quiz`, PROCESSING_TIMEOUT / 1000, JSON.stringify(quizData));

    // Update status: completed
    await updateStatus(redis, sessionId, {
      stage: 'completed',
      progress: 100,
      message: '퀴즈 생성 완료!'
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    await updateStatus(redis, sessionId, {
      stage: 'error',
      progress: 0,
      message: 'PDF 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await redis.quit();
  }
}

async function updateStatus(redis: any, sessionId: string, status: ProcessingStatus) {
  await redis.setEx(`${SESSION_PREFIX}${sessionId}:status`, PROCESSING_TIMEOUT / 1000, JSON.stringify(status));
}

async function extractTextFromPDFBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  // Try multiple parsing methods for best results
  const methods = [
    () => extractWithLlamaParseEnhanced(arrayBuffer),
    () => extractWithLlamaParseBasic(arrayBuffer),
    () => extractWithPdfParse(arrayBuffer)
  ];

  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`Trying PDF extraction method ${i + 1}/${methods.length}...`);
      const result = await methods[i]();
      
      if (result && result.trim().length >= 50) {
        console.log(`Success with method ${i + 1}: extracted ${result.length} characters`);
        return result.trim();
      } else {
        console.log(`Method ${i + 1} returned insufficient text (${result?.length || 0} chars)`);
      }
    } catch (error) {
      console.error(`Method ${i + 1} failed:`, error);
      if (i === methods.length - 1) {
        // Last method failed, throw error
        throw new Error(`모든 PDF 파싱 방법이 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  throw new Error('PDF 텍스트 추출에 실패했습니다.');
}

async function extractWithLlamaParseEnhanced(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Using LlamaParse API (Enhanced) for PDF text extraction...');
  
  const formData = new FormData();
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'document.pdf');
  
  // Enhanced parsing settings for better accuracy
  formData.append('parse_mode', 'parse_page_without_llm');
  formData.append('high_res_ocr', 'true');
  formData.append('outlined_table_extraction', 'false');
  formData.append('output_tables_as_HTML', 'false');
  formData.append('extract_images', 'false');
  formData.append('merge_across_pages', 'true');
  formData.append('use_textract_ocr', 'true');
  
  return await processLlamaParse(formData);
}

async function extractWithLlamaParseBasic(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Using LlamaParse API (Basic) for PDF text extraction...');
  
  const formData = new FormData();
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'document.pdf');
  
  // Basic parsing settings
  formData.append('parse_mode', 'parse_page_without_llm');
  formData.append('high_res_ocr', 'false');
  
  return await processLlamaParse(formData);
}

async function extractWithPdfParse(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Using pdf-parse library as fallback...');
  
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    
    console.log(`pdf-parse extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text;
  } catch (error) {
    console.error('pdf-parse failed:', error);
    throw error;
  }
}

async function processLlamaParse(formData: FormData): Promise<string> {
  // Upload file to LlamaParse
  const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`LlamaParse upload error: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  const jobId = uploadResult.id;

  console.log(`PDF uploaded, job ID: ${jobId}, waiting for processing...`);

  // Poll for completion with shorter timeout
  let result;
  let attempts = 0;
  const maxAttempts = 15; // Reduced to 2.5 minutes
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`LlamaParse status check error: ${statusResponse.status} ${statusResponse.statusText}`);
    }

    result = await statusResponse.json();
    console.log(`Job status: ${result.status}, attempt ${attempts + 1}/${maxAttempts}`);

    if (result.status === 'SUCCESS') {
      break;
    } else if (result.status === 'ERROR') {
      throw new Error(`LlamaParse processing failed: ${result.error || 'Unknown error'}`);
    }
    
    attempts++;
  }

  if (!result || result.status !== 'SUCCESS') {
    throw new Error('LlamaParse processing timed out or failed');
  }

  // Get the parsed content
  const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/text`, {
    headers: {
      'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
    }
  });

  if (!resultResponse.ok) {
    throw new Error(`LlamaParse result fetch error: ${resultResponse.status} ${resultResponse.statusText}`);
  }

  const extractedText = await resultResponse.text();
  return extractedText;
}


function extractEnglishSentences(text: string): string[] {
  // Clean and split text into sentences
  const sentences = text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      // Filter for English sentences
      return s.length > 20 && 
             s.length < 200 && 
             /^[A-Za-z\s,'-]+$/.test(s) && 
             s.split(' ').length >= 5 &&
             s.split(' ').length <= 25;
    })
    .slice(0, 15); // Limit to 15 sentences for processing
    
  return sentences;
}

async function generateQuizzesWithAI(sentences: string[], fullText: string): Promise<QuizData> {
  try {
    // Prepare text for AI processing (limit to prevent token overflow)
    const textForAI = sentences.slice(0, 10).join('. ') + '.';
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Terry English, a 25-year English teaching expert from University of Toronto. Your specialty is creating effective English memorization quizzes for Korean middle and high school students.

Create educational quizzes based on the provided English text. Respond ONLY in valid JSON format with the following structure:

{
  "fillInBlankQuiz": [
    {
      "sentence": "The ___ of education cannot be ___ in modern society because it ___ the foundation for personal growth",
      "blankWords": ["importance", "overstated", "provides"],
      "options": [
        ["importance", "value", "meaning", "concept"],
        ["overstated", "ignored", "forgotten", "dismissed"],
        ["provides", "creates", "builds", "establishes"]
      ]
    }
  ],
  "importantSentences": [
    "Education serves as the foundation for personal growth and development"
  ],
  "vocabularyWords": [
    {
      "word": "foundation",
      "meaning": "기초, 토대",
      "context": "Education serves as the foundation for personal growth",
      "distractors": ["기회", "목표", "방법"]
    }
  ]
}

Requirements:
- Create 5 LONG fill-in-blank questions with 2-4 blanks per sentence (15-25 words each)
- Use complex sentences that test deeper comprehension
- Each blank should test different types of words (nouns, verbs, adjectives, adverbs)
- Select 3-4 important sentences for word order exercises
- Choose 5 vocabulary words with Korean meanings
- Generate contextually appropriate distractors
- Focus on educational and meaningful content
- Ensure questions test comprehension, not just memorization
- Make sentences that flow naturally and are educationally valuable`
        },
        {
          role: 'user',
          content: `Create quizzes based on this English text:

${textForAI}

Generate questions that will help Korean students learn English effectively.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    // Parse AI response
    let llmQuiz: LLMQuizResponse;
    try {
      llmQuiz = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('AI JSON parsing error:', parseError);
      console.log('AI Response:', aiResponse);
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    // Validate and process AI response
    if (!llmQuiz.fillInBlankQuiz || !llmQuiz.importantSentences || !llmQuiz.vocabularyWords) {
      throw new Error('AI 응답에 필요한 데이터가 없습니다.');
    }

    // Process fill-in-blank quiz
    const fillInBlankQuiz = llmQuiz.fillInBlankQuiz.map(q => ({
      sentence: q.sentence,
      blanks: q.blankWords,
      options: q.options,
      correct: q.blankWords.map((word, index) => q.options[index].indexOf(word))
    }));

    // Process word order quiz
    const wordOrderQuiz = llmQuiz.importantSentences.slice(0, 4).map(sentence => {
      const words = sentence.split(' ').filter(w => w.length > 0);
      const correctOrder = Array.from({ length: words.length }, (_, i) => i);
      const scrambledWords = [...words].sort(() => Math.random() - 0.5);
      
      return {
        originalSentence: sentence,
        scrambledWords,
        correctOrder
      };
    });

    // Process vocabulary quiz
    const vocabularyQuiz = llmQuiz.vocabularyWords.map(v => {
      const options = [v.meaning, ...v.distractors].sort(() => Math.random() - 0.5);
      return {
        word: v.word,
        meaning: v.meaning,
        context: v.context,
        options,
        correct: options.indexOf(v.meaning)
      };
    });

    return {
      originalText: textForAI,
      sentences,
      fillInBlankQuiz,
      wordOrderQuiz,
      vocabularyQuiz
    };

  } catch (error) {
    console.error('OpenAI quiz generation error:', error);
    
    // Fallback to basic quiz generation if AI fails
    console.log('Falling back to basic quiz generation...');
    return generateBasicQuizzes(sentences);
  }
}

// Fallback function for basic quiz generation
async function generateBasicQuizzes(sentences: string[]): Promise<QuizData> {
  // Simple fallback implementation
  const fillInBlankQuiz = sentences.slice(0, 5).map(sentence => {
    const words = sentence.split(' ');
    // Create 2-3 blanks per sentence
    const numBlanks = Math.min(3, Math.max(2, Math.floor(words.length / 8)));
    const blankIndices: number[] = [];
    
    // Select random positions for blanks
    for (let i = 0; i < numBlanks; i++) {
      let index;
      do {
        index = Math.floor(Math.random() * words.length);
      } while (blankIndices.includes(index) || words[index].length < 3);
      blankIndices.push(index);
    }
    
    blankIndices.sort((a, b) => a - b);
    
    const blankWords = blankIndices.map(i => words[i]);
    const sentenceWithBlanks = words.map((word, i) => 
      blankIndices.includes(i) ? '___' : word
    ).join(' ');
    
    const commonWords = ['important', 'different', 'necessary', 'possible', 'available', 'significant', 'effective', 'successful', 'various', 'essential'];
    
    const options = blankWords.map(word => {
      const wrongOptions = commonWords.filter(w => w !== word.toLowerCase()).slice(0, 3);
      return [word, ...wrongOptions].sort(() => Math.random() - 0.5);
    });
    
    return {
      sentence: sentenceWithBlanks,
      blanks: blankWords,
      options,
      correct: blankWords.map((word, index) => options[index].indexOf(word))
    };
  });

  const wordOrderQuiz = sentences.slice(0, 3).map(sentence => {
    const words = sentence.split(' ').slice(0, 8);
    const correctOrder = Array.from({ length: words.length }, (_, i) => i);
    const scrambledWords = [...words].sort(() => Math.random() - 0.5);
    
    return {
      originalSentence: sentence,
      scrambledWords,
      correctOrder
    };
  });

  const vocabularyQuiz = [
    { word: 'education', meaning: '교육', context: 'Education is important', options: ['교육', '경제', '사회', '기술'], correct: 0 },
    { word: 'important', meaning: '중요한', context: 'This is important', options: ['쉬운', '중요한', '어려운', '재미있는'], correct: 1 },
    { word: 'development', meaning: '발전', context: 'Economic development', options: ['문제', '해결', '발전', '계획'], correct: 2 }
  ];

  return {
    originalText: sentences.join('. ') + '.',
    sentences,
    fillInBlankQuiz,
    wordOrderQuiz,
    vocabularyQuiz
  };
}