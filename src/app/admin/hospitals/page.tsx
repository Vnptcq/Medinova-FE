'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClinicManagement } from '@/generated/api/endpoints/clinic-management/clinic-management';

export default function HospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      setIsLoading(true);
      const clinicApi = getClinicManagement();
      const response = await clinicApi.getAllClinics();

      // API trả về Clinic[] trực tiếp
      const clinics = Array.isArray(response) ? response : [];
      setHospitals(clinics);
    } catch (error: any) {
      console.error('Error loading hospitals:', error);
      setHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cơ sở này?')) {
      return;
    }

    try {
      const clinicApi = getClinicManagement();
      await clinicApi.deleteClinic(id);
      // Reload danh sách sau khi xóa
      await loadHospitals();
      alert('Xóa cơ sở thành công!');
    } catch (error: any) {
      console.error('Error deleting hospital:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi xóa cơ sở. Vui lòng thử lại!';
      alert(errorMessage);
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingHospital(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      description: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (hospital: any) => {
    setIsCreateMode(false);
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name || '',
      address: hospital.address || '',
      phone: hospital.phone || '',
      description: hospital.description || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsCreateMode(false);
    setEditingHospital(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      description: '',
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: any = {};
    if (!formData.name) {
      newErrors.name = 'Tên cơ sở là bắt buộc';
    }
    if (!formData.address) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const clinicApi = getClinicManagement();
      
      if (isCreateMode) {
        // Create new clinic
        await clinicApi.createClinic({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          description: formData.description || undefined,
        });
        alert('Tạo cơ sở thành công!');
      } else {
        // Update existing clinic
        await clinicApi.updateClinic(editingHospital.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          description: formData.description || undefined,
        });
        alert('Cập nhật cơ sở thành công!');
      }
      
      // Reload danh sách sau khi create/update
      await loadHospitals();
      handleCloseModal();
    } catch (error: any) {
      console.error(`Error ${isCreateMode ? 'creating' : 'updating'} hospital:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || `Có lỗi xảy ra khi ${isCreateMode ? 'tạo' : 'cập nhật'} cơ sở. Vui lòng thử lại!`;
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Danh sách cơ sở</h2>
        <button 
          className="btn btn-primary"
          onClick={handleCreate}
        >
          <i className="fa fa-plus me-2"></i>Đăng ký cơ sở mới
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-hospital fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có cơ sở nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên cơ sở</th>
                    <th>Địa chỉ</th>
                    <th>Số điện thoại</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((hospital) => (
                    <tr key={hospital.id}>
                      <td>{hospital.id}</td>
                      <td>{hospital.name || 'N/A'}</td>
                      <td>{hospital.address || 'N/A'}</td>
                      <td>{hospital.phone || 'N/A'}</td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleEdit(hospital)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(hospital.id!)}
                        >
                          <i className="fa fa-trash"></i>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isCreateMode ? 'Đăng ký cơ sở mới' : 'Chỉnh sửa cơ sở'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-name" className="form-label">
                      Tên cơ sở <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-address" className="form-label">
                      Địa chỉ <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-phone" className="form-label">
                      Số điện thoại <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-description" className="form-label">
                      Mô tả
                    </label>
                    <textarea
                      className="form-control"
                      id="edit-description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  {errors.submit && (
                    <div className="alert alert-danger" role="alert">
                      {errors.submit}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Đóng
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isCreateMode ? 'Đang tạo...' : 'Đang lưu...'}
                      </>
                    ) : (
                      isCreateMode ? 'Tạo' : 'Lưu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

