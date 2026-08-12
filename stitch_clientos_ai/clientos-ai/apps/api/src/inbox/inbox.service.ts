import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

function parseJsonList(value?: string | null): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function toApi(conversation: any) {
  return {
    id: conversation.id,
    company: conversation.company,
    contact: conversation.contact,
    title: conversation.title,
    time: new Date(conversation.lastMessageAt).toLocaleString(),
    tags: parseJsonList(conversation.tags),
    score: conversation.score,
    intent: conversation.intent,
    friction: parseJsonList(conversation.friction),
    pitch: conversation.pitch,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: (conversation.messages || []).map((m: any) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      isMe: m.isMe,
      sentAt: m.sentAt.toISOString(),
      time: new Date(m.sentAt).toLocaleString(),
    })),
  };
}

@Injectable()
export class InboxService {
  async list(orgId: string) {
    const conversations = await prisma.conversation.findMany({
      where: { organizationId: orgId },
      include: {
        messages: { orderBy: { sentAt: 'asc' } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    return { data: conversations.map(toApi) };
  }

  async get(orgId: string, id: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
      include: {
        messages: { orderBy: { sentAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return toApi(conversation);
  }

  async create(orgId: string, data: any) {
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: orgId,
        company: data.company ?? '',
        contact: data.contact ?? '',
        title: data.title ?? '',
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        score: data.score ?? 0,
        intent: data.intent ?? '',
        friction: data.friction ? JSON.stringify(data.friction) : '[]',
        pitch: data.pitch ?? '',
      },
      include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    return toApi(conversation);
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Conversation not found');

    const patch: any = {};
    if (data.company !== undefined) patch.company = data.company;
    if (data.contact !== undefined) patch.contact = data.contact;
    if (data.title !== undefined) patch.title = data.title;
    if (data.tags !== undefined) patch.tags = JSON.stringify(data.tags);
    if (data.score !== undefined) patch.score = data.score;
    if (data.intent !== undefined) patch.intent = data.intent;
    if (data.friction !== undefined) patch.friction = JSON.stringify(data.friction);
    if (data.pitch !== undefined) patch.pitch = data.pitch;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: patch,
      include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    return toApi(conversation);
  }

  async sendMessage(orgId: string, id: string, data: any) {
    const existing = await prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Conversation not found');

    const now = new Date();
    await prisma.inboxMessage.create({
      data: {
        conversationId: id,
        sender: data.sender,
        body: data.body,
        isMe: data.isMe ?? true,
        sentAt: now,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: now, updatedAt: now },
    });

    return this.get(orgId, id);
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.conversation.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Conversation not found');
    await prisma.conversation.delete({ where: { id } });
    return { id };
  }
}
