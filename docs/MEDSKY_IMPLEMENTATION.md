# Medsky Implementation Documentation

## Overview

The Medsky system is a comprehensive AI-powered student record analysis tool integrated into the Rootedu platform. It processes Korean student records (학생생활기록부) through a 4-stage pipeline to provide detailed feedback and analysis.

## System Architecture

### 4-Stage Processing Pipeline

1. **PDF Parsing** (`exp1_parsing.py` → TypeScript equivalent)
   - Uses LlamaCloud API for high-quality PDF text extraction
   - Handles Korean text with high-resolution OCR
   - Extracts tables in HTML format for better structure preservation

2. **Text Section Extraction** (`exp2_parsing_via_regex.py` → `textParser.ts`)
   - Regex-based parsing to separate document sections
   - Extracts: 창의적체험활동상황, 교과학습발달상황, 세부능력 및 특기사항
   - Validates completeness of extracted sections

3. **LLM Data Extraction** (`exp4_extraction.py` → `llmService.ts`)
   - OpenRouter API integration using DeepSeek Chat v3.1
   - Structured data extraction using 100% identical prompts from Python version
   - Parallel processing for optimal performance

4. **Validation Analysis** (`exp5_validation.py` → `llmService.ts`)
   - 5-category validation system with detailed feedback
   - Categories: blue_highlight, red_line, blue_line, black_line, red_check
   - Each represents different aspects of student record quality

## File Structure

```
/types/medsky.ts                    # TypeScript type definitions
/lib/medsky/
  ├── prompts.ts                    # LLM prompts (100% identical to Python)
  ├── textParser.ts                 # Regex text parsing utilities
  ├── pdfService.ts                 # LlamaCloud PDF parsing
  ├── llmService.ts                 # OpenRouter LLM integration
  └── medskyService.ts              # Main orchestration service

/app/api/medsky/
  ├── process/route.ts              # Complete processing endpoint
  ├── status/route.ts               # Status checking endpoint
  └── health/route.ts               # System health endpoint

/components/medsky/
  ├── MedskyAnalyzer.tsx            # Main component
  ├── PDFUploader.tsx               # File upload interface
  ├── ProcessingStatusDisplay.tsx   # Progress tracking
  ├── ValidationResults.tsx         # Results overview
  ├── ValidationCategoryDisplay.tsx # Category-specific display
  └── ExtractedDataDisplay.tsx      # Raw data viewer
```

## Integration with 알약툰 Influencer Page

### Location
- Integrated into `/app/influencers/[slug]/page.tsx`
- Only accessible on 알약툰's page (`/influencers/yaktoon`)
- Added as "🏥 생기부 분석" tab

### Special Features for 알약툰
- Medical-focused branding and messaging
- Specialized UI components with medical theme
- Integration with 알약툰's existing service offerings
- Direct connection to 1:1 mentoring services

## API Endpoints

### POST /api/medsky/process
Complete processing pipeline from PDF upload to final analysis.

**Request:**
```typescript
FormData: {
  file: File // PDF file
}
```

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  result: ProcessingResult;
}
```

### GET /api/medsky/process?sessionId={id}
Retrieve processing results for a session.

### GET /api/medsky/status?sessionId={id}
Get current processing status.

### GET /api/medsky/health
System health check and configuration validation.

## Environment Variables

```env
# PDF Processing (Cost-Optimized - matches Python version exactly)
LLAMA_API_KEY="your-llama-cloud-api-key"
LLAMA_PARSE_MODE="parse_page_without_llm"
LLAMA_HIGH_RES_OCR="true"
LLAMA_TABLE_EXTRACTION="true"
LLAMA_OUTPUT_HTML="true"
# LLAMA_ADAPTIVE_LONG_TABLE="false"  # Disabled by default to save API costs

# LLM Processing
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="deepseek/deepseek-chat-v3.1"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important Note**: The PDF processing configuration exactly matches the Python version (`exp1_parsing.py`) to ensure identical functionality and minimize LlamaCloud API costs. The `adaptive_long_table` feature is disabled by default since it wasn't used in the original Python implementation and would increase API usage costs.

## Validation Categories

### 1. Blue Highlight (파란색 하이라이트)
**Purpose:** 진로 역량 강조 - Career competency emphasis
- Direct connections between activities and career goals
- Evidence of career-related experiments, research, or projects
- Explicit career exploration depth and direction

### 2. Red Line (빨간색 밑줄)
**Purpose:** 구체적 노력·깊이 강조 - Concrete effort/depth emphasis
- Academic capabilities with self-directed, sustained effort
- Career capabilities with clear evidence of research methods
- Community capabilities showing motivation→action→change→learning flow

### 3. Blue Line (파란색 밑줄)
**Purpose:** 연계·후속 탐구 강조 - Connection/follow-up research emphasis
- Past activities motivating future exploration
- Topics generating new questions leading to follow-up research
- Cross-time interest continuity and deepening
- Organic connections between different activities

