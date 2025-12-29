'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { getClinicManagement } from '@/generated/api/endpoints/clinic-management/clinic-management';
import { getDoctorManagement } from '@/generated/api/endpoints/doctor-management/doctor-management';

export default function Search() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  useEffect(() => {
    loadClinics();
    loadAllDoctors();
  }, []);

  const loadClinics = async () => {
    try {
      const clinicApi = getClinicManagement();
      const response = await clinicApi.getAllClinics();
      const clinicsData = Array.isArray(response) ? response : [];
      setClinics(clinicsData);
    } catch (error: any) {
      console.error('Error loading clinics:', error);
      setClinics([]);
    }
  };

  const loadAllDoctors = async () => {
    try {
      setIsLoading(true);
      const doctorApi = getDoctorManagement();
      const response = await doctorApi.getAllDoctors();
      const doctorsData = response.data || response;
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const doctorApi = getDoctorManagement();
      
      let doctorsData: any[] = [];
      
      if (selectedClinicId) {
        // Nếu chọn clinic, lấy doctors theo clinic
        const response = await doctorApi.getDoctorsByClinic(Number(selectedClinicId));
        doctorsData = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);
      } else {
        // Nếu không chọn clinic, lấy tất cả doctors
        const response = await doctorApi.getAllDoctors();
        doctorsData = response.data || response;
        doctorsData = Array.isArray(doctorsData) ? doctorsData : [];
      }
      
      // Filter theo keyword nếu có
      if (keyword.trim()) {
        const keywordLower = keyword.toLowerCase().trim();
        doctorsData = doctorsData.filter((doctor) => {
          const fullName = doctor.user?.fullName?.toLowerCase() || '';
          const specialization = doctor.specialization?.toLowerCase() || '';
          const email = doctor.user?.email?.toLowerCase() || '';
          const bio = doctor.bio?.toLowerCase() || '';
          
          return fullName.includes(keywordLower) || 
                 specialization.includes(keywordLower) ||
                 email.includes(keywordLower) ||
                 bio.includes(keywordLower);
        });
      }
      
      setDoctors(doctorsData);
    } catch (error: any) {
      console.error('Error searching doctors:', error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <Topbar />
      <Navbar />

      {/* Search Start */}
      <div className="container-fluid pt-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
              Find A Doctor
            </h5>
            <h1 className="display-4 mb-4">Find A Healthcare Professionals</h1>
            <h5 className="fw-normal">
              Duo ipsum erat stet dolor sea ut nonumy tempor. Tempor duo lorem eos sit sed ipsum
              takimata ipsum sit est. Ipsum ea voluptua ipsum sit justo
            </h5>
          </div>
          <div className="mx-auto" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="input-group">
              <select 
                className="form-select border-primary w-25" 
                style={{ height: '60px', borderRadius: '8px' }}
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
              >
                <option value="">Tất cả cơ sở</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.address}
                  </option>
                ))}
              </select>
              <input 
                type="text" 
                className="form-control border-primary w-50" 
                placeholder="Tìm kiếm theo tên, chuyên khoa, email..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="btn btn-dark border-0 w-25"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang tìm...
                  </>
                ) : (
                  'Tìm kiếm'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Search End */}

      {/* Search Result Start */}
      <div className="container-fluid py-5">
        <div className="container">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Đang tìm kiếm bác sĩ...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-user-md fa-3x text-muted mb-3"></i>
              <p className="text-muted">Không tìm thấy bác sĩ nào</p>
              <p className="text-muted">Vui lòng thử lại với từ khóa hoặc cơ sở khác</p>
            </div>
          ) : (
            <>
              <div className="row g-5">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="col-lg-6 team-item">
                    <div className="row g-0 bg-light rounded overflow-hidden">
                      <div className="col-12 col-sm-5 h-100">
                        <Image
                          src={`/img/team-${((doctor.id || 0) % 3) + 1}.jpg`}
                          alt={doctor.user?.fullName || 'Doctor'}
                          width={300}
                          height={350}
                          className="img-fluid h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className="col-12 col-sm-7 h-100 d-flex flex-column">
                        <div className="mt-auto p-4">
                          <h3>{doctor.user?.fullName || 'N/A'}</h3>
                          <h6 className="fw-normal fst-italic text-primary mb-2">
                            {doctor.specialization || 'Chưa có chuyên khoa'}
                          </h6>
                          {doctor.clinic && (
                            <p className="text-muted mb-2">
                              <i className="fa fa-hospital me-2"></i>
                              {doctor.clinic.name}
                            </p>
                          )}
                          {doctor.experienceYears && (
                            <p className="text-muted mb-2">
                              <i className="fa fa-calendar me-2"></i>
                              {doctor.experienceYears} năm kinh nghiệm
                            </p>
                          )}
                          {doctor.bio && (
                            <p className="m-0">{doctor.bio}</p>
                          )}
                          {doctor.user?.email && (
                            <p className="text-muted mt-2 mb-0">
                              <i className="fa fa-envelope me-2"></i>
                              {doctor.user.email}
                            </p>
                          )}
                        </div>
                        <div className="d-flex mt-auto border-top p-4">
                          <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#!">
                            <i className="fab fa-twitter"></i>
                          </a>
                          <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#!">
                            <i className="fab fa-facebook-f"></i>
                          </a>
                          <a className="btn btn-lg btn-primary btn-lg-square rounded-circle" href="#!">
                            <i className="fab fa-linkedin-in"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {doctors.length > 0 && (
                <div className="col-12 text-center mt-4">
                  <p className="text-muted">Hiển thị {doctors.length} bác sĩ</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Search Result End */}

      <Footer />
      <BackToTop />
    </>
  );
}

