import { OpenAIPlannerService } from '../lib/services/openai-planner.service';
import type { ChatResponses } from '../lib/types/study-plan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAIAPI() {
  console.log('🧪 Testing OpenAI API with new responses.parse format...\n');

  // Sample responses
  const testResponses: ChatResponses = {
    timeRanges: [{ start: '09:00', end: '18:00' }],
    subjects: ['수학', '영어', '과학'],
    subjectDetails: [
      { subject: '수학', content: '미적분 3단원 - 적분의 활용' },
      { subject: '영어', content: '토익 문법 - 시제와 태' },
      { subject: '과학', content: '물리 - 운동과 에너지' },
    ],
    timeAllocation: [
      { subject: '수학', duration: 120 },
      { subject: '영어', duration: 90 },
      { subject: '과학', duration: 90 },
    ],
    motivationalQuote: '오늘도 최선을 다해 목표를 향해 나아가세요!',
  };

  try {
    console.log('📤 Sending request to OpenAI...');
    const startTime = Date.now();

    const result = await OpenAIPlannerService.generateStudyPlan(testResponses);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ API call successful!');
    console.log(`⏱️  Response time: ${duration}ms\n`);
    console.log('📋 Generated Study Plan:');
    console.log('━'.repeat(50));

    // Display the generated plan
    console.log('\n🎯 Motivational Quote:');
    console.log(`   "${result.motivationalQuote || 'No quote generated'}"\n`);

    console.log('📚 Study Schedule:');
    result.plans.forEach((plan, index) => {
      console.log(`\n   ${index + 1}. ${plan.subject}`);
      console.log(`      ⏰ Time: ${plan.startTime} - ${plan.endTime}`);
      console.log(`      📖 Content: ${plan.content}`);
    });

    console.log('\n' + '━'.repeat(50));
    console.log('✨ Test completed successfully!\n');

    // Return success
    return true;
  } catch (error) {
    console.error('❌ Error during API test:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Return failure
    return false;
  }
}

// Run the test
testOpenAIAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });