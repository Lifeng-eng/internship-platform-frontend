import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Row, Col, Button, Tag, Spin, message, Modal,
  Input, Breadcrumb, Statistic, Typography, Empty,
} from 'antd';
import {
  EnvironmentOutlined, DollarOutlined, ClockCircleOutlined,
  EditOutlined, SendOutlined, StopOutlined,
  CheckCircleOutlined, CloseCircleFilled, MessageOutlined,
} from '@ant-design/icons';
import { getJobDetail, closeJob } from '../api/jobs';
import { apply, cancelApplication } from '../api/applications';
import { useAuthStore } from '../store/useAuthStore';
import type { Job } from '../types';

const { Title, Text, Paragraph } = Typography;

/** 投递状态对应的按钮配置 */
const APPLICATION_ACTIONS: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; action?: 'apply' | 'cancel' }
> = {
  not_applied: { label: '投递简历', color: 'blue', icon: <SendOutlined />, action: 'apply' },
  pending: { label: '已投递，待处理', color: 'orange', icon: <ClockCircleOutlined />, action: 'cancel' },
  accepted: { label: '已接受', color: 'green', icon: <CheckCircleOutlined /> },
  rejected: { label: '已被拒绝', color: 'red', icon: <CloseCircleFilled /> },
  cancelled: { label: '投递简历', color: 'blue', icon: <SendOutlined />, action: 'apply' },
};

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // 关闭岗位确认弹窗
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  /** 判断当前用户是否为该岗位的发布企业 */
  const isOwnCompany = isLoggedIn() && user?.role === 'company' && job?.companyId === user.id;

  /** 加载岗位详情 */
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getJobDetail(Number(id));
        const result = res.data;
        if (result.code === 200 && result.data) {
          setJob(result.data);
        } else {
          message.error(result.message || '获取岗位详情失败');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        message.error(err?.response?.data?.message || '网络错误');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  /** 格式化薪资 */
  const formatSalary = (min?: number, max?: number) => {
    if (min && max) return `${min / 1000}-${max / 1000}K`;
    if (min) return `${min / 1000}K起`;
    if (max) return `至${max / 1000}K`;
    return '面议';
  };

  /** 学生：投递简历 */
  const handleApply = async () => {
    if (!job) return;
    setApplying(true);
    try {
      const res = await apply(job.id);
      if (res.data.code === 200) {
        message.success('投递成功');
        // 刷新岗位详情，更新投递状态
        const refreshRes = await getJobDetail(job.id);
        if (refreshRes.data.code === 200 && refreshRes.data.data) {
          setJob(refreshRes.data.data);
        }
      } else {
        message.error(res.data.message || '投递失败');
      }
    } catch {
      message.error('投递失败，请稍后重试');
    } finally {
      setApplying(false);
    }
  };

  /** 学生：撤销投递 */
  const handleCancelApplication = async () => {
    if (!job || !job.applicationId) return;
    setApplying(true);
    try {
      const res = await cancelApplication(job.applicationId);
      if (res.data.code === 200) {
        message.success('已撤销投递');
        const refreshRes = await getJobDetail(job.id);
        if (refreshRes.data.code === 200 && refreshRes.data.data) {
          setJob(refreshRes.data.data);
        }
      } else {
        message.error(res.data.message || '撤销失败');
      }
    } catch {
      message.error('撤销失败，请稍后重试');
    } finally {
      setApplying(false);
    }
  };

  /** 确认撤销投递 */
  const showCancelConfirm = () => {
    if (!job) return;
    Modal.confirm({
      title: '确认撤销',
      content: `确定要撤销对「${job.title}」的投递吗？撤销后可重新投递。`,
      okText: '确认撤销',
      cancelText: '取消',
      onOk: handleCancelApplication,
    });
  };

  /** 企业：下架岗位 */
  const handleCloseJob = async () => {
    if (!job) return;
    try {
      const res = await closeJob(job.id);
      if (res.data.code === 200) {
        message.success('岗位已下架');
        setCloseModalOpen(false);
        setCloseReason('');
        const refreshRes = await getJobDetail(job.id);
        if (refreshRes.data.code === 200 && refreshRes.data.data) {
          setJob(refreshRes.data.data);
        }
      } else {
        message.error(res.data.message || '下架失败');
      }
    } catch {
      message.error('下架失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Empty description="岗位不存在或已被删除" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          返回首页
        </Button>
      </div>
    );
  }

  // 确定当前用户的操作按钮
  const getActionButton = () => {
    // 未登录：提示登录
    if (!isLoggedIn()) {
      return (
        <Button type="primary" size="large" block onClick={() => navigate('/login')}>
          登录后可投递简历
        </Button>
      );
    }

    // 学生：根据投递状态显示不同按钮
    if (user?.role === 'student') {
      const status = job.applyStatus || 'not_applied';
      const action = APPLICATION_ACTIONS[status];
      if (!action) return null;

      const isPending = status === 'pending';
      const hasApplied = status !== 'not_applied';

      return (
        <div>
          <Button
            type={isPending ? 'default' : 'primary'}
            size="large"
            block
            icon={action.icon}
            loading={applying}
            onClick={() => {
              if (action.action === 'apply') handleApply();
              else if (action.action === 'cancel') showCancelConfirm();
            }}
            style={isPending ? { borderColor: '#faad14', color: '#faad14' } : {}}
          >
            {action.label}
          </Button>
          {/* 已投递后可联系发布者 */}
          {hasApplied && (
            <Button
              type="link"
              size="large"
              block
              icon={<MessageOutlined />}
              style={{ marginTop: 8 }}
              onClick={() => navigate(`/chat?appId=${job.applicationId}`)}
            >
              联系发布者
            </Button>
          )}
          {/* 投递中状态下显示额外提示 */}
          {status === 'pending' && (
            <Text type="warning" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
              点击可撤销投递
            </Text>
          )}
        </div>
      );
    }

    // 企业：如果是自己的岗位，显示编辑和下架按钮
    if (user?.role === 'company' && isOwnCompany) {
      return (
        <Row gutter={12}>
          <Col span={12}>
            <Button
              type="primary"
              size="large"
              block
              icon={<EditOutlined />}
              onClick={() => navigate(`/jobs/${job.id}/edit`)}
            >
              编辑岗位
            </Button>
          </Col>
          <Col span={12}>
            <Button
              danger
              size="large"
              block
              icon={<StopOutlined />}
              disabled={job.status === 'closed'}
              onClick={() => setCloseModalOpen(true)}
            >
              {job.status === 'closed' ? '已下架' : '下架岗位'}
            </Button>
          </Col>
        </Row>
      );
    }

    return null;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{job.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={24}>
        {/* 左侧主内容区 */}
        <Col xs={24} lg={16}>
          {/* 岗位基本信息卡片 */}
          <Card style={{ borderRadius: 10, marginBottom: 24 }}>
            <Row align="middle" gutter={16}>
              <Col>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 22,
                  }}
                >
                  {job.companyName?.charAt(0) || '企'}
                </div>
              </Col>
              <Col flex="auto">
                <Title level={3} style={{ marginBottom: 4 }}>
                  {job.title}
                </Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {job.companyName}
                </Text>
              </Col>
            </Row>

            {/* 标签：薪资、地点、状态 */}
            <div style={{ marginTop: 16 }}>
              <Tag color="blue" icon={<DollarOutlined />} style={{ fontSize: 14, padding: '2px 8px' }}>
                {formatSalary(job.salaryMin, job.salaryMax)}
              </Tag>
              <Tag icon={<EnvironmentOutlined />} style={{ fontSize: 14, padding: '2px 8px' }}>
                {job.location}
              </Tag>
              {job.status === 'closed' && (
                <Tag color="default" style={{ fontSize: 14, padding: '2px 8px' }}>
                  已下线
                </Tag>
              )}
              {job.status === 'pending' && (
                <Tag color="orange" style={{ fontSize: 14, padding: '2px 8px' }}>
                  待审核
                </Tag>
              )}
            </div>

            {/* 发布时间 */}
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                <ClockCircleOutlined /> 发布于 {job.publishTime ? job.publishTime.slice(0, 10) : '未知'}
              </Text>
            </div>
          </Card>

          {/* 岗位描述 */}
          <Card title="职位描述" style={{ borderRadius: 10, marginBottom: 24 }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>
              {job.description || '暂无描述'}
            </Paragraph>
          </Card>

          {/* 任职要求 */}
          <Card title="任职要求" style={{ borderRadius: 10, marginBottom: 24 }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>
              {job.requirements || '暂无要求'}
            </Paragraph>
          </Card>
        </Col>

        {/* 右侧侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 操作按钮区 */}
          <Card style={{ borderRadius: 10, marginBottom: 24, position: 'sticky', top: 80 }}>
            {getActionButton()}
          </Card>

          {/* 企业信息卡片 */}
          <Card title="企业信息" style={{ borderRadius: 10, marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  background: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 26,
                  margin: '0 auto 12px',
                }}
              >
                {job.companyName?.charAt(0) || '企'}
              </div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {job.companyName}
              </Title>
              {job.companyScale && (
                <Text type="secondary">{job.companyScale}</Text>
              )}
            </div>
            {job.companyIntro && (
              <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}
                style={{ fontSize: 14 }}
              >
                {job.companyIntro}
              </Paragraph>
            )}
          </Card>

          {/* 数据统计 */}
          <Card style={{ borderRadius: 10 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="薪资范围" value={formatSalary(job.salaryMin, job.salaryMax)} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={12}>
                <Statistic title="工作地点" value={job.location} valueStyle={{ fontSize: 16 }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 下架确认弹窗 */}
      <Modal
        title="下架岗位"
        open={closeModalOpen}
        onOk={handleCloseJob}
        onCancel={() => {
          setCloseModalOpen(false);
          setCloseReason('');
        }}
        okText="确认下架"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '12px 0' }}>
          <Text>确定要下架「{job.title}」吗？下架后学生将无法投递此岗位。</Text>
          <div style={{ marginTop: 16 }}>
            <Text strong>下架原因（选填）：</Text>
            <Input.TextArea
              rows={3}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="请填写下架原因..."
              style={{ marginTop: 8 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobDetailPage;
