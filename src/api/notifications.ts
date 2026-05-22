import client from './client';
import type { ApiResult, Notification, PageResult } from '../types';

// 通知列表
export const listNotifications = (page = 1, size = 10) =>
  client.get<ApiResult<PageResult<Notification>>>('/notifications', { params: { page, size } });

// 标记已读
export const markRead = (id: number) =>
  client.put<ApiResult>(`/notifications/${id}/read`);

// 全部标记已读
export const markAllRead = () =>
  client.put<ApiResult>('/notifications/read-all');

// 未读通知数量
export const getUnreadCount = () =>
  client.get<ApiResult<{ count: number }>>('/notifications/unread-count');
