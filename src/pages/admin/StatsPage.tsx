import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getAdminStats } from '../../api/admin';

// 统计数据类型
interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  acceptanceRate: number;
  // 岗位状态分布
  jobStatusDistribution?: { status: string; count: number }[];
  // 投递结果分布
  applicationResultDistribution?: { status: string; count: number }[];
  // 近7日投递趋势
  applicationTrend?: { date: string; count: number }[];
}

// 状态颜色和标签
const jobStatusColors: Record<string, string> = {
  PENDING: '#faad14',
  PUBLISHED: '#52c41a',
  REJECTED: '#ff4d4f',
  CLOSED: '#d9d9d9',
};

const jobStatusLabels: Record<string, string> = {
  PENDING: '审核中',
  PUBLISHED: '已发布',
  REJECTED: '未通过',
  CLOSED: '已下架',
};

const appStatusColors: Record<string, string> = {
  PENDING: '#faad14',
  ACCEPTED: '#52c41a',
  REJECTED: '#ff4d4f',
  CANCELLED: '#d9d9d9',
};

const appStatusLabels: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '已拒绝',
  CANCELLED: '已撤销',
};

const StatsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getAdminStats();
        const data = res.data.data as unknown as AdminStats;
        setStats(data);
      } catch {
        // 静默处理
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const jobDistribution = stats?.jobStatusDistribution || [];
  const appResultDistribution = stats?.applicationResultDistribution || [];
  const trend = stats?.applicationTrend || [];

  // 计算饼图各段的百分比和渐变配置
  const buildConicGradient = (
    data: { status: string; count: number }[],
    colorMap: Record<string, string>,
  ): string => {
    const total = data.reduce((s, i) => s + i.count, 0);
    if (total === 0) return 'conic-gradient(#f0f0f0 0% 100%)';
    return `conic-gradient(${data
      .map((item, index) => {
        const startPct = data.slice(0, index).reduce((s, i) => s + (i.count / total) * 100, 0);
        const pct = (item.count / total) * 100;
        const color = colorMap[item.status] || '#888';
        return `${color} ${startPct}% ${startPct + pct}%`;
      })
      .join(', ')})`;
  };

  // 计算柱状图最大高度
  const maxTrendCount = Math.max(...trend.map((d) => d.count), 1);

  return (
    <div>
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="用户总数" value={stats?.totalUsers ?? 0} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="岗位总数" value={stats?.totalJobs ?? 0} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="投递总数" value={stats?.totalApplications ?? 0} suffix="份" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="通过率"
              value={stats?.acceptanceRate ?? 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[24, 24]}>
        {/* 岗位状态分布（饼图） */}
        <Col xs={24} lg={8}>
          <Card title="岗位状态分布">
            {jobDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '10px 0' }}>
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: buildConicGradient(jobDistribution, jobStatusColors),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <div style={{ width: '100%' }}>
                  {jobDistribution.map((item, index) => {
                    const total = jobDistribution.reduce((s, i) => s + i.count, 0);
                    const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: jobStatusColors[item.status] || '#888', marginRight: 8, flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>
                          {jobStatusLabels[item.status] || item.status}: {item.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 投递结果分布（饼图） */}
        <Col xs={24} lg={8}>
          <Card title="投递结果分布">
            {appResultDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '10px 0' }}>
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: buildConicGradient(appResultDistribution, appStatusColors),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <div style={{ width: '100%' }}>
                  {appResultDistribution.map((item, index) => {
                    const total = appResultDistribution.reduce((s, i) => s + i.count, 0);
                    const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: appStatusColors[item.status] || '#888', marginRight: 8, flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>
                          {appStatusLabels[item.status] || item.status}: {item.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 近7日投递趋势（柱状图） */}
        <Col xs={24} lg={8}>
          <Card title="近7日投递趋势">
            {trend.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 220, padding: '20px 10px 0', borderBottom: '1px solid #f0f0f0' }}>
                {trend.map((item, index) => (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, marginBottom: 4, color: '#666' }}>{item.count}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 40,
                        height: `${(item.count / maxTrendCount) * 160}px`,
                        background: 'linear-gradient(180deg, #722ed1 0%, #b37feb 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s',
                        minHeight: item.count > 0 ? 4 : 0,
                      }}
                    />
                    <span style={{ fontSize: 10, marginTop: 8, color: '#666', transform: 'rotate(-30deg)', whiteSpace: 'nowrap' }}>
                      {item.date?.slice(5) || item.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatsPage;
