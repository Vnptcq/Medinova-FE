'use client';

import { useState } from 'react';

export default function EmergencyPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);

  const handleAccept = (id: string) => {
    // TODO: Implement accept emergency
    console.log('Accept emergency:', id);
  };

  const handleStartTreatment = (id: string) => {
    // TODO: Implement start treatment
    console.log('Start treatment:', id);
  };

  const handleCloseCase = (id: string) => {
    // TODO: Implement close case
    console.log('Close case:', id);
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      NEW: 'bg-danger',
      ACCEPTED: 'bg-warning',
      IN_TREATMENT: 'bg-info',
      CLOSED: 'bg-success',
    };
    return badges[status] || 'bg-secondary';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🚨 Quản lý cấp cứu (REAL-TIME)</h2>
        <span className="badge bg-danger">Ưu tiên cao nhất</span>
      </div>

      <div className="row g-4">
        {emergencies.length === 0 ? (
          <div className="col-12">
            <div className="card shadow-sm border-danger">
              <div className="card-body text-center py-5">
                <i className="fa fa-ambulance fa-3x text-danger mb-3"></i>
                <p className="text-muted">Hiện tại không có ca cấp cứu nào</p>
              </div>
            </div>
          </div>
        ) : (
          emergencies.map((emergency) => (
            <div key={emergency.id} className="col-md-6">
              <div className={`card shadow-sm border-start border-5 ${emergency.status === 'NEW' ? 'border-danger' : 'border-warning'}`}>
                <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ca cấp cứu #{emergency.id}</h5>
                  <span className={`badge ${getStatusBadge(emergency.status)}`}>
                    {emergency.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <strong>Bệnh nhân:</strong> {emergency.patientName}
                  </div>
                  <div className="mb-3">
                    <strong>Thời gian:</strong> {emergency.time}
                  </div>
                  <div className="mb-3">
                    <strong>Mô tả:</strong> {emergency.description}
                  </div>
                  <div className="mb-3">
                    <strong>Mức độ:</strong>
                    <span className={`badge ${emergency.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'} ms-2`}>
                      {emergency.severity}
                    </span>
                  </div>
                  <div className="btn-group w-100">
                    {emergency.status === 'NEW' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleAccept(emergency.id)}
                      >
                        <i className="fa fa-check me-1"></i>Nhận ca
                      </button>
                    )}
                    {emergency.status === 'ACCEPTED' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleStartTreatment(emergency.id)}
                      >
                        <i className="fa fa-play me-1"></i>Bắt đầu xử lý
                      </button>
                    )}
                    {emergency.status === 'IN_TREATMENT' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleCloseCase(emergency.id)}
                      >
                        <i className="fa fa-check-circle me-1"></i>Kết thúc ca
                      </button>
                    )}
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedEmergency(emergency)}
                    >
                      <i className="fa fa-info-circle me-1"></i>Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Emergency Detail Modal */}
      {selectedEmergency && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Chi tiết ca cấp cứu #{selectedEmergency.id}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmergency(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Thông tin bệnh nhân</h6>
                    <p><strong>Tên:</strong> {selectedEmergency.patientName}</p>
                    <p><strong>Tuổi:</strong> {selectedEmergency.age}</p>
                    <p><strong>Giới tính:</strong> {selectedEmergency.gender}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Tình trạng</h6>
                    <p><strong>Mức độ:</strong> {selectedEmergency.severity}</p>
                    <p><strong>Thời gian:</strong> {selectedEmergency.time}</p>
                    <p><strong>Trạng thái:</strong> {selectedEmergency.status}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <h6>Mô tả chi tiết</h6>
                  <p>{selectedEmergency.description}</p>
                </div>
                <div className="mt-3">
                  <h6>Chẩn đoán</h6>
                  <textarea className="form-control" rows={4} placeholder="Nhập chẩn đoán..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedEmergency(null)}
                >
                  Đóng
                </button>
                <button type="button" className="btn btn-danger">
                  Lưu chẩn đoán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

