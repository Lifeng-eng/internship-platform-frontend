import client from './client';
import type { ApiResult, Job, UserVO, PageResult } from '../types';

// 待审核岗位列表
export const listPendingJobs = (page = 1, size = 10) =>
  client.get<ApiResult<PageResult<Job>>>('/admin/jobs/pending', { params: { page, size } });

// 审核岗位
export const reviewJob = (id: number, result: string, comment?: string) =>
  client.post<ApiResult>(`/admin/jobs/${id}/review`, { result, comment });

// 用户列表
export const listUsers = (page = 1, size = 10, role?: string) =>
  client.get<ApiResult<PageResult<UserVO>>>('/admin/users', { params: { page, size, role } });

// 禁用用户
export const disableUser = (id: number, reason?: string) =>
  client.put<ApiResult>(`/admin/users/${id}/disable`, { reason });

// 启用用户
export const enableUser = (id: number) =>
  client.put<ApiResult>(`/admin/users/${id}/enable`);

// 管理员统计
export const getAdminStats = () =>
  client.get<ApiResult<Record<string, unknown>>>('/admin/stats');
