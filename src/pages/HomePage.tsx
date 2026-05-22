import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Input, Select, Tag, Spin, Empty, Pagination, Typography, Divider, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { listJobs, getRecommendedJobs } from '../api/jobs';
import { useAuthStore } from '../store/useAuthStore';
import type { Job } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

/** 薪资范围选项 */
const SALARY_OPTIONS = [
  { label: '不限', value: '' },
  { label: '3K以下', value: '0-3000' },
  { label: '3K-5K', value: '3000-5000' },
  { label: '5K-10K', value: '5000-10000' },
  { label: '10K-20K', value: '10000-20000' },
  { label: '20K以上', value: '20000-999999' },
];

/** 地点选项（常见城市） */
const LOCATION_OPTIONS = [
  { label: '不限', value: '' },
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
  { label: '杭州', value: '杭州' },
  { label: '成都', value: '成都' },
  { label: '武汉', value: '武汉' },
  { label: '南京', value: '南京' },
  { label: '西安', value: '西安' },
];

/** 将薪资范围字符串转为 API 参数 */
const parseSalary = (value: string) => {
  if (!value) return {};
  const [min, max] = value.split('-').map(Number);
  return { salaryMin: min, salaryMax: max };
};

/** 格式化薪资显示 */
const formatSalary = (min?: number, max?: number) => {
  if (min && max) return `${min / 1000}-${max / 1000}K`;
  if (min) return `${min / 1000}K起`;
  if (max) return `至${max / 1000}K`;
  return '面议';
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  // 搜索/筛选条件
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');

  // 岗位列表数据
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 推荐岗位
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const pageSize = 10;

  /** 加载岗位列表 */
  const fetchJobs = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const salaryParams = parseSalary(salaryRange);
      const res = await listJobs({
        page: currentPage,
        size: pageSize,
        keyword: keyword || undefined,
        location: location || undefined,
        ...salaryParams,
      });
      const result = res.data;
      if (result.code === 200 && result.data) {
        setJobs(result.data.records);
        setTotal(result.data.total);
      }
    } catch {
      // 请求失败时的静默处理
    } finally {
      setLoading(false);
    }
  }, [keyword, location, salaryRange]);

  /** 加载推荐岗位（仅学生角色） */
  const fetchRecommended = useCallback(async () => {
    if (!isLoggedIn() || user?.role !== 'student') return;
    setRecLoading(true);
    try {
      const res = await getRecommendedJobs();
      const result = res.data;
      if (result.code === 200 && result.data) {
        setRecommendedJobs(result.data);
      }
    } catch {
      // 静默处理
    } finally {
      setRecLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchJobs(page);
  }, [page, fetchJobs]);

  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  /** 搜索触发：重置到第一页 */
  const handleSearch = () => {
    setPage(1);
    fetchJobs(1);
  };

  /** 分页切换 */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** 跳转到岗位详情 */
  const goToJobDetail = (jobId: number) => {
    navigate(`/jobs/${jobId}`);
  };

  /** 获取岗位状态对应的标签颜色 */
  const getSalaryColor = (_min?: number, _max?: number) => {
    return 'blue';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* 顶部搜索区域 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索岗位、公司关键字"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="工作地点"
              value={location || undefined}
              onChange={(val) => setLocation(val || '')}
              style={{ width: '100%' }}
              size="large"
              allowClear
            >
              {LOCATION_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="薪资范围"
              value={salaryRange || undefined}
              onChange={(val) => setSalaryRange(val || '')}
              style={{ width: '100%' }}
              size="large"
              allowClear
            >
              {SALARY_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="large" block>
              搜索
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 推荐岗位（仅对学生展示） */}
      {isLoggedIn() && user?.role === 'student' && recommendedJobs.length > 0 && (
        <>
          <Title level={4} style={{ marginBottom: 16 }}>
            <span style={{ color: '#fa8c16' }}>&#9733;</span> 为你推荐
          </Title>
          <Spin spinning={recLoading}>
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              {recommendedJobs.slice(0, 4).map((job) => (
                <Col xs={24} sm={12} md={6} key={job.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 10, border: '1px solid #fff1b8', background: '#fffbe6' }}
                    onClick={() => goToJobDetail(job.id)}
                  >
                    <Text strong ellipsis style={{ display: 'block', marginBottom: 8, fontSize: 15 }}>
                      {job.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {job.companyName}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color="orange">{formatSalary(job.salaryMin, job.salaryMax)}</Tag>
                      <Tag>{job.location}</Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Spin>
          <Divider />
        </>
      )}

      {/* 全部岗位列表 */}
      <Title level={4} style={{ marginBottom: 16 }}>
        全部岗位
      </Title>
      <Spin spinning={loading}>
        {jobs.length === 0 && !loading ? (
          <Empty description="暂无岗位信息" style={{ padding: 60 }} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {jobs.map((job) => (
                <Col xs={24} sm={12} md={8} key={job.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 10, height: '100%' }}
                    onClick={() => goToJobDetail(job.id)}
                    actions={[
                      <Text type="secondary" key="time">
                        <ClockCircleOutlined />{' '}
                        {job.publishTime ? job.publishTime.slice(0, 10) : ''}
                      </Text>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            background: '#1890ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 18,
                          }}
                        >
                          {job.companyName?.charAt(0) || '企'}
                        </div>
                      }
                      title={
                        <Text strong ellipsis style={{ fontSize: 16 }}>
                          {job.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary" ellipsis>
                          {job.companyName}
                        </Text>
                      }
                    />
                    <div style={{ marginTop: 12 }}>
                      <Tag color="blue" icon={<DollarOutlined />}>
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </Tag>
                      <Tag icon={<EnvironmentOutlined />}>{job.location}</Tag>
                      {job.status === 'closed' && <Tag color="default">已下线</Tag>}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {/* 分页 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={handlePageChange}
                showTotal={(t) => `共 ${t} 个岗位`}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Spin>
    </div>
  );
};

export default HomePage;
