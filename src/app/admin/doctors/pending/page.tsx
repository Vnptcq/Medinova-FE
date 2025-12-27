'use client';

import { useState } from 'react';

export default function PendingDoctorsPage() {
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = (id: string) => {
    // TODO: Implement approve functionality
    console.log('Approve doctor:', id);
  };

  const handleReject = (id: string) => {
    // TODO: Implement reject functionality
    console.log('Reject doctor:', id);
  };

  return (
    <div>
      <h2 className="mb-4">Bác sĩ chờ duyệt</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : pendingDoctors.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-check-circle fa-3x text-success mb-3"></i>
              <p className="text-muted">Không có bác sĩ nào chờ duyệt</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Bệnh viện</th>
                    <th>Email</th>
                    <th>Ngày đăng ký</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDoctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.id}</td>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialty}</td>
                      <td>{doctor.hospital}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.createdAt}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(doctor.id)}
                        >
                          <i className="fa fa-check me-1"></i>Duyệt
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(doctor.id)}
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

