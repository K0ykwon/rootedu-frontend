import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sort = searchParams.get('sort') || 'latest';

    // TODO: Redis에서 커뮤니티 게시글 조회
    
    return NextResponse.json({
      items: [],
      page,
      pageSize,
      total: 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: content, tags } = body;
    
    // TODO: Redis에 새 게시글 저장
    
    return NextResponse.json({
      id: 'temp_id',
      createdAt: Date.now()
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}