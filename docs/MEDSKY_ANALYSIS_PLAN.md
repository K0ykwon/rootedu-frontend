# Medsky Analysis Upgrade Plan

> Goal: extend the Medsky 생활기록부 분석 to incorporate consultant-editable insights, richer analytics, and a faster parallelized LLM pipeline while keeping current code structure aligned.

## Context Snapshot
- **Current flow** (`lib/medsky/medskyService.ts:128`): sequential stages — PDF parsing → regex sectioning → `extractAllData` (3 parallel calls) → `runComprehensiveValidation` (Promise.allSettled across 15 prompts) → session persistence.
- **Rendering** (`components/medsky/MedskyAnalyzer.tsx:216` + `app/dashboard/[slug]/analysis/[sessionId]/page.tsx:146`): tabs for 개요/구조화/상세 but read-only. No slots for manual consultant input today.
- **LLM integration** (`lib/medsky/llmService.ts:58`): uses OpenAI SDK with `responses.parse` helper but instantiates a new client per call, returning JSON mapped to Zod schemas.

## 1. Analysis Engine Enhancements
1. **Data model additions** (`types/medsky.ts`)
   - Extend `ProcessingResult` + `ExtractedData` with:
     ```ts
     gradeTrends?: GradeTrendReport;
     competencyScores?: CompetencyScorePayload;
     majorAlignment?: MajorAlignmentReport;
     keywordMatrix?: KeywordMatrixEntry[];
     consultantNotes?: ConsultantNoteBlock;
     summaryDraft?: SummaryDraft;
     manualInputs?: ManualInputState;
     ```
   - Add explicit Zod schemas for auto-generated pieces to validate post-LLM responses before persistence.

2. **LLM prompt set** (`lib/medsky/prompts.ts`)
   - Introduce structured prompts for:
     - `SUMMARY_DRAFT_PROMPT`: consumes stats, keywords, major gaps, consultant notes to produce editable 총평.
     - `KEYWORD_CLASSIFIER_PROMPT`: classify 키워드 ↔ 역량, seeded with 대학 학종 가이드북 exemplars.
   - Keep existing validation prompts untouched but update instructions to reference new competency labels to keep mappings consistent.

3. **LLM execution upgrades** (`lib/medsky/llmService.ts`)
   - Centralize OpenAI Responses API usage (structured parsing helper):
     ```ts
     const openai = createResponsesClient();
     const response = await openai.responses.parse({
       model: resolved.model,
       input: [
         { role: 'system', content: systemPrompt },
         { role: 'user', content: userContent }
       ],
       text: {
         format: zodTextFormat(schema, schemaName)
       }
     });
     const parsed = response.output_parsed as SchemaType;
     ```
   - Implement a single `createResponsesClient()` so each batch reuses the same client but allows per-request concurrency; remove per-call env lookups to reduce latency.
   - Add `runParallelLLMTasks(tasks, concurrency = 5)` utility (wraps `Promise.allSettled` + `p-limit`) so extraction, validation, summary, keyword runs share pooled concurrency.
   - Capture token usage + timings in `MedskyError` metadata for monitoring.

4. **Deterministic transformers** (new `lib/medsky/transformers/` folder)
   - `gradeTrends.ts`: derive semestered series from `AcademicDevelopments`; compute combos (전체, 국·영·수, 국·영·수·사) with student score vs 평균 vs delta.
   - `competencyScores.ts`: map validation categories to 학업/진로/공동체/기타, merge auto-scores with consultant overrides, generate z-score placement data for the normal-curve visualization.
   - `majorAlignment.ts`: load `data/majors.json` (converted from Excel) and mark required/추천 과목 fulfillment using parsed coursework + 세특 keywords.
   - `keywordMatrix.ts`: aggregate noun phrases per 학년/과목; call `KEYWORD_CLASSIFIER_PROMPT` to tag 역량 when deterministic heuristics insufficient; link to originating sentences.

5. **Session persistence** (`medskyService.ts`)
   - After each transformer completes, call `updateSessionResult(sessionId, { ... })` so Redis mirrors new data; extend `storeAnalysisForAdmin` to include manual inputs and summary drafts for dashboard reuse.
   - Add `manualInputs` stub to hold consultant edits (to be patched by UI later).

## 2. Parallelized Pipeline Plan
1. **Stage graph refactor** (`medskyService.ts`)
   ```mermaid
   graph LR
     Upload --> Parse
     Parse --> ExtractSections
     ExtractSections -->|parallel batch A| {LLMExtraction, KeywordMatrix}
     ExtractSections -->|parallel batch B| MajorAlignment
     LLMExtraction --> Validation
     Validation --> Summary
     KeywordMatrix --> Summary
     ManualInputs -.-> Summary
   ```

2. **Implementation steps**
   - Replace current `processCompleteAnalysis` Promise chain with an async task graph:
     ```ts
     const [sections] = await Promise.all([processTextExtraction(...)]);
     const { creative, academic, detailed } = sections;

     const llmBatch = runParallelLLMTasks([
       () => extractCreativeActivities(creative,...),
       () => extractAcademicDevelopment(academic,...),
       () => extractDetailedAbilities(detailed,...)
     ]);

     const keywordTask = () => buildKeywordMatrix(sections);
     const majorTask = () => computeMajorAlignment(sections, manualInputs?.targetMajor);

     const [extractedData, keywordMatrix, majorAlignment] = await Promise.all([
       llmBatch.then(mergeExtractionResults),
       keywordTask(),
       majorTask(),
     ]);

     const validationTask = () => runComprehensiveValidation(sections, llmConfig);
     const summaryTask = () => generateSummaryDraft({...});

     const [validationAnalysis, summaryDraft] = await runParallelLLMTasks([
       validationTask,
       summaryTask
     ]);
     ```
   - Update `ProcessingStatus` progression to reflect sub-stage completion (e.g., `analysis_batch`, `keyword_analysis`, `summary_generation`) so UI can show granular progress.
   - Ensure `runParallelLLMTasks` catches parse failures per task and raises `MedskyError` with stage metadata; failing non-critical tasks (e.g., keyword tagging) should degrade gracefully while critical ones (validation) bubble up.

