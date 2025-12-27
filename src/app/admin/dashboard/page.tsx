export default function AdminDashboard() {
  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Hospitals</h6>
                  <h3 className="mb-0">0</h3>
                </div>
                <i className="fa fa-hospital fa-2x text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Doctors</h6>
                  <h3 className="mb-0">0</h3>
                </div>
                <i className="fa fa-user-md fa-2x text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Pending Approvals</h6>
                  <h3 className="mb-0">0</h3>
                </div>
                <i className="fa fa-clock fa-2x text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Users</h6>
                  <h3 className="mb-0">0</h3>
                </div>
                <i className="fa fa-users fa-2x text-info"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

