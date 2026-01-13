"use client";

import { useState, useEffect } from "react";
import { getPharmacyOrderManagement } from "@/generated/api/endpoints/pharmacy-order-management/pharmacy-order-management";
import { getToken } from "@/utils/auth";
import axios from "axios";

export default function PharmacyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    loadPharmacyOrders();
  }, [statusFilter]);

  const loadPharmacyOrders = async () => {
    try {
      setIsLoading(true);
      const pharmacyApi = getPharmacyOrderManagement();
      const response = await pharmacyApi.getAllPharmacyOrders({
        status: statusFilter || undefined,
      });

      const data = (response as any)?.data || response;
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading pharmacy orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    try {
      setIsLoadingDetail(true);
      const pharmacyApi = getPharmacyOrderManagement();
      const response = await pharmacyApi.getPharmacyOrderById(orderId);
      const data = (response as any)?.data || response;
      setSelectedOrder(data);
      setNewStatus(data.status);
    } catch (error: any) {
      console.error("Error loading order detail:", error);
      alert("Không thể tải chi tiết đơn thuốc: " + (error?.response?.data?.message || error?.message));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewDetails = async (order: any) => {
    setShowDetailModal(true);
    await loadOrderDetail(order.id);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const token = getToken();
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      await axios.put(
        `${baseURL}/api/pharmacy-orders/${selectedOrder.id}/status`,
        null,
        {
          params: { status: newStatus },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Reload order detail and orders list
      await loadOrderDetail(selectedOrder.id);
      await loadPharmacyOrders();
      
      alert("Status updated successfully!");
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Failed to update status: " + (error?.response?.data?.message || error?.message));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-warning";
      case "PROCESSING":
        return "bg-info";
      case "READY":
        return "bg-primary";
      case "OUT_FOR_DELIVERY":
        return "bg-info";
      case "DELIVERED":
        return "bg-success";
      case "CANCELLED":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      PENDING: "Pending",
      PROCESSING: "Processing",
      READY: "Ready",
      OUT_FOR_DELIVERY: "Out for Delivery",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">💊 Pharmacy Orders Management</h2>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadPharmacyOrders}
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
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">PENDING - Pending</option>
                <option value="PROCESSING">PROCESSING - Processing</option>
                <option value="READY">READY - Ready</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY - Out for Delivery</option>
                <option value="DELIVERED">DELIVERED - Delivered</option>
                <option value="CANCELLED">CANCELLED - Cancelled</option>
              </select>
            </div>
            <div className="col-md-8 d-flex align-items-end">
              <div className="text-muted">
                Tổng: <strong>{orders.length}</strong> đơn thuốc
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
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-pills fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không tìm thấy đơn thuốc nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bệnh nhân</th>
                    <th>Clinic</th>
                    <th>Medication Count</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.patientName || "N/A"}</td>
                      <td>{order.clinicName || "N/A"}</td>
                      <td>
                        {order.items && order.items.length > 0
                          ? `${order.items.length} loại`
                          : "N/A"}
                      </td>
                      <td>
                        {order.totalAmount
                          ? formatCurrency(order.totalAmount)
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(order)}
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
              setSelectedOrder(null);
              setNewStatus("");
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
                  Chi tiết đơn thuốc #{selectedOrder?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
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
                ) : selectedOrder ? (
                  <>
                    {/* Order Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Thông tin đơn hàng</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>ID:</strong></td>
                              <td>#{selectedOrder.id}</td>
                            </tr>
                            <tr>
                              <td><strong>Bệnh nhân:</strong></td>
                              <td>{selectedOrder.patientName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Phòng khám:</strong></td>
                              <td>{selectedOrder.clinicName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Trạng thái:</strong></td>
                              <td>
                                <span
                                  className={`badge ${getStatusBadgeClass(
                                    selectedOrder.status
                                  )}`}
                                >
                                  {getStatusLabel(selectedOrder.status)}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Created Date:</strong></td>
                              <td>
                                {selectedOrder.createdAt
                                  ? new Date(
                                      selectedOrder.createdAt
                                    ).toLocaleString("vi-VN")
                                  : "N/A"}
                              </td>
                            </tr>
                            {selectedOrder.processedAt && (
                              <tr>
                                <td><strong>Ngày xử lý:</strong></td>
                                <td>
                                  {new Date(
                                    selectedOrder.processedAt
                                  ).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            )}
                            {selectedOrder.deliveredAt && (
                              <tr>
                                <td><strong>Ngày giao hàng:</strong></td>
                                <td>
                                  {new Date(
                                    selectedOrder.deliveredAt
                                  ).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Thông tin giao hàng</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Người nhận:</strong></td>
                              <td>{selectedOrder.deliveryName || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Số điện thoại:</strong></td>
                              <td>{selectedOrder.deliveryPhone || "N/A"}</td>
                            </tr>
                            <tr>
                              <td><strong>Địa chỉ:</strong></td>
                              <td>
                                {selectedOrder.deliveryAddress || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Phương thức thanh toán:</strong></td>
                              <td>
                                {selectedOrder.paymentMethod ===
                                "CASH_ON_DELIVERY"
                                  ? "Tiền mặt khi nhận hàng"
                                  : selectedOrder.paymentMethod ===
                                    "CREDIT_CARD"
                                  ? "Thẻ tín dụng"
                                  : selectedOrder.paymentMethod ===
                                    "BANK_TRANSFER"
                                  ? "Chuyển khoản"
                                  : selectedOrder.paymentMethod || "N/A"}
                              </td>
                            </tr>
                            {selectedOrder.notes && (
                              <tr>
                                <td><strong>Ghi chú:</strong></td>
                                <td>{selectedOrder.notes}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h6 className="text-muted mb-3">Medication List</h6>
                      {selectedOrder.items &&
                      selectedOrder.items.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead>
                              <tr>
                                <th>STT</th>
                                <th>Tên thuốc</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                                <th>Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.items.map(
                                (item: any, index: number) => (
                                  <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.medicineName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.price)}</td>
                                    <td>
                                      {formatCurrency(item.totalPrice)}
                                    </td>
                                    <td>{item.notes || "-"}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={4} className="text-end">
                                  <strong>Tổng tiền thuốc:</strong>
                                </td>
                                <td colSpan={2}>
                                  <strong>
                                    {formatCurrency(
                                      selectedOrder.totalAmount -
                                        (selectedOrder.deliveryFee || 0)
                                    )}
                                  </strong>
                                </td>
                              </tr>
                              {selectedOrder.deliveryFee && (
                                <tr>
                                  <td colSpan={4} className="text-end">
                                    <strong>Phí giao hàng:</strong>
                                  </td>
                                  <td colSpan={2}>
                                    <strong>
                                      {formatCurrency(
                                        selectedOrder.deliveryFee
                                      )}
                                    </strong>
                                  </td>
                                </tr>
                              )}
                              <tr className="table-primary">
                                <td colSpan={4} className="text-end">
                                  <strong>Tổng cộng:</strong>
                                </td>
                                <td colSpan={2}>
                                  <strong>
                                    {formatCurrency(selectedOrder.totalAmount)}
                                  </strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted">Không có thuốc nào</p>
                      )}
                    </div>

                    {/* Update Status */}
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Update Delivery Status</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Current Status
                            </label>
                            <div>
                              <span
                                className={`badge ${getStatusBadgeClass(
                                  selectedOrder.status
                                )}`}
                              >
                                {getStatusLabel(selectedOrder.status)}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">
                              Change to Status
                            </label>
                            <select
                              className="form-select"
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              disabled={isUpdatingStatus}
                            >
                              <option value="PENDING">PENDING - Pending</option>
                              <option value="PROCESSING">PROCESSING - Processing</option>
                              <option value="READY">READY - Ready</option>
                              <option value="OUT_FOR_DELIVERY">
                                OUT_FOR_DELIVERY - Out for Delivery
                              </option>
                              <option value="DELIVERED">DELIVERED - Delivered</option>
                              <option value="CANCELLED">CANCELLED - Cancelled</option>
                            </select>
                          </div>
                        </div>
                        {newStatus !== selectedOrder.status && (
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
                                  Updating...
                                </> 
                              ) : (
                                <>
                                  <i className="fa fa-save me-2"></i>
                                  Update Status
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Không tìm thấy thông tin đơn hàng</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrder(null);
                    setNewStatus("");
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
