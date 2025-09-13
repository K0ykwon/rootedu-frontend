import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'database', 'KICE.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('KICE 데이터 로드 실패:', error)
    return NextResponse.json(
      { error: '데이터를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
