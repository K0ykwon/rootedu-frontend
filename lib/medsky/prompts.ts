/**
 * Medsky LLM Prompts
 * 
 * This file contains all the LLM prompts used for data extraction and validation
 * in the medsky system. These prompts are preserved 100% identically from the 
 * original Python implementation to ensure consistent AI behavior.
 */

// ===========================
// Extraction Prompts
// ===========================

/**
 * Prompt for extracting creative activities data from parsed text
 */
export const CREATIVE_ACTIVITIES_PROMPT = `
You are tasked with extracting creative activities data from a Korean student record section.

INPUT: Text from the "창의적 체험활동상황" section containing activity information in table format.

OUTPUT: Return a JSON object matching this exact structure:
\`\`\`json
{
  "창의적체험활동상황": [
    {
      "영역": "string - activity domain (e.g., 자율활동, 동아리활동, 진로활동, 봉사활동)",
      "시간": "integer - hours spent on this activity", 
      "특기사항": "string - detailed description of the activity and achievements"
    }
  ]
}
\`\`\`

EXTRACTION RULES:
1. Look for table structures with columns: 영역, 시간, 특기사항
2. Extract each row as a separate activity entry
3. For 시간: Convert to integer (ignore non-numeric text)
4. For 특기사항: Include the full detailed description, preserving important details
5. Skip header rows and formatting text
6. If 시간 is missing or unclear, use 0
7. Combine multi-line 특기사항 descriptions into single strings

EXAMPLE:
If you see:
\`\`\`
학년 영역 시간 특기사항
1 자율활동 74 학생회에서 매 정기고사 전 운영한 멘토·멘티 활동에 성실히 참여함...
동아리활동 22 (바이온)(22시간) 연합 포스터 제작 활동에서 자료 조사를 맡아...
\`\`\`

Extract as:
\`\`\`json
{
  "창의적체험활동상황": [
    {
      "영역": "자율활동",
      "시간": 74,
      "특기사항": "학생회에서 매 정기고사 전 운영한 멘토·멘티 활동에 성실히 참여함..."
    },
    {
      "영역": "동아리활동", 
      "시간": 22,
      "특기사항": "(바이온)(22시간) 연합 포스터 제작 활동에서 자료 조사를 맡아..."
    }
  ]
}
\`\`\`

Extract all creative activities from the provided text.
`;

/**
 * Prompt for extracting academic development data from parsed text
 */
export const ACADEMIC_DEVELOPMENT_PROMPT = `
You are tasked with extracting academic performance data from a Korean student record section.

INPUT: Text from the "교과학습발달상황" section containing grade tables with academic performance data.

OUTPUT: Return a JSON object matching this exact structure:
\`\`\`json
{
  "교과학습발달상황": [
    {
      "과목": "string - subject name (e.g., 국어, 수학, 영어, 한국사, 통합사회, 통합과학, etc.)",
      "학점수": "integer - credit points for the subject",
      "score_over_average": "string - original score/class average format (e.g., '82/69.2(13.6)')",
      "성취도": "string - achievement level (A, B, C, D, E)",
      "석차등급": "string - rank grade (1-9 or similar)"
    }
  ]
}
\`\`\`

EXTRACTION RULES:
1. Look for grade tables with columns: 교과, 과목, 학점수, 원점수/과목평균, 성취도, 석차등급
2. Extract each subject as a separate entry
3. For 학점수: Convert to integer
4. For score_over_average: Keep exact format with scores, averages, and standard deviations
5. Skip header rows, semester labels, and summary rows
6. If data is missing, use empty string for strings, 0 for integers
7. Handle both semester 1 and semester 2 data

EXAMPLE:
If you see:
\`\`\`
학기 교과 과목 학점수 원점수/과목평균(표준편차) 성취도 석차등급
1 국어 국어 4 82/69.2(13.6) A(326) 3
1 수학 수학 4 74/60.7(20.1) B(326) 4
\`\`\`

Extract as:
\`\`\`json
{
  "교과학습발달상황": [
    {
      "과목": "국어",
      "학점수": 4,
      "score_over_average": "82/69.2(13.6)",
      "성취도": "A",
      "석차등급": "3"
    },
    {
      "과목": "수학", 
      "학점수": 4,
      "score_over_average": "74/60.7(20.1)",
      "성취도": "B",
      "석차등급": "4"
    }
  ]
}
\`\`\`

Extract all academic performance data from the provided text.
`;

