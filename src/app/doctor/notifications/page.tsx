'use client';

import { useState } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleMarkAsRead = (id: string) => {
    // TODO: Implement mark as read
    console.log('Mark as read:', id);
  };

  return (
    <div>
      <h2 className="mb-4">🔔 Notification Center</h2>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Notifications</h5>
        </div>
        <div className="card-body">
          {notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-bell fa-3x text-muted mb-3"></i>
              <p className="text-muted">No notifications</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`list-group-item ${!notification.read ? 'bg-light' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">
                        {!notification.read && <span className="badge bg-primary me-2">New</span>}
                        {notification.title}
                      </h6>
                      <p className="mb-1">{notification.message}</p>
                      <small className="text-muted">{notification.time}</small>
                    </div>
                    {!notification.read && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm mt-4">
        <div className="card-header">
          <h5 className="mb-0">Notification Types</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="notif1" defaultChecked />
                <label className="form-check-label" htmlFor="notif1">
                  New Appointments
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="notif2" defaultChecked />
                <label className="form-check-label" htmlFor="notif2">
                  Emergencies
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="notif3" defaultChecked />
                <label className="form-check-label" htmlFor="notif3">
                  Schedule Changes
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="notif4" defaultChecked />
                <label className="form-check-label" htmlFor="notif4">
                  Patient Cancellations
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