3. **Concurrency controls**
   - Use `p-limit` (new dependency) or implement simple semaphore to cap concurrent Responses API calls (limit ~5 to respect rate limits). Share across pipeline batches to avoid bursts.
   - Leverage existing `setGlobalDispatcher` to keep HTTP agent reuse.

4. **Telemetry**
   - Log per-task duration + tokens (from Responses API `usage` field) to help tune concurrency later.

## 3. Rendering Updates
1. **Analyzer tabs** (`components/medsky/MedskyAnalyzer.tsx`)
   - Reorder tabs to mirror client outline: 성적 추이 → 점수화 → 전공 연계 → 키워드 → 세부 분석 → 총평.
   - Introduce new components:
     - `GradeTrendChart` (line chart; use `recharts` or `nivo`, gated behind feature flag and added to `package.json`).
     - `CompetencyDistribution` (normal curve with manual/auto markers, legends showing 역량 매핑).
     - `MajorAlignmentMatrix` (table of 필수/권장 과목 with completion badges + callouts for 미이수).
     - `KeywordHeatmap` (grid by 학년/과목 with clickable keywords linking to 세특 sentences).
     - `SummaryEditor` (renders AI draft with edit controls; see section 4).
   - Feed each component from new fields in `ProcessingResult`; fallback to skeleton UI when data missing.

2. **Dashboard analysis view** (`app/dashboard/[slug]/analysis/[sessionId]/page.tsx`)
   - Replace single-tab layout with multi-section page matching analyzer order, each wrapped in `Card` and optionally collapsible for quick scan.
   - Display manual input controls inline (e.g., between chart header and data) if user has edit permissions.
   - Add status chips showing when consultant edits diverge from AI suggestions.

3. **State management**
   - Extend `useMedskyAnalysis` context to store `manualInputs` and expose actions: `upsertManualScore`, `setTargetMajor`, `updateSummaryDraft`.
   - Sync context with server via optimistic mutations (see section 4 API).

4. **Styling**
   - Add consistent “AI vs Consultant” badges; highlight fields updated manually.
   - Provide export (PDF/print) view using updated sections, ensuring manual overrides render.

## 4. Consultant-Editable Report UX
1. **Editable sections**
   - **Manual scores**: slider or numeric input (0–100) per competency with optional notes. Show AI auto-score as ghost value; allow one-click “Use AI suggestion”.
   - **Target major**: searchable select tied to `majorAlignment`. Editing triggers recalculation (debounced call to `/api/medsky/analysis/{sessionId}/major` for new alignment).
   - **Summary draft**: rich textarea with tracked changes; show AI-sourced sentences and consultant-added notes separately (store both in `consultantNotes`).
   - **Keyword adjustments**: allow tagging/untagging keywords to different 역량; store overrides.

2. **API surface**
   - New REST endpoints (with auth guard):
     - `PATCH /api/medsky/analysis/{sessionId}/manual-scores` → updates `manualInputs.scores` and re-computes distributions server-side.
     - `PATCH /api/medsky/analysis/{sessionId}/target-major` → sets desired major and enqueues major alignment recompute.
     - `PATCH /api/medsky/analysis/{sessionId}/summary` → stores consultant edits alongside AI draft.
     - `PATCH /api/medsky/analysis/{sessionId}/keywords` → overrides keyword ↔ competency tags.
   - Each handler loads session via `getProcessingResultAsync`, merges changes, persists to Redis, and optionally triggers background recomputation (reuse `startProcessingPipeline` subroutines for incremental updates).

3. **UI interactions**
   - Use `react-hook-form` or simple controlled inputs with debounced `fetch` calls (PUT/PATCH). Show `toast` feedback on success/failure.
   - Display `lastSavedAt` timestamp per section; show unsaved indicator when local edits diverge.
   - Implement versioning snapshot (keep previous AI draft to allow “reset to AI output”).

4. **Report rendering**
   - Main dashboard page renders consultant inputs blended with AI outputs:
     - Charts/lists use manual scores when present, fall back to auto.
     - Summary section shows combined content with badges denoting origin.
     - Provide “Download PDF” or “Copy to clipboard” actions that respect manual overrides.

5. **Data persistence**
   - Extend Redis storage to keep `manualInputs` and `summaryDraft` keyed by session; ensure `storeAnalysisForAdmin` writes both raw AI outputs and consultant overrides for audit.
   - Update admin dashboards (if any) to highlight sessions requiring review (manual edits present, etc.).

## Rollout Checklist
- [ ] Add new types & schemas.
- [ ] Implement transformer modules & tests (fixtures from `dev/medsky/file/park/park_sample_parsed.txt`).
- [ ] Refactor pipeline with `runParallelLLMTasks` + updated status messaging.
- [ ] Create new API endpoints for consultant edits.
- [ ] Rebuild Medsky UI with new components/tabs and editable controls.
- [ ] Update docs (`docs/MEDSKY_IMPLEMENTATION.md`) and provide editor guide.
- [ ] Monitor LLM usage; adjust concurrency limits as needed.
