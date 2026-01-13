"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function RankingPage() {
  return (
    <div>
      <h2 className="mb-4">Ranking</h2>
      <div className="row g-4">
        <div className="col-md-6">
          <Link href="/admin/ranking/doctors" className="text-decoration-none">
            <div className={`card shadow-sm h-100 ${styles.hoverCard}`}>
              <div className="card-body text-center p-5">
                <i className="fa fa-user-md fa-4x text-primary mb-3"></i>
                <h4 className="card-title">Doctor Ranking</h4>
                <p className="card-text text-muted">
                  View doctor rankings based on ratings and number of reviews
                </p>
                <button className="btn btn-primary mt-3">
                  View Details <i className="fa fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-6">
          <Link
            href="/admin/ranking/hospitals"
            className="text-decoration-none"
          >
            <div className={`card shadow-sm h-100 ${styles.hoverCard}`}>
              <div className="card-body text-center p-5">
                <i className="fa fa-hospital fa-4x text-success mb-3"></i>
                <h4 className="card-title">Hospital Ranking</h4>
                <p className="card-text text-muted">
                  View hospital rankings based on ratings and number of reviews
                </p>
                <button className="btn btn-success mt-3">
                  View Details <i className="fa fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
