// 通用类型定义

// 用户信息
export interface UserInfo {
  id: number;
  name: string;
  role: 'student' | 'company' | 'admin';
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  id: number;
  role: string;
  name: string;
  mustChangePassword?: number;
}

// 学生注册
export interface RegisterStudentRequest {
  username: string;
  password: string;
  name: string;
  studentId: string;
  major: string;
  phone: string;
  email?: string;
  preferredJobs?: string;
  preferredLocations?: string;
}

// 企业注册
export interface RegisterCompanyRequest {
  username: string;
  password: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  companyIntro?: string;
  companyScale?: string;
}

// 岗位
export interface Job {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  companyIntro?: string;
  companyScale?: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  description: string;
  requirements: string;
  status: string;
  publishTime: string;
  reviewTime?: string;
  applyStatus?: string;
  applicationId?: number;
}

// 投递
export interface ApplicationVO {
  id: number;
  studentId: number;
  jobId: number;
  status: string;
  resumePath: string;
  applyComment?: string;
  handleComment?: string;
  applyTime: string;
  handleTime?: string;
  jobTitle?: string;
  companyName?: string;
  studentName?: string;
  studentIdNum?: string;
  major?: string;
}

// 通知
export interface Notification {
  id: number;
  receiverId: number;
  senderId?: number;
  content: string;
  type: 'application' | 'review';
  status: 'unread' | 'read';
  sendTime: string;
}

// 用户管理
export interface UserVO {
  id: number;
  username: string;
  email?: string;
  phone: string;
  role: string;
  status: string;
  createTime: string;
  name?: string;
  companyName?: string;
}

// 分页结果
export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 会话
export interface ConversationVO {
  id: number;
  applicationId: number;
  studentId: number;
  companyId: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  studentName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  createTime: string;
}

// 消息
export interface MessageVO {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  isRead: boolean;
  sendTime: string;
}

// API 响应
export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}
