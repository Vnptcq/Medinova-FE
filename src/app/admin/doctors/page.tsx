"use client";

import { useState, useEffect } from "react";
import { getDoctorManagement } from "@/generated/api/endpoints/doctor-management/doctor-management";
import { getClinicManagement } from "@/generated/api/endpoints/clinic-management/clinic-management";

// Default specializations list based on medical services
const SPECIALIZATIONS = [
  { value: "Emergency Care", label: "Emergency Care" },
  { value: "Operation & Surgery", label: "Operation & Surgery" },
  { value: "Outdoor Checkup", label: "Outdoor Checkup" },
  { value: "Ambulance Service", label: "Ambulance Service" },
  { value: "Medicine & Pharmacy", label: "Medicine & Pharmacy" },
  { value: "Blood Testing", label: "Blood Testing" },
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [formData, setFormData] = useState({
    specialization: "",
    experienceYears: "",
    bio: "",
    clinicId: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDoctors();
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setIsLoadingClinics(true);
      const clinicApi = getClinicManagement();
      const response = await clinicApi.getAllClinics();
      // API trả về Clinic[] trực tiếp
      const clinicsData = Array.isArray(response) ? response : [];
      setClinics(clinicsData);
    } catch (error: any) {
      console.error("Error loading clinics:", error);
      setClinics([]);
    } finally {
      setIsLoadingClinics(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const doctorApi = getDoctorManagement();
      const response = await doctorApi.getAllDoctors();

      // API function already extracts response.data, so response is the data itself
      // Handle both array and object with data/content property
      const doctorsData =
        (response as any)?.data || (response as any)?.content || response;
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (error: any) {
      console.error("Error loading doctors:", error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (doctor: any) => {
    setEditingDoctor(doctor);
    setFormData({
      specialization: doctor.specialization || "",
      experienceYears: doctor.experienceYears?.toString() || "",
      bio: doctor.bio || "",
      clinicId: doctor.clinic?.id?.toString() || "",
    });
    setErrors({});

    // Reload clinics list to ensure we have the latest list
    await loadClinics();

    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingDoctor(null);
    setFormData({
      specialization: "",
      experienceYears: "",
      bio: "",
      clinicId: "",
    });
    setErrors({});
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: any = {};
    if (!formData.specialization) {
      newErrors.specialization = "Specialization is required";
    }
    if (formData.experienceYears && isNaN(Number(formData.experienceYears))) {
      newErrors.experienceYears = "Experience years must be a number";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsUpdating(true);
      const doctorApi = getDoctorManagement();
      // UpdateDoctorRequest doesn't have 'specialization', only 'department' (enum)
      // For now, we'll skip specialization/department update if not mapped to enum
      await doctorApi.updateDoctor(editingDoctor.id, {
        experienceYears: formData.experienceYears
          ? Number(formData.experienceYears)
          : undefined,
        bio: formData.bio || undefined,
        clinicId: formData.clinicId ? Number(formData.clinicId) : undefined,
        // Note: specialization is not in UpdateDoctorRequest, only department (enum)
        // If needed, map specialization string to UpdateDoctorRequestDepartment enum
      });

      // Reload list after update
      await loadDoctors();
      alert("Doctor updated successfully!");
      handleCloseModal();
    } catch (error: any) {
      console.error("Error updating doctor:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error updating doctor. Please try again!";
      setErrors({ submit: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this doctor?")) {
      return;
    }

    try {
      const doctorApi = getDoctorManagement();
      await doctorApi.deleteDoctor(id);
      // Reload list after delete
      await loadDoctors();
      alert("Doctor deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting doctor:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error deleting doctor. Please try again!";
      alert(errorMessage);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Doctor List</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-user-md fa-3x text-muted mb-3"></i>
              <p className="text-muted">No doctors found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Doctor Name</th>
                    <th>Specialization</th>
                    <th>Clinic</th>
                    <th>Email</th>
                    <th>Experience Years</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.id || "N/A"}</td>
                      <td>{doctor.user?.fullName || "N/A"}</td>
                      <td>{doctor.specialization || "N/A"}</td>
                      <td>{doctor.clinic?.name || "N/A"}</td>
                      <td>{doctor.user?.email || "N/A"}</td>
                      <td>
                        {doctor.experienceYears
                          ? `${doctor.experienceYears} years`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            doctor.user?.status === "ACTIVE" ||
                            doctor.user?.status === "active"
                              ? "bg-success"
                              : doctor.user?.status === "INACTIVE" ||
                                doctor.user?.status === "inactive"
                              ? "bg-danger"
                              : doctor.user?.status === "PENDING" ||
                                doctor.user?.status === "pending"
                              ? "bg-warning"
                              : "bg-secondary"
                          }`}
                        >
                          {doctor.user?.status || "N/A"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleEdit(doctor)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(doctor.id!)}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Doctor Information</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-specialization" className="form-label">
                      Specialization <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-control ${
                        errors.specialization ? "is-invalid" : ""
                      }`}
                      id="edit-specialization"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      required
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="">-- Select Specialization --</option>
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec.value} value={spec.value}>
                          {spec.label} ({spec.value})
                        </option>
                      ))}
                    </select>
                    {errors.specialization && (
                      <div className="invalid-feedback">
                        {errors.specialization}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="edit-experienceYears"
                      className="form-label"
                    >
                      Experience Years
                    </label>
                    <input
                      type="number"
                      className={`form-control ${
                        errors.experienceYears ? "is-invalid" : ""
                      }`}
                      id="edit-experienceYears"
                      value={formData.experienceYears}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experienceYears: e.target.value,
                        })
                      }
                      min="0"
                    />
                    {errors.experienceYears && (
                      <div className="invalid-feedback">
                        {errors.experienceYears}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-clinicId" className="form-label">
                      Clinic
                    </label>
                    {isLoadingClinics ? (
                      <div className="form-control">
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Loading clinics list...
                      </div>
                    ) : (
                      <select
                        className="form-control"
                        id="edit-clinicId"
                        value={formData.clinicId}
                        onChange={(e) =>
                          setFormData({ ...formData, clinicId: e.target.value })
                        }
                      >
                        <option value="">-- Select Clinic --</option>
                        {clinics.map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {clinics.length === 0 && !isLoadingClinics && (
                      <small className="text-muted">No clinics available</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-bio" className="form-label">
                      Bio / Description
                    </label>
                    <textarea
                      className="form-control"
                      id="edit-bio"
                      rows={4}
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Enter doctor bio or description..."
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
                    disabled={isUpdating}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </> 
                    ) : (
                      "Save"
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
