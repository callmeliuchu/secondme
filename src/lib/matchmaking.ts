import { prisma } from './prisma'
import { MatchSession, ChatMessage } from '@prisma/client'

export type MatchSessionWithRelations = MatchSession & {
  agent1: { name: string; avatar: string | null; personality: string }
  agent2: { name: string; avatar: string | null; personality: string }
  messages: ChatMessage[]
}

export async function createMatchSession(
  userId: string,
  agent1Id: string,
  agent2Id: string
): Promise<MatchSession> {
  return prisma.matchSession.create({
    data: {
      userId,
      agent1Id,
      agent2Id,
      status: 'pending',
    },
  })
}

export async function getMatchSessionById(id: string): Promise<MatchSessionWithRelations | null> {
  return prisma.matchSession.findUnique({
    where: { id },
    include: {
      agent1: { select: { name: true, avatar: true, personality: true } },
      agent2: { select: { name: true, avatar: true, personality: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export async function addChatMessage(
  sessionId: string,
  agentId: string,
  content: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: { sessionId, agentId, content },
  })
}

export async function endMatchSession(id: string, matchScore: number): Promise<MatchSession> {
  return prisma.matchSession.update({
    where: { id },
    data: {
      status: 'ended',
      endedAt: new Date(),
      matchScore,
    },
  })
}

export async function getUserMatchSessions(userId: string, limit = 10): Promise<MatchSession[]> {
  return prisma.matchSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}