### 4. Black Line (검은색 밑줄)
**Purpose:** 구체성 부족 - Lack of specificity
- Abstract descriptions without clear what/how/why/results
- Results without process or evidence
- Participation facts without content/methods/learning

### 5. Red Check (빨간색 체크)
**Purpose:** 평가 불가 수준 - Insufficient information for evaluation
- Only activity names/participation facts with no content
- No clues for capability/growth evaluation
- Single-line mentions with no further analysis possible

## Usage Instructions

### For Developers

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Medsky Feature**
   - Navigate to `/influencers/yaktoon`
   - Click on "🏥 생기부 분석" tab
   - Upload a PDF student record file

5. **Consultant Editing Overview**
   - 분석 결과 페이지는 이제 `성적 추이 → 역량 점수화 → 전공 연계 → 키워드 맵 → 세부 분석 → 총평` 순으로 탭이 구성됩니다.
   - 컨설턴트는 각 탭에서 수동 입력을 즉시 수정할 수 있으며 모든 수정 사항은 `/api/medsky/analysis/:sessionId/...` 엔드포인트를 통해 저장됩니다.
     - `manual-scores`: 역량 점수 및 메모 업데이트
     - `target-major`: 목표 대학/학과 설정 → 전공 연계 분석 자동 갱신
     - `keywords`: 키워드 ↔ 역량 분류 덮어쓰기
     - `summary`: 총평 초안에 대한 컨설턴트 수정본 저장
   - 모든 수동 입력은 Redis 세션에 저장되고 `finalizeReportAnalytics` 단계에서 보고서 재생성을 트리거합니다.

### For Users (알약툰 Page)

1. **Navigate to Analysis Tab**
   - Go to 알약툰's influencer page
   - Select "🏥 생기부 분석" tab

2. **Upload Student Record**
   - Drag and drop PDF file or click to browse
   - File must be Korean student record (학생생활기록부)
   - Maximum file size: 10MB

3. **Monitor Processing**
   - Real-time status updates through 4 stages
   - Progress percentage and estimated time
   - Error handling with retry options

4. **Review Results**
   - Interactive validation category filtering
   - Detailed feedback for each identified sentence
   - Export options for further analysis
   - Raw data viewer for extracted information

## Performance Considerations

### Optimization Features
- Parallel processing for data extraction and validation
- Session-based processing to handle large files
- Intelligent caching for repeated operations
- Error recovery and retry mechanisms
- Token usage optimization

### Scalability
- Stateless session management (ready for Redis/database)
- Configurable timeout and retry settings
- Health monitoring and service availability checks
- Graceful degradation when services are unavailable

## Security & Privacy

### Data Handling
- PDF files processed in memory, never stored permanently
- Session data automatically cleaned up after 24 hours
- No sensitive information logged or persisted
- All API calls use environment-based authentication

### File Validation
- Strict PDF format validation
- File size limits (10MB maximum)
- Content validation to ensure it's a student record
- Malicious file detection and rejection

## Testing

### Manual Testing Checklist
- [ ] PDF upload with valid student record
- [ ] Processing pipeline completion
- [ ] Status updates during processing
- [ ] Error handling for invalid files
- [ ] Results display with all validation categories
- [ ] Export functionality
- [ ] Mobile responsiveness
- [ ] Integration with 알약툰 page design

### API Testing
```bash
# Health check
curl -X GET http://localhost:3000/api/medsky/health

# Upload test (replace with actual PDF file)
curl -X POST \
  -F "file=@path/to/student-record.pdf" \
  http://localhost:3000/api/medsky/process
```

## Troubleshooting

### Common Issues

1. **LlamaCloud API Errors**
   - Check API key validity
   - Verify file is valid PDF
   - Check network connectivity

2. **OpenRouter API Errors**
   - Validate API key and credits
   - Check model availability
   - Review rate limiting

3. **Processing Timeouts**
   - Large files may take longer
   - Check timeout configurations
   - Verify service health

4. **Invalid Student Records**
   - File must contain required sections
   - Korean language content expected
   - Proper document structure needed

### Debug Information
- Check browser console for client-side errors
- Review server logs for API endpoint issues
- Use health endpoint to verify service status
- Monitor network tab for API response details

## Future Enhancements

### Planned Features
- Real-time collaboration for analysis
- Historical analysis comparison
- Advanced export formats (Word, PowerPoint)
- Integration with additional LLM providers
- Batch processing for multiple files
- Enhanced mobile optimization

### Scalability Improvements
- Redis-based session storage
- Queue-based processing for high load
- CDN integration for static assets
- Database persistence for analysis results
- Advanced caching strategies

## Support and Maintenance

### Monitoring
- API response time tracking
- Error rate monitoring
- Service availability alerts
- Usage analytics

### Updates
- Regular security patches
- LLM model updates
- Performance optimizations
- Feature enhancements based on user feedback