/**
 * Prompt for extracting detailed abilities data from parsed text
 */
export const DETAILED_ABILITIES_PROMPT = `
You are tasked with extracting detailed subject abilities from a Korean student record section.

INPUT: Text from the "세부능력 및 특기사항" section containing detailed subject-specific evaluations and achievements.

OUTPUT: Return a JSON object matching this exact structure:
\`\`\`json
{
  "세부특기사항": [
    {
      "과목": "string - subject name (e.g., 국어, 수학, 영어, 한국사, 통합사회, 통합과학, etc.)",
      "특기사항": "string - detailed evaluation and special abilities description for this subject"
    }
  ]
}
\`\`\`

EXTRACTION RULES:
1. Look for subject names followed by colon and detailed descriptions
2. Subject names are typically at the start of paragraphs followed by ":"
3. Extract the full detailed description for each subject
4. Combine multi-line descriptions into single strings
5. Preserve important details about achievements, projects, and evaluations
6. Remove line numbers and formatting artifacts
7. Handle subjects that span multiple pages or have broken formatting

EXAMPLE:
If you see:
\`\`\`
국어: 관심 있는 분야의 책을 읽고 질문하는 창의적 사고 역량을 보여줌. '수의사가 말하는 수의사'를 읽고 안락사에 대한 수의사의 생각이나 직업적 어려움에 대해 궁금한 점을 질문으로 만듦...

수학: 수학교과서 탐구과제에 나와 있는 '겔로시아 곱셈'에 대해 탐구하고 발표함. 겔로시아는 인도의 수학자인 바스카라가 지은 수학책인 '릴라바티'에 주석으로 달려 있으며...
\`\`\`

Extract as:
\`\`\`json
{
  "세부특기사항": [
    {
      "과목": "국어",
      "특기사항": "관심 있는 분야의 책을 읽고 질문하는 창의적 사고 역량을 보여줌. '수의사가 말하는 수의사'를 읽고 안락사에 대한 수의사의 생각이나 직업적 어려움에 대해 궁금한 점을 질문으로 만듦..."
    },
    {
      "과목": "수학",
      "특기사항": "수학교과서 탐구과제에 나와 있는 '겔로시아 곱셈'에 대해 탐구하고 발표함. 겔로시아는 인도의 수학자인 바스카라가 지은 수학책인 '릴라바티'에 주석으로 달려 있으며..."
    }
  ]
}
\`\`\`

Extract all detailed subject abilities from the provided text.
`;

// ===========================
// Validation Prompts
// ===========================

/**
 * Blue Highlight Validation - 진로 역량 강조
 */
export const BLUE_HIGHLIGHT_PROMPT = `
역할: 학생 활동 기록에서 파란색 하이라이트(진로 역량 강조)에 해당하는 문장만 선별하여 JSON으로 반환하는 분석가.

포함 체크리스트(아래 항목 중 최소 1개를 충족해야 하며, 제외 규칙에 걸리면 안 됨):
1) 학생의 명시된 희망 진로 또는 구체 직무/학문 분야와 활동 내용이 직접적으로 연결됨(예: 생명공학 연구, 간호 임상 실습, 기계공학 설계 프로젝트 등).
2) 진로 관련 실험/탐구/프로젝트를 실제로 수행한 증거가 문장 내에 있음(방법·절차·도구·대상 등 일부라도 구체 단서 포함).
3) 진로가 바뀐 계기·이유·과정·결론 중 1개 이상이 명시적 문장으로 드러남(막연한 의지/희망만은 불가).
4) 진로 탐색의 방향성/깊이가 문장 자체에서 드러남(목표, 비교·의견, 전문 자료 활용, 현장 경험 등 근거 포함).

제외 규칙(하나라도 해당하면 제외):
- 단순 관심 표명, 포부, 장래희망 나열(예: "과학자가 되고 싶다"만 언급)으로 구체 연결고리 부재.
- 진로 키워드만 있고 활동 내용·방법·근거가 전혀 없음(예: "의학 관련 활동 참여함").
- 문맥 바깥의 정보 추론이 필요한 경우(다른 문장 근거 없이는 판단 불가).
- 부분 구절/문장 조각, 문장 재작성·요약·의역.
- 동일 의미의 중복 문장(첫 등장만 유지).

판단 절차:
1) 문장 단위로 평가한다. 문장 내부에 진로와의 직접 연결 또는 명시적 근거가 있는지 확인한다.
2) 포함 체크리스트를 만족하는지 확인하고, 제외 규칙 위반 시 제외한다.
3) 경계 사례는 보수적으로 배제한다(불확실하면 포함하지 않는다).
4) 출력에는 체크리스트 만족 문장만을 포함한다. (모든 문장을 출력하는 것이 아닌, 체크리스트 만족 문장만을 출력해야 함.)

부정 예시(선택적으로 참고):
- "생명공학에 관심이 생겼다."(근거·활동·연결 부재)
- "의사가 되고 싶다."(방향성·근거 없음)
- "공학 관련 대회에 참여함."(내용·방법 전무)

선택 수량 제한:
- Feedbacks는 가장 도움이 되는 문장 3-5개만 포함한다.
- 가치 있는 문장이 3개 미만이면 그만큼만 포함한다.
- 유사/중복 의미 문장은 제거한다(다양성·대표성 우선).

출력 지시(엄격):
- 출력은 JSON 1개 객체만, 마크다운/설명/코드블록 없이 순수 JSON으로만 반환할 것.
- 스키마: { "type": "blue_highlight", "Feedbacks": [ { "sentence": string, "feedback": string } ] }
- 일치 문장이 없으면 "Feedbacks": []로 반환(빈 배열 허용).
- sentence는 원문과 문자 하나까지 완전 일치(공백·문장부호 동일). 의역·부분 문자열 금지.
- 같은 문장이 여러 번 조건을 만족해도 1회만 포함(첫 등장 순서 유지).
- feedback은 왜 포함 기준을 충족하는지 근거를 1-2문장으로 간결히 서술(한국어).
- Feedbacks 항목 수는 최대 5개, 최소 0개(권장 3-5개).
`;

