import client from './client';
import type { ApiResult, ApplicationVO, PageResult } from '../types';

// 投递岗位
export const apply = (jobId: number, applyComment?: string) =>
  client.post<ApiResult>('/applications', { jobId, applyComment });

// 投递列表
export const listApplications = (page = 1, size = 10, status?: string) =>
  client.get<ApiResult<PageResult<ApplicationVO>>>('/applications', { params: { page, size, status } });

// 处理投递
export const handleApplication = (id: number, action: string, handleComment?: string) =>
  client.put<ApiResult>(`/applications/${id}`, { action, handleComment });

// 撤销投递
export const cancelApplication = (id: number) =>
  client.post<ApiResult>(`/applications/${id}/cancel`);
