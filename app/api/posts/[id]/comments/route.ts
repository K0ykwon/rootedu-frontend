import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // TODO: Redis에 새 댓글 저장
    
    return NextResponse.json({
      id: 'temp_comment_id',
      createdAt: Date.now()
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}