/**
 * Red Line Validation - 구체적 노력·깊이 강조
 */
export const RED_LINE_PROMPT = `
역할: 학생 활동 기록에서 빨간색 밑줄(구체적 노력·깊이 강조)에 해당하는 문장만 선별하여 JSON으로 반환하는 분석가.

포함 체크리스트(아래 항목 중 최소 1개를 충족해야 하며, 제외 규칙에 걸리면 안 됨):
A) 학업 역량: 자발적·지속적 노력이 과정 단서와 함께 드러남(예: 반복 학습 계획, 오개념 교정, 풀이 전략 변화, 직접 증명 시도 등).
B) 진로 역량: 무엇을 조사했고 어떤 근거/자료/방법으로 어떤 의견을 제시했는지 문장 내에 명확히 제시.
C) 공동체 역량: 직책·갈등 해결·의견 조율 사례에서 동기→행동→변화/결과→배움의 흐름 중 2개 이상이 한 문장에 구체 단서로 제시.

제외 규칙(하나라도 해당하면 제외):
- 노력·과정 없이 결과만 서술(예: "성적이 올랐다" 단독).
- 추상 표현만 있음(예: "꾸준히 노력함", "분위기 개선에 이바지함").
- 원인·방법·시도·개선 단서 없이 포부·태도만 언급.
- 문맥 외 추론 필요, 문장 조각 또는 의역, 중복 문장.

판단 절차:
1) 문장 내에 과정 단서(방법, 시도, 실패와 개선, 도구, 단계 등)가 최소 1개 이상 존재하는지 확인.
2) 포함 체크리스트 만족 여부를 보고, 제외 규칙 위반 시 배제.
3) 보수적 적용: 애매하면 포함하지 않음.
4) 출력에는 체크리스트 만족 문장만을 포함한다. (모든 문장을 출력하는 것이 아닌, 체크리스트 만족 문장만을 출력해야 함.)

부정 예시(선택적으로 참고):
- "문제를 많이 풀었다."(방법/개선/근거 부재)
- "분위기 개선에 이바지하였다."(구체 행위·결과 없음)

선택 수량 제한:
- 가장 정보가 풍부하고 교정 가치가 높은 문장 5-8개만 포함한다.
- 5개 미만이면 그만큼만 포함한다.
- 유사/중복 의미 문장은 제거한다.

출력 지시(엄격):
- 출력은 JSON 1개 객체만, 마크다운/설명/코드블록 없이 순수 JSON으로만 반환할 것.
- 스키마: { "type": "red_line", "Feedbacks": [ { "sentence": string, "feedback": string } ] }
- 일치 문장이 없으면 "Feedbacks": []로 반환.
- sentence는 원문과 완전 일치, feedback은 어떤 과정 단서로 판단했는지 1-2문장으로 간결히 서술(한국어).
- Feedbacks 항목 수는 최대 5개(권장 5-8개).
`;

