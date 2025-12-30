'use client';

import { useState } from 'react';

export default function AmbulancePage() {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<any>(null);

  const handleAssign = (id: string) => {
    // TODO: Implement assign ambulance
    console.log('Assign ambulance:', id);
  };

  return (
    <div>
      <h2 className="mb-4">🚑 Quản lý xe cứu thương</h2>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-primary">
            <div className="card-body text-center">
              <i className="fa fa-truck-medical fa-2x text-primary mb-3"></i>
              <h3>5</h3>
              <p className="text-muted mb-0">Xe sẵn sàng</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-warning">
            <div className="card-body text-center">
              <i className="fa fa-spinner fa-2x text-warning mb-3"></i>
              <h3>2</h3>
              <p className="text-muted mb-0">Đang di chuyển</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-danger">
            <div className="card-body text-center">
              <i className="fa fa-exclamation-triangle fa-2x text-danger mb-3"></i>
              <h3>1</h3>
              <p className="text-muted mb-0">Bận</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Danh sách xe cứu thương</h5>
        </div>
        <div className="card-body">
          {ambulances.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-truck-medical fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có thông tin xe cứu thương</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Biển số</th>
                    <th>Loại xe</th>
                    <th>Vị trí</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {ambulances.map((ambulance) => (
                    <tr key={ambulance.id}>
                      <td>{ambulance.licensePlate}</td>
                      <td>{ambulance.type}</td>
                      <td>{ambulance.location}</td>
                      <td>
                        <span className={`badge ${
                          ambulance.status === 'AVAILABLE' ? 'bg-success' :
                          ambulance.status === 'ON_ROUTE' ? 'bg-warning' :
                          'bg-danger'
                        }`}>
                          {ambulance.status}
                        </span>
                      </td>
                      <td>
                        {ambulance.status === 'AVAILABLE' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAssign(ambulance.id)}
                          >
                            <i className="fa fa-check me-1"></i>Phân công
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setSelectedAmbulance(ambulance)}
                        >
                          <i className="fa fa-info-circle me-1"></i>Chi tiết
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

      {/* Ambulance Detail Modal */}
      {selectedAmbulance && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Chi tiết xe cứu thương</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedAmbulance(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Biển số:</strong> {selectedAmbulance.licensePlate}
                </div>
                <div className="mb-3">
                  <strong>Loại xe:</strong> {selectedAmbulance.type}
                </div>
                <div className="mb-3">
                  <strong>Vị trí:</strong> {selectedAmbulance.location}
                </div>
                <div className="mb-3">
                  <strong>Trạng thái:</strong> {selectedAmbulance.status}
                </div>
                <div className="mb-3">
                  <strong>Nhân viên:</strong> {selectedAmbulance.staff || 'Chưa phân công'}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAmbulance(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

