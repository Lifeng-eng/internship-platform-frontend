import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Tag, Button, Modal, message, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/useAuthStore';
import type { ApplicationVO } from '../../types';
import { listApplications, cancelApplication } from '../../api/applications';

// 状态标签映射
const statusMap: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'processing', text: '待处理' },
  ACCEPTED: { color: 'success', text: '已通过' },
  REJECTED: { color: 'error', text: '已拒绝' },
  CANCELLED: { color: 'default', text: '已撤销' },
};

const ApplicationsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 状态管理
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [applications, setApplications] = useState<ApplicationVO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // 获取投递列表
  const fetchApplications = useCallback(async () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const status = activeTab === 'ALL' ? undefined : activeTab;
      const res = await listApplications(page, pageSize, status);
      const data = res.data.data;
      setApplications(data?.records ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取投递列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate, activeTab, page, pageSize]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // 撤销投递
  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await cancelApplication(id);
      message.success('已撤销该投递');
      fetchApplications();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '撤销失败';
      message.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  // 确认撤销对话框
  const showCancelConfirm = (id: number) => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销此投递申请吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => handleCancel(id),
    });
  };

  // 表格列定义
  const columns: ColumnsType<ApplicationVO> = [
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      ellipsis: true,
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: true,
    },
    {
      title: '投递时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 180,
    },
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
      title: '处理时间',
      dataIndex: 'handleTime',
      key: 'handleTime',
      width: 180,
      render: (time: string | null) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: ApplicationVO) => {
        if (record.status === 'PENDING') {
          return (
            <Button
              type="link"
              danger
              size="small"
              loading={cancellingId === record.id}
              onClick={() => showCancelConfirm(record.id)}
            >
              撤销
            </Button>
          );
        }
        return null;
      },
    },
  ];

  // Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const tabItems = [
    { key: 'ALL', label: '全部' },
    { key: 'PENDING', label: '待处理' },
    { key: 'ACCEPTED', label: '已通过' },
    { key: 'REJECTED', label: '已拒绝' },
  ];

  return (
    <Card title="我的投递" style={{ minHeight: 500 }}>
      <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} />
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
    </Card>
  );
};

export default ApplicationsPage;
