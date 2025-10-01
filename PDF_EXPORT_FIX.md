# PDF Export Serverless Fix - Deployment Guide

## 🔍 Root Cause Summary

**Problem:** "The client is closed" error in production (Vercel/serverless)

**Root Cause:**
- Global browser instance reuse failed in serverless environments
- Serverless platforms freeze execution contexts when idle
- Browser process terminated by platform, but global reference remained
- Next request attempted to use closed browser → error

**Why Local Worked:**
- Persistent Node.js process
- Browser stayed alive between requests
- No container freezing/thawing

---

## ✅ Fixes Implemented

### 1. **Serverless Environment Detection** (`lib/medsky/pdfGenerator.ts`)
```typescript
function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.CLOUDFLARE_WORKERS
  );
}
```

### 2. **Conditional Browser Instance Management**
- **Serverless:** Always creates fresh browser (no reuse)
- **Local Dev:** Reuses browser for performance
- **Robust Connection Check:** Tests browser responsiveness with `browser.version()`

### 3. **Comprehensive Error Handling**
- **Retry Logic:** 3 automatic retries with 1-second delay
- **Proper Cleanup:** Closes browser/page on errors
- **Detailed Logging:** Enhanced error messages for debugging

### 4. **Serverless-Optimized Configuration**
- Added serverless-specific Chrome flags
- Proper resource cleanup after use
- Extended timeout: 60s → 300s for cold starts

---

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Fix: Resolve PDF export 'client is closed' error in serverless"
git push origin main
```

### Step 2: Verify Vercel Deployment
1. Monitor Vercel deployment dashboard
2. Check build logs for any errors
3. Verify environment variables are set

### Step 3: Test in Production
1. Navigate to analysis result page
2. Click "PDF 내보내기" button
3. Verify PDF downloads successfully
4. Check Vercel function logs for errors

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to analysis result
- [ ] Export PDF (should reuse browser instance)
- [ ] Check console logs for "♻️ Reusing browser instance"

### Production Testing
- [ ] Deploy to Vercel
- [ ] Wait for deployment completion
- [ ] Test PDF export on live URL
- [ ] Check Vercel function logs
- [ ] Verify "🌐 Serverless environment detected" in logs
- [ ] Test multiple exports (cold start + warm requests)

### Edge Cases
- [ ] Test after 5-10 minutes of inactivity (cold start)
- [ ] Test concurrent PDF requests
- [ ] Test with large analysis results (>5 pages)
- [ ] Test error recovery (should retry 3 times)

---

## 📊 Monitoring

### Success Indicators
```
✅ PDF generated successfully in XXXms (X.XXMB)
🌐 Serverless environment detected - creating fresh browser instance
```

### Error Indicators to Watch
```
❌ PDF generation failed (X retries left)
🔄 Retrying PDF generation... (X attempts remaining)
⚠️ Existing browser instance unresponsive, creating new one
```

### Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Find `/api/dashboard/[slug]/analysis/[sessionId]/export-pdf`
3. Monitor execution time and errors
4. Check for cold start performance

---

## 🔧 Configuration Changes

### Modified Files
1. **lib/medsky/pdfGenerator.ts**
   - Serverless detection
   - Conditional browser reuse
   - Retry logic
   - Enhanced error handling

2. **app/api/dashboard/[slug]/analysis/[sessionId]/export-pdf/route.ts**
   - Increased timeout: 60s → 300s

### Environment Variables (No changes needed)
- Serverless detection uses platform-provided env vars
- No additional configuration required

---

## 🚨 Troubleshooting

### If PDF Export Still Fails

#### 1. Check Vercel Function Logs
```bash
vercel logs --app rootedu-platform --limit 50
```

#### 2. Verify Puppeteer Installation
- Puppeteer version: `24.22.3` (already in package.json)
- Chromium should auto-download during build
- Check Vercel build logs for download errors

#### 3. Memory/Timeout Issues
Current settings:
- `maxDuration: 300` (5 minutes)
- Default Vercel memory: 1024MB

If needed, increase in `vercel.json`:
```json
{
  "functions": {
    "app/api/dashboard/[slug]/analysis/[sessionId]/export-pdf/route.ts": {
      "memory": 3008,
      "maxDuration": 300
    }
  }
}
```

#### 4. Still Having Issues?
Consider upgrading to **Phase 2: Serverless-Optimized Chromium**
- Switch to `@sparticuz/chromium` (50MB vs 170MB)
- Faster cold starts
- Better serverless compatibility

---

## 📈 Next Steps (Future Optimization)

### Phase 2: Serverless-Optimized Chromium
```bash
npm install puppeteer-core @sparticuz/chromium
npm uninstall puppeteer
```

Benefits:
- 70% smaller binary size
- 3-5x faster cold starts
- Built specifically for serverless

### Phase 3: Monitoring & Alerts
- Add PDF generation metrics
- Set up error alerting
- Track success/failure rates
- Monitor cold start performance

---

## 📝 Summary

**Changes Made:**
✅ Serverless environment detection
✅ Conditional browser instance management
✅ Retry logic (3 attempts)
✅ Enhanced error handling
✅ Proper resource cleanup
✅ Extended timeout (300s)
✅ Serverless-optimized Chrome flags

**Expected Outcome:**
- PDF export works reliably in production
- Automatic recovery from transient errors
- Better logging for debugging
- No more "client is closed" errors

**Deploy and test immediately!** 🚀
