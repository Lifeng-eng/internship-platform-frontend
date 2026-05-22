import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Tag, Button, Modal, Form, Input, InputNumber, message, Empty, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/useAuthStore';
import type { Job } from '../../types';
import { createJob, updateJob, deleteJob, closeJob } from '../../api/jobs';
import { listCompanyJobs } from '../../api/profile';

const { TextArea } = Input;

// 岗位状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  PUBLISHED: { color: 'success', text: '已发布' },
  PENDING: { color: 'processing', text: '审核中' },
  REJECTED: { color: 'error', text: '未通过' },
  CLOSED: { color: 'default', text: '已下架' },
};

const JobsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 列表状态
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // 岗位表单弹窗
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 获取岗位列表
  const fetchJobs = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setLoading(true);
    try {
      const status = activeTab === 'ALL' ? undefined : activeTab;
      const res = await listCompanyJobs(page, pageSize, status);
      const data = res.data.data as { records: Job[]; total: number };
      setJobs(data?.records ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取岗位列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate, activeTab, page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingJob(null);
    form.resetFields();
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (job: Job) => {
    setEditingJob(job);
    form.setFieldsValue(job);
    setModalOpen(true);
  };

  // 提交表单（新增/编辑）
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingJob) {
        // 编辑模式
        const updateRes = await updateJob(editingJob.id, values);
        if (updateRes.data.code !== 200) {
          message.error(updateRes.data.message || '更新失败');
          return;
        }
        message.success('岗位更新成功');
      } else {
        // 新增模式
        const createRes = await createJob(values);
        if (createRes.data.code !== 200) {
          message.error(createRes.data.message || '发布失败');
          return;
        }
        message.success('岗位发布成功，请等待审核');
      }
      setModalOpen(false);
      form.resetFields();
      fetchJobs();
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 下架岗位
  const handleClose = (id: number) => {
    Modal.confirm({
      title: '确认下架',
      content: '确定要下架该岗位吗？下架后学生将无法查看。',
      okText: '确认下架',
      cancelText: '取消',
      onOk: async () => {
        try {
          await closeJob(id);
          message.success('岗位已下架');
          fetchJobs();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
          message.error(msg);
        }
      },
    });
  };

  // 删除岗位
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该岗位吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteJob(id);
          message.success('岗位已删除');
          fetchJobs();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败';
          message.error(msg);
        }
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '工作地点', dataIndex: 'location', key: 'location', width: 120 },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Job) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'PUBLISHED' && (
            <Button type="link" size="small" onClick={() => handleClose(record.id)}>
              下架
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'REJECTED') && (
            <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'ALL', label: '全部' },
    { key: 'PUBLISHED', label: '已发布' },
    { key: 'PENDING', label: '审核中' },
    { key: 'REJECTED', label: '未通过' },
  ];

  return (
    <Card
      title="岗位管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          发布岗位
        </Button>
      }
    >
      <Tabs activeKey={activeTab} items={tabItems} onChange={(key) => { setActiveTab(key); setPage(1); }} />
      <Table<Job>
        columns={columns}
        dataSource={jobs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (t) => `共 ${t} 条`,
        }}
        locale={{ emptyText: <Empty description="暂无岗位" /> }}
      />

      {/* 新增/编辑岗位弹窗 */}
      <Modal
        title={editingJob ? '编辑岗位' : '发布岗位'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={submitting}
        okText="提交"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="岗位名称"
            name="title"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="请输入岗位名称" maxLength={100} />
          </Form.Item>
          <Form.Item
            label="工作地点"
            name="location"
            rules={[{ required: true, message: '请输入工作地点' }]}
          >
            <Input placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item
            label="岗位描述"
            name="description"
            rules={[{ required: true, message: '请输入岗位描述' }]}
          >
            <TextArea rows={4} placeholder="请输入岗位描述" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            label="任职要求"
            name="requirements"
            rules={[{ required: true, message: '请输入任职要求' }]}
          >
            <TextArea rows={4} placeholder="请输入任职要求" maxLength={2000} showCount />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="最低薪资（元/月）" name="salaryMin">
              <InputNumber min={0} precision={0} placeholder="薪资范围下限" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="最高薪资（元/月）" name="salaryMax">
              <InputNumber min={0} precision={0} placeholder="薪资范围上限" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
};

export default JobsPage;
