import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Input, message, Empty } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, DownloadOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/useAuthStore';
import type { ApplicationVO } from '../../types';
import { listApplications, handleApplication } from '../../api/applications';
import { downloadResume } from '../../api/profile';

const { TextArea } = Input;

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待处理' },
  ACCEPTED: { color: 'success', text: '已通过' },
  REJECTED: { color: 'error', text: '已拒绝' },
  CANCELLED: { color: 'default', text: '已撤销' },
};

const ApplicationsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 列表状态
  const [applications, setApplications] = useState<ApplicationVO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // 拒绝弹窗
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectAppId, setRejectAppId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  // 获取投递列表
  const fetchApplications = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await listApplications(page, pageSize);
      const data = res.data.data;
      setApplications(data?.records ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取投递列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate, page, pageSize]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 接受投递
  const handleAccept = (id: number) => {
    Modal.confirm({
      title: '确认通过',
      content: '确定要接受该学生的投递申请吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await handleApplication(id, 'accept');
          message.success('已接受该投递');
          fetchApplications();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
          message.error(msg);
        }
      },
    });
  };

  // 打开拒绝弹窗
  const handleReject = (id: number) => {
    setRejectAppId(id);
    setRejectComment('');
    setRejectModalOpen(true);
  };

  // 提交拒绝
  const handleRejectSubmit = async () => {
    if (rejectAppId === null) return;
    setProcessing(true);
    try {
      await handleApplication(rejectAppId, 'reject', rejectComment || undefined);
      message.success('已拒绝该投递');
      setRejectModalOpen(false);
      fetchApplications();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
      message.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  // 查看/下载简历
  const handleViewResume = async (record: ApplicationVO) => {
    if (!record.resumePath) {
      message.warning('该学生未上传简历');
      return;
    }
    try {
      await downloadResume(record.resumePath);
    } catch {
      message.error('下载失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<ApplicationVO> = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
    { title: '学号', dataIndex: 'studentIdNum', key: 'studentIdNum', width: 130 },
    { title: '专业', dataIndex: 'major', key: 'major', ellipsis: true },
    { title: '应聘岗位', dataIndex: 'jobTitle', key: 'jobTitle', ellipsis: true },
    { title: '投递时间', dataIndex: 'applyTime', key: 'applyTime', width: 180 },
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
      width: 240,
      render: (_: unknown, record: ApplicationVO) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => navigate(`/chat?appId=${record.id}`)}
          >
            联系学生
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewResume(record)}
              >
                查看简历
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleAccept(record.id)}
              >
                接受
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status !== 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              disabled={!record.resumePath}
              onClick={() => handleViewResume(record)}
            >
              下载简历
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="收到的投递" style={{ minHeight: 500 }}>
      <Table<ApplicationVO>
        columns={columns}
        dataSource={applications}
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
        locale={{ emptyText: <Empty description="暂无投递记录" /> }}
      />

      {/* 拒绝弹窗 */}
      <Modal
        title="拒绝投递"
        open={rejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={processing}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ margin: '16px 0' }}>
          <p style={{ marginBottom: 8 }}>拒绝理由（可选）：</p>
          <TextArea
            rows={4}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="请输入拒绝理由，供学生参考"
            maxLength={500}
            showCount
          />
        </div>
      </Modal>
    </Card>
  );
};

export default ApplicationsPage;
