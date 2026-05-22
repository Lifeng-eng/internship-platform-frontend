import client from './client';
import type { ApiResult, Job, PageResult } from '../types';

// 岗位列表
export const listJobs = (params: {
  page?: number; size?: number; keyword?: string; location?: string;
  salaryMin?: number; salaryMax?: number; sort?: string;
}) => client.get<ApiResult<PageResult<Job>>>('/jobs', { params });

// 岗位详情
export const getJobDetail = (id: number) =>
  client.get<ApiResult<Job>>(`/jobs/${id}`);

// 发布岗位
export const createJob = (data: {
  title: string; location: string; description: string; requirements: string;
  salaryMin?: number; salaryMax?: number;
}) => client.post<ApiResult>('/jobs', data);

// 编辑岗位
export const updateJob = (id: number, data: {
  title: string; location: string; description: string; requirements: string;
  salaryMin?: number; salaryMax?: number;
}) => client.put<ApiResult>(`/jobs/${id}`, data);

// 删除岗位
export const deleteJob = (id: number) =>
  client.delete<ApiResult>(`/jobs/${id}`);

// 下架岗位
export const closeJob = (id: number) =>
  client.post<ApiResult>(`/jobs/${id}/close`);

// 推荐岗位
export const getRecommendedJobs = () =>
  client.get<ApiResult<Job[]>>('/jobs/recommended');
