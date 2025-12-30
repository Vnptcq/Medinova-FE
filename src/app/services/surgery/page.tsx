'use client';

import { useState } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function SurgeryPage() {
  const [step, setStep] = useState<'info' | 'consultation' | 'appointment' | 'schedule' | 'followup'>('info');
  const [surgeryInfo, setSurgeryInfo] = useState({
    type: '',
    description: '',
    urgency: '',
  });
  const [consultationRequested, setConsultationRequested] = useState(false);

  const surgeryTypes = [
    'General Surgery',
    'Cardiac Surgery',
    'Orthopedic Surgery',
    'Neurosurgery',
    'Plastic Surgery',
    'Other',
  ];

  const handleInfoSubmit = () => {
    setStep('consultation');
  };

  const handleRequestConsultation = () => {
    setConsultationRequested(true);
    setStep('appointment');
  };

  return (
    <>
      <Topbar />
      <Navbar />

      <div className="container-fluid py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="alert alert-warning">
                <i className="fa fa-info-circle me-2"></i>
                <strong>Note:</strong> Surgery cannot be booked directly. Please request a consultation first.
              </div>

              {step === 'info' && (
                <div className="card shadow">
                  <div className="card-header bg-info text-white">
                    <h3 className="mb-0">⚕️ Surgery Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Surgery Type *</label>
                      <select
                        className="form-select"
                        value={surgeryInfo.type}
                        onChange={(e) => setSurgeryInfo({ ...surgeryInfo, type: e.target.value })}
                      >
                        <option value="">Select surgery type</option>
                        {surgeryTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows={5}
                        value={surgeryInfo.description}
                        onChange={(e) => setSurgeryInfo({ ...surgeryInfo, description: e.target.value })}
                        placeholder="Describe the surgery needed, medical history, current condition..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Urgency Level</label>
                      <select
                        className="form-select"
                        value={surgeryInfo.urgency}
                        onChange={(e) => setSurgeryInfo({ ...surgeryInfo, urgency: e.target.value })}
                      >
                        <option value="">Select urgency</option>
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <button
                      className="btn btn-info btn-lg w-100"
                      onClick={handleInfoSubmit}
                      disabled={!surgeryInfo.type || !surgeryInfo.description}
                    >
                      Request Consultation
                    </button>
                  </div>
                </div>
              )}

              {step === 'consultation' && (
                <div className="card shadow">
                  <div className="card-header bg-info text-white">
                    <h3 className="mb-0">📋 Consultation Request</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <h5>Your Request Summary</h5>
                      <p><strong>Type:</strong> {surgeryInfo.type}</p>
                      <p><strong>Urgency:</strong> {surgeryInfo.urgency || 'Not specified'}</p>
                      <p><strong>Description:</strong> {surgeryInfo.description}</p>
                    </div>
                    <p className="mb-4">
                      A doctor will review your request and schedule a consultation appointment with you.
                    </p>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-info btn-lg"
                        onClick={handleRequestConsultation}
                      >
                        <i className="fa fa-paper-plane me-2"></i>Submit Consultation Request
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep('info')}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'appointment' && consultationRequested && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">✅ Consultation Requested</h3>
                  </div>
                  <div className="card-body text-center">
                    <i className="fa fa-check-circle fa-5x text-success mb-4"></i>
                    <h4>Your consultation request has been submitted!</h4>
                    <p className="text-muted">
                      A doctor will contact you soon to schedule a consultation appointment.
                    </p>
                    <button
                      className="btn btn-primary mt-4"
                      onClick={() => setStep('schedule')}
                    >
                      View Schedule
                    </button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="card shadow">
                  <div className="card-header bg-info text-white">
                    <h3 className="mb-0">📅 Surgery Schedule</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-warning">
                      <i className="fa fa-clock me-2"></i>
                      Your surgery schedule will be available after consultation with the doctor.
                    </div>
                    <div className="text-center py-5">
                      <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No surgery scheduled yet</p>
                    </div>
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setStep('appointment')}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {step === 'followup' && (
                <div className="card shadow">
                  <div className="card-header bg-info text-white">
                    <h3 className="mb-0">🔄 Follow-up</h3>
                  </div>
                  <div className="card-body">
                    <p>Follow-up information will be available after surgery.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </>
  );
}

