# Feedback Popover Issue Analysis

## 🔴 Problem Summary

**Issue**: Feedback popover tooltips are not displaying on the dedicated analysis page, even though they work correctly in the modal view.

**Affected URL**: `/dashboard/[slug]/analysis/[sessionId]`
**Working URL**: Modal triggered by "분석보기" button on `/dashboard/[slug]`

**User Report**: "even when mouse cursor is on there, feedback is now shown properly"

---

## 📊 Issue Comparison

### ✅ Working Implementation (Modal)
**Location**: `app/dashboard/[slug]/page.tsx` (lines 634-752)

```tsx
{showAnalysisModal && selectedAnalysis && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-[var(--color-bg-primary)] rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
      {/* ... */}
      <ValidationResults
        textSections={selectedAnalysis.analysisData.textSections}
        extractedData={selectedAnalysis.analysisData.extractedData}
        validationAnalysis={selectedAnalysis.analysisData.validationAnalysis}
        activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
        onFilterChange={() => {}}
      />
    </div>
  </div>
)}
```

**Key Characteristics**:
- Renders in a fixed modal with `z-50`
- Container has `overflow-y-auto` but parent is fixed
- Data passed directly from `selectedAnalysis` state
- FeedbackPopover appears on hover ✅

### ❌ Broken Implementation (Analysis Page)
**Location**: `app/dashboard/[slug]/analysis/[sessionId]/page.tsx` (lines 455-463)

```tsx
{activeResultsTab === 'detailed' && (
  <ValidationResults
    textSections={analysisResult.analysisData.textSections}
    extractedData={analysisResult.analysisData.extractedData}
    validationAnalysis={analysisResult.analysisData.validationAnalysis}
    activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
    onFilterChange={() => {}}
  />
)}
```

**Key Characteristics**:
- Renders inside tab content within page layout
- Data fetched via API: `/api/dashboard/[slug]/analysis-results`
- Same props structure as modal
- FeedbackPopover does NOT appear on hover ❌

---

## 🔍 Technical Implementation Details

### FeedbackPopover Component
**Location**: `components/medsky/FeedbackPopover.tsx`

**Rendering Strategy**: React Portal with fixed positioning
```tsx
{typeof window !== 'undefined' && createPortal(
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed z-[99999] pointer-events-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          minWidth: '300px',
          maxWidth: '600px',
          width: `${position.width}px`
        }}
      >
        {/* Popover content */}
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
)}
```

**Event Handling**:
- `onMouseEnter` → sets `isOpen = true`
- `onMouseLeave` → sets `isOpen = false`
- Position calculated using `getBoundingClientRect()`
- Updates on scroll/resize

### Text Highlighting System
**Location**: `lib/medsky/textHighlighter.tsx`

**Flow**:
1. `renderHighlightedText()` creates feedback map from validation data
2. Fuzzy matches text with 45% threshold
3. Wraps matched text in `<FeedbackPopover>` component
4. Displays highlight with hover badge showing feedback count

---

## 🐛 Potential Root Causes

### 1. **Data Structure Mismatch** (HIGH PROBABILITY)
The analysis page data comes from a different API endpoint than the modal:

**Modal Data Source**:
- Direct state from `selectedAnalysis`
- Data structure guaranteed to match expected format

**Analysis Page Data Source**:
```tsx
const response = await fetch(`/api/dashboard/${slug}/analysis-results`);
const data = await response.json();
const result = data.results?.find((r: AnalysisResult) => r.sessionId === sessionId);
```

**Hypothesis**: The `validationAnalysis` structure from the API might be:
- Missing or null
- In a different format (different property names)
- Nested differently than expected

### 2. **Container Overflow Constraints** (MEDIUM PROBABILITY)
The analysis page has multiple nested containers with potential overflow issues:

```tsx
// Page structure (approximate)
<div className="min-h-screen">  // Root
  <div className="container">    // Container
    <Card>                        // Tab container
      <div>                       // Tab content wrapper
        {activeResultsTab === 'detailed' && (
          <ValidationResults />   // Component here
        )}
      </div>
    </Card>
  </div>
</div>
```

**Potential Issues**:
- Parent containers with `overflow: hidden`
- Portal positioning calculated incorrectly due to scroll offset
- Z-index stacking context issues

### 3. **React Portal Timing Issues** (LOW PROBABILITY)
- Portal may not be finding `document.body` in SSR/hydration
- Tab switching may unmount/remount components incorrectly

### 4. **Event Listener Conflicts** (LOW PROBABILITY)
- Parent containers intercepting mouse events
- Event bubbling being stopped somewhere in the chain

---

## 🔬 Debugging Steps Added

### Debug Logging Implemented
**File**: `components/medsky/ValidationResults.tsx`

```tsx
// Component render logging
console.log('ValidationResults rendered with:', {
  hasTextSections: !!textSections,
  hasExtractedData: !!extractedData,
  hasValidationAnalysis: !!validationAnalysis,
  validationKeys: validationAnalysis ? Object.keys(validationAnalysis) : [],
  activeFilters,
});

// Feedback map creation logging
console.log('FeedbackMap created with', map.size, 'unique sentences');
console.log('Sample feedbacks:', Array.from(map.entries()).slice(0, 3).map(([sentence, feedbacks]) => ({
  sentence: sentence.substring(0, 50),
  feedbackCount: feedbacks.length
})));
```

**File**: `components/medsky/FeedbackPopover.tsx`

