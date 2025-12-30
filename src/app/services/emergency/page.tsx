'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function EmergencyPage() {
  const [step, setStep] = useState<'initial' | 'location' | 'symptoms' | 'confirm' | 'status'>('initial');
  const [location, setLocation] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [emergencyId, setEmergencyId] = useState<string>('');

  const symptoms = [
    'Chest Pain',
    'Difficulty Breathing',
    'Severe Bleeding',
    'Unconscious',
    'Severe Pain',
    'Accident',
    'Other',
  ];

  useEffect(() => {
    // Auto-detect location
    if (step === 'location' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        () => {
          setLocation('Location not available');
        }
      );
    }
  }, [step]);

  const handleGetHelp = () => {
    setStep('location');
  };

  const handleLocationConfirm = () => {
    setStep('symptoms');
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleConfirm = () => {
    // TODO: Call API to create emergency request
    const id = 'EMG-' + Date.now();
    setEmergencyId(id);
    setStep('status');
  };

  return (
    <>
      <Topbar />
      <Navbar />

      <div className="container-fluid py-5" style={{ minHeight: '80vh' }}>
        <div className="container">
          {step === 'initial' && (
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <div className="card shadow-lg border-danger border-4">
                  <div className="card-body p-5">
                    <i className="fa fa-ambulance fa-5x text-danger mb-4"></i>
                    <h1 className="display-4 text-danger mb-4">🚨 I NEED HELP NOW</h1>
                    <p className="lead mb-4">
                      Emergency medical assistance is available 24/7. Click the button below to request immediate help.
                    </p>
                    <button
                      className="btn btn-danger btn-lg px-5 py-3"
                      onClick={handleGetHelp}
                      style={{ fontSize: '1.5rem' }}
                    >
                      <i className="fa fa-phone me-2"></i>
                      REQUEST EMERGENCY HELP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'location' && (
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card shadow">
                  <div className="card-header bg-danger text-white">
                    <h3 className="mb-0">📍 Your Location</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Current Location (Auto-detected)</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Detecting location..."
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-danger btn-lg"
                        onClick={handleLocationConfirm}
                        disabled={!location}
                      >
                        Confirm Location
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep('initial')}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'symptoms' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow">
                  <div className="card-header bg-danger text-white">
                    <h3 className="mb-0">⚡ Quick Symptom Select</h3>
                  </div>
                  <div className="card-body">
                    <p className="mb-4">Select all that apply:</p>
                    <div className="row g-3">
                      {symptoms.map((symptom) => (
                        <div key={symptom} className="col-md-6">
                          <button
                            className={`btn w-100 py-3 ${
                              selectedSymptoms.includes(symptom)
                                ? 'btn-danger'
                                : 'btn-outline-danger'
                            }`}
                            onClick={() => handleSymptomToggle(symptom)}
                            style={{ fontSize: '1.1rem' }}
                          >
                            {selectedSymptoms.includes(symptom) && (
                              <i className="fa fa-check-circle me-2"></i>
                            )}
                            {symptom}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 d-grid gap-2">
                      <button
                        className="btn btn-danger btn-lg"
                        onClick={handleConfirm}
                        disabled={selectedSymptoms.length === 0}
                      >
                        <i className="fa fa-paper-plane me-2"></i>
                        Send Emergency Request
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep('location')}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card shadow">
                  <div className="card-body text-center p-5">
                    <i className="fa fa-check-circle fa-5x text-success mb-4"></i>
                    <h2 className="mb-4">Request Submitted</h2>
                    <p className="lead">Your emergency request has been received. Help is on the way!</p>
                    <button
                      className="btn btn-primary btn-lg mt-4"
                      onClick={() => setStep('status')}
                    >
                      View Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'status' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow">
                  <div className="card-header bg-danger text-white">
                    <h3 className="mb-0">📊 Live Status</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <strong>Emergency ID:</strong> {emergencyId}
                    </div>
                    <div className="timeline">
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-success rounded-circle p-3 me-3">
                          <i className="fa fa-check"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Request Sent</h5>
                          <small className="text-muted">Your request has been received</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-warning rounded-circle p-3 me-3">
                          <i className="fa fa-spinner fa-spin"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Ambulance On The Way</h5>
                          <small className="text-muted">Estimated arrival: 5 minutes</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">In Treatment</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Completed</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => {
                          setStep('initial');
                          setSelectedSymptoms([]);
                          setLocation('');
                          setEmergencyId('');
                        }}
                      >
                        New Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <BackToTop />
    </>
  );
}

