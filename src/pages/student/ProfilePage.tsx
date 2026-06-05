import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Form, Input, Button, Upload, Row, Col, message, Modal, Descriptions, Typography,
} from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getProfile, updateProfile, uploadResume, getResumeInfo, deleteResume, changePassword, downloadResume,
} from '../../api/profile';
import type { RcFile } from 'antd/es/upload';

const { Text } = Typography;

// 简历信息类型
interface ResumeInfo {
  resumePath: string;
  originalName?: string;
  fileSize?: number;
  uploadTime?: string;
}

const ProfilePage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 个人信息表单
  const [form] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 简历相关
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [resumeLoading, _setResumeLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // 修改密码
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [passwordForm] = Form.useForm();
  const [changingPwd, setChangingPwd] = useState<boolean>(false);

  // 上传组件 ref
  const uploadRef = useRef<HTMLDivElement>(null);

  // 加载个人信息
  const fetchProfile = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setProfileLoading(true);
    try {
      const res = await getProfile();
      const data = res.data.data as Record<string, unknown>;
      // 回填表单
      form.setFieldsValue(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取个人信息失败';
      message.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  // 加载简历信息
  const fetchResumeInfo = async () => {
    try {
      const res = await getResumeInfo();
      const data = res.data.data;
      if (data && data.resumePath) {
        setResumeInfo(data as unknown as ResumeInfo);
      }
    } catch {
      // 没有简历时忽略
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchResumeInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 保存个人信息
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateProfile(values);
      message.success('保存成功');
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return; // 表单校验失败
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存失败';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // 上传简历前校验
  const beforeUpload = (file: RcFile): boolean => {
    const isPdf = file.type === 'application/pdf';
    if (!isPdf) {
      message.error('仅支持 PDF 格式的简历');
      return false;
    }
    const isLessThan5M = file.size / 1024 / 1024 < 5;
    if (!isLessThan5M) {
      message.error('简历文件大小不能超过 5MB');
      return false;
    }
    return true;
  };

  // 上传简历
  const handleUpload = async (file: RcFile): Promise<false> => {
    if (!beforeUpload(file)) return false;
    setUploading(true);
    try {
      await uploadResume(file);
      message.success('简历上传成功');
      await fetchResumeInfo();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '上传失败';
      message.error(msg);
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传行为
  };

  // 删除简历
  const handleDeleteResume = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除当前简历吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteResume();
          message.success('简历已删除');
          setResumeInfo(null);
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败';
          message.error(msg);
        }
      },
    });
  };

  // 下载简历
  const handleDownloadResume = async () => {
    if (!resumeInfo?.resumePath) return;
    try {
      await downloadResume(resumeInfo.resumePath);
    } catch {
      message.error('下载失败');
    }
  };

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

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Row gutter={24}>
      {/* 左列：个人信息 */}
      <Col xs={24} lg={14}>
        <Card title="个人信息" loading={profileLoading}>
          <Form
            form={form}
            layout="vertical"
            style={{ maxWidth: 600 }}
          >
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="学号" name="studentId">
              <Input disabled />
            </Form.Item>
            <Form.Item label="专业" name="major" rules={[{ required: true, message: '请输入专业' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="期望岗位" name="preferredJobs">
              <Input placeholder="多个岗位请用逗号分隔，如：前端开发,后端开发" />
            </Form.Item>
            <Form.Item label="期望地点" name="preferredLocations">
              <Input placeholder="多个地点请用逗号分隔，如：北京,上海" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleSave} loading={saving}>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      {/* 右列：简历管理与安全设置 */}
      <Col xs={24} lg={10}>
        {/* 简历管理 */}
        <Card title="简历管理" style={{ marginBottom: 24 }}>
          {resumeLoading ? (
            <Text>加载中...</Text>
          ) : resumeInfo ? (
            <div>
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="文件名">
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  {resumeInfo.originalName || resumeInfo.resumePath.split('/').pop() || '简历文件'}
                </Descriptions.Item>
                <Descriptions.Item label="文件大小">
                  {formatFileSize(resumeInfo.fileSize)}
                </Descriptions.Item>
                <Descriptions.Item label="上传时间">
                  {resumeInfo.uploadTime || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="文件路径">
                  <Text copyable style={{ fontSize: 12 }}>{resumeInfo.resumePath}</Text>
                </Descriptions.Item>
              </Descriptions>
              <Row gutter={8}>
                <Col>
                  <Button icon={<DownloadOutlined />} onClick={handleDownloadResume}>
                    下载
                  </Button>
                </Col>
                <Col>
                  <Button icon={<DeleteOutlined />} danger onClick={handleDeleteResume}>
                    删除
                  </Button>
                </Col>
              </Row>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                暂未上传简历
              </Text>
            </div>
          )}

          {/* 上传简历区域 */}
          <div ref={uploadRef} style={{ marginTop: 16 }}>
            <Upload
              accept=".pdf"
              showUploadList={false}
              beforeUpload={(file) => {
                handleUpload(file as RcFile);
                return false;
              }}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading} block>
                {uploading ? '上传中...' : '上传简历（仅支持 PDF，最大 5MB）'}
              </Button>
            </Upload>
          </div>
        </Card>

        {/* 安全设置 */}
        <Card title="安全设置">
          <Button type="default" onClick={() => setPasswordModalOpen(true)}>
            修改密码
          </Button>
        </Card>
      </Col>

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
            rules={[
              { required: true, message: '请再次输入新密码' },
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default ProfilePage;
