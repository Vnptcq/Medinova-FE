'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser } from '@/utils/auth';

export default function DoctorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    todayAppointments: 8,
    activeEmergencies: 1,
    pendingLabResults: 2,
    upcomingSurgeries: 1,
  });

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            👨‍⚕️ {user?.fullName || 'Bác sĩ'} - {user?.specialization || 'Chuyên khoa'}
          </h2>
          <p className="text-muted mb-0">
            📅 {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Lịch khám hôm nay</h6>
                  <h3 className="mb-0 text-primary">{stats.todayAppointments}</h3>
                </div>
                <i className="fa fa-calendar-check fa-2x text-primary"></i>
              </div>
              <Link href="/doctor/outdoor-checkup" className="btn btn-sm btn-outline-primary mt-3 w-100">
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-danger border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Ca cấp cứu</h6>
                  <h3 className="mb-0 text-danger">{stats.activeEmergencies}</h3>
                </div>
                <i className="fa fa-ambulance fa-2x text-danger"></i>
              </div>
              <Link href="/doctor/emergency" className="btn btn-sm btn-outline-danger mt-3 w-100">
                Xử lý ngay
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Xét nghiệm chờ kết quả</h6>
                  <h3 className="mb-0 text-warning">{stats.pendingLabResults}</h3>
                </div>
                <i className="fa fa-vial fa-2x text-warning"></i>
              </div>
              <Link href="/doctor/blood-testing" className="btn btn-sm btn-outline-warning mt-3 w-100">
                Xem kết quả
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Ca phẫu thuật sắp tới</h6>
                  <h3 className="mb-0 text-info">{stats.upcomingSurgeries}</h3>
                </div>
                <i className="fa fa-procedures fa-2x text-info"></i>
              </div>
              <Link href="/doctor/surgery" className="btn btn-sm btn-outline-info mt-3 w-100">
                Xem lịch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">⏳ Lịch sắp tới hôm nay</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Bệnh nhân {item}</h6>
                      <small className="text-muted">08:00 - Khám ngoại trú</small>
                    </div>
                    <span className="badge bg-primary rounded-pill">Sắp tới</span>
                  </div>
                ))}
              </div>
              <Link href="/doctor/outdoor-checkup" className="btn btn-primary mt-3 w-100">
                Xem tất cả lịch khám
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">🚨 Ca cấp cứu đang xử lý</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-danger mb-3">
                <h6 className="alert-heading">Ca cấp cứu #001</h6>
                <p className="mb-2">Bệnh nhân: Nguyễn Văn A</p>
                <p className="mb-2">Thời gian: 07:30</p>
                <small>Trạng thái: Đang xử lý</small>
              </div>
              <Link href="/doctor/emergency" className="btn btn-danger w-100">
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4 mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Thao tác nhanh</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <Link href="/doctor/outdoor-checkup" className="btn btn-outline-primary w-100">
                    <i className="fa fa-stethoscope me-2"></i>
                    Khám bệnh
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/doctor/pharmacy" className="btn btn-outline-success w-100">
                    <i className="fa fa-pills me-2"></i>
                    Kê đơn thuốc
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/doctor/blood-testing" className="btn btn-outline-warning w-100">
                    <i className="fa fa-vial me-2"></i>
                    Yêu cầu xét nghiệm
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/doctor/schedule" className="btn btn-outline-info w-100">
                    <i className="fa fa-calendar-alt me-2"></i>
                    Quản lý lịch
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

