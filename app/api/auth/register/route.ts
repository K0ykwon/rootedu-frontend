import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getRedisClient } from '../../../../lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 입력 검증
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Redis 연결 보장 후 이메일 중복 확인
    const redis = await getRedisClient();
    const existingUser = await redis.get(`user:email:${email}`);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // 사용자 ID 생성
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 비밀번호 해시
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 데이터 저장
    const userData = {
      id: userId,
      name,
      email,
      passwordHash,
      createdAt: Date.now()
    };

    await redis.hSet(`user:${userId}`, userData);
    await redis.set(`user:email:${email}`, userId);

    return NextResponse.json({ 
      message: 'User created successfully',
      userId 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}