/**
 * Blue Line Validation - 연계·후속 탐구 강조
 */
export const BLUE_LINE_PROMPT = `
역할: 학생 활동 기록에서 파란색 밑줄(연계·후속 탐구 강조)에 해당하는 문장만 선별하여 JSON으로 반환하는 분석가.

포함 체크리스트(아래 항목 중 최소 1개를 충족해야 하며, 제외 규칙에 걸리면 안 됨):
1) 과거 활동/학습이 다음 탐구의 동기가 되었음을 한 문장 내에서 명시(연결 표현 또는 인과 단서 포함).
2) 하나의 주제에서 파생된 새로운 질문이 후속 탐구로 이어졌음을 구체 단서와 함께 서술.
3) 시기(학년·학기·기간)를 가로지르는 관심사의 지속성·심화가 문장 내에서 확인됨.
4) 상이한 활동 간 유기적 연관(개념·방법·데이터·도구의 계승/응용)이 문장에 나타남.

제외 규칙(하나라도 해당하면 제외):
- "추가로", "더 나아가" 등의 접속어만 있고 실제 연결 내용·근거 없음.
- 연계가 문맥 추론에만 의존(한 문장 자체로 연결 단서 부족).
- 단순 활동 나열, 시간 나열(연결성·지속성 근거 없음).
- 문장 조각/의역/중복.

판단 절차:
1) 문장 내부에 연결고리(원인→결과, 이전→이후, 적용·확장 단서)가 최소 1개 이상 있는지 확인.
2) 포함 체크리스트를 만족하고 제외 규칙에 걸리지 않으면 포함.
3) 애매하면 제외한다(보수적).
4) 출력에는 체크리스트 만족 문장만을 포함한다. (모든 문장을 출력하는 것이 아닌, 체크리스트 만족 문장만을 출력해야 함.)

부정 예시(선택적으로 참고):
- "이를 바탕으로 더 공부했다."(무엇을 어떻게가 불명확)
- "추가로 프로젝트를 했다."(연계 근거 없음)

선택 수량 제한:
- 진짜 연계성이 뚜렷하고 대표성 있는 문장 5-8개만 선택한다.
- 5개 미만이면 그만큼만 포함한다.
- 유사/중복 의미 문장은 제거한다.

출력 지시(엄격):
- 출력은 JSON 1개 객체만, 마크다운/설명/코드블록 없이 순수 JSON으로만 반환할 것.
- 스키마: { "type": "blue_line", "Feedbacks": [ { "sentence": string, "feedback": string } ] }
- 일치 문장이 없으면 "Feedbacks": []로 반환.
- sentence는 원문과 완전 일치, feedback은 어떤 연결 단서로 판단했는지 1-2문장으로 간결히 서술(한국어).
- Feedbacks 항목 수는 최대 5개(권장 5-8개).
`;

/**
 * Black Line Validation - 구체성 부족
 */
export const BLACK_LINE_PROMPT = `
역할: 학생 활동 기록에서 검은색 밑줄(구체성 부족)에 해당하는 문장만 선별하여 JSON으로 반환하는 분석가.

포함 체크리스트(아래 항목 중 최소 1개를 충족해야 하며, 제외 규칙에 걸리면 안 됨):
1) 진로/학업/공동체 관련 키워드는 있으나 무엇을·어떻게·왜·결과가 불분명한 추상 서술.
2) 결과만 있고 과정·근거 부재(예: "성과가 있었다", "역할을 맡았다").
3) 참여 사실만 있고 내용·방법·배움이 전혀 없음(예: "활동에 참여함").

제외 규칙(하나라도 해당하면 제외):
- 문장 안에 최소한의 구체 단서(방법·도구·자료·절차·지표 등)가 존재하면 검은색 밑줄로 분류하지 않음.
- 문맥 추론 필요, 문장 조각/의역/중복은 제외.

판단 절차:
1) 문장에 활동 핵심 5W1H 또는 과정·근거·결과 중 어느 것도 식별되지 않는지 확인.
2) 포함 체크리스트 해당 시 포함, 단 근거가 없거나 애매하다면 제외한다(보수적).
3) 출력에는 체크리스트 만족 문장만을 포함한다. (모든 문장을 출력하는 것이 아닌, 체크리스트 만족 문장만을 출력해야 함.)

부정 예시(선택적으로 참고):
- "생명과학 실험을 했다."(무엇을/어떻게 불명확)
- "분위기 개선에 이바지했다."(행위·지표·결과 불명확)

선택 수량 제한:
- 구체성 부족이 가장 뚜렷한 문장 5-8개만 포함한다(대표 사례 우선).
- 5개 미만이면 그만큼만 포함한다.
- 유사/중복 의미 문장은 제거한다.

출력 지시(엄격):
- 출력은 JSON 1개 객체만, 마크다운/설명/코드블록 없이 순수 JSON으로만 반환할 것.
- 스키마: { "type": "black_line", "Feedbacks": [ { "sentence": string, "feedback": string } ] }
- 일치 문장이 없으면 "Feedbacks": []로 반환.
- sentence는 원문과 완전 일치, feedback은 어떤 구체성 결핍이 있는지 1-2문장으로 간결히 서술(한국어).
- Feedbacks 항목 수는 최대 5개(권장 5-8개).
`;

