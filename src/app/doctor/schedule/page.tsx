'use client';

import { useState } from 'react';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleBlockTime = () => {
    // TODO: Implement block time
    console.log('Block time');
    setShowBlockModal(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📅 Quản lý lịch làm việc</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowBlockModal(true)}
        >
          <i className="fa fa-ban me-2"></i>Chặn thời gian
        </button>
      </div>

      <div className="alert alert-info">
        <i className="fa fa-info-circle me-2"></i>
        <strong>Lưu ý:</strong> Lịch làm việc của bạn ảnh hưởng trực tiếp đến việc bệnh nhân đặt lịch.
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Lịch làm việc tuần này</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Thứ 2</th>
                  <th>Thứ 3</th>
                  <th>Thứ 4</th>
                  <th>Thứ 5</th>
                  <th>Thứ 6</th>
                  <th>Thứ 7</th>
                  <th>Chủ nhật</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => (
                  <tr key={hour}>
                    <td className="fw-bold">{hour}:00 - {hour + 1}:00</td>
                    {Array.from({ length: 7 }, (_, day) => (
                      <td key={day}>
                        <button className="btn btn-sm btn-outline-success w-100">
                          <i className="fa fa-check me-1"></i>Có thể
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title">Chặn thời gian</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowBlockModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Ngày</label>
                  <input type="date" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Từ giờ</label>
                  <input type="time" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Đến giờ</label>
                  <input type="time" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Lý do</label>
                  <textarea className="form-control" rows={3} placeholder="Nhập lý do chặn thời gian..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBlockModal(false)}
                >
                  Hủy
                </button>
                <button type="button" className="btn btn-warning" onClick={handleBlockTime}>
                  Chặn thời gian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

