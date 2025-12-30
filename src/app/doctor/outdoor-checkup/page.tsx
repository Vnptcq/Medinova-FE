'use client';

import { useState } from 'react';

export default function OutdoorCheckupPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const handleStartConsultation = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  const handleMarkCompleted = (id: string) => {
    // TODO: Implement mark as completed
    console.log('Mark completed:', id);
  };

  const handleMarkAbsent = (id: string) => {
    // TODO: Implement mark as absent
    console.log('Mark absent:', id);
  };

  const handleRequestLab = (id: string) => {
    // TODO: Implement request lab test
    console.log('Request lab:', id);
  };

  return (
    <div>
      <h2 className="mb-4">🏥 Quản lý lịch khám ngoại trú</h2>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Danh sách lịch khám hôm nay</h5>
        </div>
        <div className="card-body">
          {appointments.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có lịch khám nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Bệnh nhân</th>
                    <th>Triệu chứng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.time}</td>
                      <td>{apt.patientName}</td>
                      <td>{apt.symptoms}</td>
                      <td>
                        <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartConsultation(apt)}
                          >
                            <i className="fa fa-play me-1"></i>Bắt đầu
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={() => handleMarkCompleted(apt.id)}
                          >
                            <i className="fa fa-check me-1"></i>Hoàn thành
                          </button>
                          <button
                            className="btn btn-warning"
                            onClick={() => handleMarkAbsent(apt.id)}
                          >
                            <i className="fa fa-times me-1"></i>Vắng mặt
                          </button>
                          <button
                            className="btn btn-info"
                            onClick={() => handleRequestLab(apt.id)}
                          >
                            <i className="fa fa-vial me-1"></i>Xét nghiệm
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Medical Record Modal */}
      {selectedAppointment && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Hồ sơ bệnh nhân - {selectedAppointment.patientName}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAppointment(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Thông tin bệnh nhân</h6>
                    <p><strong>Tuổi:</strong> {selectedAppointment.age}</p>
                    <p><strong>Giới tính:</strong> {selectedAppointment.gender}</p>
                    <p><strong>Tiền sử bệnh:</strong> {selectedAppointment.medicalHistory}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Triệu chứng hiện tại</h6>
                    <p>{selectedAppointment.symptoms}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <h6>Ghi chú khám</h6>
                  <textarea className="form-control" rows={4} placeholder="Nhập ghi chú khám..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Đóng
                </button>
                <button type="button" className="btn btn-primary">
                  Lưu kết quả
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

