'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Danh sách cơ sở</h2>
        <Link href="/admin/hospitals/create" className="btn btn-primary">
          <i className="fa fa-plus me-2"></i>Đăng ký cơ sở mới
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-hospital fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có cơ sở nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên cơ sở</th>
                    <th>Địa chỉ</th>
                    <th>Số điện thoại</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((hospital) => (
                    <tr key={hospital.id}>
                      <td>{hospital.id}</td>
                      <td>{hospital.name}</td>
                      <td>{hospital.address}</td>
                      <td>{hospital.phone}</td>
                      <td>
                        <span className={`badge ${hospital.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                          {hospital.status}
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

