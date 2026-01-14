"use client";

import { useState, useEffect } from "react";
import { getAmbulanceBookingManagement } from "@/generated/api/endpoints/ambulance-booking-management/ambulance-booking-management";
import { getAmbulanceManagement } from "@/generated/api/endpoints/ambulance-management/ambulance-management";
import { getToken } from "@/utils/auth";
import axios from "axios";

export default function AmbulanceBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [availableAmbulances, setAvailableAmbulances] = useState<any[]>([]);
  const [isLoadingAmbulances, setIsLoadingAmbulances] = useState(false);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<number | null>(null);
  const [isUpdatingAmbulance, setIsUpdatingAmbulance] = useState(false);

  useEffect(() => {
    loadAmbulanceBookings();
  }, [statusFilter]);

  const loadAmbulanceBookings = async () => {
    try {
      setIsLoading(true);
      const ambulanceApi = getAmbulanceBookingManagement();
      const response = await ambulanceApi.getAllAmbulanceBookings({
        status: statusFilter || undefined,
      });

      const data = (response as any)?.data || response;
      let bookingsList = Array.isArray(data) ? data : [];
      
      // Sort by created date (newest first) để hiển thị booking mới nhất
      bookingsList.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setBookings(bookingsList);
    } catch (error: any) {
      console.error("Error loading ambulance bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingDetail = async (bookingId: number) => {
    try {
      setIsLoadingDetail(true);
      const ambulanceApi = getAmbulanceBookingManagement();
      const response = await ambulanceApi.getAmbulanceBookingById(bookingId);
      const data = (response as any)?.data || response;
      setSelectedBooking(data);
      setNewStatus(data.status);
      setSelectedAmbulanceId(data.ambulanceId || null);
      
      // Load available ambulances (load tất cả để đảm bảo có xe mới)
      await loadAvailableAmbulances(data.clinicId);
    } catch (error: any) {
      console.error("Error loading booking detail:", error);
      alert("Không thể tải chi tiết đặt xe: " + (error?.response?.data?.message || error?.message));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const loadAvailableAmbulances = async (clinicId?: number) => {
    try {
      setIsLoadingAmbulances(true);
      const ambulanceApi = getAmbulanceManagement();
      
      // Load tất cả xe, không filter theo clinic để đảm bảo hiển thị xe mới
      const response = await ambulanceApi.getAllAmbulances();
      const data = Array.isArray(response) ? response : [];
      
      // Nếu có clinicId, ưu tiên hiển thị xe của clinic đó trước
      if (clinicId) {
        const clinicAmbulances = data.filter((amb: any) => amb.clinicId === clinicId);
        const otherAmbulances = data.filter((amb: any) => amb.clinicId !== clinicId);
        setAvailableAmbulances([...clinicAmbulances, ...otherAmbulances]);
      } else {
        setAvailableAmbulances(data);
      }
    } catch (error: any) {
      console.error("Error loading available ambulances:", error);
      setAvailableAmbulances([]);
    } finally {
      setIsLoadingAmbulances(false);
    }
  };

  const handleViewDetails = async (booking: any) => {
    setShowDetailModal(true);
    await loadBookingDetail(booking.id);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking || !newStatus || newStatus === selectedBooking.status) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const token = getToken();
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      await axios.put(
        `${baseURL}/api/ambulance-bookings/${selectedBooking.id}/status`,
        null,
        {
          params: { status: newStatus },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Reload booking detail and bookings list
      await loadBookingDetail(selectedBooking.id);
      await loadAmbulanceBookings();
      
      alert("Cập nhật trạng thái thành công!");
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Không thể cập nhật trạng thái: " + (error?.response?.data?.message || error?.message));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateAmbulance = async () => {
    if (!selectedBooking || !selectedAmbulanceId || selectedAmbulanceId === selectedBooking.ambulanceId) {
      return;
    }

    try {
      setIsUpdatingAmbulance(true);
      const token = getToken();
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      await axios.put(
        `${baseURL}/api/ambulance-bookings/${selectedBooking.id}/assign-ambulance`,
        null,
        {
          params: { ambulanceId: selectedAmbulanceId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Reload booking detail and bookings list
      await loadBookingDetail(selectedBooking.id);
      await loadAmbulanceBookings();
      
      alert("Cập nhật xe cứu thương thành công!");
    } catch (error: any) {
      console.error("Error updating ambulance:", error);
      alert("Không thể cập nhật xe cứu thương: " + (error?.response?.data?.message || error?.message));
    } finally {
      setIsUpdatingAmbulance(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-warning";
      case "ASSIGNED":
        return "bg-primary";
      case "IN_TRANSIT":
        return "bg-info";
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
    const labels: { [key: string]: string } = {
      PENDING: "Chờ xử lý",
      ASSIGNED: "Đã phân công",
      IN_TRANSIT: "Đang di chuyển",
      ARRIVED: "Đã đến nơi",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🚑 Quản lý đặt xe cấp cứu</h2>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadAmbulanceBookings}
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
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">PENDING - Chờ xử lý</option>
                <option value="ASSIGNED">ASSIGNED - Đã phân công</option>
                <option value="IN_TRANSIT">IN_TRANSIT - Đang di chuyển</option>
                <option value="ARRIVED">ARRIVED - Đã đến nơi</option>
                <option value="COMPLETED">COMPLETED - Hoàn thành</option>
                <option value="CANCELLED">CANCELLED - Đã hủy</option>
              </select>
            </div>
            <div className="col-md-8 d-flex align-items-end">
              <div className="text-muted">
                Tổng: <strong>{bookings.length}</strong> đặt xe
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
          ) : bookings.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-ambulance fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không tìm thấy đặt xe nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bệnh nhân</th>
                    <th>Phòng khám</th>
                    <th>Xe cấp cứu</th>
                    <th>Tài xế</th>
                    <th>Địa chỉ đón</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>{booking.patientName || "N/A"}</td>
                      <td>{booking.clinicName || "N/A"}</td>
                      <td>{booking.ambulanceLicensePlate || "Chưa phân công"}</td>
                      <td>{booking.driverName || "Chưa phân công"}</td>
                      <td>
                        {booking.pickupAddress
                          ? booking.pickupAddress.substring(0, 30) + "..."
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <i className="fa fa-eye me-1"></i>Chi tiết
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

      {/* Detail Modal */}
      {showDetailModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
          tabIndex={-1}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
                setSelectedBooking(null);
                setNewStatus("");
                setSelectedAmbulanceId(null);
                setAvailableAmbulances([]);
              }
            }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            style={{
              zIndex: 1051,
              position: "relative",
              margin: "1.75rem auto",
              maxWidth: "800px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chi tiết đặt xe #{selectedBooking?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBooking(null);
                    setNewStatus("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {isLoadingDetail ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : selectedBooking ? (
                  <>
                    {/* Booking Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Thông tin đặt xe</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>ID:</strong></td>
                              <td>#{selectedBooking.id}</td>
                            </tr>
                            <tr>
                              <td><strong>Bệnh nhân:</strong></td>
                              <td>{selectedBooking.patientName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Phòng khám:</strong></td>
                              <td>{selectedBooking.clinicName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Xe cấp cứu:</strong></td>
                              <td>
                                {selectedBooking.ambulanceLicensePlate || "Chưa phân công"}
                                {selectedBooking.ambulanceId && (
                                  <span className="text-muted ms-2">
                                    (ID: {selectedBooking.ambulanceId})
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Tài xế:</strong></td>
                              <td>{selectedBooking.driverName || "Chưa phân công"}</td>
                            </tr>
                            <tr>
                              <td><strong>Trạng thái:</strong></td>
                              <td>
                                <span
                                  className={`badge ${getStatusBadgeClass(
                                    selectedBooking.status
                                  )}`}
                                >
                                  {getStatusLabel(selectedBooking.status)}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Thông tin địa điểm</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Địa chỉ đón:</strong></td>
                              <td>{selectedBooking.pickupAddress || "N/A"}</td>
                            </tr>
                            {selectedBooking.pickupLat && selectedBooking.pickupLng && (
                              <tr>
                                <td><strong>Tọa độ đón:</strong></td>
                                <td>
                                  {selectedBooking.pickupLat.toFixed(6)}, {selectedBooking.pickupLng.toFixed(6)}
                                </td>
                              </tr>
                            )}
                            {selectedBooking.destinationAddress && (
                              <tr>
                                <td><strong>Địa chỉ đến:</strong></td>
                                <td>{selectedBooking.destinationAddress}</td>
                              </tr>
                            )}
                            {selectedBooking.destinationLat && selectedBooking.destinationLng && (
                              <tr>
                                <td><strong>Tọa độ đến:</strong></td>
                                <td>
                                  {selectedBooking.destinationLat.toFixed(6)}, {selectedBooking.destinationLng.toFixed(6)}
                                </td>
                              </tr>
                            )}
                            {selectedBooking.distanceKm && (
                              <tr>
                                <td><strong>Khoảng cách:</strong></td>
                                <td>{selectedBooking.distanceKm.toFixed(2)} km</td>
                              </tr>
                            )}
                            {selectedBooking.estimatedTime && (
                              <tr>
                                <td><strong>Thời gian ước tính:</strong></td>
                                <td>{selectedBooking.estimatedTime} phút</td>
                              </tr>
                            )}
                            <tr>
                              <td><strong>Ngày tạo:</strong></td>
                              <td>
                                {selectedBooking.createdAt
                                  ? new Date(
                                      selectedBooking.createdAt
                                    ).toLocaleString("vi-VN")
                                  : "N/A"}
                              </td>
                            </tr>
                            {selectedBooking.assignedAt && (
                              <tr>
                                <td><strong>Ngày phân công:</strong></td>
                                <td>
                                  {new Date(
                                    selectedBooking.assignedAt
                                  ).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            )}
                            {selectedBooking.arrivedAt && (
                              <tr>
                                <td><strong>Ngày đến nơi:</strong></td>
                                <td>
                                  {new Date(
                                    selectedBooking.arrivedAt
                                  ).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            )}
                            {selectedBooking.completedAt && (
                              <tr>
                                <td><strong>Ngày hoàn thành:</strong></td>
                                <td>
                                  {new Date(
                                    selectedBooking.completedAt
                                  ).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            )}
                            {selectedBooking.notes && (
                              <tr>
                                <td><strong>Ghi chú:</strong></td>
                                <td>{selectedBooking.notes}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Update Ambulance */}
                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Cập nhật xe cứu thương</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Xe hiện tại
                            </label>
                            <div>
                              {selectedBooking.ambulanceLicensePlate ? (
                                <span className="badge bg-primary">
                                  {selectedBooking.ambulanceLicensePlate}
                                </span>
                              ) : (
                                <span className="text-muted">Chưa phân công</span>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">
                              Chọn xe mới
                            </label>
                            {isLoadingAmbulances ? (
                              <div className="text-center py-2">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ) : (
                              <select
                                className="form-select"
                                value={selectedAmbulanceId || ""}
                                onChange={(e) =>
                                  setSelectedAmbulanceId(
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                                disabled={isUpdatingAmbulance}
                              >
                                <option value="">-- Chọn xe cứu thương --</option>
                                {availableAmbulances.map((ambulance) => (
                                  <option key={ambulance.id} value={ambulance.id}>
                                    {ambulance.licensePlate} - {ambulance.clinicName} ({ambulance.ambulanceType}) - {ambulance.status}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                        {selectedAmbulanceId && selectedAmbulanceId !== selectedBooking.ambulanceId && (
                          <div className="mt-3">
                            <button
                              className="btn btn-primary"
                              onClick={handleUpdateAmbulance}
                              disabled={isUpdatingAmbulance}
                            >
                              {isUpdatingAmbulance ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                  ></span>
                                  Đang cập nhật...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-save me-2"></i>
                                  Cập nhật xe cứu thương
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Update Status */}
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Cập nhật trạng thái</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Trạng thái hiện tại
                            </label>
                            <div>
                              <span
                                className={`badge ${getStatusBadgeClass(
                                  selectedBooking.status
                                )}`}
                              >
                                {getStatusLabel(selectedBooking.status)}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">
                              Chuyển sang trạng thái
                            </label>
                            <select
                              className="form-select"
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              disabled={isUpdatingStatus}
                            >
                              <option value="PENDING">PENDING - Chờ xử lý</option>
                              <option value="ASSIGNED">ASSIGNED - Đã phân công</option>
                              <option value="IN_TRANSIT">IN_TRANSIT - Đang di chuyển</option>
                              <option value="ARRIVED">ARRIVED - Đã đến nơi</option>
                              <option value="COMPLETED">COMPLETED - Hoàn thành</option>
                              <option value="CANCELLED">CANCELLED - Đã hủy</option>
                            </select>
                          </div>
                        </div>
                        {newStatus !== selectedBooking.status && (
                          <div className="mt-3">
                            <button
                              className="btn btn-primary"
                              onClick={handleUpdateStatus}
                              disabled={isUpdatingStatus}
                            >
                              {isUpdatingStatus ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                  ></span>
                                  Đang cập nhật...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-save me-2"></i>
                                  Cập nhật trạng thái
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Không tìm thấy thông tin đặt xe</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBooking(null);
                    setNewStatus("");
                    setSelectedAmbulanceId(null);
                    setAvailableAmbulances([]);
                  }}
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

