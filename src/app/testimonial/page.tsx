import Image from 'next/image';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function Testimonial() {
  return (
    <>
      <Topbar />
      <Navbar />

      {/* Testimonial Start */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
              Testimonial
            </h5>
            <h1 className="display-4">Patients Say About Our Services</h1>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="owl-carousel testimonial-carousel">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="testimonial-item text-center">
                    <div className="position-relative mb-5">
                      <Image
                        src={`/img/testimonial-${i}.jpg`}
                        alt="Testimonial"
                        width={150}
                        height={150}
                        className="img-fluid rounded-circle mx-auto"
                      />
                      <div
                        className="position-absolute top-100 start-50 translate-middle d-flex align-items-center justify-content-center bg-white rounded-circle"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <i className="fa fa-quote-left fa-2x text-primary"></i>
                      </div>
                    </div>
                    <p className="fs-4 fw-normal">
                      Dolores sed duo clita tempor justo dolor et stet lorem kasd labore dolore
                      lorem ipsum. At lorem lorem magna ut et, nonumy et labore et tempor diam
                      tempor erat. Erat dolor rebum sit ipsum.
                    </p>
                    <hr className="w-25 mx-auto" />
                    <h3>Patient Name</h3>
                    <h6 className="fw-normal text-primary mb-3">Profession</h6>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Testimonial End */}

      <Footer />
      <BackToTop />
    </>
  );
}

