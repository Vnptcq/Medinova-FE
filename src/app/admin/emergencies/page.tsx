"use client";

import { useState, useEffect, useMemo } from "react";
import { getEmergencyManagement } from "@/generated/api/endpoints/emergency-management/emergency-management";
import { getAmbulanceManagement } from "@/generated/api/endpoints/ambulance-management/ambulance-management";
import { getToken } from "@/utils/auth";
import axios from "axios";


export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [isLoadingAmbulances, setIsLoadingAmbulances] = useState(false);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<number | null>(null);
  const [ambulanceSearchTerm, setAmbulanceSearchTerm] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadEmergencies();
  }, [statusFilter, currentPage, pageSize]);

  const loadEmergencies = async () => {
    try {
      setIsLoading(true);
      const emergencyApi = getEmergencyManagement();

      // Use history endpoint with pagination
      const token = getToken();
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        }/api/emergencies/history`,
        {
          params: {
            page: currentPage,
            size: pageSize,
            ...(statusFilter ? { status: statusFilter } : {}),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      let emergenciesList = Array.isArray(data.content)
        ? data.content
        : Array.isArray(data)
        ? data
        : [];

      // Sort: NEEDS_ATTENTION first, then by created date (newest first)
      emergenciesList.sort((a: any, b: any) => {
        // NEEDS_ATTENTION always comes first
        if (a.status === "NEEDS_ATTENTION" && b.status !== "NEEDS_ATTENTION") {
          return -1;
        }
        if (a.status !== "NEEDS_ATTENTION" && b.status === "NEEDS_ATTENTION") {
          return 1;
        }
        // Then sort by created date (newest first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setEmergencies(emergenciesList);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || emergenciesList.length);
    } catch (error: any) {
      console.error("Error loading emergencies:", error);
      // Fallback to getAllEmergencies if history endpoint fails
      try {
        const emergencyApi = getEmergencyManagement();
        const response = await emergencyApi.getAllEmergencies({
          status: statusFilter || undefined,
        });
        const data = (response as any)?.data || response;
        let emergenciesList = Array.isArray(data) ? data : [];

        // Sort: NEEDS_ATTENTION first
        emergenciesList.sort((a: any, b: any) => {
          if (
            a.status === "NEEDS_ATTENTION" &&
            b.status !== "NEEDS_ATTENTION"
          ) {
            return -1;
          }
          if (
            a.status !== "NEEDS_ATTENTION" &&
            b.status === "NEEDS_ATTENTION"
          ) {
            return 1;
          }
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setEmergencies(emergenciesList);
        setTotalPages(Math.ceil(emergenciesList.length / pageSize));
        setTotalElements(emergenciesList.length);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setEmergencies([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = async (emergency: any) => {
    setSelectedEmergency(emergency);
    setSelectedAmbulanceId(null);
    setSelectedDoctorId(null);
    setAmbulanceSearchTerm("");
    setDoctorSearchTerm("");
    setShowAssignModal(true);
    await Promise.all([
      loadAvailableAmbulances(emergency.clinicId),
      loadAvailableDoctors()
    ]);
  };

  const loadAvailableAmbulances = async (clinicId?: number) => {
    try {
      setIsLoadingAmbulances(true);
      const ambulanceApi = getAmbulanceManagement();
      const params: any = { status: "AVAILABLE" };
      if (clinicId) {
        params.clinicId = clinicId;
      }
      const response = await ambulanceApi.getAllAmbulances(params);
      const ambulances = Array.isArray(response) ? response : [];
      setAvailableAmbulances(ambulances);
    } catch (error: any) {
      console.error("Error loading available ambulances:", error);
      setAvailableAmbulances([]);
    } finally {
      setIsLoadingAmbulances(false);
    }
  };

  const loadAvailableDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const token = getToken();
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Load all available doctors with pagination
      const allDoctors: any[] = [];
      let page = 0;
      let hasMore = true;
      let maxPages = 10;

      while (hasMore && page < maxPages) {
        const response = await axios.get(
          `${baseURL}/api/emergencies/available-staff`,
          {
            params: {
              page: page,
              size: 100,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;
        let staff: any[] = [];
        if (Array.isArray(data)) {
          staff = data;
        } else if (Array.isArray(data.content)) {
          staff = data.content;
        } else if (data.data && Array.isArray(data.data)) {
          staff = data.data;
        }

        // Filter only doctors
        const doctors = staff.filter((s) => s.staffType === "DOCTOR");
        allDoctors.push(...doctors);

        hasMore = !data.last && staff.length > 0 && (data.totalElements > allDoctors.length);
        page++;
      }

      setAvailableDoctors(allDoctors);
    } catch (error: any) {
      console.error("Error loading available doctors:", error);
      setAvailableDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };


  const handleAssignEmergency = async () => {
    if (!selectedEmergency || !selectedAmbulanceId) {
      alert("Vui lòng chọn xe cứu thương");
      return;
    }

    try {
      setIsAssigning(true);
      const emergencyApi = getEmergencyManagement();
      
      await emergencyApi.assignEmergency(selectedEmergency.id, {
        ambulanceId: selectedAmbulanceId,
        doctorId: selectedDoctorId || undefined,
      });

      // Close modal and refresh list
      setShowAssignModal(false);
      setSelectedEmergency(null);
      await loadEmergencies();
      alert("Điều phối thành công!");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error dispatching emergency";
      alert("Lỗi: " + errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredAmbulances = useMemo(() => {
    if (!availableAmbulances || availableAmbulances.length === 0) {
      return [];
    }
    
    // If search term is empty, return all ambulances
    if (!ambulanceSearchTerm || ambulanceSearchTerm.trim() === "") {
      return availableAmbulances;
    }
    
    // Filter by search term
    const searchLower = ambulanceSearchTerm.toLowerCase().trim();
    return availableAmbulances.filter(
      (ambulance) =>
        ambulance.licensePlate?.toLowerCase().includes(searchLower) ||
        ambulance.clinicName?.toLowerCase().includes(searchLower) ||
        ambulance.ambulanceType?.toLowerCase().includes(searchLower)
    );
  }, [availableAmbulances, ambulanceSearchTerm]);

  const filteredDoctors = useMemo(() => {
    if (!availableDoctors || availableDoctors.length === 0) {
      return [];
    }
    
    // If search term is empty, return all doctors
    if (!doctorSearchTerm || doctorSearchTerm.trim() === "") {
      return availableDoctors;
    }
    
    // Filter by search term
    const searchLower = doctorSearchTerm.toLowerCase().trim();
    return availableDoctors.filter(
      (doctor) =>
        doctor.name?.toLowerCase().includes(searchLower) ||
        doctor.email?.toLowerCase().includes(searchLower) ||
        doctor.phone?.includes(doctorSearchTerm.trim())
    );
  }, [availableDoctors, doctorSearchTerm]);


  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-warning";
      case "NEEDS_ATTENTION":
        return "bg-danger";
      case "ASSIGNED":
        return "bg-info";
      case "EN_ROUTE":
        return "bg-primary";
      case "ARRIVED":
        return "bg-success";
      case "COMPLETED":
        return "bg-success";
      case "CANCELLED":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "Pending",
      NEEDS_ATTENTION: "Cần xử lý",
      ASSIGNED: "Đã phân công",
      EN_ROUTE: "Đang di chuyển",
      ARRIVED: "Đã đến nơi",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-danger";
      case "HIGH":
        return "bg-warning";
      case "MEDIUM":
        return "bg-info";
      case "LOW":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fa fa-ambulance me-2"></i>
          Quản lý ca cấp cứu
        </h2>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadEmergencies}
        >
          <i className="fa fa-sync-alt me-1"></i>Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Lọc theo trạng thái</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Pending</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="EN_ROUTE">En Route</option>
                <option value="ARRIVED">Arrived</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Số lượng mỗi trang</label>
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="text-muted">
                Tổng: <strong>{totalElements}</strong> ca cấp cứu
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
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-ambulance fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không tìm thấy ca cấp cứu nào</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Hospital</th>
                      <th>Doctor</th>
                      <th>Ambulance</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map((emergency) => (
                      <tr
                        key={emergency.id}
                        className={
                          emergency.status === "NEEDS_ATTENTION"
                            ? "table-danger"
                            : ""
                        }
                      >
                        <td>
                          #{emergency.id}
                          {emergency.status === "NEEDS_ATTENTION" && (
                            <span className="badge bg-danger ms-2">
                              <i className="fa fa-exclamation-triangle me-1"></i>
                              CẦN XỬ LÝ
                            </span>
                          )}
                        </td>
                        <td>
                          <div>
                            <strong>{emergency.patientName || "N/A"}</strong>
                            {emergency.patientPhone && (
                              <div className="text-muted small">
                                <i className="fa fa-phone me-1"></i>
                                {emergency.patientPhone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{emergency.clinicName || "N/A"}</td>
                        <td>
                          {emergency.doctorName ? (
                            <div>
                              <div>{emergency.doctorName}</div>
                              {emergency.doctorPhone && (
                                <div className="text-muted small">
                                  <i className="fa fa-phone me-1"></i>
                                  {emergency.doctorPhone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Chưa phân công</span>
                          )}
                        </td>
                        <td>
                          {emergency.ambulanceLicensePlate || (
                            <span className="text-muted">Chưa phân công</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${getPriorityBadgeClass(
                              emergency.priority || "MEDIUM"
                            )}`}
                          >
                            {emergency.priority || "MEDIUM"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              emergency.status
                            )}`}
                          >
                            {getStatusLabel(emergency.status)}
                          </span>
                        </td>
                        <td>
                          {emergency.createdAt
                            ? new Date(emergency.createdAt).toLocaleString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </td>
                        <td>
                          {(emergency.status === "PENDING" ||
                            emergency.status === "NEEDS_ATTENTION" ||
                            !emergency.doctorId) && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOpenAssignModal(emergency)}
                            >
                              <i className="fa fa-user-plus me-1"></i>
                              Điều phối
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Emergency pagination">
                  <ul className="pagination justify-content-center mt-4">
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
                        Trước
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
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedEmergency && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fa fa-user-plus me-2"></i>
                  Điều phối ca cấp cứu #{selectedEmergency.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEmergency(null);
                    setSelectedAmbulanceId(null);
                    setSelectedDoctorId(null);
                    setAmbulanceSearchTerm("");
                    setDoctorSearchTerm("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Bệnh nhân:</strong> {selectedEmergency.patientName}
                  {selectedEmergency.patientPhone && (
                    <>
                      <br />
                      <span className="text-muted">
                        <i className="fa fa-phone me-1"></i>
                        {selectedEmergency.patientPhone}
                      </span>
                    </>
                  )}
                  <br />
                  <strong>Địa chỉ:</strong> {selectedEmergency.patientAddress}
                  <br />
                  <strong>Ưu tiên:</strong>{" "}
                  <span
                    className={`badge ${getPriorityBadgeClass(
                      selectedEmergency.priority || "MEDIUM"
                    )}`}
                  >
                    {selectedEmergency.priority || "MEDIUM"}
                  </span>
                  {selectedEmergency.doctorName && (
                    <>
                      <br />
                      <strong>Bác sĩ trực:</strong> {selectedEmergency.doctorName}
                      {selectedEmergency.doctorPhone && (
                        <>
                          <br />
                          <span className="text-muted">
                            <i className="fa fa-phone me-1"></i>
                            {selectedEmergency.doctorPhone}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>

                <hr />

                {/* Doctor Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="fa fa-user-md me-2"></i>
                    Chọn bác sĩ trực <span className="text-muted">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Tìm kiếm bác sĩ (tên, email, số điện thoại)..."
                    value={doctorSearchTerm}
                    onChange={(e) => setDoctorSearchTerm(e.target.value)}
                  />
                  {isLoadingDoctors ? (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Đang tải danh sách bác sĩ...</span>
                    </div>
                  ) : (
                    <>
                      <select
                        className="form-select"
                        value={selectedDoctorId || ""}
                        onChange={(e) =>
                          setSelectedDoctorId(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        size={5}
                        style={{ maxHeight: "200px" }}
                      >
                        <option value="">-- Chọn bác sĩ trực (Tùy chọn) --</option>
                        {filteredDoctors.length === 0 ? (
                          <option disabled>Không có bác sĩ khả dụng</option>
                        ) : (
                          filteredDoctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.email}
                              {doctor.phone && ` - ${doctor.phone}`}
                              {doctor.clinicName && ` (${doctor.clinicName})`}
                            </option>
                          ))
                        )}
                      </select>
                      {selectedDoctorId && (
                        <div className="mt-2">
                          <small className="text-success">
                            <i className="fa fa-check-circle me-1"></i>
                            Đã chọn:{" "}
                            {
                              filteredDoctors.find((d) => d.id === selectedDoctorId)
                                ?.name
                            }
                            {filteredDoctors.find((d) => d.id === selectedDoctorId)?.phone && (
                              <span className="text-muted ms-2">
                                <i className="fa fa-phone me-1"></i>
                                {filteredDoctors.find((d) => d.id === selectedDoctorId)?.phone}
                              </span>
                            )}
                          </small>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Ambulance Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="fa fa-truck-medical me-2"></i>
                    Chọn xe cứu thương <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Tìm kiếm xe (biển số, bệnh viện)..."
                    value={ambulanceSearchTerm}
                    onChange={(e) => setAmbulanceSearchTerm(e.target.value)}
                  />
                  <select
                    className="form-select"
                    value={selectedAmbulanceId || ""}
                    onChange={(e) =>
                      setSelectedAmbulanceId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    size={5}
                    style={{ maxHeight: "200px" }}
                  >
                    <option value="">-- Chọn xe cứu thương --</option>
                    {isLoadingAmbulances ? (
                      <option disabled>Loading...</option>
                    ) : filteredAmbulances.length === 0 ? (
                      <option disabled>No available ambulances</option>
                    ) : (
                      filteredAmbulances.map((ambulance) => (
                        <option key={ambulance.id} value={ambulance.id}>
                          {ambulance.licensePlate} - {ambulance.clinicName} ({ambulance.ambulanceType})
                        </option>
                      ))
                    )}
                  </select>
                  {selectedAmbulanceId && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="fa fa-check-circle me-1"></i>
                        Đã chọn:{" "}
                        {
                          filteredAmbulances.find((a) => a.id === selectedAmbulanceId)
                            ?.licensePlate
                        }
                      </small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEmergency(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAssignEmergency}
                  disabled={
                    isAssigning ||
                    !selectedAmbulanceId ||
                    isLoadingAmbulances
                  }
                >
                  {isAssigning ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check me-2"></i>
                      Confirm Dispatch
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
