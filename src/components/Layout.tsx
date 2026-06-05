import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { Layout as AntLayout, Button, Space, Badge, Dropdown, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { getUnreadCount } from '../api/notifications';
import { getUnreadChatCount } from '../api/chat';

const { Header, Content, Footer } = AntLayout;

// 全局布局组件 - 顶部导航栏 + 内容区 + 底部
export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      if (res.data.code === 200 && res.data.data) {
        setUnreadCount(res.data.data.count);
      }
    } catch {
      // 静默处理
    }
  }, [user]);

  const fetchChatUnread = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    try {
      const res = await getUnreadChatCount();
      if (res.data.code === 200 && res.data.data) {
        setChatUnreadCount(res.data.data.count);
      }
    } catch {
      // 静默处理
    }
  }, [user]);

  useEffect(() => {
    fetchUnread();
    fetchChatUnread();
  }, [fetchUnread, fetchChatUnread]);

  // 路由变化时刷新未读数（用户从通知页返回后）
  useEffect(() => {
    fetchUnread();
    fetchChatUnread();
  }, [location.pathname, fetchUnread, fetchChatUnread]);

  // 退出登录
  const handleLogout = () => {
    clearAuth();
    message.info('已退出登录');
    navigate('/');
  };

  // 导航菜单项
  const studentMenuItems = [
    { key: 'applications', label: '我的投递', onClick: () => navigate('/student/applications') },
    { key: 'profile', label: '个人中心', onClick: () => navigate('/student/profile') },
  ];

  const companyMenuItems = [
    { key: 'jobs', label: '我的岗位', onClick: () => navigate('/company/jobs') },
    { key: 'applications', label: '收到的投递', onClick: () => navigate('/company/applications') },
    { key: 'stats', label: '数据统计', onClick: () => navigate('/company/stats') },
    { key: 'profile', label: '企业中心', onClick: () => navigate('/company/profile') },
  ];

  const adminMenuItems = [
    { key: 'review', label: '岗位审核', onClick: () => navigate('/admin/jobs') },
    { key: 'users', label: '用户管理', onClick: () => navigate('/admin/users') },
    { key: 'stats', label: '数据统计', onClick: () => navigate('/admin/stats') },
  ];

  const userDropdownItems = [
    { key: 'profile', label: '个人中心', onClick: () => navigate(`/${user?.role}/profile`) },
    { key: 'logout', label: '退出登录', onClick: handleLogout },
  ];

  const registerItems = [
    { key: 'student', label: '学生注册', onClick: () => navigate('/register/student') },
    { key: 'company', label: '企业注册', onClick: () => navigate('/register/company') },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Logo */}
        <div style={{ color: '#1677ff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
             onClick={() => navigate('/')}>
          <span>🎓</span>
          <span>实习通</span>
        </div>

        {/* 导航区域 */}
        <Space>
          <Button type="link" onClick={() => navigate('/')}>首页</Button>

          {user?.role === 'student' && studentMenuItems.map(item => (
            <Button key={item.key} type="link" onClick={item.onClick}>{item.label}</Button>
          ))}

          {user?.role === 'company' && companyMenuItems.map(item => (
            <Button key={item.key} type="link" onClick={item.onClick}>{item.label}</Button>
          ))}

          {user?.role === 'admin' && adminMenuItems.map(item => (
            <Button key={item.key} type="link" onClick={item.onClick}>{item.label}</Button>
          ))}

          {/* 通知 */}
          <Badge count={unreadCount} overflowCount={99}>
            <Button type="link" onClick={() => navigate('/notifications')}>通知</Button>
          </Badge>

          {/* 消息（仅学生和企业） */}
          {user && user.role !== 'admin' && (
            <Badge count={chatUnreadCount} overflowCount={99}>
              <Button type="link" onClick={() => navigate('/chat')}>消息</Button>
            </Badge>
          )}

          {/* 用户区域 */}
          {user ? (
            <Dropdown menu={{ items: userDropdownItems }}>
              <Button type="primary">{user.name}</Button>
            </Dropdown>
          ) : (
            <Space>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Dropdown menu={{ items: registerItems }}>
                <Button type="primary">注册</Button>
              </Dropdown>
            </Space>
          )}
        </Space>
      </Header>

      <Content style={{ background: '#f5f5f5' }}>
        {children}
      </Content>

      <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>
        © 2026 实习通 — 大学生实训实习岗位投递与校企对接系统
      </Footer>
    </AntLayout>
  );
}
