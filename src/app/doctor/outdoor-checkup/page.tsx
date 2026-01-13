'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAppointmentManagement } from '@/generated/api/endpoints/appointment-management/appointment-management';
import { getDoctorManagement } from '@/generated/api/endpoints/doctor-management/doctor-management';
import { getUser } from '@/utils/auth';
import { api } from '@/lib/api';
import type { AppointmentResponse } from '@/generated/api/models';

export default function OutdoorCheckupPage() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');

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

  // Load appointments when doctor ID is available or view mode changes
  useEffect(() => {
    if (doctorId) {
      if (viewMode === 'today') {
        loadTodayAppointments();
      } else {
        loadAllAppointments();
      }
    }
  }, [doctorId, viewMode]);

  // Load today's appointments
  const loadTodayAppointments = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getTodayAppointments({ doctorId });
      
      // Handle response - could be array directly or wrapped in data
      const appointmentsData = (response as any)?.data || response;
      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];
      
      // Sort appointments by time (earliest first)
      const sortedAppointments = appointmentsList.sort((a, b) => {
        const timeA = a.appointmentTime || a.scheduleStartTime || '';
        const timeB = b.appointmentTime || b.scheduleStartTime || '';
        return timeA.localeCompare(timeB);
      });
      
      setAppointments(sortedAppointments);
    } catch (error: any) {
      console.error('Error loading today appointments:', error);
      setErrorMessage('Error loading appointments. Please try again.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  // Load all appointments
  const loadAllAppointments = useCallback(async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getAppointments({ 
        doctorId,
        page: 0,
        size: 1000 // Get a large number to show all appointments
      });
      
      // Handle response - API returns Page object with content array
      const pageData = (response as any)?.data || response;
      const appointmentsList = pageData?.content || pageData || [];
      
      // Sort appointments by date and time (earliest first)
      const sortedAppointments = appointmentsList.sort((a: AppointmentResponse, b: AppointmentResponse) => {
        const dateTimeA = a.appointmentTime || a.scheduleWorkDate || '';
        const dateTimeB = b.appointmentTime || b.scheduleWorkDate || '';
        return dateTimeA.localeCompare(dateTimeB);
      });
      
      setAppointments(sortedAppointments);
    } catch (error: any) {
      console.error('Error loading all appointments:', error);
      setErrorMessage('Error loading appointments. Please try again.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  // Format time for display
  const formatTime = (time: string | any): string => {
    if (!time) return 'N/A';
    
    // If it's a LocalTime object with hour and minute
    if (typeof time === 'object' && time.hour !== undefined && time.minute !== undefined) {
      return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
    }
    
    // If it's a datetime string
    if (typeof time === 'string') {
      try {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        // If it's already in HH:mm format
        if (time.match(/^\d{2}:\d{2}/)) {
          return time.substring(0, 5);
        }
      } catch (e) {
        // If parsing fails, return as is
        return time;
      }
    }
    
    return String(time);
  };

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string | undefined): string => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-warning';
      case 'CONFIRMED':
      case 'BOOKED':
        return 'bg-info';
      case 'CHECKED_IN':
        return 'bg-primary';
      case 'IN_PROGRESS':
        return 'bg-warning text-dark';
      case 'REVIEW':
        return 'bg-primary';
      case 'COMPLETED':
        return 'bg-success';
      case 'CANCELLED':
      case 'CANCELLED_BY_PATIENT':
        return 'bg-danger';
      case 'CANCELLED_BY_DOCTOR':
        return 'bg-danger';
      case 'NO_SHOW':
        return 'bg-secondary';
      case 'REJECTED':
        return 'bg-danger';
      case 'EXPIRED':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  // Get status text
  const getStatusText = (status: string | undefined): string => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
      case 'BOOKED':
        return 'Confirmed';
      case 'CHECKED_IN':
        return 'Checked In';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'REVIEW':
        return 'Review';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
      case 'CANCELLED_BY_PATIENT':
        return 'Cancelled (Patient)';
      case 'CANCELLED_BY_DOCTOR':
        return 'Cancelled (Doctor)';
      case 'NO_SHOW':
        return 'No Show';
      case 'REJECTED':
        return 'Rejected';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status || 'N/A';
    }
  };

  const handleStartConsultation = (appointment: AppointmentResponse) => {
    setSelectedAppointment(appointment);
  };

  // Check-in appointment (CONFIRMED → CHECKED_IN)
  const handleCheckIn = async (id: number | undefined) => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to check-in this patient?')) {
      return;
    }
    
    try {
      // Call check-in API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/check-in`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Check-in successful!');
      handleRefresh();
    } catch (error: any) {
      console.error('Error checking in:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error checking in.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  // Start consultation (CHECKED_IN → IN_PROGRESS)
  const handleStartConsultationClick = async (id: number | undefined) => {
    if (!id) return;
    
    if (!confirm('Start consultation for this patient?')) {
      return;
    }
    
    try {
      // Call start consultation API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/start`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Consultation started!');
      handleRefresh();
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error starting consultation.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  // Complete consultation (IN_PROGRESS → REVIEW)
  const handleCompleteConsultation = async (id: number | undefined) => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to complete the consultation? The appointment will change to "Review" status and the patient can review you.')) {
      return;
    }
    
    try {
      // Call complete consultation API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/complete`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Consultation completed! The appointment has changed to "Review" status. The patient can now review you.');
      handleRefresh();
    } catch (error: any) {
      console.error('Error completing consultation:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error completing consultation.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  // Confirm appointment (PENDING → CONFIRMED) - for doctor
  const handleConfirmAppointment = async (id: number | undefined) => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to confirm this appointment? The patient will receive a confirmation notification.')) {
      return;
    }
    
    try {
      // Call confirm API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/confirm`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Appointment confirmed! The patient will receive a notification.');
      handleRefresh();
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error confirming appointment.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  // Reject appointment (PENDING → REJECTED) - for doctor
  const handleRejectAppointment = async (id: number | undefined) => {
    if (!id) return;
    
    const reason = prompt('Enter rejection reason (internal, only visible to doctor and admin):\n\nThe patient will receive a general notification: "Doctor is not available at this time"');
    if (reason === null) return; // User cancelled
    
    if (!confirm('Are you sure you want to reject this appointment? The slot will be released and the patient will receive a notification.')) {
      return;
    }
    
    try {
      // Call reject API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/reject`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: reason ? { reason } : {}
      });
      alert('Appointment rejected! Slot has been released.');
      handleRefresh();
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error rejecting appointment.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  // Cancel confirmed appointment (CONFIRMED → CANCELLED_BY_DOCTOR) - for doctor
  const handleCancelByDoctor = async (id: number | undefined) => {
    if (!id) return;
    
    const reason = prompt('Enter cancellation reason (internal, only visible to doctor and admin):');
    if (reason === null) return; // User cancelled
    
    if (!confirm('Are you sure you want to cancel this confirmed appointment? The patient will receive a notification and can choose another slot.')) {
      return;
    }
    
    try {
      // Call cancel API endpoint
      await api<AppointmentResponse>({
        url: `/api/appointments/${id}/cancel`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: reason ? { reason } : {}
      });
      alert('Appointment cancelled! The patient will receive a notification.');
      handleRefresh();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error cancelling appointment.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  const handleMarkAbsent = async (id: number | undefined) => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to mark this patient as absent (NO_SHOW)?')) {
      return;
    }
    
    try {
      const appointmentApi = getAppointmentManagement();
      await appointmentApi.updateAppointmentStatusByDoctor(id, { status: 'NO_SHOW' });
      alert('Marked as absent!');
      handleRefresh();
    } catch (error: any) {
      console.error('Error marking as absent:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error updating status.';
      setErrorMessage(errorMessage);
      alert(errorMessage);
    }
  };

  const handleRequestLab = async (id: number | undefined) => {
    if (!id) return;
    
    // Navigate to blood test page or open modal to create blood test
    // For now, just show a message
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
      const confirmCreate = confirm(`Do you want to create a blood test request for patient ${appointment.patientName}?`);
      if (confirmCreate) {
        // Navigate to blood test page with patient info pre-filled
        window.location.href = `/services/blood-testing?appointmentId=${id}&patientId=${appointment.patientId}&clinicId=${appointment.clinicId}`;
      }
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    if (viewMode === 'today') {
      loadTodayAppointments();
    } else {
      loadAllAppointments();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🏥 Quản lý lịch khám ngoại trú</h2>
        <div className="d-flex gap-2">
          {/* View Mode Toggle */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${viewMode === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('today')}
              disabled={isLoading}
            >
              <i className="fa fa-calendar-day me-2"></i>
              Hôm nay
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('all')}
              disabled={isLoading}
            >
              <i className="fa fa-calendar-alt me-2"></i>
              Tất cả
            </button>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <i className={`fa fa-${isLoading ? 'spinner fa-spin' : 'sync'} me-2`}></i>
            Refresh
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fa fa-exclamation-circle me-2"></i>
          {errorMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage('')}
          ></button>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className={`fa fa-${viewMode === 'today' ? 'calendar-day' : 'calendar-alt'} me-2`}></i>
            {viewMode === 'today' ? "Today's Appointments" : 'All Appointments'}
          </h5>
          <span className="badge bg-light text-dark">
            {appointments.length} appointments
          </span>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">
                {viewMode === 'today' 
                  ? 'No appointments today' 
                  : 'No appointments found'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    {viewMode === 'all' && <th style={{ width: '120px' }}>Date</th>}
                    <th style={{ width: '120px' }}>Time</th>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Age / Gender</th>
                    <th>Symptoms</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '250px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      {viewMode === 'all' && (
                        <td>
                          <div className="fw-bold">
                            {formatDate(apt.scheduleWorkDate || apt.appointmentTime)}
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="fw-bold">
                          {formatTime(apt.appointmentTime || apt.scheduleStartTime)}
                        </div>
                        {apt.scheduleEndTime && (
                          <small className="text-muted">
                            - {formatTime(apt.scheduleEndTime)}
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{apt.patientName || 'N/A'}</div>
                        {apt.clinicName && (
                          <small className="text-muted d-block">{apt.clinicName}</small>
                        )}
                      </td>
                      <td>
                        <small>{apt.patientEmail || 'N/A'}</small>
                      </td>
                      <td>
                        {apt.age && (
                          <span className="me-2">{apt.age} years</span>
                        )}
                        {apt.gender && (
                          <span className="badge bg-secondary">
                            {apt.gender === 'MALE' ? 'Male' : apt.gender === 'FEMALE' ? 'Female' : 'Other'}
                          </span>
                        )}
                        {!apt.age && !apt.gender && 'N/A'}
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {apt.symptoms ? (
                            <small className="text-truncate d-block" title={apt.symptoms}>
                              {apt.symptoms}
                            </small>
                          ) : (
                            <small className="text-muted">Không có</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {/* Confirm button - PENDING → CONFIRMED */}
                          {apt.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => handleConfirmAppointment(apt.id)}
                                title="Confirm Appointment"
                              >
                                <i className="fa fa-check-circle"></i> Confirm
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRejectAppointment(apt.id)}
                                title="Reject Appointment"
                              >
                                <i className="fa fa-times-circle"></i> Reject
                              </button>
                            </>
                          )}
                          {/* Cancel button - CONFIRMED → CANCELLED_BY_DOCTOR */}
                          {apt.status === 'CONFIRMED' && (
                            <>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleCheckIn(apt.id)}
                                title="Check-in Patient"
                              >
                                <i className="fa fa-sign-in-alt"></i>
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleCancelByDoctor(apt.id)}
                                title="Cancel Appointment (Doctor)"
                              >
                                <i className="fa fa-ban"></i>
                              </button>
                            </>
                          )}
                          {/* Start consultation button - CHECKED_IN → IN_PROGRESS */}
                          {apt.status === 'CHECKED_IN' && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleStartConsultationClick(apt.id)}
                              title="Start Consultation"
                            >
                              <i className="fa fa-play"></i>
                            </button>
                          )}
                          {/* View/Edit button - IN_PROGRESS */}
                          {apt.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleStartConsultation(apt)}
                                title="View/Edit Record"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-success"
                                onClick={() => handleCompleteConsultation(apt.id)}
                                title="Complete Consultation (move to review)"
                              >
                                <i className="fa fa-check"></i>
                              </button>
                            </>
                          )}
                          {/* No-show button - for PENDING, CONFIRMED, CHECKED_IN */}
                          {(apt.status === 'PENDING' || apt.status === 'CONFIRMED' || apt.status === 'CHECKED_IN') && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleMarkAbsent(apt.id)}
                              title="Mark as Absent"
                            >
                              <i className="fa fa-user-times"></i>
                            </button>
                          )}
                          {/* Request lab button - available for most statuses */}
                          {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && apt.status !== 'CANCELLED_BY_DOCTOR' && apt.status !== 'CANCELLED_BY_PATIENT' && apt.status !== 'NO_SHOW' && apt.status !== 'REJECTED' && apt.status !== 'EXPIRED' && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleRequestLab(apt.id)}
                              title="Yêu cầu xét nghiệm"
                            >
                              <i className="fa fa-vial"></i>
                            </button>
                          )}
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
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedAppointment(null);
            }
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fa fa-user-md me-2"></i>
                  Patient Record - {selectedAppointment.patientName || 'N/A'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedAppointment(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6 className="text-primary">
                      <i className="fa fa-info-circle me-2"></i>
                      Patient Information
                    </h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Name:</strong></td>
                          <td>{selectedAppointment.patientName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{selectedAppointment.patientEmail || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Age:</strong></td>
                          <td>{selectedAppointment.age || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Gender:</strong></td>
                          <td>
                            {selectedAppointment.gender === 'MALE' ? 'Male' : 
                             selectedAppointment.gender === 'FEMALE' ? 'Female' : 
                             selectedAppointment.gender || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Clinic:</strong></td>
                          <td>{selectedAppointment.clinicName || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary">
                      <i className="fa fa-calendar me-2"></i>
                      Appointment Information
                    </h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Time:</strong></td>
                          <td>
                            {formatTime(selectedAppointment.appointmentTime || selectedAppointment.scheduleStartTime)}
                            {selectedAppointment.scheduleEndTime && (
                              <> - {formatTime(selectedAppointment.scheduleEndTime)}</>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Date:</strong></td>
                          <td>{formatDate(selectedAppointment.scheduleWorkDate || selectedAppointment.appointmentTime)}</td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(selectedAppointment.status)}`}>
                              {getStatusText(selectedAppointment.status)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="text-primary">
                    <i className="fa fa-stethoscope me-2"></i>
                    Symptoms / Reason for Visit
                  </h6>
                  <div className="p-3 bg-light rounded">
                    {selectedAppointment.symptoms || 'No information'}
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="text-primary">
                    <i className="fa fa-file-medical me-2"></i>
                    Consultation Notes
                  </h6>
                  <textarea 
                    className="form-control" 
                    rows={4} 
                    placeholder="Enter consultation notes, diagnosis, and treatment plan..."
                    value={selectedAppointment.notes || ''}
                    onChange={(e) => {
                      setSelectedAppointment({ ...selectedAppointment, notes: e.target.value });
                    }}
                  ></textarea>
                  {selectedAppointment.notes && (
                    <small className="text-muted mt-1 d-block">
                      <i className="fa fa-info-circle me-1"></i>
                      Saved notes will be displayed to the patient in their medical history.
                    </small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAppointment(null)}
                >
                  <i className="fa fa-times me-2"></i>Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!selectedAppointment.id) return;
                    
                    try {
                      // Call API directly since it may not be generated yet
                      await api<AppointmentResponse>({
                        url: `/api/appointments/${selectedAppointment.id}/notes`,
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                          notes: selectedAppointment.notes || ''
                        }
                      });
                      alert('Consultation notes saved successfully!');
                      setSelectedAppointment(null);
                      handleRefresh();
                    } catch (error: any) {
                      console.error('Error saving consultation notes:', error);
                      const errorMessage = error?.response?.data?.message || error?.message || 'Error saving notes.';
                      alert(errorMessage);
                    }
                  }}
                >
                  <i className="fa fa-save me-2"></i>Lưu kết quả
                </button>
                {/* Show different buttons based on status */}
                {selectedAppointment.status === 'IN_PROGRESS' && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={async () => {
                      if (!selectedAppointment.id) return;
                      
                      if (!confirm('Are you sure you want to complete the consultation? The appointment will change to "Review" status and the patient can review you.')) {
                        return;
                      }
                      
                      try {
                        await api<AppointmentResponse>({
                          url: `/api/appointments/${selectedAppointment.id}/complete`,
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        alert('Consultation completed! The appointment has changed to "Review" status. The patient can now review you.');
                        setSelectedAppointment(null);
                        handleRefresh();
                      } catch (error: any) {
                        console.error('Error completing consultation:', error);
                        const errorMessage = error?.response?.data?.message || error?.message || 'Error completing consultation.';
                        alert(errorMessage);
                      }
                    }}
                  >
                    <i className="fa fa-check me-2"></i>Complete Consultation
                  </button>
                )}
                {selectedAppointment.status === 'CHECKED_IN' && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={async () => {
                      if (!selectedAppointment.id) return;
                      
                      if (!confirm('Start consultation for this patient?')) {
                        return;
                      }
                      
                      try {
                        await api<AppointmentResponse>({
                          url: `/api/appointments/${selectedAppointment.id}/start`,
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        alert('Consultation started!');
                        setSelectedAppointment(null);
                        handleRefresh();
                      } catch (error: any) {
                        console.error('Error starting consultation:', error);
                        const errorMessage = error?.response?.data?.message || error?.message || 'Error starting consultation.';
                        alert(errorMessage);
                      }
                    }}
                  >
                    <i className="fa fa-play me-2"></i>Start Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
