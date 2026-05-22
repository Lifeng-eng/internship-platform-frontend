import client from './client';
import type { ApiResult } from '../types';

// 获取个人信息
export const getProfile = () =>
  client.get<ApiResult<Record<string, unknown>>>('/profile');

// 更新个人信息
export const updateProfile = (data: Record<string, unknown>) =>
  client.put<ApiResult>('/profile', data);

// 上传简历
export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post<ApiResult<string>>('/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 获取简历信息
export const getResumeInfo = () =>
  client.get<ApiResult<{ resumePath: string } | null>>('/profile/resume/info');

// 删除简历
export const deleteResume = () =>
  client.delete<ApiResult>('/profile/resume');

// 修改密码
export const changePassword = (oldPassword: string, newPassword: string) =>
  client.put<ApiResult>('/profile/password', { oldPassword, newPassword });

// 企业统计
export const getCompanyStats = () =>
  client.get<ApiResult<Record<string, unknown>>>('/company/stats');

// 下载简历（带认证）
export const downloadResume = async (resumePath: string) => {
  const res = await client.get('/profile/resume', {
    params: { path: resumePath },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resume.pdf';
  link.click();
  window.URL.revokeObjectURL(url);
};

// 企业自有岗位
export const listCompanyJobs = (page = 1, size = 10, status?: string) =>
  client.get<ApiResult<unknown>>('/company/jobs', { params: { page, size, status } });
