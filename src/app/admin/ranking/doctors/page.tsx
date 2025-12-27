'use client';

import { useState } from 'react';

export default function DoctorsRankingPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <h2 className="mb-4">Xếp hạng bác sĩ</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-trophy fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có dữ liệu xếp hạng</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Tên bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Điểm đánh giá</th>
                    <th>Số lượt đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((ranking, index) => (
                    <tr key={ranking.id}>
                      <td>
                        <span className="badge bg-primary">#{index + 1}</span>
                      </td>
                      <td>{ranking.doctorName}</td>
                      <td>{ranking.specialty}</td>
                      <td>
                        <i className="fa fa-star text-warning me-1"></i>
                        {ranking.rating}
                      </td>
                      <td>{ranking.reviewCount}</td>
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

