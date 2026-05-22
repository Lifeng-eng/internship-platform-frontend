import client from './client';
import type { ApiResult, LoginRequest, LoginResponse, RegisterStudentRequest, RegisterCompanyRequest } from '../types';

// 学生注册
export const registerStudent = (data: RegisterStudentRequest) =>
  client.post<ApiResult>('/auth/register/student', data);

// 企业注册
export const registerCompany = (data: RegisterCompanyRequest) =>
  client.post<ApiResult>('/auth/register/company', data);

// 登录
export const login = (data: LoginRequest) =>
  client.post<ApiResult<LoginResponse>>('/auth/login', data);

// 刷新 token
export const refreshToken = (refreshToken: string) =>
  client.post<ApiResult<string>>('/auth/refresh', { refreshToken });

// 申请密码重置
export const requestPasswordReset = (phone: string) =>
  client.post<ApiResult<string>>('/auth/reset-password/request', { phone });

// 校验验证码并重置密码
export const verifyAndResetPassword = (phone: string, code: string, newPassword: string) =>
  client.post<ApiResult>('/auth/reset-password/verify', { phone, code, newPassword });
