import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions, Input, Alert, message, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/useAuthStore';
import type { Job } from '../../types';
import { listPendingJobs, reviewJob } from '../../api/admin';

const { TextArea } = Input;

const ReviewPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 列表状态
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // 审核弹窗状态
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  // 获取待审核列表
  const fetchJobs = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await listPendingJobs(page, pageSize);
      const data = res.data.data;
      setJobs(data?.records ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取待审核列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate, page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 查看详情
  const handleViewDetail = (job: Job) => {
    setCurrentJob(job);
    setReviewComment('');
    setDetailModalOpen(true);
  };

  // 审核操作
  const handleReview = async (result: 'pass' | 'reject') => {
    if (!currentJob) return;
    // 拒绝时必须填写理由
    if (result === 'reject' && !reviewComment.trim()) {
      message.warning('拒绝时请填写审核意见');
      return;
    }
    setReviewing(true);
    try {
      const res = await reviewJob(currentJob.id, result, reviewComment || undefined);
      if (res.data.code !== 200) {
        message.error(res.data.message || '操作失败');
        return;
      }
      message.success(result === 'pass' ? '岗位已通过审核' : '岗位已被拒绝');
      setDetailModalOpen(false);
      fetchJobs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
      message.error(msg);
    } finally {
      setReviewing(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<Job> = [
    { title: '岗位名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '企业名称', dataIndex: 'companyName', key: 'companyName', width: 150, ellipsis: true },
    { title: '工作地点', dataIndex: 'location', key: 'location', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'processing', text: '待审核' },
          published: { color: 'success', text: '已发布' },
          rejected: { color: 'error', text: '未通过' },
          closed: { color: 'default', text: '已下架' },
        };
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Job) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Card title="岗位审核" style={{ minHeight: 500 }}>
      {/* 待审核数量提示 */}
      {total > 0 && (
        <Alert
          type="info"
          showIcon
          message={`当前共有 ${total} 个岗位等待审核`}
          style={{ marginBottom: 16 }}
        />
      )}

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
        locale={{ emptyText: <Empty description="暂无待审核岗位" /> }}
      />

      {/* 岗位详情及审核弹窗 */}
      <Modal
        title="岗位详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={700}
        footer={
          currentJob ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                danger
                loading={reviewing}
                onClick={() => handleReview('reject')}
              >
                拒绝
              </Button>
              <Button
                type="primary"
                loading={reviewing}
                onClick={() => handleReview('pass')}
              >
                通过
              </Button>
            </div>
          ) : null
        }
        destroyOnClose
      >
        {currentJob && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="岗位名称" span={2}>
                {currentJob.title}
              </Descriptions.Item>
              <Descriptions.Item label="企业名称">{currentJob.companyName}</Descriptions.Item>
              <Descriptions.Item label="工作地点">{currentJob.location}</Descriptions.Item>
              <Descriptions.Item label="薪资范围" span={2}>
                {currentJob.salaryMin && currentJob.salaryMax
                  ? `${currentJob.salaryMin} - ${currentJob.salaryMax} 元/月`
                  : currentJob.salaryMin
                    ? `${currentJob.salaryMin} 元/月起`
                    : currentJob.salaryMax
                      ? `最高 ${currentJob.salaryMax} 元/月`
                      : '面议'}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间" span={2}>
                {currentJob.publishTime}
              </Descriptions.Item>
              <Descriptions.Item label="企业规模">{currentJob.companyScale || '-'}</Descriptions.Item>
              <Descriptions.Item label="企业简介" span={2}>
                {currentJob.companyIntro || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="岗位描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentJob.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="任职要求" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentJob.requirements}</div>
              </Descriptions.Item>
            </Descriptions>

            {/* 审核意见 */}
            <div>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>审核意见：</p>
              <TextArea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="请输入审核意见（拒绝时必填）"
                maxLength={500}
                showCount
              />
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
};

export default ReviewPage;
