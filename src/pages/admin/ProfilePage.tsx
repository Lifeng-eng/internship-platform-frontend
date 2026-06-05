import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Modal, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getProfile, changePassword } from '../../api/profile';

const ProfilePage: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();
  const navigate = useNavigate();

  // 个人信息
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 修改密码
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [passwordForm] = Form.useForm();
  const [changingPwd, setChangingPwd] = useState<boolean>(false);

  // 获取个人信息
  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        setProfile(res.data.data as Record<string, unknown>);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取个人信息失败';
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLoggedIn, navigate]);

  // 修改密码
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }
      setChangingPwd(true);
      await changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功，请重新登录');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '修改密码失败';
      message.error(msg);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <Card title="个人信息" loading={loading} style={{ maxWidth: 700 }}>
      <Descriptions column={1} bordered size="middle" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="用户 ID">
          {(profile?.id as React.ReactNode) ?? (user?.id as React.ReactNode) ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="用户名">
          {(profile?.username as React.ReactNode) ?? (user?.name as React.ReactNode) ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="角色">
          管理员
        </Descriptions.Item>
        <Descriptions.Item label="姓名">
          {(profile?.name as string) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="手机号">
          {(profile?.phone as string) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="邮箱">
          {(profile?.email as string) || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="安全设置" type="inner">
        <Button type="default" onClick={() => setPasswordModalOpen(true)}>
          修改密码
        </Button>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => { setPasswordModalOpen(false); passwordForm.resetFields(); }}
        confirmLoading={changingPwd}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为 6 位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProfilePage;
