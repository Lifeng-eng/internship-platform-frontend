import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Select, Modal, message, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserVO } from '../../types';
import { listUsers, disableUser, enableUser } from '../../api/admin';

// 角色映射
const roleMap: Record<string, { color: string; text: string }> = {
  student: { color: 'blue', text: '学生' },
  company: { color: 'orange', text: '企业' },
  admin: { color: 'red', text: '管理员' },
};

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'success', text: '正常' },
  disabled: { color: 'error', text: '已禁用' },
};

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'student', label: '学生' },
  { value: 'company', label: '企业' },
  { value: 'admin', label: '管理员' },
];

const UsersPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  // 列表状态
  const [users, setUsers] = useState<UserVO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [roleFilter, setRoleFilter] = useState<string>('');

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setLoading(true);
    try {
      const role = roleFilter || undefined;
      const res = await listUsers(page, pageSize, role);
      const data = res.data.data;
      setUsers(data?.records ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取用户列表失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate, roleFilter, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 禁用用户
  const handleDisable = (id: number) => {
    Modal.confirm({
      title: '确认禁用',
      content: '确定要禁用该用户吗？禁用后用户将无法登录系统。',
      okText: '确认禁用',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await disableUser(id);
          message.success('用户已禁用');
          fetchUsers();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
          message.error(msg);
        }
      },
    });
  };

  // 启用用户
  const handleEnable = (id: number) => {
    Modal.confirm({
      title: '确认启用',
      content: '确定要启用该用户吗？',
      okText: '确认启用',
      cancelText: '取消',
      onOk: async () => {
        try {
          await enableUser(id);
          message.success('用户已启用');
          fetchUsers();
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败';
          message.error(msg);
        }
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<UserVO> = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const cfg = roleMap[role] || { color: 'default', text: role };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '名称/企业',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: UserVO) => record.name || record.companyName || '-',
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
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
    { title: '注册时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: UserVO) => {
        // 管理员不可操作
        if (record.role === 'admin') return <span>-</span>;
        if (record.status === 'normal') {
          return (
            <Button type="link" size="small" danger onClick={() => handleDisable(record.id)}>
              禁用
            </Button>
          );
        }
        return (
          <Button type="link" size="small" onClick={() => handleEnable(record.id)}>
            启用
          </Button>
        );
      },
    },
  ];

  return (
    <Card title="用户管理" style={{ minHeight: 500 }}>
      {/* 角色筛选 */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>角色筛选：</span>
        <Select
          value={roleFilter}
          onChange={(val) => { setRoleFilter(val); setPage(1); }}
          options={roleOptions}
          style={{ width: 150 }}
        />
      </div>

      <Table<UserVO>
        columns={columns}
        dataSource={users}
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
        locale={{ emptyText: <Empty description="暂无用户" /> }}
      />
    </Card>
  );
};

export default UsersPage;
