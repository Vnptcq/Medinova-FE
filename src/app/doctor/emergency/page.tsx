'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEmergencyManagement } from '@/generated/api/endpoints/emergency-management/emergency-management';
import { getDoctorManagement } from '@/generated/api/endpoints/doctor-management/doctor-management';
import { getUser, getToken } from '@/utils/auth';
import axios from 'axios';
import type { EmergencyResponse } from '@/generated/api/models';

export default function EmergencyPage() {
  const [emergencies, setEmergencies] = useState<EmergencyResponse[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(''); // Filter by status
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentTime: '',
    durationMinutes: 60,
    age: '',
    gender: '',
    symptoms: '',
  });

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

  // Load emergencies when doctor ID is available
  useEffect(() => {
    if (doctorId) {
      loadEmergencies();
      // Auto-refresh every 10 seconds for real-time updates
      const interval = setInterval(() => {
        loadEmergencies(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [doctorId, statusFilter]);

  // Load emergencies
  const loadEmergencies = useCallback(async (silent = false) => {
    if (!doctorId) return;

    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage('');

      const emergencyApi = getEmergencyManagement();
      const params: any = {};
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await emergencyApi.getMyEmergencies(params);
      const emergenciesData = (response as any)?.data || response;
      const emergenciesList = Array.isArray(emergenciesData) ? emergenciesData : [];
      
      // Sort by creation time (newest first)
      emergenciesList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setEmergencies(emergenciesList);
    } catch (error: any) {
      console.error('Error loading emergencies:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Error loading emergency list.';
      setErrorMessage(errorMsg);
      setEmergencies([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [doctorId, statusFilter]);

  // Load emergency details
  const loadEmergencyDetails = useCallback(async (id: number) => {
    try {
      const emergencyApi = getEmergencyManagement();
      const response = await emergencyApi.getEmergencyById(id);
      const emergency = (response as any)?.data || response;
      setSelectedEmergency(emergency);
    } catch (error: any) {
      console.error('Error loading emergency details:', error);
      alert('Error loading emergency details.');
    }
  }, []);

  const handleViewDetails = async (emergency: EmergencyResponse) => {
    if (emergency.id) {
      await loadEmergencyDetails(emergency.id);
    } else {
      setSelectedEmergency(emergency);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return { class: 'bg-warning', label: 'Pending' };
      case 'DISPATCHED':
        return { class: 'bg-info', label: 'Dispatched' };
      case 'IN_TRANSIT':
        return { class: 'bg-primary', label: 'In Transit' };
      case 'COMPLETED':
        return { class: 'bg-success', label: 'Completed' };
      case 'CANCELLED':
        return { class: 'bg-secondary', label: 'Cancelled' };
      default:
        return { class: 'bg-danger', label: status || 'N/A' };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return { class: 'bg-danger', label: 'High' };
      case 'MEDIUM':
        return { class: 'bg-warning', label: 'Medium' };
      case 'LOW':
        return { class: 'bg-info', label: 'Low' };
      default:
        return { class: 'bg-secondary', label: priority || 'N/A' };
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleDoctorConfirm = async () => {
    if (!selectedEmergency?.id) return;

    try {
      setIsConfirming(true);
      const token = getToken();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/emergencies/${selectedEmergency.id}/doctor-confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await loadEmergencies();
      if (selectedEmergency.id) {
        await loadEmergencyDetails(selectedEmergency.id);
      }
      alert("Emergency confirmed successfully!");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Error occurred";
      alert("Error: " + errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedEmergency?.id) return;

    try {
      setIsCreatingAppointment(true);
      const token = getToken();

      const requestBody: any = {};
      if (appointmentForm.appointmentTime) {
        // Remove timezone offset if present (LocalDateTime doesn't support timezone)
        // datetime-local input returns format: YYYY-MM-DDTHH:mm
        // Ensure format is YYYY-MM-DDTHH:mm:ss (add seconds if missing)
        let appointmentTimeStr = appointmentForm.appointmentTime;
        // Remove timezone offset if present (+07:00, +07:00:00, etc.)
        appointmentTimeStr = appointmentTimeStr.replace(/[+-]\d{2}:\d{2}(:\d{2})?$/, '');
        // Add seconds if missing (format should be YYYY-MM-DDTHH:mm:ss)
        if (!appointmentTimeStr.includes(':', appointmentTimeStr.lastIndexOf('T') + 1)) {
          // Only one colon after T, need to add seconds
          appointmentTimeStr = appointmentTimeStr.replace(/(\d{2}:\d{2})$/, '$1:00');
        } else if (appointmentTimeStr.match(/T\d{2}:\d{2}$/)) {
          // Has HH:mm but no seconds
          appointmentTimeStr = appointmentTimeStr + ':00';
        }
        requestBody.appointmentTime = appointmentTimeStr;
      }
      if (appointmentForm.durationMinutes) {
        requestBody.durationMinutes = appointmentForm.durationMinutes;
      }
      if (appointmentForm.age) {
        requestBody.age = parseInt(appointmentForm.age);
      }
      if (appointmentForm.gender) {
        requestBody.gender = appointmentForm.gender;
      }
      if (appointmentForm.symptoms) {
        requestBody.symptoms = appointmentForm.symptoms;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/emergencies/${selectedEmergency.id}/create-appointment`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setShowCreateAppointmentModal(false);
      setAppointmentForm({
        appointmentTime: '',
        durationMinutes: 60,
        age: '',
        gender: '',
        symptoms: '',
      });
      alert("Appointment created successfully!");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Error occurred";
      alert("Error: " + errorMessage);
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  const canDoctorConfirm = (emergency: EmergencyResponse | null) => {
    if (!emergency) return false;
    return emergency.status === 'ASSIGNED' || 
           emergency.status === 'EN_ROUTE' || 
           emergency.status === 'ARRIVED';
  };

  const canCreateAppointment = (emergency: EmergencyResponse | null) => {
    if (!emergency) return false;
    return emergency.status === 'ARRIVED' || 
           emergency.status === 'COMPLETED';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">🚨 Emergency Management</h2>
          <small className="text-muted">Auto-updates every 10 seconds</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {isRefreshing && (
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          <button
            className="btn btn-outline-primary"
            onClick={() => loadEmergencies()}
            disabled={isLoading}
          >
            <i className="fa fa-sync me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <label className="mb-0 fw-bold">Filter by Status:</label>
            <button
              className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('')}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'DISPATCHED' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setStatusFilter('DISPATCHED')}
            >
              Dispatched
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'IN_TRANSIT' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('IN_TRANSIT')}
            >
              In Transit
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'COMPLETED' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {isLoading && !isRefreshing ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : emergencies.length === 0 ? (
        <div className="card shadow-sm border-danger">
          <div className="card-body text-center py-5">
            <i className="fa fa-ambulance fa-3x text-danger mb-3"></i>
            <p className="text-muted">
              {statusFilter ? `No emergencies with status "${getStatusBadge(statusFilter).label}"` : 'No emergencies currently'}
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {emergencies.map((emergency) => {
            const statusBadge = getStatusBadge(emergency.status);
            const priorityBadge = getPriorityBadge(emergency.priority);
            const isUrgent = emergency.status === 'PENDING' || emergency.status === 'DISPATCHED';
            
            return (
              <div key={emergency.id} className="col-md-6 col-lg-4">
                <div className={`card shadow-sm border-start border-5 h-100 ${
                  isUrgent ? 'border-danger' : 'border-secondary'
                }`}>
                  <div className={`card-header text-white d-flex justify-content-between align-items-center ${
                    isUrgent ? 'bg-danger' : 'bg-secondary'
                  }`}>
                    <h6 className="mb-0">Emergency #{emergency.id}</h6>
                    <span className={`badge ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>Patient:</strong> {emergency.patientName || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Phone:</strong> {emergency.patientPhone || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Address:</strong> {emergency.patientAddress || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Description:</strong> {emergency.description || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Priority:</strong>
                      <span className={`badge ${priorityBadge.class} ms-2`}>
                        {priorityBadge.label}
                      </span>
                    </div>
                    {emergency.clinicName && (
                      <div className="mb-2">
                        <strong>Clinic:</strong> {emergency.clinicName}
                      </div>
                    )}
                    {emergency.ambulanceLicensePlate && (
                      <div className="mb-2">
                        <strong>Ambulance:</strong> {emergency.ambulanceLicensePlate}
                        {emergency.distanceKm && (
                          <span className="text-muted ms-1">
                            ({emergency.distanceKm.toFixed(2)} km)
                          </span>
                        )}
                      </div>
                    )}
                    {emergency.doctorName && (
                      <div className="mb-2">
                        <strong>Doctor:</strong> {emergency.doctorName}
                      </div>
                    )}
                    <div className="mb-2">
                      <strong>Created Time:</strong> {formatDateTime(emergency.createdAt)}
                    </div>
                    {emergency.dispatchedAt && (
                      <div className="mb-2">
                        <strong>Dispatched Time:</strong> {formatDateTime(emergency.dispatchedAt)}
                      </div>
                    )}
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-primary w-100"
                        onClick={() => handleViewDetails(emergency)}
                      >
                        <i className="fa fa-info-circle me-1"></i>View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Emergency Detail Modal */}
      {selectedEmergency && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} 
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEmergency(null);
            }
          }}
        >
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Emergency Details #{selectedEmergency.id}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmergency(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6 className="text-primary">Patient Information</h6>
                    <p><strong>Name:</strong> {selectedEmergency.patientName || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedEmergency.patientPhone || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedEmergency.patientAddress || 'N/A'}</p>
                    {selectedEmergency.patientLat && selectedEmergency.patientLng && (
                      <p>
                        <strong>Location:</strong>{' '}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedEmergency.patientLat},${selectedEmergency.patientLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <i className="fa fa-map-marker-alt text-danger me-1"></i>
                          View on Map
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary">Emergency Information</h6>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${getStatusBadge(selectedEmergency.status).class}`}>
                        {getStatusBadge(selectedEmergency.status).label}
                      </span>
                    </p>
                    <p>
                      <strong>Priority:</strong>{' '}
                      <span className={`badge ${getPriorityBadge(selectedEmergency.priority).class}`}>
                        {getPriorityBadge(selectedEmergency.priority).label}
                      </span>
                    </p>
                    <p><strong>Created Time:</strong> {formatDateTime(selectedEmergency.createdAt)}</p>
                    {selectedEmergency.dispatchedAt && (
                      <p><strong>Dispatched Time:</strong> {formatDateTime(selectedEmergency.dispatchedAt)}</p>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="text-primary">Description</h6>
                  <p className="border p-3 rounded bg-light">
                    {selectedEmergency.description || 'No description'}
                  </p>
                </div>
                {selectedEmergency.clinicName && (
                  <div className="mb-3">
                    <h6 className="text-primary">Clinic</h6>
                    <p>{selectedEmergency.clinicName} (ID: {selectedEmergency.clinicId})</p>
                  </div>
                )}
                {selectedEmergency.ambulanceLicensePlate && (
                  <div className="mb-3">
                    <h6 className="text-primary">Ambulance</h6>
                    <p>
                      License Plate: {selectedEmergency.ambulanceLicensePlate}
                      {selectedEmergency.distanceKm && (
                        <span className="text-muted ms-2">
                          ({selectedEmergency.distanceKm.toFixed(2)} km away)
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {selectedEmergency.doctorName && (
                  <div className="mb-3">
                    <h6 className="text-primary">Assigned Doctor</h6>
                    <p>{selectedEmergency.doctorName} (ID: {selectedEmergency.doctorId})</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {canDoctorConfirm(selectedEmergency) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDoctorConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <i className="fa fa-spinner fa-spin me-2"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-check-circle me-2"></i>
                        Confirm Emergency
                      </>
                    )}
                  </button>
                )}
                {canCreateAppointment(selectedEmergency) && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => setShowCreateAppointmentModal(true)}
                    disabled={isCreatingAppointment}
                  >
                    <i className="fa fa-stethoscope me-2"></i>
                    Create Appointment
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedEmergency(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateAppointmentModal && selectedEmergency && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateAppointmentModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fa fa-stethoscope me-2"></i>
                  Create Appointment from Emergency #{selectedEmergency.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateAppointmentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-calendar me-2"></i>
                    Appointment Time (default: now):
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={appointmentForm.appointmentTime}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentTime: e.target.value,
                      })
                    }
                  />
                  <small className="text-muted">
                    Leave empty to use current time
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fa fa-clock me-2"></i>
                    Duration (minutes):
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={appointmentForm.durationMinutes}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        durationMinutes: parseInt(e.target.value) || 60,
                      })
                    }
                    min="15"
                    max="180"
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Age:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={appointmentForm.age}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          age: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender:</label>
                    <select
                      className="form-select"
                      value={appointmentForm.gender}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Symptoms/Notes:</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={appointmentForm.symptoms}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        symptoms: e.target.value,
                      })
                    }
                    placeholder="Enter symptoms or consultation notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateAppointmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleCreateAppointment}
                  disabled={isCreatingAppointment}
                >
                  {isCreatingAppointment ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check me-2"></i>
                      Create Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
