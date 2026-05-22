import client from './client';
import type { ConversationVO, MessageVO } from '../types';

export const listConversations = () =>
  client.get<{ code: number; data: ConversationVO[] }>('/chat/conversations');

export const listMessages = (conversationId: number, page = 1, size = 50) =>
  client.get<{ code: number; data: MessageVO[] }>(`/chat/conversations/${conversationId}/messages`, { params: { page, size } });

export const sendMessage = (applicationId: number, content: string) =>
  client.post<{ code: number; data: MessageVO }>('/chat/send', { applicationId, content });

export const getUnreadChatCount = () =>
  client.get<{ code: number; data: { count: number } }>('/chat/unread-count');

export const markConversationRead = (conversationId: number) =>
  client.put(`/chat/conversations/${conversationId}/read`);

export const getOrCreateConversation = (applicationId: number) =>
  client.post<{ code: number; data: { conversationId: number } }>('/chat/conversations', { applicationId });
