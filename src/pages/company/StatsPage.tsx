import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getCompanyStats } from '../../api/profile';

// 统计数据类型
interface CompanyStats {
  totalJobs: number;
  totalApplications: number;
  acceptedCount: number;
  // 各岗位投递数
  applicationsPerJob?: { jobTitle: string; count: number }[];
  // 投递状态分布
  applicationStatusDistribution?: { status: string; count: number }[];
}

// 状态颜色映射
const statusColors: Record<string, string> = {
  PENDING: '#faad14',
  ACCEPTED: '#52c41a',
  REJECTED: '#ff4d4f',
  CANCELLED: '#d9d9d9',
};

const statusLabels: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '已拒绝',
  CANCELLED: '已撤销',
};

const StatsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取统计信息
  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getCompanyStats();
        const data = res.data.data as unknown as CompanyStats;
        setStats(data);
      } catch {
        // 静默处理，后续可扩展
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

  const applicationsPerJob = stats?.applicationsPerJob || [];
  const statusDistribution = stats?.applicationStatusDistribution || [];

  // 计算柱状图最大高度
  const maxJobCount = Math.max(...applicationsPerJob.map((j) => j.count), 1);

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="岗位总数" value={stats?.totalJobs ?? 0} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="投递总数" value={stats?.totalApplications ?? 0} suffix="份" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已通过人数"
              value={stats?.acceptedCount ?? 0}
              suffix="人"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[24, 24]}>
        {/* 柱状图：各岗位投递数 */}
        <Col xs={24} lg={12}>
          <Card title="各岗位投递数量">
            {applicationsPerJob.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 220, padding: '20px 10px', borderBottom: '1px solid #f0f0f0' }}>
                {applicationsPerJob.map((item, index) => (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>{item.count}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 60,
                        height: `${(item.count / maxJobCount) * 160}px`,
                        background: 'linear-gradient(180deg, #1890ff 0%, #69c0ff 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s',
                        minHeight: item.count > 0 ? 8 : 0,
                      }}
                      title={item.jobTitle}
                    />
                    <span style={{ fontSize: 11, marginTop: 8, color: '#333', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.jobTitle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* 饼图：投递状态分布 */}
        <Col xs={24} lg={12}>
          <Card title="投递状态分布">
            {statusDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '20px 0' }}>
                {/* 使用 conic-gradient 模拟饼图 */}
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: `conic-gradient(${statusDistribution
                      .map((item, index) => {
                        const total = statusDistribution.reduce((s, i) => s + i.count, 0);
                        const startPct = statusDistribution
                          .slice(0, index)
                          .reduce((s, i) => s + (i.count / total) * 100, 0);
                        const pct = (item.count / total) * 100;
                        const color = statusColors[item.status] || '#888';
                        return `${color} ${startPct}% ${startPct + pct}%`;
                      })
                      .join(', ')})`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                {/* 图例 */}
                <div>
                  {statusDistribution.map((item, index) => {
                    const total = statusDistribution.reduce((s, i) => s + i.count, 0);
                    const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            backgroundColor: statusColors[item.status] || '#888',
                            marginRight: 8,
                          }}
                        />
                        <span style={{ fontSize: 13 }}>
                          {statusLabels[item.status] || item.status}: {item.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatsPage;
