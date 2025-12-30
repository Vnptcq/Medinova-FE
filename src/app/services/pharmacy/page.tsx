'use client';

import { useState } from 'react';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function PharmacyPage() {
  const [step, setStep] = useState<'upload' | 'medicine' | 'checkout' | 'track'>('upload');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orderId, setOrderId] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
      setStep('medicine');
    }
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setStep('medicine');
  };

  const handleCheckout = () => {
    // TODO: Call API to create order
    const id = 'ORD-' + Date.now();
    setOrderId(id);
    setStep('track');
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
                    {['Upload Prescription', 'Medicine List', 'Checkout', 'Track Order'].map((label, index) => {
                      const steps = ['upload', 'medicine', 'checkout', 'track'];
                      const currentStepIndex = steps.indexOf(step);
                      const isActive = index <= currentStepIndex;
                      return (
                        <div key={label} className="text-center flex-fill">
                          <div
                            className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                              isActive ? 'bg-success text-white' : 'bg-secondary text-white'
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

              {step === 'upload' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">💊 Upload Prescription / Choose Appointment</h3>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="card border-primary">
                          <div className="card-body text-center p-5">
                            <i className="fa fa-upload fa-4x text-primary mb-4"></i>
                            <h5>Upload Prescription</h5>
                            <input
                              type="file"
                              className="form-control mt-3"
                              accept="image/*,.pdf"
                              onChange={handleFileUpload}
                            />
                            <small className="text-muted d-block mt-2">
                              Supported formats: JPG, PNG, PDF
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-info">
                          <div className="card-body">
                            <h5 className="mb-3">Or Choose from Appointment</h5>
                            <div className="list-group">
                              <button
                                className="list-group-item list-group-item-action"
                                onClick={() => handleAppointmentSelect('APT-001')}
                              >
                                <div>
                                  <strong>Appointment #APT-001</strong>
                                  <br />
                                  <small>Dr. Smith - Dec 30, 2024</small>
                                </div>
                              </button>
                              <button
                                className="list-group-item list-group-item-action"
                                onClick={() => handleAppointmentSelect('APT-002')}
                              >
                                <div>
                                  <strong>Appointment #APT-002</strong>
                                  <br />
                                  <small>Dr. Johnson - Dec 28, 2024</small>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'medicine' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">📋 Medicine List</h3>
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={() => setStep('upload')}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    {prescriptionFile && (
                      <div className="alert alert-info">
                        <i className="fa fa-file me-2"></i>
                        Prescription uploaded: {prescriptionFile.name}
                      </div>
                    )}
                    {selectedAppointment && (
                      <div className="alert alert-info">
                        <i className="fa fa-calendar me-2"></i>
                        Selected appointment: {selectedAppointment}
                      </div>
                    )}
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Medicine Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted py-5">
                                <i className="fa fa-pills fa-3x mb-3 d-block"></i>
                                <p>No medicines found. Please upload prescription or select appointment.</p>
                              </td>
                            </tr>
                          ) : (
                            medicines.map((medicine, index) => (
                              <tr key={index}>
                                <td>{medicine.name}</td>
                                <td>{medicine.quantity}</td>
                                <td>${medicine.price}</td>
                                <td>${medicine.total}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {medicines.length > 0 && (
                          <tfoot>
                            <tr>
                              <th colSpan={3}>Total</th>
                              <th>${medicines.reduce((sum, m) => sum + m.total, 0)}</th>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                    {medicines.length > 0 && (
                      <div className="mt-4">
                        <button
                          className="btn btn-success btn-lg w-100"
                          onClick={() => setStep('checkout')}
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'checkout' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">🛒 Checkout</h3>
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={() => setStep('medicine')}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    <div className="row">
                      <div className="col-md-8">
                        <h5>Delivery Information</h5>
                        <div className="mb-3">
                          <label className="form-label">Full Name</label>
                          <input type="text" className="form-control" />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input type="tel" className="form-control" />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <textarea className="form-control" rows={3}></textarea>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <select className="form-select">
                            <option>Cash on Delivery</option>
                            <option>Credit Card</option>
                            <option>Bank Transfer</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body">
                            <h6>Order Summary</h6>
                            <hr />
                            <div className="d-flex justify-content-between">
                              <span>Subtotal</span>
                              <span>$0.00</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Delivery</span>
                              <span>$5.00</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Total</span>
                              <span>$5.00</span>
                            </div>
                            <button
                              className="btn btn-success w-100 mt-3"
                              onClick={handleCheckout}
                            >
                              Place Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'track' && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">📦 Track Order</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-success">
                      <h5>Order ID: {orderId}</h5>
                      <p>Your order has been placed successfully!</p>
                    </div>
                    <div className="timeline">
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-success rounded-circle p-3 me-3">
                          <i className="fa fa-check"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Order Placed</h5>
                          <small className="text-muted">Your order has been received</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-warning rounded-circle p-3 me-3">
                          <i className="fa fa-spinner fa-spin"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Processing</h5>
                          <small className="text-muted">Preparing your medicines</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Out for Delivery</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="badge bg-secondary rounded-circle p-3 me-3">
                          <i className="fa fa-clock"></i>
                        </div>
                        <div>
                          <h5 className="mb-0">Delivered</h5>
                          <small className="text-muted">Waiting...</small>
                        </div>
                      </div>
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

