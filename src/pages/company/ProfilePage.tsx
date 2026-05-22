import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getProfile, updateProfile } from '../../api/profile';

const { TextArea } = Input;

// 企业规模选项
const scaleOptions = [
  { value: '1-50', label: '1-50人' },
  { value: '50-200', label: '50-200人' },
  { value: '200-500', label: '200-500人' },
  { value: '500-1000', label: '500-1000人' },
  { value: '1000+', label: '1000人以上' },
];

const ProfilePage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 获取企业信息
  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        const data = res.data.data as Record<string, unknown>;
        form.setFieldsValue(data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取企业信息失败';
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLoggedIn, navigate, form]);

  // 保存信息
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateProfile(values);
      message.success('保存成功');
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存失败';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="企业信息管理" loading={loading} style={{ maxWidth: 800 }}>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 600 }}
      >
        <Form.Item label="企业名称" name="companyName">
          <Input disabled />
        </Form.Item>
        <Form.Item label="联系人" name="contactPerson" rules={[{ required: true, message: '请输入联系人' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="企业规模" name="companyScale">
          <Select placeholder="请选择企业规模" allowClear>
            {scaleOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="企业简介" name="companyIntro">
          <TextArea rows={4} placeholder="请输入企业简介" maxLength={500} showCount />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfilePage;
