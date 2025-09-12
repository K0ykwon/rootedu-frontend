import * as fs from 'fs';
import * as path from 'path';

const files = [
  '/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/app/api/dashboard/[slug]/chat/[chatId]/route.ts',
  '/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/app/api/dashboard/[slug]/chat/list/route.ts',
  '/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/app/api/dashboard/[slug]/chat/save/route.ts',
  '/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/app/api/dashboard/[slug]/generate-profile/route.ts',
  '/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/app/api/dashboard/[slug]/analysis-results/route.ts'
];

const oldPattern = /const userRole = \(session\.user as any\)\?\.role;\s*\n\s*const userId = \(session\.user as any\)\?\.userId;([\s\S]*?)if \(userRole !== 'admin' && \(userRole !== 'influencer' \|\| userId !== slug\)\) \{/g;

const newReplacement = `const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;$1// Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {`;

for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file needs updating
    if (content.includes("userRole !== 'influencer'")) {
      // Replace the pattern
      content = content.replace(oldPattern, newReplacement);
      
      // Write back the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
    } else {
      console.log(`⏭️ Skipped (already fixed): ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

console.log('\n🎉 Auth check fixes complete!');