```tsx
// Popover initialization logging
useEffect(() => {
  if (feedbacks && feedbacks.length > 0) {
    console.log('FeedbackPopover initialized with feedbacks:', feedbacks.length, 'for text:', highlightedText.substring(0, 30));
  }
}, [feedbacks, highlightedText]);

// Mouse event logging
const handleMouseEnter = () => {
  console.log('FeedbackPopover: Mouse entered, opening popover', { highlightedText: highlightedText.substring(0, 50) });
  setIsOpen(true);
};
```

### Required Console Output Analysis
When visiting the broken page, check browser console for:

1. **ValidationResults initialization**:
   - Does `hasValidationAnalysis` return true?
   - What are the `validationKeys`? (Expected: blue_highlight, red_line, etc.)
   - Are filters active?

2. **FeedbackMap creation**:
   - How many unique sentences are found?
   - Do sample feedbacks exist?

3. **FeedbackPopover initialization**:
   - Are any popovers being created?
   - What text are they associated with?

4. **Mouse events**:
   - Does hovering trigger "Mouse entered" logs?
   - Is `isOpen` being set to true?

---

## 📋 Investigation Checklist

### Data Integrity
- [ ] Console shows `hasValidationAnalysis: true`
- [ ] Console shows validationKeys array with expected types
- [ ] FeedbackMap has > 0 unique sentences
- [ ] Sample feedbacks are logged correctly

### Component Rendering
- [ ] FeedbackPopover components are initialized (console logs present)
- [ ] Highlighted spans are visible in DOM with correct classes
- [ ] Badge with feedback count is visible on highlights

### Event Handling
- [ ] Mouse enter events are firing (console logs appear)
- [ ] `isOpen` state is being set to true
- [ ] Position is being calculated (check position state)

### Portal Rendering
- [ ] Portal div exists at end of `document.body`
- [ ] Portal has correct z-index (99999)
- [ ] Portal position values are not 0,0

---

## 🔧 Recommended Next Steps

### Immediate Actions
1. **Verify Data Structure**:
   ```tsx
   console.log('Full validationAnalysis:', JSON.stringify(validationAnalysis, null, 2));
   ```
   Compare with working modal data structure

2. **Check DOM Rendering**:
   - Inspect highlighted text in browser DevTools
   - Verify FeedbackPopover trigger spans exist
   - Check for event listeners on spans

3. **Test Portal Rendering**:
   ```tsx
   // In FeedbackPopover, add:
   console.log('Portal rendering:', { isOpen, position, feedbackCount: feedbacks.length });
   ```

4. **Verify Container Overflow**:
   - Inspect parent containers in DevTools
   - Check for `overflow: hidden` or similar constraints
   - Test by temporarily setting all parents to `overflow: visible`

### If Data is Missing
- Check API response format at `/api/dashboard/[slug]/analysis-results`
- Verify Redis data structure matches expected format
- Compare with working modal's `selectedAnalysis` structure

### If Data Exists but Popover Doesn't Show
- Check z-index stacking context issues
- Verify portal is rendering to correct DOM location
- Test by adding visible border/background to portal div
- Check if position calculation returns valid coordinates

### If Events Aren't Firing
- Check parent containers for pointer-events interference
- Verify event listeners are attached (DevTools → Event Listeners)
- Test with onClick instead of onMouseEnter as debug

---

## 📁 Relevant Files

### Core Components
- `/components/medsky/FeedbackPopover.tsx` - Popover component with portal rendering
- `/components/medsky/ValidationResults.tsx` - Main results display with feedback integration
- `/lib/medsky/textHighlighter.tsx` - Text highlighting and feedback mapping logic

### Pages
- `/app/dashboard/[slug]/page.tsx` (lines 634-752) - **Working modal implementation**
- `/app/dashboard/[slug]/analysis/[sessionId]/page.tsx` (lines 455-463) - **Broken page implementation**

### API
- `/app/api/dashboard/[slug]/analysis-results/route.ts` - Data source for analysis page

### Related Components
- `/components/medsky/SubjectCard.tsx` - Uses renderHighlightedText
- `/components/medsky/ActivityCard.tsx` - Uses renderHighlightedText
- `/components/medsky/EnhancedAcademicAnalysisView.tsx` - Uses renderHighlightedText

---

## 🎯 Success Criteria

The issue will be resolved when:
1. ✅ Console logs confirm validationAnalysis data exists on analysis page
2. ✅ FeedbackMap is created with feedbacks on analysis page
3. ✅ FeedbackPopover components are initialized with correct data
4. ✅ Mouse hover events trigger popover display
5. ✅ Portal renders at correct position with visible content
6. ✅ Feedback tooltips appear on hover in analysis page matching modal behavior

---

## 💡 Additional Notes

### Portal Implementation Details
The current implementation uses React Portal to escape DOM hierarchy constraints. This was implemented to solve the original issue where feedback was clipped by parent container overflow.

**Portal Strategy**:
- Renders to `document.body` (root level)
- Uses fixed positioning with calculated coordinates
- Z-index of 99999 to ensure visibility
- Framer Motion for animations

### Previous Fixes Applied
1. Changed from inline rendering to React Portal
2. Increased z-index from 50 to 99999
3. Added scroll/resize position updates
4. Integrated validation analysis with EnhancedAcademicAnalysisView
5. Added debug logging throughout the system

### Known Working Contexts
- ✅ Modal view (dashboard/[slug]/page.tsx)
- ✅ All highlight types (blue_highlight, red_line, etc.)
- ✅ Multiple feedbacks per highlight
- ✅ Scroll and resize handling

### Suspected Non-Working Context
- ❌ Dedicated analysis page tab content
- ❌ Possibly all tab-based content on analysis page

---

**Last Updated**: 2025-10-01
**Status**: Under Investigation
**Priority**: High - User-facing feature not working in production context
