'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAppointmentManagement } from '@/generated/api/endpoints/appointment-management/appointment-management';
import { getDoctorManagement } from '@/generated/api/endpoints/doctor-management/doctor-management';
import { getUser } from '@/utils/auth';
import type { BusyScheduleResponse } from '@/generated/api/models';

export default function SchedulePage() {
  const [busySchedules, setBusySchedules] = useState<BusyScheduleResponse[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Get doctor ID from user
  useEffect(() => {
    const loadDoctorId = async () => {
      try {
        const userData = getUser();
        if (!userData) {
          console.warn('User data not found');
          return;
        }

        // Try to get doctor ID directly from user object
        const directDoctorId = userData.doctorId || userData.doctor?.id;
        if (directDoctorId) {
          setDoctorId(Number(directDoctorId));
          return;
        }

        // If not found, search for doctor by user ID or email
        const userId = userData.id || userData.userId || userData.user?.id;
        const userEmail = userData.email;

        if (!userId && !userEmail) {
          console.warn('User ID and email not found');
          return;
        }

        const doctorApi = getDoctorManagement();
        const response = await doctorApi.getAllDoctors();
        const doctorsData = (response as any)?.data || response;
        const allDoctors = Array.isArray(doctorsData) ? doctorsData : [];
        
        // Find doctor by user ID or email
        let currentDoctor = null;
        if (userId) {
          currentDoctor = allDoctors.find((doc: any) => 
            doc.user?.id === userId || 
            doc.userId === userId ||
            doc.user?.userId === userId
          );
        }
        
        if (!currentDoctor && userEmail) {
          currentDoctor = allDoctors.find((doc: any) => 
            doc.user?.email === userEmail || 
            doc.email === userEmail
          );
        }
        
        if (currentDoctor && currentDoctor.id) {
          setDoctorId(Number(currentDoctor.id));
        }
      } catch (error) {
        console.error('Error loading doctor ID:', error);
      }
    };

    loadDoctorId();
  }, []);

  // Load busy schedules when doctor ID is available or week changes
  useEffect(() => {
    if (doctorId) {
      loadBusySchedules(doctorId);
    }
  }, [doctorId, selectedWeek]);

  // Load busy schedules for the doctor
  const loadBusySchedules = useCallback(async (doctorId: number) => {
    try {
      setIsLoading(true);
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getBusySchedules(doctorId);
      const schedules = Array.isArray(response) ? response : [];
      setBusySchedules(schedules);
    } catch (error) {
      console.error('Error loading busy schedules:', error);
      setBusySchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get all days in the week
  const getWeekDays = (weekStart: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get hours from 8 to 17 (8 AM to 5 PM)
  const getHours = (): number[] => {
    return Array.from({ length: 10 }, (_, i) => i + 8); // 8-17
  };

  // Check if a date is at least 3 days from now
  const isAtLeast3DaysFromNow = (date: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  };

  // Get busy schedule info for a specific slot
  const getSlotBusyInfo = (date: Date, hour: number): BusyScheduleResponse | null => {
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, 0, 0, 0);
    
    for (const schedule of busySchedules) {
      if (schedule.startDateTime && schedule.endDateTime) {
        const startDate = new Date(schedule.startDateTime);
        const endDate = new Date(schedule.endDateTime);
        
        if (slotDateTime >= startDate && slotDateTime < endDate) {
          return schedule;
        }
      } else if (schedule.startDate && schedule.endDate) {
        const startDate = new Date(schedule.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(schedule.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const slotDateOnly = new Date(date);
        slotDateOnly.setHours(0, 0, 0, 0);
        
        if (slotDateOnly >= startDate && slotDateOnly <= endDate) {
          return schedule;
        }
      }
    }
    return null;
  };

  // Check if a slot is busy
  const isSlotBusy = (date: Date, hour: number): boolean => {
    return getSlotBusyInfo(date, hour) !== null;
  };

  // Get slot type (APPOINTMENT, HOLD, or LEAVE)
  const getSlotType = (date: Date, hour: number): string | null => {
    const info = getSlotBusyInfo(date, hour);
    return info?.type || null;
  };

  // Check if a time slot is in the past
  const isPastTime = (date: Date, hour: number): boolean => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  // Handle block time form submission
  const handleBlockTime = async () => {
    if (!blockFormData.date || !blockFormData.startTime || !blockFormData.endTime) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const selectedDate = new Date(blockFormData.date);
    if (!isAtLeast3DaysFromNow(selectedDate)) {
      setErrorMessage('Lịch làm việc phải được đặt trước 3 ngày.');
      return;
    }

    try {
      // TODO: Implement API call to block time (create leave request)
      console.log('Block time:', blockFormData);
      setShowBlockModal(false);
      setBlockFormData({ date: '', startTime: '', endTime: '', reason: '' });
      setErrorMessage('');
      
      // Reload busy schedules after blocking
      if (doctorId) {
        await loadBusySchedules(doctorId);
      }
    } catch (error) {
      console.error('Error blocking time:', error);
      setErrorMessage('Có lỗi xảy ra khi chặn thời gian. Vui lòng thử lại.');
    }
  };

  // Calculate week days and hours for the grid
  const weekStart = getWeekStart(selectedWeek);
  const weekDays = getWeekDays(weekStart);
  const hours = getHours(); // 8-17
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Get minimum date for block form (3 days from now)
  const getMinDate = (): string => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate.toISOString().split('T')[0];
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📅 Quản lý lịch làm việc</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowBlockModal(true);
            setErrorMessage('');
            setBlockFormData({ date: '', startTime: '', endTime: '', reason: '' });
          }}
        >
          <i className="fa fa-ban me-2"></i>Chặn thời gian
        </button>
      </div>

      <div className="alert alert-info">
        <i className="fa fa-info-circle me-2"></i>
        <strong>Lưu ý:</strong> Lịch làm việc của bạn ảnh hưởng trực tiếp đến việc bệnh nhân đặt lịch. 
        <strong className="ms-2">Lịch làm việc phải được đặt trước 3 ngày.</strong>
      </div>

      {/* Week Navigation */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToPreviousWeek}
              disabled={isLoading}
            >
              <i className="fa fa-chevron-left me-2"></i>Tuần trước
            </button>
            <h6 className="mb-0">
              {isLoading && (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              )}
              {weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })} - {' '}
              {weekDays[6].toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </h6>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToNextWeek}
              disabled={isLoading}
            >
              Tuần sau<i className="fa fa-chevron-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="fa fa-calendar-alt me-2"></i>
            Lịch làm việc tuần này
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover mb-0" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light" style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center', fontWeight: 'bold', padding: '12px' }}>
                    <i className="fa fa-clock me-1"></i>Giờ
                  </th>
                  {weekDays.map((date, index) => (
                    <th key={index} style={{ textAlign: 'center', minWidth: '120px', padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{dayNames[index]}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>
                        {date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour}>
                    <td className="text-center fw-bold" style={{ verticalAlign: 'middle' }}>
                      {hour}:00
                    </td>
                    {weekDays.map((date, dayIndex) => {
                      const isBusy = isSlotBusy(date, hour);
                      const isPast = isPastTime(date, hour);
                      const slotType = getSlotType(date, hour);
                      const busyInfo = getSlotBusyInfo(date, hour);

                      // Determine button class and color based on slot type
                      let btnClass = 'btn btn-sm';
                      let btnStyle: React.CSSProperties = { width: '100%', minHeight: '45px', position: 'relative' };
                      
                      if (isBusy) {
                        if (slotType === 'APPOINTMENT') {
                          btnClass += ' btn-danger';
                          btnStyle.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                          btnStyle.color = 'white';
                        } else if (slotType === 'HOLD') {
                          btnClass += ' btn-info';
                          btnStyle.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
                          btnStyle.color = 'white';
                        } else if (slotType === 'LEAVE') {
                          btnClass += ' btn-warning';
                          btnStyle.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
                          btnStyle.color = 'white';
                        } else {
                          btnClass += ' btn-danger';
                        }
                      } else if (isPast) {
                        btnClass += ' btn-secondary';
                        btnStyle.opacity = 0.5;
                      } else {
                        btnClass += ' btn-outline-success';
                      }

                      // Build tooltip text
                      let tooltipText = '';
                      if (isPast) {
                        tooltipText = 'Lịch đã qua';
                      } else if (isBusy && busyInfo) {
                        const startTime = busyInfo.startDateTime 
                          ? new Date(busyInfo.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : busyInfo.startDate;
                        const endTime = busyInfo.endDateTime 
                          ? new Date(busyInfo.endDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : busyInfo.endDate;
                        
                        if (slotType === 'APPOINTMENT') {
                          tooltipText = '📅 Cuộc hẹn với bệnh nhân\n';
                        } else if (slotType === 'HOLD') {
                          tooltipText = '⏳ Đang giữ chỗ (bệnh nhân chưa xác nhận)\n';
                        } else {
                          tooltipText = '🏖️ Nghỉ phép\n';
                        }
                        
                        if (startTime && endTime) {
                          tooltipText += `Thời gian: ${startTime} - ${endTime}\n`;
                        }
                        if (busyInfo.reason) {
                          tooltipText += `Lý do: ${busyInfo.reason}`;
                        }
                      } else {
                        tooltipText = `Trống - Có thể đặt lịch`;
                      }

                      return (
                        <td key={dayIndex} style={{ padding: '4px', textAlign: 'center', position: 'relative' }}>
                          <button
                            type="button"
                            className={btnClass}
                            style={btnStyle}
                            disabled={isPast}
                            title={tooltipText}
                            onMouseEnter={(e) => {
                              if (isBusy && busyInfo) {
                                const tooltip = document.createElement('div');
                                tooltip.className = 'custom-slot-tooltip';
                                tooltip.style.cssText = `
                                  position: absolute;
                                  background: rgba(0, 0, 0, 0.9);
                                  color: white;
                                  padding: 8px 12px;
                                  border-radius: 6px;
                                  font-size: 0.85rem;
                                  z-index: 1000;
                                  white-space: pre-line;
                                  pointer-events: none;
                                  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                                  max-width: 250px;
                                `;
                                
                                const startTime = busyInfo.startDateTime 
                                  ? new Date(busyInfo.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                  : busyInfo.startDate;
                                const endTime = busyInfo.endDateTime 
                                  ? new Date(busyInfo.endDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                  : busyInfo.endDate;
                                
                                let typeLabel = '';
                                if (slotType === 'APPOINTMENT') {
                                  typeLabel = '📅 Cuộc hẹn với bệnh nhân';
                                } else if (slotType === 'HOLD') {
                                  typeLabel = '⏳ Đang giữ chỗ (chưa xác nhận)';
                                } else {
                                  typeLabel = '🏖️ Nghỉ phép';
                                }
                                
                                tooltip.innerHTML = `
                                  <div style="font-weight: bold; margin-bottom: 4px;">
                                    ${typeLabel}
                                  </div>
                                  ${startTime && endTime ? `<div style="margin-bottom: 4px;">⏰ ${startTime} - ${endTime}</div>` : ''}
                                  ${busyInfo.reason ? `<div style="font-size: 0.8rem; opacity: 0.9;">${busyInfo.reason}</div>` : ''}
                                `;
                                
                                document.body.appendChild(tooltip);
                                const rect = e.currentTarget.getBoundingClientRect();
                                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
                              }
                            }}
                            onMouseLeave={() => {
                              const tooltip = document.querySelector('.custom-slot-tooltip');
                              if (tooltip) {
                                tooltip.remove();
                              }
                            }}
                          >
                            {isBusy ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                {slotType === 'APPOINTMENT' ? (
                                  <>
                                    <i className="fa fa-calendar-check" style={{ fontSize: '1rem' }}></i>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Hẹn</span>
                                  </>
                                ) : slotType === 'HOLD' ? (
                                  <>
                                    <i className="fa fa-clock" style={{ fontSize: '1rem' }}></i>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Giữ</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-umbrella-beach" style={{ fontSize: '1rem' }}></i>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Nghỉ</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.85rem' }}>Trống</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-3 p-3 bg-light rounded border">
            <div className="row g-3">
              <div className="col-12">
                <h6 className="mb-3 fw-bold">
                  <i className="fa fa-info-circle me-2 text-primary"></i>
                  Chú thích:
                </h6>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-outline-success" disabled style={{ minWidth: '70px', minHeight: '35px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Trống</span>
                  </button>
                  <span style={{ fontSize: '0.85rem' }}>Có thể đặt lịch</span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-danger" 
                    disabled 
                    style={{ 
                      minWidth: '70px', 
                      minHeight: '35px',
                      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                    }}
                  >
                    <i className="fa fa-calendar-check"></i>
                  </button>
                  <span style={{ fontSize: '0.85rem' }}>📅 Cuộc hẹn với bệnh nhân</span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-info" 
                    disabled 
                    style={{ 
                      minWidth: '70px', 
                      minHeight: '35px',
                      background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'
                    }}
                  >
                    <i className="fa fa-clock"></i>
                  </button>
                  <span style={{ fontSize: '0.85rem' }}>⏳ Đang giữ chỗ</span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-warning" 
                    disabled 
                    style={{ 
                      minWidth: '70px', 
                      minHeight: '35px',
                      background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'
                    }}
                  >
                    <i className="fa fa-umbrella-beach"></i>
                  </button>
                  <span style={{ fontSize: '0.85rem' }}>🏖️ Nghỉ phép</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="fa fa-lightbulb me-1 text-warning"></i>
                <strong>Tip:</strong> Di chuột qua các slot bận để xem thông tin chi tiết
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Block Time Modal */}
      {showBlockModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title">
                  <i className="fa fa-ban me-2"></i>Chặn thời gian
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowBlockModal(false);
                    setErrorMessage('');
                    setBlockFormData({ date: '', startTime: '', endTime: '', reason: '' });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fa fa-exclamation-circle me-2"></i>
                    {errorMessage}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Ngày *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={blockFormData.date}
                    onChange={(e) => setBlockFormData({ ...blockFormData, date: e.target.value })}
                    min={getMinDate()}
                    required
                  />
                  <small className="text-muted">Lịch làm việc phải được đặt trước 3 ngày</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Từ giờ *</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={blockFormData.startTime}
                    onChange={(e) => setBlockFormData({ ...blockFormData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Đến giờ *</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={blockFormData.endTime}
                    onChange={(e) => setBlockFormData({ ...blockFormData, endTime: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Lý do</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Nhập lý do chặn thời gian..."
                    value={blockFormData.reason}
                    onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowBlockModal(false);
                    setErrorMessage('');
                    setBlockFormData({ date: '', startTime: '', endTime: '', reason: '' });
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning" 
                  onClick={handleBlockTime}
                >
                  <i className="fa fa-ban me-2"></i>Chặn thời gian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
