'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function AmbulancePage() {
  const [step, setStep] = useState<'pickup' | 'destination' | 'confirm' | 'tracking'>('pickup');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [ambulanceId, setAmbulanceId] = useState<string>('');

  useEffect(() => {
    // Auto-detect pickup location
    if (step === 'pickup' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        () => {
          setPickupLocation('');
        }
      );
    }
  }, [step]);

  const handlePickupConfirm = () => {
    setStep('destination');
  };

  const handleDestinationConfirm = () => {
    setStep('confirm');
  };

  const handleConfirm = () => {
    // TODO: Call API to request ambulance
    const id = 'AMB-' + Date.now();
    setAmbulanceId(id);
    setStep('tracking');
  };

  return (
    <>
      <Topbar />
      <Navbar />

      <div className="container-fluid py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {step === 'pickup' && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">🚑 Pickup Location</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Current Location (Auto-detected)</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="Detecting location..."
                      />
                      <button
                        className="btn btn-outline-primary mt-2"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setPickupLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
                              }
                            );
                          }
                        }}
                      >
                        <i className="fa fa-map-marker-alt me-2"></i>Detect Location
                      </button>
                    </div>
                    <button
                      className="btn btn-primary btn-lg w-100"
                      onClick={handlePickupConfirm}
                      disabled={!pickupLocation}
                    >
                      Confirm Pickup Location
                    </button>
                  </div>
                </div>
              )}

              {step === 'destination' && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">📍 Destination</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Destination Hospital / Location</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter destination address or hospital name"
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleDestinationConfirm}
                        disabled={!destination}
                      >
                        Confirm Destination
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep('pickup')}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">✅ Confirm Ambulance Request</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <h5>Request Summary</h5>
                      <p><strong>Pickup:</strong> {pickupLocation}</p>
                      <p><strong>Destination:</strong> {destination}</p>
                      <p><strong>Estimated Time:</strong> 15-20 minutes</p>
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-success btn-lg"
                        onClick={handleConfirm}
                      >
                        <i className="fa fa-check me-2"></i>Confirm Request
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setStep('destination')}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'tracking' && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">📊 Live Tracking</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-success">
                      <strong>Ambulance ID:</strong> {ambulanceId}
                    </div>
                    <div className="timeline">
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-success rounded-circle p-3 me-3">
                          <i className="fa fa-check"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Request Confirmed</h5>
                          <small className="text-muted">Your request has been received</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-warning rounded-circle p-3 me-3">
                          <i className="fa fa-spinner fa-spin"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Ambulance On The Way</h5>
                          <small className="text-muted">ETA: 10 minutes</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Arrived at Pickup</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">En Route to Destination</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Arrived at Destination</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6>Map View</h6>
                          <div className="bg-secondary text-white text-center p-5 rounded">
                            <i className="fa fa-map fa-3x mb-3"></i>
                            <p>Live map tracking will be displayed here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        className="btn btn-outline-primary w-100"
                        onClick={() => {
                          setStep('pickup');
                          setPickupLocation('');
                          setDestination('');
                          setAmbulanceId('');
                        }}
                      >
                        New Request
                      </button>
                    </div>
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

