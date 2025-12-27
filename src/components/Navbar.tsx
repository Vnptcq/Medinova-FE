'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="container-fluid sticky-top bg-white shadow-sm">
      <div className="container">
        <nav className="navbar navbar-expand-lg bg-white navbar-light py-3 py-lg-0">
          <Link href="/" className="navbar-brand">
            <h1 className="m-0 text-uppercase text-primary">
              <i className="fa fa-clinic-medical me-2"></i>Medinova
            </h1>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <div className="navbar-nav ms-auto py-0">
              <Link
                href="/"
                className={`nav-item nav-link ${isActive('/') && pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`nav-item nav-link ${isActive('/about') ? 'active' : ''}`}
              >
                About
              </Link>
              <Link
                href="/service"
                className={`nav-item nav-link ${isActive('/service') ? 'active' : ''}`}
              >
                Service
              </Link>
              <Link
                href="/price"
                className={`nav-item nav-link ${isActive('/price') ? 'active' : ''}`}
              >
                Pricing
              </Link>
              <div className="nav-item dropdown">
                <a
                  href="#"
                  className={`nav-link dropdown-toggle ${isActive('/blog') || isActive('/detail') || isActive('/team') || isActive('/testimonial') || isActive('/appointment') || isActive('/search') ? 'active' : ''}`}
                  data-bs-toggle="dropdown"
                >
                  Pages
                </a>
                <div className="dropdown-menu m-0">
                  <Link href="/blog" className="dropdown-item">
                    Blog Grid
                  </Link>
                  <Link href="/detail" className="dropdown-item">
                    Blog Detail
                  </Link>
                  <Link href="/team" className="dropdown-item">
                    The Team
                  </Link>
                  <Link href="/testimonial" className="dropdown-item">
                    Testimonial
                  </Link>
                  <Link href="/appointment" className="dropdown-item">
                    Appointment
                  </Link>
                  <Link href="/search" className="dropdown-item">
                    Search
                  </Link>
                </div>
              </div>
              <Link
                href="/contact"
                className={`nav-item nav-link ${isActive('/contact') ? 'active' : ''}`}
              >
                Contact
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

