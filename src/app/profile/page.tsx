'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

interface MedicalHistory {
  id?: string;
  medicalCondition: string;
  diagnosisDate: string;
  treatmentDescription: string;
  medications: string;
  allergies: string;
  chronicDiseases: string;
  previousSurgeries: string;
  familyHistory: string;
  notes: string;
  createdAt?: string;
}

interface UserProfile {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [medicalHistories, setMedicalHistories] = useState<MedicalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<MedicalHistory | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [profileData, setProfileData] = useState<UserProfile>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const [formData, setFormData] = useState<MedicalHistory>({
    medicalCondition: '',
    diagnosisDate: '',
    treatmentDescription: '',
    medications: '',
    allergies: '',
    chronicDiseases: '',
    previousSurgeries: '',
    familyHistory: '',
    notes: '',
  });

  // Load medical histories and profile on component mount
  useEffect(() => {
    loadMedicalHistories();
    loadProfile();
  }, []);

  const loadMedicalHistories = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/medical-history');
      // const data = await response.json();
      // setMedicalHistories(data);
      
      // For now, load from localStorage (demo)
      const saved = localStorage.getItem('medicalHistories');
      if (saved) {
        setMedicalHistories(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading medical histories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const historyData = {
        ...formData,
        id: editingHistory?.id || Date.now().toString(),
        createdAt: editingHistory?.createdAt || new Date().toISOString(),
      };

      // TODO: Replace with actual API endpoint
      // if (editingHistory) {
      //   await fetch(`/api/medical-history/${editingHistory.id}`, {
      //     method: 'PUT',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // } else {
      //   await fetch('/api/medical-history', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // }

      // For now, save to localStorage (demo)
      let updatedHistories;
      if (editingHistory) {
        updatedHistories = medicalHistories.map((h) =>
          h.id === editingHistory.id ? historyData : h
        );
      } else {
        updatedHistories = [...medicalHistories, historyData];
      }
      setMedicalHistories(updatedHistories);
      localStorage.setItem('medicalHistories', JSON.stringify(updatedHistories));

      // Reset form
      setFormData({
        medicalCondition: '',
        diagnosisDate: '',
        treatmentDescription: '',
        medications: '',
        allergies: '',
        chronicDiseases: '',
        previousSurgeries: '',
        familyHistory: '',
        notes: '',
      });
      setShowForm(false);
      setEditingHistory(null);
      alert(editingHistory ? 'Cập nhật lịch sử bệnh án thành công!' : 'Lưu lịch sử bệnh án thành công!');
    } catch (error) {
      console.error('Error saving medical history:', error);
      alert('Có lỗi xảy ra khi lưu lịch sử bệnh án. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (history: MedicalHistory) => {
    setEditingHistory(history);
    setFormData(history);
    setShowForm(true);
    setActiveTab('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch sử bệnh án này?')) {
      return;
    }

    try {
      // TODO: Replace with actual API endpoint
      // await fetch(`/api/medical-history/${id}`, { method: 'DELETE' });

      // For now, delete from localStorage (demo)
      const updatedHistories = medicalHistories.filter((h) => h.id !== id);
      setMedicalHistories(updatedHistories);
      localStorage.setItem('medicalHistories', JSON.stringify(updatedHistories));
      alert('Xóa lịch sử bệnh án thành công!');
    } catch (error) {
      console.error('Error deleting medical history:', error);
      alert('Có lỗi xảy ra khi xóa lịch sử bệnh án. Vui lòng thử lại!');
    }
  };

  const handleCancel = () => {
    setFormData({
      medicalCondition: '',
      diagnosisDate: '',
      treatmentDescription: '',
      medications: '',
      allergies: '',
      chronicDiseases: '',
      previousSurgeries: '',
      familyHistory: '',
      notes: '',
    });
    setShowForm(false);
    setEditingHistory(null);
  };

  // Profile functions
  const loadProfile = async () => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/profile');
      // const data = await response.json();
      // setProfileData(data);

      // For now, load from localStorage (demo)
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        setProfileData(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!profileData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (profileData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!profileData.fullName) {
      errors.fullName = 'Họ và tên là bắt buộc';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Replace with actual API endpoint
      // await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData),
      // });

      // For now, save to localStorage (demo)
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      alert('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin cá nhân. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <Navbar />

      {/* Profile Start */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '800px' }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
              Hồ Sơ
            </h5>
            <h1 className="display-4">Hồ Sơ Bệnh Nhân</h1>
            <p className="mb-5">
              Quản lý thông tin cá nhân và lịch sử bệnh án của bạn
            </p>
          </div>

          {/* Tabs */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                    type="button"
                  >
                    <i className="fa fa-user me-2"></i>Thông Tin Cá Nhân
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    type="button"
                  >
                    <i className="fa fa-file-medical me-2"></i>Lịch Sử Bệnh Án
                  </button>
                </li>
              </ul>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-light rounded p-5">
                  <h4 className="mb-4">Thông Tin Cá Nhân</h4>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="row g-3">
                      {/* Full Name */}
                      <div className="col-12">
                        <label htmlFor="fullName" className="form-label fw-bold">
                          Họ và Tên <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          className={`form-control bg-white border-0 ${profileErrors.fullName ? 'is-invalid' : ''}`}
                          placeholder="Nhập họ và tên đầy đủ"
                          value={profileData.fullName}
                          onChange={handleProfileChange}
                          style={{ height: '55px' }}
                          required
                        />
                        {profileErrors.fullName && (
                          <div className="invalid-feedback d-block">{profileErrors.fullName}</div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="col-12 col-md-6">
                        <label htmlFor="email" className="form-label fw-bold">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control bg-white border-0 ${profileErrors.email ? 'is-invalid' : ''}`}
                          placeholder="example@email.com"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          style={{ height: '55px' }}
                          required
                        />
                        {profileErrors.email && (
                          <div className="invalid-feedback d-block">{profileErrors.email}</div>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="col-12 col-md-6">
                        <label htmlFor="phone" className="form-label fw-bold">
                          Số Điện Thoại
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-control bg-white border-0"
                          placeholder="Nhập số điện thoại"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          style={{ height: '55px' }}
                        />
                      </div>

                      {/* Password */}
                      <div className="col-12">
                        <label htmlFor="password" className="form-label fw-bold">
                          Mật Khẩu <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            className={`form-control bg-white border-0 ${profileErrors.password ? 'is-invalid' : ''}`}
                            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                            value={profileData.password}
                            onChange={handleProfileChange}
                            style={{ height: '55px', paddingRight: '50px' }}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-link position-absolute"
                            style={{
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              border: 'none',
                              padding: '0',
                              textDecoration: 'none',
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        {profileErrors.password && (
                          <div className="invalid-feedback d-block">{profileErrors.password}</div>
                        )}
                        <small className="text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
                      </div>

                      {/* Submit Button */}
                      <div className="col-12">
                        <button
                          className="btn btn-primary w-100 py-3"
                          type="submit"
                          disabled={isLoading}
                        >
                          <i className="fa fa-save me-2"></i>
                          {isLoading ? 'Đang lưu...' : 'Cập Nhật Thông Tin'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Medical History Tab */}
              {activeTab === 'history' && (
                <div>
                  {/* Add New Button */}
                  {!showForm && (
                    <div className="mb-4">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setShowForm(true);
                          setEditingHistory(null);
                          setFormData({
                            medicalCondition: '',
                            diagnosisDate: '',
                            treatmentDescription: '',
                            medications: '',
                            allergies: '',
                            chronicDiseases: '',
                            previousSurgeries: '',
                            familyHistory: '',
                            notes: '',
                          });
                        }}
                      >
                        <i className="fa fa-plus me-2"></i>Thêm Lịch Sử Bệnh Án Mới
                      </button>
                    </div>
                  )}

                  {/* Form */}
                  {showForm && (
                    <div className="bg-light rounded p-5 mb-4">
                      <h4 className="mb-4">
                        {editingHistory ? 'Chỉnh Sửa Lịch Sử Bệnh Án' : 'Thêm Lịch Sử Bệnh Án Mới'}
                      </h4>
                      <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                          {/* Medical Condition */}
                          <div className="col-12">
                            <label htmlFor="medicalCondition" className="form-label fw-bold">
                              Tên Bệnh / Tình Trạng Sức Khỏe <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="medicalCondition"
                              name="medicalCondition"
                              className="form-control bg-white border-0"
                              placeholder="Nhập tên bệnh hoặc tình trạng sức khỏe"
                              value={formData.medicalCondition}
                              onChange={handleChange}
                              style={{ height: '55px' }}
                              required
                            />
                          </div>

                          {/* Diagnosis Date */}
                          <div className="col-12 col-md-6">
                            <label htmlFor="diagnosisDate" className="form-label fw-bold">
                              Ngày Chẩn Đoán <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="diagnosisDate"
                              name="diagnosisDate"
                              className="form-control bg-white border-0"
                              value={formData.diagnosisDate}
                              onChange={handleChange}
                              style={{ height: '55px' }}
                              required
                            />
                          </div>

                          {/* Treatment Description */}
                          <div className="col-12">
                            <label htmlFor="treatmentDescription" className="form-label fw-bold">
                              Mô Tả Điều Trị
                            </label>
                            <textarea
                              id="treatmentDescription"
                              name="treatmentDescription"
                              className="form-control bg-white border-0"
                              rows={4}
                              placeholder="Mô tả chi tiết về quá trình điều trị"
                              value={formData.treatmentDescription}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Medications */}
                          <div className="col-12">
                            <label htmlFor="medications" className="form-label fw-bold">
                              Thuốc Đang Sử Dụng
                            </label>
                            <textarea
                              id="medications"
                              name="medications"
                              className="form-control bg-white border-0"
                              rows={3}
                              placeholder="Liệt kê các loại thuốc đang sử dụng (tên thuốc, liều lượng, tần suất)"
                              value={formData.medications}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Allergies */}
                          <div className="col-12 col-md-6">
                            <label htmlFor="allergies" className="form-label fw-bold">
                              Dị Ứng
                            </label>
                            <textarea
                              id="allergies"
                              name="allergies"
                              className="form-control bg-white border-0"
                              rows={3}
                              placeholder="Liệt kê các dị ứng (thuốc, thực phẩm, môi trường...)"
                              value={formData.allergies}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Chronic Diseases */}
                          <div className="col-12 col-md-6">
                            <label htmlFor="chronicDiseases" className="form-label fw-bold">
                              Bệnh Mãn Tính
                            </label>
                            <textarea
                              id="chronicDiseases"
                              name="chronicDiseases"
                              className="form-control bg-white border-0"
                              rows={3}
                              placeholder="Liệt kê các bệnh mãn tính (nếu có)"
                              value={formData.chronicDiseases}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Previous Surgeries */}
                          <div className="col-12">
                            <label htmlFor="previousSurgeries" className="form-label fw-bold">
                              Phẫu Thuật Trước Đó
                            </label>
                            <textarea
                              id="previousSurgeries"
                              name="previousSurgeries"
                              className="form-control bg-white border-0"
                              rows={3}
                              placeholder="Mô tả các cuộc phẫu thuật đã thực hiện (tên phẫu thuật, ngày thực hiện, bác sĩ phẫu thuật...)"
                              value={formData.previousSurgeries}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Family History */}
                          <div className="col-12">
                            <label htmlFor="familyHistory" className="form-label fw-bold">
                              Tiền Sử Gia Đình
                            </label>
                            <textarea
                              id="familyHistory"
                              name="familyHistory"
                              className="form-control bg-white border-0"
                              rows={3}
                              placeholder="Mô tả tiền sử bệnh tật trong gia đình (bệnh di truyền, bệnh mãn tính của người thân...)"
                              value={formData.familyHistory}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Notes */}
                          <div className="col-12">
                            <label htmlFor="notes" className="form-label fw-bold">
                              Ghi Chú Thêm
                            </label>
                            <textarea
                              id="notes"
                              name="notes"
                              className="form-control bg-white border-0"
                              rows={4}
                              placeholder="Bất kỳ thông tin bổ sung nào khác mà bạn muốn chia sẻ"
                              value={formData.notes}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Buttons */}
                          <div className="col-12">
                            <button
                              className="btn btn-primary me-2"
                              type="submit"
                              disabled={isLoading}
                            >
                              <i className="fa fa-save me-2"></i>
                              {isLoading ? 'Đang lưu...' : editingHistory ? 'Cập Nhật' : 'Lưu'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={handleCancel}
                              disabled={isLoading}
                            >
                              <i className="fa fa-times me-2"></i>Hủy
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Medical Histories List */}
                  {!showForm && (
                    <div>
                      {isLoading && medicalHistories.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                          </div>
                        </div>
                      ) : medicalHistories.length === 0 ? (
                        <div className="bg-light rounded p-5 text-center">
                          <i className="fa fa-file-medical fa-3x text-muted mb-3"></i>
                          <p className="text-muted">Chưa có lịch sử bệnh án nào. Hãy thêm lịch sử bệnh án đầu tiên của bạn.</p>
                        </div>
                      ) : (
                        <div className="row g-4">
                          {medicalHistories.map((history) => (
                            <div key={history.id} className="col-12">
                              <div className="bg-light rounded p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h5 className="text-primary mb-1">{history.medicalCondition}</h5>
                                    <p className="text-muted mb-0">
                                      <i className="fa fa-calendar me-2"></i>
                                      Ngày chẩn đoán: {new Date(history.diagnosisDate).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>
                                  <div>
                                    <button
                                      className="btn btn-sm btn-outline-primary me-2"
                                      onClick={() => handleEdit(history)}
                                    >
                                      <i className="fa fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDelete(history.id!)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </div>
                                </div>

                                {history.treatmentDescription && (
                                  <div className="mb-2">
                                    <strong>Mô tả điều trị:</strong>
                                    <p className="mb-0">{history.treatmentDescription}</p>
                                  </div>
                                )}

                                {history.medications && (
                                  <div className="mb-2">
                                    <strong>Thuốc đang sử dụng:</strong>
                                    <p className="mb-0">{history.medications}</p>
                                  </div>
                                )}

                                <div className="row">
                                  {history.allergies && (
                                    <div className="col-md-6 mb-2">
                                      <strong>Dị ứng:</strong>
                                      <p className="mb-0">{history.allergies}</p>
                                    </div>
                                  )}
                                  {history.chronicDiseases && (
                                    <div className="col-md-6 mb-2">
                                      <strong>Bệnh mãn tính:</strong>
                                      <p className="mb-0">{history.chronicDiseases}</p>
                                    </div>
                                  )}
                                </div>

                                {history.previousSurgeries && (
                                  <div className="mb-2">
                                    <strong>Phẫu thuật trước đó:</strong>
                                    <p className="mb-0">{history.previousSurgeries}</p>
                                  </div>
                                )}

                                {history.familyHistory && (
                                  <div className="mb-2">
                                    <strong>Tiền sử gia đình:</strong>
                                    <p className="mb-0">{history.familyHistory}</p>
                                  </div>
                                )}

                                {history.notes && (
                                  <div className="mb-2">
                                    <strong>Ghi chú:</strong>
                                    <p className="mb-0">{history.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Profile End */}

      <Footer />
      <BackToTop />
    </>
  );
}

