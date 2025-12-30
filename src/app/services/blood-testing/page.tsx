'use client';

import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { getUser } from '@/utils/auth';

export default function BloodTestingPage() {
  const [step, setStep] = useState<'test' | 'time' | 'info' | 'confirm' | 'result'>('test');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [testId, setTestId] = useState<string>('');

  const testTypes = [
    { id: '1', name: 'Complete Blood Count (CBC)', price: 50 },
    { id: '2', name: 'Blood Glucose Test', price: 30 },
    { id: '3', name: 'Lipid Panel', price: 60 },
    { id: '4', name: 'Liver Function Test', price: 70 },
    { id: '5', name: 'Thyroid Function Test', price: 80 },
    { id: '6', name: 'Vitamin D Test', price: 90 },
  ];

  useEffect(() => {
    const user = getUser();
    if (user) {
      setPatientInfo({
        name: user.fullName || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, []);

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const hours = Array.from({ length: 6 }, (_, i) => i + 8); // 8-13

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
    setStep('time');
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('info');
  };

  const handleInfoSubmit = () => {
    setStep('confirm');
  };

  const handleConfirm = () => {
    // TODO: Call API to create test appointment
    const id = 'TEST-' + Date.now();
    setTestId(id);
    setStep('result');
  };

  return (
    <>
      <Topbar />
      <Navbar />

      <div className="container-fluid py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Progress Steps */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    {['Select Test', 'Select Time', 'Patient Info', 'Confirm', 'View Result'].map((label, index) => {
                      const steps = ['test', 'time', 'info', 'confirm', 'result'];
                      const currentStepIndex = steps.indexOf(step);
                      const isActive = index <= currentStepIndex;
                      return (
                        <div key={label} className="text-center flex-fill">
                          <div
                            className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                              isActive ? 'bg-warning text-white' : 'bg-secondary text-white'
                            }`}
                            style={{ width: '40px', height: '40px' }}
                          >
                            {index + 1}
                          </div>
                          <div className="mt-2 small">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {step === 'test' && (
                <div className="card shadow">
                  <div className="card-header bg-warning text-white">
                    <h3 className="mb-0">🧪 Select Test</h3>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {testTypes.map((test) => (
                        <div key={test.id} className="col-md-6">
                          <div className="card border-warning">
                            <div className="card-body">
                              <h5>{test.name}</h5>
                              <p className="text-muted mb-3">Price: ${test.price}</p>
                              <button
                                className="btn btn-warning w-100"
                                onClick={() => handleTestSelect(test.id)}
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'time' && (
                <div className="card shadow">
                  <div className="card-header bg-warning text-white">
                    <h3 className="mb-0">⏰ Select Time</h3>
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={() => setStep('test')}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    <div className="row">
                      <div className="col-md-6">
                        <h5 className="mb-3">Select Date</h5>
                        <div className="d-flex flex-wrap gap-2">
                          {getWeekDays().map((date, index) => (
                            <button
                              key={index}
                              className={`btn ${
                                selectedDate === date.toISOString().split('T')[0]
                                  ? 'btn-warning'
                                  : 'btn-outline-warning'
                              }`}
                              onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                            >
                              {date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h5 className="mb-3">Select Time</h5>
                        <div className="d-flex flex-wrap gap-2">
                          {hours.map((hour) => (
                            <button
                              key={hour}
                              className={`btn ${
                                selectedTime === `${hour}:00`
                                  ? 'btn-warning'
                                  : 'btn-outline-warning'
                              }`}
                              onClick={() => setSelectedTime(`${hour}:00`)}
                              disabled={!selectedDate}
                            >
                              {hour}:00
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedDate && selectedTime && (
                      <div className="mt-4">
                        <button
                          className="btn btn-warning btn-lg w-100"
                          onClick={() => handleDateTimeSelect(selectedDate, selectedTime)}
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'info' && (
                <div className="card shadow">
                  <div className="card-header bg-warning text-white">
                    <h3 className="mb-0">👤 Patient Information</h3>
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={() => setStep('time')}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={patientInfo.name}
                          onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={patientInfo.email}
                          onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={patientInfo.phone}
                          onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        className="btn btn-warning btn-lg w-100"
                        onClick={handleInfoSubmit}
                        disabled={!patientInfo.name || !patientInfo.email || !patientInfo.phone}
                      >
                        Continue to Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">✅ Confirm Test Appointment</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <h5>Test Summary</h5>
                      <p><strong>Test:</strong> {testTypes.find(t => t.id === selectedTest)?.name}</p>
                      <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Time:</strong> {selectedTime}</p>
                      <p><strong>Patient:</strong> {patientInfo.name}</p>
                      <p><strong>Price:</strong> ${testTypes.find(t => t.id === selectedTest)?.price}</p>
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-success btn-lg"
                        onClick={handleConfirm}
                      >
                        <i className="fa fa-check me-2"></i>Confirm Appointment
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

              {step === 'result' && (
                <div className="card shadow">
                  <div className="card-header bg-warning text-white">
                    <h3 className="mb-0">📊 View Result</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-success">
                      <h5>Test ID: {testId}</h5>
                      <p>Your test appointment has been confirmed!</p>
                    </div>
                    <div className="alert alert-info">
                      <i className="fa fa-info-circle me-2"></i>
                      Test results will be available after the test is completed. You will be notified via email.
                    </div>
                    <div className="text-center py-5">
                      <i className="fa fa-vial fa-3x text-muted mb-3"></i>
                      <p className="text-muted">Results will appear here once available</p>
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

