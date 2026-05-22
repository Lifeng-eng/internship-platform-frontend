import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, List, Input, Button, Empty, Spin, Badge, Typography, message } from 'antd';
import { SendOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import { listConversations, listMessages, markConversationRead, getOrCreateConversation } from '../api/chat';
import { useAuthStore } from '../store/useAuthStore';
import type { ConversationVO, MessageVO } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ChatPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [searchParams] = useSearchParams();
  const currentUserId = user?.id ?? 0;

  const [conversations, setConversations] = useState<ConversationVO[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationVO | null>(null);
  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const stompRef = useRef<Client | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 加载会话列表
  const fetchConversations = useCallback(async () => {
    try {
      const res = await listConversations();
      if (res.data.code === 200) {
        setConversations(res.data.data);
      }
    } catch {
      // 静默处理
    }
  }, []);

  // 加载消息历史
  const fetchMessages = async (conv: ConversationVO) => {
    setLoading(true);
    try {
      const res = await listMessages(conv.id);
      if (res.data.code === 200) {
        setMessages(res.data.data);
      }
      // 标记已读
      if (conv.unreadCount > 0) {
        await markConversationRead(conv.id);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  };

  // 建立 WebSocket 连接
  useEffect(() => {
    if (!accessToken) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/user/${currentUserId}/queue/chat`, (msg) => {
        const incoming: MessageVO = JSON.parse(msg.body);
        setMessages((prev) => [...prev, incoming]);
        // 刷新会话列表以更新最后消息
        fetchConversations();
      });
    };

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [accessToken, currentUserId, fetchConversations]);

  // 新消息时滚动到底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载会话列表
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 通过 appId 参数自动打开/创建会话
  useEffect(() => {
    const appId = searchParams.get('appId');
    if (!appId) return;
    const initConv = async () => {
      try {
        const res = await getOrCreateConversation(Number(appId));
        if (res.data.code === 200) {
          const convId = res.data.data.conversationId;
          // 刷新会话列表后再选中
          const listRes = await listConversations();
          if (listRes.data.code === 200) {
            setConversations(listRes.data.data);
            const conv = listRes.data.data.find((c: ConversationVO) => c.id === convId);
            if (conv) {
              setSelectedConv(conv);
              fetchMessages(conv);
            }
          }
        }
      } catch {
        // 静默处理
      }
    };
    initConv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 选择会话
  const handleSelectConversation = (conv: ConversationVO) => {
    setSelectedConv(conv);
    fetchMessages(conv);
  };

  // 发送消息
  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || !selectedConv || !stompRef.current || !stompRef.current.connected) return;

    setSending(true);
    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ applicationId: selectedConv.applicationId, content }),
    });
    setInputValue('');
    setSending(false);
  };

  // 获取对方名称
  const getChatPartner = (conv: ConversationVO) => {
    if (user?.role === 'student') return conv.companyName;
    return conv.studentName;
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const d = dayjs(timeStr);
    const now = dayjs();
    if (d.isSame(now, 'day')) return d.format('HH:mm');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return `昨天 ${d.format('HH:mm')}`;
    return d.format('MM-DD HH:mm');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', height: 'calc(100vh - 120px)' }}>
      <Card style={{ height: '100%', borderRadius: 10 }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧会话列表 */}
          <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Title level={5} style={{ margin: 0 }}><MessageOutlined /> 消息</Title>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {conversations.length === 0 ? (
                <Empty description="暂无消息" style={{ marginTop: 60 }} />
              ) : (
                <List
                  dataSource={conversations}
                  renderItem={(conv) => (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: selectedConv?.id === conv.id ? '#e6f4ff' : '#fff',
                        borderLeft: selectedConv?.id === conv.id ? '3px solid #1677ff' : '3px solid transparent',
                      }}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge count={conv.unreadCount} size="small" offset={[-2, 2]}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 20, background: '#f0f5ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <UserOutlined style={{ color: '#1677ff' }} />
                            </div>
                          </Badge>
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 14 }}>{getChatPartner(conv)}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}
                            </Text>
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>
                              {conv.jobTitle}
                            </Text>
                            <Text
                              type="secondary"
                              style={{ fontSize: 12, display: 'block' }}
                              ellipsis
                            >
                              {conv.lastMessage || '暂无消息'}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>

          {/* 右侧聊天窗口 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!selectedConv ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="选择一个会话开始聊天" />
              </div>
            ) : (
              <>
                {/* 聊天头部 */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <Text strong>{getChatPartner(selectedConv)}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{selectedConv.jobTitle}</Text>
                </div>

                {/* 消息列表 */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                  ) : messages.length === 0 ? (
                    <Empty description="暂无消息，发送第一条消息吧" />
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === currentUserId;
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                          <div style={{ maxWidth: '70%' }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: isMine ? 'right' : 'left' }}>
                              {isMine ? '我' : msg.senderName} · {formatTime(msg.sendTime)}
                            </Text>
                            <div style={{
                              marginTop: 4, padding: '8px 14px', borderRadius: 12,
                              background: isMine ? '#1677ff' : '#fff',
                              color: isMine ? '#fff' : '#262626',
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* 输入框 */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                  <Input.TextArea
                    rows={2}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="输入消息，按 Enter 发送，Shift+Enter 换行"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!inputValue.trim()}
                  >
                    发送
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatPage;
