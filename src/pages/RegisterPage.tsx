import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Row, Col, message, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, BookOutlined, TeamOutlined, ContactsOutlined } from '@ant-design/icons';
import { registerStudent, registerCompany } from '../api/auth';
import type { RegisterStudentRequest, RegisterCompanyRequest } from '../types';

const { Title, Text } = Typography;

/**
 * 注册页面
 * @param role - 注册角色：'student' | 'company'
 */
interface RegisterPageProps {
  role: 'student' | 'company';
}

/** 学生角色的主题色 - 青绿色 */
const STUDENT_COLOR = '#00a8a8';
/** 企业角色的主题色 - 绿色 */
const COMPANY_COLOR = '#52c41a';

const RegisterPage: React.FC<RegisterPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isStudent = role === 'student';
  const themeColor = isStudent ? STUDENT_COLOR : COMPANY_COLOR;

  /** 处理注册提交 */
  const handleRegister = async (values: any) => {
    if (!agreed) {
      message.warning('请先同意用户协议');
      return;
    }

    setLoading(true);
    try {
      if (isStudent) {
        // 学生注册：username 使用手机号
        const studentData: RegisterStudentRequest = {
          username: values.phone,
          password: values.password,
          name: values.name,
          studentId: values.studentId,
          major: values.major,
          phone: values.phone,
        };
        const res = await registerStudent(studentData);
        if (res.data.code === 200) {
          message.success('注册成功，请登录');
          navigate('/login');
        } else {
          message.error(res.data.message || '注册失败');
        }
      } else {
        // 企业注册
        const companyData: RegisterCompanyRequest = {
          username: values.phone,
          password: values.password,
          companyName: values.companyName,
          contactPerson: values.contactPerson,
          phone: values.phone,
        };
        const res = await registerCompany(companyData);
        if (res.data.code === 200) {
          message.success('注册成功，请等待管理员审核');
          navigate('/login');
        } else {
          message.error(res.data.message || '注册失败');
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '网络错误，请稍后重试';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 480, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {/* 顶部色条 */}
        <div
          style={{
            height: 6,
            background: themeColor,
            margin: '-24px -24px 24px',
            borderRadius: '12px 12px 0 0',
          }}
        />

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={3} style={{ color: themeColor, marginBottom: 4 }}>
            {isStudent ? '学生注册' : '企业注册'}
          </Title>
          <Text type="secondary">填写以下信息完成注册</Text>
        </div>

        {/* 注册表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          <Row gutter={16}>
            {/* 公共字段：手机号 */}
            <Col span={24}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1\d{10}$/, message: '请输入正确的手机号格式' },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>

            {/* 公共字段：密码 */}
            <Col span={24}>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
              </Form.Item>
            </Col>

            {/* 公共字段：确认密码 */}
            <Col span={24}>
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请再次输入密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
              </Form.Item>
            </Col>

            {/* 学生专有字段 */}
            {isStudent && (
              <>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="studentId"
                    label="学号"
                    rules={[{ required: true, message: '请输入学号' }]}
                  >
                    <Input prefix={<IdcardOutlined />} placeholder="请输入学号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="major"
                    label="专业"
                    rules={[{ required: true, message: '请输入专业' }]}
                  >
                    <Input prefix={<BookOutlined />} placeholder="请输入专业" />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* 企业专有字段 */}
            {!isStudent && (
              <>
                <Col span={24}>
                  <Form.Item
                    name="companyName"
                    label="企业名称"
                    rules={[{ required: true, message: '请输入企业名称' }]}
                  >
                    <Input prefix={<TeamOutlined />} placeholder="请输入企业名称" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="contactPerson"
                    label="联系人"
                    rules={[{ required: true, message: '请输入联系人姓名' }]}
                  >
                    <Input prefix={<ContactsOutlined />} placeholder="请输入联系人姓名" />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* 协议勾选 */}
            <Col span={24}>
              <Form.Item style={{ marginBottom: 12 }}>
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                  我已阅读并同意{' '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    《用户协议》
                  </a>
                </Checkbox>
              </Form.Item>
            </Col>

            {/* 提交按钮 */}
            <Col span={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    background: themeColor,
                    borderColor: themeColor,
                    height: 44,
                    borderRadius: 8,
                  }}
                >
                  {isStudent ? '注册为学生' : '注册为企业'}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 底部链接 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
