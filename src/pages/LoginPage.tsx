import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Radio, Alert, message, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import type { LoginRequest } from '../types';

const { Title, Text } = Typography;

/** 渐变背景样式（与原型 CSS 一致） */
const gradientBg: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
};

/** 登录卡片样式 */
const cardStyle: React.CSSProperties = {
  width: 420,
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [role, setRole] = useState<'student' | 'company' | 'admin'>('student');

  /** 处理登录提交 */
  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await login(values);
      const result = res.data;

      // 登录成功 (code 200 或 4003 管理员首次登录)
      if ((result.code === 200 || result.code === 4003) && result.data) {
        const { accessToken, refreshToken, id, role: userRole, name, mustChangePassword } = result.data;

        // 将用户信息存入 auth store
        setAuth({ id, name, role: userRole }, accessToken, refreshToken);

        // 管理员首次登录需改密
        if (mustChangePassword === 1 || result.code === 4003) {
          message.warning('首次登录，请先修改密码');
          navigate('/admin/profile');
          return;
        }

        message.success('登录成功');
        navigate('/');
        return;
      }

      // 其他业务错误
      setErrorMsg(result.message || '登录失败，请重试');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '网络错误，请稍后重试';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  /** 角色选择变化时重置错误提示 */
  const handleRoleChange = (e: any) => {
    setRole(e.target.value);
    setErrorMsg('');
    form.resetFields();
  };

  return (
    <div style={gradientBg}>
      <Card style={cardStyle}>
        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            实习就业管理系统
          </Title>
          <Text type="secondary">欢迎回来，请登录您的账户</Text>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, borderRadius: 6 }}
            onClose={() => setErrorMsg('')}
          />
        )}

        {/* 角色选择 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            选择角色
          </Text>
          <Radio.Group
            value={role}
            onChange={handleRoleChange}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="student">学生</Radio.Button>
            <Radio.Button value="company">企业</Radio.Button>
            <Radio.Button value="admin">管理员</Radio.Button>
          </Radio.Group>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名/邮箱/手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 / 邮箱 / 手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* 底部链接 */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ fontSize: 14 }}>
            忘记密码？
          </Link>
          <Text type="secondary" style={{ margin: '0 8px' }}>|</Text>
          <Link to="/register/student" style={{ fontSize: 14 }}>
            学生注册
          </Link>
          <Text type="secondary" style={{ margin: '0 8px' }}>|</Text>
          <Link to="/register/company" style={{ fontSize: 14 }}>
            企业注册
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
