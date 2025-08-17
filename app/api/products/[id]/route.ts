import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    
    // TODO: Redis에서 특정 상품 조회
    
    return NextResponse.json({
      product: null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}