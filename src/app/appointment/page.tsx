import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function Appointment() {
  return (
    <>
      <Topbar />
      <Navbar />

      {/* Appointment Start */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="row gx-5">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="mb-4">
                <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
                  Appointment
                </h5>
                <h1 className="display-4">Make An Appointment For Your Family</h1>
              </div>
              <p className="mb-5">
                Eirmod sed tempor lorem ut dolores. Aliquyam sit sadipscing kasd ipsum. Dolor ea et
                dolore et at sea ea at dolor, justo ipsum duo rebum sea invidunt voluptua. Eos vero
                eos vero ea et dolore eirmod et. Dolores diam duo invidunt lorem. Elitr ut dolores
                magna sit. Sea dolore sanctus sed et. Takimata takimata sanctus sed.
              </p>
              <a className="btn btn-primary rounded-pill py-3 px-5 me-3" href="#!">
                Find Doctor
              </a>
              <a className="btn btn-outline-primary rounded-pill py-3 px-5" href="#!">
                Read More
              </a>
            </div>
            <div className="col-lg-6">
              <div className="bg-light text-center rounded p-5">
                <h1 className="mb-4">Book An Appointment</h1>
                <form>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <select className="form-select bg-white border-0" style={{ height: '55px' }} defaultValue="">
                        <option value="">Choose Department</option>
                        <option value="1">Department 1</option>
                        <option value="2">Department 2</option>
                        <option value="3">Department 3</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <select className="form-select bg-white border-0" style={{ height: '55px' }} defaultValue="">
                        <option value="">Select Doctor</option>
                        <option value="1">Doctor 1</option>
                        <option value="2">Doctor 2</option>
                        <option value="3">Doctor 3</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control bg-white border-0"
                        placeholder="Your Name"
                        style={{ height: '55px' }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="email"
                        className="form-control bg-white border-0"
                        placeholder="Your Email"
                        style={{ height: '55px' }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="date" id="date" data-target-input="nearest">
                        <input
                          type="text"
                          className="form-control bg-white border-0 datetimepicker-input"
                          placeholder="Date"
                          data-target="#date"
                          data-toggle="datetimepicker"
                          style={{ height: '55px' }}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="time" id="time" data-target-input="nearest">
                        <input
                          type="text"
                          className="form-control bg-white border-0 datetimepicker-input"
                          placeholder="Time"
                          data-target="#time"
                          data-toggle="datetimepicker"
                          style={{ height: '55px' }}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <button className="btn btn-primary w-100 py-3" type="submit">
                        Make An Appointment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Appointment End */}

      <Footer />
      <BackToTop />
    </>
  );
}

