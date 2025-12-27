import Image from 'next/image';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function Blog() {
  return (
    <>
      <Topbar />
      <Navbar />

      {/* Blog Start */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
              Blog Post
            </h5>
            <h1 className="display-4">Our Latest Medical Blog Posts</h1>
          </div>
          <div className="row g-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="col-xl-4 col-lg-6">
                <div className="bg-light rounded overflow-hidden">
                  <Image
                    src={`/img/blog-${((i - 1) % 3) + 1}.jpg`}
                    alt="Blog"
                    width={400}
                    height={250}
                    className="img-fluid w-100"
                  />
                  <div className="p-4">
                    <a className="h3 d-block mb-3" href="#!">
                      Dolor clita vero elitr sea stet dolor justo diam
                    </a>
                    <p className="m-0">
                      Dolor lorem eos dolor duo et eirmod sea. Dolor sit magna rebum clita rebum
                      dolor stet amet justo
                    </p>
                  </div>
                  <div className="d-flex justify-content-between border-top p-4">
                    <div className="d-flex align-items-center">
                      <Image
                        src="/img/user.jpg"
                        alt="User"
                        width={25}
                        height={25}
                        className="rounded-circle me-2"
                      />
                      <small>John Doe</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <small className="ms-3">
                        <i className="far fa-eye text-primary me-1"></i>12345
                      </small>
                      <small className="ms-3">
                        <i className="far fa-comment text-primary me-1"></i>123
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-12 text-center">
              <button className="btn btn-primary py-3 px-5">Load More</button>
            </div>
          </div>
        </div>
      </div>
      {/* Blog End */}

      <Footer />
      <BackToTop />
    </>
  );
}

