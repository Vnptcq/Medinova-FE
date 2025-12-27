'use client';

import { useState } from 'react';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = (id: string) => {
    // TODO: Implement approve functionality
    console.log('Approve leave:', id);
  };

  const handleReject = (id: string) => {
    // TODO: Implement reject functionality
    console.log('Reject leave:', id);
  };

  return (
    <div>
      <h2 className="mb-4">Duyệt lịch nghỉ</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không có đơn xin nghỉ nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bác sĩ</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.id}</td>
                      <td>{leave.doctorName}</td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td>{leave.reason}</td>
                      <td>
                        <span className={`badge ${leave.status === 'approved' ? 'bg-success' : leave.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(leave.id)}
                        >
                          <i className="fa fa-check me-1"></i>Duyệt
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(leave.id)}
                        >
                          <i className="fa fa-times me-1"></i>Từ chối
                        </button>
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

