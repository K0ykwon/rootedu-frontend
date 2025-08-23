# -*- coding: utf-8 -*-
"""
Prompts for extracting structured data from parsed student record sections
"""

CREATIVE_ACTIVITIES_PROMPT = """
You are tasked with extracting creative activities data from a Korean student record section.

INPUT: Text from the "창의적 체험활동상황" section containing activity information in table format.

OUTPUT: Return a JSON object matching this exact structure:
```json
{
  "창의적체험활동상황": [
    {
      "영역": "string - activity domain (e.g., 자율활동, 동아리활동, 진로활동, 봉사활동)",
      "시간": "integer - hours spent on this activity", 
      "특기사항": "string - detailed description of the activity and achievements"
    }
  ]
}
```

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
```
학년 영역 시간 특기사항
1 자율활동 74 학생회에서 매 정기고사 전 운영한 멘토·멘티 활동에 성실히 참여함...
동아리활동 22 (바이온)(22시간) 연합 포스터 제작 활동에서 자료 조사를 맡아...
```

Extract as:
```json
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
```

Extract all creative activities from the provided text.
"""

ACADEMIC_DEVELOPMENT_PROMPT = """
You are tasked with extracting academic performance data from a Korean student record section.

INPUT: Text from the "교과학습발달상황" section containing grade tables with academic performance data.

OUTPUT: Return a JSON object matching this exact structure:
```json
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
```

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
```
학기 교과 과목 학점수 원점수/과목평균(표준편차) 성취도 석차등급
1 국어 국어 4 82/69.2(13.6) A(326) 3
1 수학 수학 4 74/60.7(20.1) B(326) 4
```

Extract as:
```json
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
```

Extract all academic performance data from the provided text.
"""

DETAILED_ABILITIES_PROMPT = """
You are tasked with extracting detailed subject abilities from a Korean student record section.

INPUT: Text from the "세부능력 및 특기사항" section containing detailed subject-specific evaluations and achievements.

OUTPUT: Return a JSON object matching this exact structure:
```json
{
  "세부특기사항": [
    {
      "과목": "string - subject name (e.g., 국어, 수학, 영어, 한국사, 통합사회, 통합과학, etc.)",
      "특기사항": "string - detailed evaluation and special abilities description for this subject"
    }
  ]
}
```

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
```
국어: 관심 있는 분야의 책을 읽고 질문하는 창의적 사고 역량을 보여줌. '수의사가 말하는 수의사'를 읽고 안락사에 대한 수의사의 생각이나 직업적 어려움에 대해 궁금한 점을 질문으로 만듦...

수학: 수학교과서 탐구과제에 나와 있는 '겔로시아 곱셈'에 대해 탐구하고 발표함. 겔로시아는 인도의 수학자인 바스카라가 지은 수학책인 '릴라바티'에 주석으로 달려 있으며...
```

Extract as:
```json
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
```

Extract all detailed subject abilities from the provided text.
"""

# Usage function for testing
def get_extraction_prompt(section_type):
    """
    Get the appropriate extraction prompt for a given section type.
    
    Args:
        section_type (str): One of 'creative', 'academic', 'detailed'
    
    Returns:
        str: The extraction prompt for that section
    """
    prompts = {
        'creative': CREATIVE_ACTIVITIES_PROMPT,
        'academic': ACADEMIC_DEVELOPMENT_PROMPT, 
        'detailed': DETAILED_ABILITIES_PROMPT
    }
    
    return prompts.get(section_type, "Invalid section type")

if __name__ == "__main__":
    print("Available extraction prompts:")
    print("1. creative - Creative Activities")
    print("2. academic - Academic Development") 
    print("3. detailed - Detailed Abilities")
    
    section = input("Enter section type: ").strip().lower()
    
    if section in ['creative', 'academic', 'detailed']:
        print("\n" + "="*80 + "\n")
        print(get_extraction_prompt(section))
    else:
        print("Invalid section type. Use: creative, academic, or detailed")