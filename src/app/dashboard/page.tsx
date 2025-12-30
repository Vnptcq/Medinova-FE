'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import RequireAuth from '@/components/RequireAuth';
import { getUser } from '@/utils/auth';

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    // TODO: Load data from API
  }, []);

  return (
    <RequireAuth>
      <Topbar />
      <Navbar />

      <div className="container-fluid py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="mb-2">My Health Dashboard</h2>
            <p className="text-muted">Welcome back, {user?.fullName || 'User'}!</p>
          </div>

          {/* Quick Stats */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-primary">
                <div className="card-body text-center">
                  <i className="fa fa-calendar-check fa-2x text-primary mb-3"></i>
                  <h3>{appointments.length}</h3>
                  <p className="text-muted mb-0">Upcoming Appointments</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-danger">
                <div className="card-body text-center">
                  <i className="fa fa-ambulance fa-2x text-danger mb-3"></i>
                  <h3>{emergencies.length}</h3>
                  <p className="text-muted mb-0">Emergency History</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-warning">
                <div className="card-body text-center">
                  <i className="fa fa-vial fa-2x text-warning mb-3"></i>
                  <h3>{testResults.length}</h3>
                  <p className="text-muted mb-0">Test Results</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-success">
                <div className="card-body text-center">
                  <i className="fa fa-pills fa-2x text-success mb-3"></i>
                  <h3>{prescriptions.length}</h3>
                  <p className="text-muted mb-0">Prescriptions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Upcoming Appointments */}
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Upcoming Appointments</h5>
                  <Link href="/services/outdoor-checkup" className="btn btn-sm btn-light">
                    Book New
                  </Link>
                </div>
                <div className="card-body">
                  {appointments.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No upcoming appointments</p>
                      <Link href="/services/outdoor-checkup" className="btn btn-primary">
                        Book Appointment
                      </Link>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {appointments.map((apt) => (
                        <div key={apt.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{apt.doctorName}</h6>
                              <small className="text-muted">
                                {apt.date} at {apt.time}
                              </small>
                              <br />
                              <span className={`badge ${
                                apt.status === 'Scheduled' ? 'bg-primary' :
                                apt.status === 'In Progress' ? 'bg-warning' :
                                apt.status === 'Completed' ? 'bg-success' :
                                'bg-secondary'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary">Reschedule</button>
                              <button className="btn btn-outline-danger">Cancel</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency History */}
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Emergency History</h5>
                  <Link href="/services/emergency" className="btn btn-sm btn-light">
                    Request Help
                  </Link>
                </div>
                <div className="card-body">
                  {emergencies.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-ambulance fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No emergency history</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {emergencies.map((emergency) => (
                        <div key={emergency.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">Emergency #{emergency.id}</h6>
                              <small className="text-muted">{emergency.date}</small>
                              <br />
                              <span className={`badge ${
                                emergency.status === 'Request Sent' ? 'bg-primary' :
                                emergency.status === 'Ambulance On The Way' ? 'bg-warning' :
                                emergency.status === 'In Treatment' ? 'bg-info' :
                                emergency.status === 'Completed' ? 'bg-success' :
                                'bg-secondary'
                              }`}>
                                {emergency.status}
                              </span>
                            </div>
                            <button className="btn btn-sm btn-outline-primary">View</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-warning text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Test Results</h5>
                  <Link href="/services/blood-testing" className="btn btn-sm btn-light">
                    Book Test
                  </Link>
                </div>
                <div className="card-body">
                  {testResults.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-vial fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No test results available</p>
                      <Link href="/services/blood-testing" className="btn btn-warning">
                        Book Test
                      </Link>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {testResults.map((test) => (
                        <div key={test.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{test.testName}</h6>
                              <small className="text-muted">{test.date}</small>
                            </div>
                            <button className="btn btn-sm btn-outline-warning">View Result</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Prescriptions</h5>
                  <Link href="/services/pharmacy" className="btn btn-sm btn-light">
                    Order Medicine
                  </Link>
                </div>
                <div className="card-body">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-pills fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No prescriptions</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">Prescription #{prescription.id}</h6>
                              <small className="text-muted">{prescription.date}</small>
                              <br />
                              <span className={`badge ${
                                prescription.status === 'PENDING' ? 'bg-warning' :
                                prescription.status === 'DISPENSED' ? 'bg-success' :
                                'bg-secondary'
                              }`}>
                                {prescription.status}
                              </span>
                            </div>
                            <button className="btn btn-sm btn-outline-success">View</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row g-4 mt-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <Link href="/services/emergency" className="btn btn-danger w-100">
                        <i className="fa fa-ambulance me-2"></i>Emergency
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <Link href="/services/outdoor-checkup" className="btn btn-primary w-100">
                        <i className="fa fa-stethoscope me-2"></i>Book Appointment
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <Link href="/services/blood-testing" className="btn btn-warning w-100">
                        <i className="fa fa-vial me-2"></i>Blood Test
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <Link href="/services/pharmacy" className="btn btn-success w-100">
                        <i className="fa fa-pills me-2"></i>Pharmacy
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </RequireAuth>
  );
}

