import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    
    // TODO: Redis에서 특정 게시글 및 댓글 조회
    
    return NextResponse.json({
      post: null,
      comments: []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
}