import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getRedisClient, User } from '../../../../lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { name, userId, studentPhoneNumber, parentPhoneNumber, userType, password } = await request.json();

    // 입력 검증
    if (!name || !userId || !studentPhoneNumber || !parentPhoneNumber || !userType || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 사용자 유형 검증
    if (userType !== 'student' && userType !== 'parent' && userType !== 'influencer') {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    // 전화번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(studentPhoneNumber)) {
      return NextResponse.json({ error: 'Invalid student phone number format. Use 010-0000-0000' }, { status: 400 });
    }
    if (!phoneRegex.test(parentPhoneNumber)) {
      return NextResponse.json({ error: 'Invalid parent phone number format. Use 010-0000-0000' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Redis 연결 보장 후 사용자 ID 중복 확인
    const redis = await getRedisClient();
    const existingUser = await redis.get(`user:userId:${userId}`);
    if (existingUser) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 409 });
    }

    // 내부 사용자 ID 생성 (고유 식별자)
    const internalId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 비밀번호 해시
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 데이터 저장
    const userData: Omit<User, 'role'> = {
      id: internalId,
      name,
      userId,
      studentPhoneNumber,
      parentPhoneNumber,
      userType: userType as 'student' | 'parent' | 'influencer',
      passwordHash,
      createdAt: Date.now()
    };

    await redis.hSet(`user:${internalId}`, {
      ...userData,
      createdAt: userData.createdAt.toString()
    } as Record<string, string>);
    await redis.set(`user:userId:${userId}`, internalId);

    return NextResponse.json({ 
      message: 'User created successfully',
      userId,
      internalId 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}