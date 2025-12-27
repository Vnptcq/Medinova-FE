'use client';

import { useState } from 'react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <h2 className="mb-4">Danh sách bác sĩ</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-user-md fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có bác sĩ nào</p>
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
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.id}</td>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialty}</td>
                      <td>{doctor.hospital}</td>
                      <td>{doctor.email}</td>
                      <td>
                        <span className={`badge ${doctor.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                          {doctor.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary me-2">
                          <i className="fa fa-edit"></i>
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <i className="fa fa-trash"></i>
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