/**
 * Red Check Validation - 평가 불가 수준의 정보 부족
 */
export const RED_CHECK_PROMPT = `
역할: 학생 활동 기록에서 빨간색 체크(평가 불가 수준의 정보 부족)에 해당하는 문장만 선별하여 JSON으로 반환하는 분석가.

포함 체크리스트(모두 또는 대부분을 충족):
1) 활동명/참여 사실만 있고 내용·방법·근거·결과가 전무하다.
2) 역량/성장을 평가할 단서가 없다(행동·사고 과정·산출물·지표 부재).
3) 한 줄 수준의 언급으로 더 이상의 분석이 불가능하다.

제외 규칙(하나라도 해당하면 제외):
- 최소한의 단서(활동 목적, 간단한 방법, 작은 결과 중 1개라도)가 있으면 빨간색 체크가 아니라 검은색 밑줄 또는 다른 분류 고려.
- 문맥 추론 필요, 문장 조각/의역/중복은 제외.

판단 절차:
1) 문장 자체만 보고 평가 가능성이 전무한지 확인.
2) 포함 체크리스트에 부합하면 포함, 그렇지 않거나 근거가 없거나 애매하다면 제외.
3) 출력에는 체크리스트 만족 문장만을 포함한다. (모든 문장을 출력하는 것이 아닌, 체크리스트 만족 문장만을 출력해야 함.)

부정 예시(선택적으로 참고):
- "동아리에 참여했다."(내용 전무)
- "강의를 수강함."(방법·배움·성과 없음)

선택 수량 제한:
- 평가 불가 수준의 문장 5-8개만 선정한다(중복/유사 제거).
- 5개 미만이면 그만큼만 포함한다.

출력 지시(엄격):
- 출력은 JSON 1개 객체만, 마크다운/설명/코드블록 없이 순수 JSON으로만 반환할 것.
- 스키마: { "type": "red_check", "Feedbacks": [ { "sentence": string, "feedback": string } ] }
- 일치 문장이 없으면 "Feedbacks": []로 반환.
- sentence는 원문과 완전 일치, feedback은 평가가 불가능한 구체 사유를 1-2문장으로 간결히 서술(한국어).
`;

// ===========================
// Prompt Utility Functions
// ===========================

/**
 * Get extraction prompt by section type
 */
export function getExtractionPrompt(sectionType: 'creative' | 'academic' | 'detailed'): string {
  const prompts = {
    creative: CREATIVE_ACTIVITIES_PROMPT,
    academic: ACADEMIC_DEVELOPMENT_PROMPT,
    detailed: DETAILED_ABILITIES_PROMPT,
  };
  
  const prompt = prompts[sectionType];
  if (!prompt) {
    throw new Error(`Invalid section type: ${sectionType}`);
  }
  
  return prompt;
}

/**
 * Get validation prompt by validation type
 */
export function getValidationPrompt(
  validationType: 'blue_highlight' | 'red_line' | 'blue_line' | 'black_line' | 'red_check'
): string {
  const prompts = {
    blue_highlight: BLUE_HIGHLIGHT_PROMPT,
    red_line: RED_LINE_PROMPT,
    blue_line: BLUE_LINE_PROMPT,
    black_line: BLACK_LINE_PROMPT,
    red_check: RED_CHECK_PROMPT,
  };
  
  const prompt = prompts[validationType];
  if (!prompt) {
    throw new Error(`Invalid validation type: ${validationType}`);
  }
  
  return prompt;
}