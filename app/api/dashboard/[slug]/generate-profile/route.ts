import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;
    const params = await context.params;
    const slug = params.slug;

    // Check access permissions
    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get analysis data
      const analysisKey = `${slug}:analysis_data:${sessionId}`;
      const analysisData = await redis.get(analysisKey);
      
      if (!analysisData) {
        return NextResponse.json({ error: 'Analysis data not found' }, { status: 404 });
      }

      const analysis = JSON.parse(analysisData);
      
      // Check if profile already exists
      const profileKey = `${slug}:profile:${sessionId}`;
      const existingProfile = await redis.get(profileKey);
      
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        return NextResponse.json({ 
          profile: profile.profile,
          cached: true 
        });
      }

      // Generate profile using OpenAI
      const prompt = `
다음은 학생의 생활기록부 분석 결과입니다. 이를 바탕으로 학생의 프로필을 한국어로 작성해주세요.

분석 데이터:
${JSON.stringify(analysis.analysis || analysis, null, 2)}

다음 형식으로 학생 프로필을 작성해주세요:

**1. 관심 분야:**
- 학생의 주요 관심사와 열정을 보이는 영역을 구체적으로 서술

**2. 현재 상태:**
- 학업 성취도, 활동 참여도, 리더십 경험 등 현재 학생의 상태를 객관적으로 평가

**3. 유의사항 및 특이점:**
- 진로 상담 시 고려해야 할 특별한 점이나 개선이 필요한 부분
- 강점을 더욱 발전시킬 수 있는 방향 제시

전체 내용은 300-500자 내외로 작성하고, 학생의 잠재력과 발전 가능성을 강조하여 긍정적인 톤으로 작성해주세요.
      `;

      const completion = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "당신은 교육 전문가이자 진로 상담사입니다. 학생의 생활기록부를 분석하여 종합적이고 건설적인 프로필을 작성합니다. 학생의 생활기록부는 학생의 학업 성적, 활동 참여도, 리더십 경험 등 현재 학생의 상태를 객관적으로 평가한 결과입니다."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_output_tokens: 5000,
      });

      const generatedProfile = completion.output_text || '';

      if (!generatedProfile) {
        return NextResponse.json({ error: 'Failed to generate profile' }, { status: 500 });
      }

      // Save generated profile to Redis
      const profileData = {
        sessionId,
        profile: generatedProfile,
        generatedAt: new Date().toISOString(),
        generatedBy: userId
      };

      await redis.set(profileKey, JSON.stringify(profileData));

      return NextResponse.json({ 
        profile: generatedProfile,
        cached: false
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error generating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}