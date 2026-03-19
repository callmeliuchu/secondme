import { NextResponse } from 'next/server'
import { getPlatformAgents } from '@/lib/agent'

export async function GET() {
  const agents = await getPlatformAgents()
  return NextResponse.json({ code: 0, data: agents })
}