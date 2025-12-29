'use client';

import { useState, useEffect } from 'react';
import { getUserManagement } from '@/generated/api/endpoints/user-management/user-management';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<Record<number, boolean>>({});

  const availableRoles = [
    { value: 'PATIENT', label: 'PATIENT' },
    { value: 'DOCTOR', label: 'DOCTOR' },
    { value: 'ADMIN', label: 'ADMIN' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userApi = getUserManagement();
      const response = await userApi.getAllUsers();

      // API có thể trả về data trực tiếp hoặc trong response.data
      const usersData = response.data || response;
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string, currentRole: string) => {
    // Nếu role không thay đổi, không cần update
    if (newRole === currentRole) {
      return;
    }

    // Confirm trước khi update
    if (!confirm(`Bạn có chắc chắn muốn thay đổi vai trò từ ${currentRole} sang ${newRole}?`)) {
      // Reload để reset dropdown về giá trị cũ
      await loadUsers();
      return;
    }

    try {
      setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
      const userApi = getUserManagement();
      await userApi.updateUserRole(userId, { role: newRole });
      // Reload danh sách sau khi update
      await loadUsers();
      alert('Cập nhật vai trò thành công!');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật vai trò. Vui lòng thử lại!';
      alert(errorMessage);
      // Reload để reset dropdown về giá trị cũ nếu có lỗi
      await loadUsers();
    } finally {
      setUpdatingRoles(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  return (
    <div>
      <h2 className="mb-4">Users</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có user nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày đăng ký</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.fullName || user.name || 'N/A'}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${updatingRoles[user.id!] ? 'opacity-50' : ''} ${user.role === 'ADMIN' ? 'bg-light' : ''}`}
                          value={user.role || ''}
                          onChange={(e) => handleUpdateRole(user.id!, e.target.value, user.role || '')}
                          disabled={updatingRoles[user.id!] || user.role === 'ADMIN'}
                          style={{ 
                            minWidth: '120px',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            padding: '6px 12px',
                            cursor: (updatingRoles[user.id!] || user.role === 'ADMIN') ? 'not-allowed' : 'pointer',
                            backgroundColor: user.role === 'ADMIN' ? '#f8f9fa' : 'white',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {availableRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {updatingRoles[user.id!] && (
                          <span className="ms-2">
                            <i className="fa fa-spinner fa-spin text-primary"></i>
                          </span>
                        )}
                      </td>
                      <td>
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'ACTIVE' || user.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                          {user.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

