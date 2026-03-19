import { prisma } from './prisma'
import { AIAgent } from '@prisma/client'

export type CreateAgentInput = {
  userId: string
  name: string
  personality: string
  hobbies?: string
  appearance?: string
  intro?: string
}

export async function createAgent(data: CreateAgentInput): Promise<AIAgent> {
  return prisma.aIAgent.create({
    data: {
      userId: data.userId,
      name: data.name,
      personality: data.personality,
      hobbies: data.hobbies || '',
      appearance: data.appearance || '',
      intro: data.intro || '',
    },
  })
}

export type CreatePlatformAgentInput = {
  name: string
  personality: string
  hobbies?: string
  appearance?: string
  intro?: string
}

export async function createPlatformAgent(data: CreatePlatformAgentInput): Promise<AIAgent> {
  return prisma.aIAgent.create({
    data: {
      name: data.name,
      personality: data.personality,
      hobbies: data.hobbies || '',
      appearance: data.appearance || '',
      intro: data.intro || '',
      isPlatform: true,
    },
  })
}

export async function getAgentById(id: string): Promise<AIAgent | null> {
  return prisma.aIAgent.findUnique({ where: { id } })
}

export async function getUserAgents(userId: string): Promise<AIAgent[]> {
  return prisma.aIAgent.findMany({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRandomAgent(excludeUserId: string, excludeAgentId?: string): Promise<AIAgent | null> {
  const agents = await prisma.aIAgent.findMany({
    where: {
      userId: { not: excludeUserId },
      id: excludeAgentId ? { not: excludeAgentId } : undefined,
      status: 'active',
      isPlatform: false,
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  })
  return agents[0] || null
}

export async function getPlatformAgents(): Promise<AIAgent[]> {
  return prisma.aIAgent.findMany({
    where: { isPlatform: true, status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getRandomPlatformAgent(): Promise<AIAgent | null> {
  const agents = await prisma.aIAgent.findMany({
    where: { isPlatform: true, status: 'active' },
    take: 1,
    orderBy: { createdAt: 'asc' },
  })
  return agents[0] || null
}

export async function getRandomSelfMatchAgent(userId: string, excludeAgentId: string): Promise<AIAgent | null> {
  const agents = await prisma.aIAgent.findMany({
    where: {
      userId,
      id: { not: excludeAgentId },
      status: 'active',
      isPlatform: false,
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  })
  return agents[0] || null
}

export async function updateAgent(id: string, data: Partial<CreateAgentInput>): Promise<AIAgent> {
  return prisma.aIAgent.update({
    where: { id },
    data,
  })
}

export async function deleteAgent(id: string): Promise<void> {
  await prisma.aIAgent.update({
    where: { id },
    data: { status: 'inactive' },
  })
}