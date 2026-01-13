"use client";

import { useState, useEffect } from "react";
import { getAppointmentManagement } from "@/generated/api/endpoints/appointment-management/appointment-management";
import axios from "axios";
import { getToken } from "@/utils/auth";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [confirmingDeposit, setConfirmingDeposit] = useState<number | null>(null);
  const pageSize = 10;

  useEffect(() => {
    loadAppointments();
  }, [statusFilter, currentPage]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getAllAppointments({
        status: statusFilter || undefined,
        page: currentPage,
        size: pageSize,
      });

      const data = (response as any)?.data || response;
      if (data && typeof data === "object" && "content" in data) {
        setAppointments(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error("Error loading appointments:", error);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-info";
      case "PENDING":
        return "bg-warning";
      case "CHECKED_IN":
        return "bg-primary";
      case "IN_PROGRESS":
        return "bg-warning text-dark";
      case "REVIEW":
        return "bg-primary";
      case "COMPLETED":
        return "bg-success";
      case "CANCELLED":
      case "CANCELLED_BY_PATIENT":
      case "CANCELLED_BY_DOCTOR":
        return "bg-danger";
      case "NO_SHOW":
        return "bg-secondary";
      case "REJECTED":
        return "bg-danger";
      case "EXPIRED":
        return "bg-secondary";
      default:
        return "bg-info";
    }
  };

  const getDepositStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-success";
      case "PENDING":
        return "bg-warning";
      case "REJECTED":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const handleConfirmDeposit = async (appointmentId: number) => {
    if (!confirm(`Confirm deposit payment received for appointment #${appointmentId}?`)) {
      return;
    }

    try {
      setConfirmingDeposit(appointmentId);
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = getToken();

      const response = await axios.post(
        `${baseURL}/api/appointments/${appointmentId}/confirm-deposit`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (response.data) {
        alert("Deposit confirmed successfully!");
        loadAppointments(); // Reload appointments
      }
    } catch (error: any) {
      console.error("Error confirming deposit:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while confirming the deposit.";
      alert(errorMsg);
    } finally {
      setConfirmingDeposit(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Appointments Management</h2>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadAppointments}
        >
          <i className="fa fa-sync-alt me-1"></i>Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">All Status</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div className="col-md-8 d-flex align-items-end">
              <div className="text-muted">
                Total: <strong>{totalElements}</strong> appointments
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">No appointments found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Clinic</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Deposit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id}>
                        <td>#{apt.id}</td>
                        <td>{apt.patientName || "N/A"}</td>
                        <td>{apt.doctorName || `Doctor ${apt.doctorId}`}</td>
                        <td>{apt.clinicName || "N/A"}</td>
                        <td>
                          {apt.appointmentTime
                            ? new Date(apt.appointmentTime).toLocaleString(
                                "en-US"
                              )
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td>
                          {apt.depositAmount ? (
                            <>
                              <div>
                                <span
                                  className={`badge ${getDepositStatusBadgeClass(
                                    apt.depositStatus || "PENDING"
                                  )}`}
                                >
                                  {apt.depositStatus || "PENDING"}
                                </span>
                              </div>
                              <small className="text-muted d-block mt-1">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(apt.depositAmount)}
                              </small>
                              {apt.depositTransferContent && (
                                <small className="text-muted d-block mt-1" style={{ fontSize: "0.7rem" }}>
                                  <code>{apt.depositTransferContent}</code>
                                </small>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {apt.depositStatus === "PENDING" &&
                            apt.depositAmount &&
                            apt.status === "PENDING" && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleConfirmDeposit(apt.id)}
                                disabled={confirmingDeposit === apt.id}
                              >
                                {confirmingDeposit === apt.id ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                    ></span>
                                    Confirming...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-check me-1"></i>
                                    Confirm Deposit
                                  </>
                                )}
                              </button>
                            )}
                          {apt.depositStatus === "CONFIRMED" && (
                            <small className="text-success">
                              <i className="fa fa-check-circle me-1"></i>
                              Confirmed
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${
                        currentPage === 0 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i).map(
                      (page) => (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page + 1}
                          </button>
                        </li>
                      )
                    )}
                    <li
                      className={`page-item ${
                        currentPage >= totalPages - 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
