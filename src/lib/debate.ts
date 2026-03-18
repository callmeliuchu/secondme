import { prisma } from './prisma'
import { Debate, DebateMessage, DebateVote, DebateComment, DebateParticipant } from '@prisma/client'

export type DebateWithRelations = Debate & {
  messages: DebateMessage[]
  votes: DebateVote[]
  comments: DebateComment[]
  participants: DebateParticipant[]
  _count?: {
    votes: number
    participants: number
  }
}

export type DebateListItem = Debate & {
  _count?: {
    votes: number
    participants: number
  }
}

export type VoteCounts = {
  positive: number
  negative: number
}

export async function createDebate(topic: string, userId: string): Promise<Debate> {
  if (!topic || topic.trim().length === 0) {
    throw new Error('辩论话题不能为空')
  }
  if (!userId) {
    throw new Error('用户ID不能为空')
  }

  return prisma.debate.create({
    data: {
      topic: topic.trim(),
      createdBy: userId,
      status: 'pending',
      positivePersona: '',
      negativePersona: '',
    },
  })
}

export async function getDebateById(id: string): Promise<DebateWithRelations | null> {
  if (!id) {
    throw new Error('辩论ID不能为空')
  }

  return prisma.debate.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      votes: true,
      comments: { orderBy: { createdAt: 'desc' } },
      participants: true,
    },
  })
}

export async function getDebateList(limit = 20, offset = 0): Promise<DebateListItem[]> {
  if (limit < 0 || offset < 0) {
    throw new Error('分页参数无效')
  }

  return prisma.debate.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      _count: {
        select: { votes: true, participants: true },
      },
    },
  })
}

export async function addDebateMessage(
  debateId: string,
  role: 'positive' | 'negative' | 'user',
  content: string
): Promise<DebateMessage> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }
  if (!content || content.trim().length === 0) {
    throw new Error('消息内容不能为空')
  }

  return prisma.debateMessage.create({
    data: {
      debateId,
      role,
      content: content.trim(),
    },
  })
}

export async function voteDebate(
  debateId: string,
  voterId: string,
  side: 'positive' | 'negative'
): Promise<DebateVote> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }
  if (!voterId) {
    throw new Error('投票者ID不能为空')
  }
  if (side !== 'positive' && side !== 'negative') {
    throw new Error('无效的投票方向')
  }

  return prisma.debateVote.upsert({
    where: {
      debateId_voterId: { debateId, voterId },
    },
    update: { side },
    create: { debateId, voterId, side },
  })
}

export async function updateDebate(
  id: string,
  data: { status?: string; positivePersona?: string; negativePersona?: string; roundCount?: number }
): Promise<Debate> {
  if (!id) {
    throw new Error('辩论ID不能为空')
  }

  return prisma.debate.update({
    where: { id },
    data,
  })
}

export async function endDebate(debateId: string, userId: string): Promise<Debate> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }
  if (!userId) {
    throw new Error('用户ID不能为空')
  }

  return prisma.debate.update({
    where: { id: debateId },
    data: {
      status: 'ended',
      endedAt: new Date(),
      endedBy: userId,
    },
  })
}

export async function joinDebate(debateId: string, userId: string): Promise<DebateParticipant> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }
  if (!userId) {
    throw new Error('用户ID不能为空')
  }

  return prisma.debateParticipant.upsert({
    where: {
      debateId_userId: { debateId, userId },
    },
    update: {},
    create: { debateId, userId },
  })
}

export async function addComment(debateId: string, userId: string, content: string): Promise<DebateComment> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }
  if (!userId) {
    throw new Error('用户ID不能为空')
  }
  if (!content || content.trim().length === 0) {
    throw new Error('评论内容不能为空')
  }

  return prisma.debateComment.create({
    data: { debateId, userId, content: content.trim() },
  })
}

export async function getVoteCounts(debateId: string): Promise<VoteCounts> {
  if (!debateId) {
    throw new Error('辩论ID不能为空')
  }

  const votes = await prisma.debateVote.findMany({
    where: { debateId },
  })
  return {
    positive: votes.filter((v) => v.side === 'positive').length,
    negative: votes.filter((v) => v.side === 'negative').length,
  }
}
