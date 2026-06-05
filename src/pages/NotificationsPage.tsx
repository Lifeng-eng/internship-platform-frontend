import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, List, Button, Tag, Badge, Typography, Spin, Empty,
  Pagination, message, Row, Col,
} from 'antd';
import {
  CheckCircleOutlined, BellOutlined, MailOutlined,
  SendOutlined, AuditOutlined,
} from '@ant-design/icons';
import { listNotifications, markRead, markAllRead } from '../api/notifications';
import { useAuthStore } from '../store/useAuthStore';
import type { Notification } from '../types';

const { Title, Text, Paragraph } = Typography;

/** 通知类型对应的显示配置 */
const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  application: { label: '投递通知', color: 'blue', icon: <SendOutlined /> },
  review: { label: '审核通知', color: 'green', icon: <AuditOutlined /> },
};

/** 格式化时间显示 */
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 1分钟内：刚刚
  if (diff < 60 * 1000) return '刚刚';
  // 1小时内：X分钟前
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
  // 今天内：显示时分
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 昨天：显示"昨天 时分"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  // 更早：显示日期
  return timeStr.slice(0, 16).replace('T', ' ');
};

const NotificationsPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const pageSize = 10;

  /** 获取通知列表 */
  const fetchNotifications = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await listNotifications(currentPage, pageSize);
      const result = res.data;
      if (result.code === 200 && result.data) {
        setNotifications(result.data.records);
        setTotal(result.data.total);
      }
    } catch {
      message.error('获取通知失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchNotifications(page);
  }, [page, isLoggedIn, fetchNotifications]);

  /** 未读通知数量（用于 Badge 显示） */
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  /** 标记单条通知为已读 */
  const handleMarkRead = async (notification: Notification) => {
    if (notification.status === 'read') return;
    setMarkingId(notification.id);
    try {
      await markRead(notification.id);
      // 更新本地状态：将该条通知标记为已读
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, status: 'read' } : n
        )
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      message.error('标记已读失败');
    } finally {
      setMarkingId(null);
    }
  };

  /** 全部标记已读 */
  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      // 更新本地状态：将所有通知标记为已读
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read' }))
      );
      message.success('已全部标记为已读');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      message.error('操作失败');
    }
  };

  /** 分页切换 */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      {/* 页面头部 */}
      <Card style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <BellOutlined style={{ marginRight: 8 }} />
              消息通知
              {unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  style={{ marginLeft: 12 }}
                  overflowCount={99}
                />
              )}
            </Title>
          </Col>
          <Col>
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              全部标记已读
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 通知列表 */}
      <Spin spinning={loading}>
        {notifications.length === 0 && !loading ? (
          <Card style={{ borderRadius: 10 }}>
            <Empty description="暂无通知" />
          </Card>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => {
              const typeConfig = TYPE_CONFIG[notification.type] || {
                label: notification.type,
                color: 'default',
                icon: <MailOutlined />,
              };
              const isUnread = notification.status === 'unread';

              return (
                <List.Item
                  style={{
                    padding: '16px 20px',
                    marginBottom: 8,
                    borderRadius: 10,
                    background: isUnread ? '#f0f5ff' : '#fff',
                    border: isUnread
                      ? '1px solid #d6e4ff'
                      : '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleMarkRead(notification)}
                  actions={
                    isUnread
                      ? [
                          <Button
                            type="link"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            loading={markingId === notification.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(notification);
                            }}
                          >
                            标为已读
                          </Button>,
                        ]
                      : undefined
                  }
                >
                  <List.Item.Meta
                    avatar={
                      isUnread ? (
                        <Badge dot>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              background: typeConfig.color === 'blue' ? '#e6f7ff' : '#f6ffed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              color: typeConfig.color === 'blue' ? '#1890ff' : '#52c41a',
                            }}
                          >
                            {typeConfig.icon}
                          </div>
                        </Badge>
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            color: '#999',
                          }}
                        >
                          {typeConfig.icon}
                        </div>
                      )
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={isUnread ? typeConfig.color : 'default'}>
                          {typeConfig.label}
                        </Tag>
                        {isUnread && (
                          <Badge status="processing" text={<Text type="secondary">未读</Text>} />
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph
                          style={{
                            margin: '4px 0 0',
                            fontSize: 14,
                            color: isUnread ? '#262626' : '#8c8c8c',
                          }}
                          ellipsis={{ rows: 2 }}
                        >
                          {notification.content}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                          {formatTime(notification.sendTime)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 24,
              padding: 16,
            }}
          >
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showTotal={(t) => `共 ${t} 条通知`}
              showSizeChanger={false}
            />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default NotificationsPage;
