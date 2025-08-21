import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    
    // MVP: 구매 기능은 스텁으로 처리
    return NextResponse.json({ 
      error: 'Purchase functionality will be available soon' 
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}