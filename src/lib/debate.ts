import { prisma } from './prisma'

export async function createDebate(topic: string, userId: string) {
  return prisma.debate.create({
    data: {
      topic,
      createdBy: userId,
      status: 'pending',
    },
  })
}

export async function getDebateById(id: string) {
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

export async function getDebateList(limit = 20, offset = 0) {
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
) {
  return prisma.debateMessage.create({
    data: {
      debateId,
      role,
      content,
    },
  })
}

export async function voteDebate(debateId: string, voterId: string, side: 'positive' | 'negative') {
  return prisma.debateVote.upsert({
    where: {
      debateId_voterId: { debateId, voterId },
    },
    update: { side },
    create: { debateId, voterId, side },
  })
}

export async function updateDebate(id: string, data: { status?: string; positivePersona?: string; negativePersona?: string; roundCount?: number }) {
  return prisma.debate.update({
    where: { id },
    data,
  })
}

export async function endDebate(debateId: string, userId: string) {
  return prisma.debate.update({
    where: { id: debateId },
    data: {
      status: 'ended',
      endedAt: new Date(),
      endedBy: userId,
    },
  })
}

export async function joinDebate(debateId: string, userId: string) {
  return prisma.debateParticipant.upsert({
    where: {
      debateId_userId: { debateId, userId },
    },
    update: {},
    create: { debateId, userId },
  })
}

export async function addComment(debateId: string, userId: string, content: string) {
  return prisma.debateComment.create({
    data: { debateId, userId, content },
  })
}

export async function getVoteCounts(debateId: string) {
  const votes = await prisma.debateVote.findMany({
    where: { debateId },
  })
  return {
    positive: votes.filter((v) => v.side === 'positive').length,
    negative: votes.filter((v) => v.side === 'negative').length,
  }
}
