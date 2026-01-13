"use client";

import { useState, useEffect, useCallback } from "react";
import { getAppointmentManagement } from "@/generated/api/endpoints/appointment-management/appointment-management";
import { getDoctorManagement } from "@/generated/api/endpoints/doctor-management/doctor-management";
import { getLeaveRequestManagement } from "@/generated/api/endpoints/leave-request-management/leave-request-management";
import { getUser } from "@/utils/auth";
import type {
  BusyScheduleResponse,
  DoctorLeaveRequest,
  LocalTime,
} from "@/generated/api/models";

export default function SchedulePage() {
  const [busySchedules, setBusySchedules] = useState<BusyScheduleResponse[]>(
    []
  );
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    isAllDay: false,
    isMultipleDays: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [myLeaveRequests, setMyLeaveRequests] = useState<DoctorLeaveRequest[]>(
    []
  );
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false);

  // Get doctor ID from user
  useEffect(() => {
    const loadDoctorId = async () => {
      try {
        const userData = getUser();
        if (!userData) {
          console.warn("User data not found");
          return;
        }

        // Try to get doctor ID directly from user object
        const directDoctorId = userData.doctorId || userData.doctor?.id;
        if (directDoctorId) {
          setDoctorId(Number(directDoctorId));
          return;
        }

        // If not found, search for doctor by user ID or email
        const userId = userData.id || userData.userId || userData.user?.id;
        const userEmail = userData.email;

        if (!userId && !userEmail) {
          console.warn("User ID and email not found");
          return;
        }

        const doctorApi = getDoctorManagement();
        const response = await doctorApi.getAllDoctors();
        const doctorsData = (response as any)?.data || response;
        const allDoctors = Array.isArray(doctorsData) ? doctorsData : [];

        // Find doctor by user ID or email
        let currentDoctor = null;
        if (userId) {
          currentDoctor = allDoctors.find(
            (doc: any) =>
              doc.user?.id === userId ||
              doc.userId === userId ||
              doc.user?.userId === userId
          );
        }

        if (!currentDoctor && userEmail) {
          currentDoctor = allDoctors.find(
            (doc: any) =>
              doc.user?.email === userEmail || doc.email === userEmail
          );
        }

        if (currentDoctor && currentDoctor.id) {
          setDoctorId(Number(currentDoctor.id));
        }
      } catch (error) {
        console.error("Error loading doctor ID:", error);
      }
    };

    loadDoctorId();
  }, []);

  // Load busy schedules when doctor ID is available or week changes
  useEffect(() => {
    if (doctorId) {
      loadBusySchedules(doctorId);
      loadMyLeaveRequests();
    }
  }, [doctorId, selectedWeek]);

  // Load busy schedules for the doctor
  const loadBusySchedules = useCallback(async (doctorId: number) => {
    try {
      setIsLoading(true);
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getBusySchedules(doctorId);
      const schedules = Array.isArray(response) ? response : [];
      setBusySchedules(schedules);
    } catch (error) {
      console.error("Error loading busy schedules:", error);
      setBusySchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load my leave requests
  const loadMyLeaveRequests = useCallback(async () => {
    try {
      setIsLoadingLeaveRequests(true);
      const leaveApi = getLeaveRequestManagement();
      const response = await leaveApi.getMyLeaveRequests();
      const requestsData = (response as any)?.data || response;
      const requestsList = Array.isArray(requestsData) ? requestsData : [];

      // Sort by creation date (newest first)
      const sortedRequests = requestsList.sort(
        (a: DoctorLeaveRequest, b: DoctorLeaveRequest) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
      );

      setMyLeaveRequests(sortedRequests);
    } catch (error) {
      console.error("Error loading my leave requests:", error);
      setMyLeaveRequests([]);
    } finally {
      setIsLoadingLeaveRequests(false);
    }
  }, []);

  // Get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get all days in the week
  const getWeekDays = (weekStart: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get hours from 8 to 17 (8 AM to 5 PM)
  const getHours = (): number[] => {
    return Array.from({ length: 10 }, (_, i) => i + 8); // 8-17
  };

  // Check if a date is at least 3 days from now
  const isAtLeast3DaysFromNow = (date: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
  };

  // Validate date format and check if it's a valid date
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Validate date selection with comprehensive checks
  const validateDateSelection = (): string | null => {
    // Check startDate is provided
    if (!blockFormData.startDate || blockFormData.startDate.trim() === "") {
      return "Please select a start date.";
    }

    // Check startDate format is valid
    if (!isValidDate(blockFormData.startDate)) {
      return "Invalid start date. Please select again.";
    }

    const startDateObj = new Date(blockFormData.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    startDateObj.setHours(0, 0, 0, 0);

    // Check startDate is not in the past
    if (startDateObj < now) {
      return "Start date cannot be in the past.";
    }

    // Check startDate is at least 3 days from now
    if (!isAtLeast3DaysFromNow(startDateObj)) {
      const diffTime = startDateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return "Start date cannot be in the past.";
      } else if (diffDays === 0) {
        return "Start date must be at least 3 days from now. Cannot set today.";
      } else if (diffDays === 1) {
        return "Start date must be at least 3 days from now. 1 more day needed.";
      } else if (diffDays === 2) {
        return "Start date must be at least 3 days from now. 2 more days needed.";
      } else {
        return "Start date must be at least 3 days from now.";
      }
    }

    // If multiple days, validate endDate
    if (blockFormData.isMultipleDays) {
      // Check endDate is provided
      if (!blockFormData.endDate || blockFormData.endDate.trim() === "") {
        return "Please select an end date.";
      }

      // Check endDate format is valid
      if (!isValidDate(blockFormData.endDate)) {
        return "Invalid end date. Please select again.";
      }

      const endDateObj = new Date(blockFormData.endDate);
      endDateObj.setHours(0, 0, 0, 0);

      // Check endDate is not in the past
      if (endDateObj < now) {
        return "End date cannot be in the past.";
      }

      // Check endDate is at least 3 days from now
      if (!isAtLeast3DaysFromNow(endDateObj)) {
        const diffTime = endDateObj.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          return "End date cannot be in the past.";
        } else if (diffDays === 0) {
          return "End date must be at least 3 days from now. Cannot set today.";
        } else if (diffDays === 1) {
          return "End date must be at least 3 days from now. 1 more day needed.";
        } else if (diffDays === 2) {
          return "End date must be at least 3 days from now. 2 more days needed.";
        } else {
          return "End date must be at least 3 days from now.";
        }
      }

      // Check endDate is after or equal to startDate
      if (endDateObj < startDateObj) {
        return "End date must be after or equal to start date.";
      }

      // Check if endDate is same as startDate (should use single day instead)
      if (endDateObj.getTime() === startDateObj.getTime()) {
        return 'End date must be different from start date. If only one day, please select "Single Day".';
      }

      // Optional: Check if date range is too long (e.g., more than 1 year)
      const diffTime = endDateObj.getTime() - startDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        return "Block time range cannot exceed 365 days.";
      }
    }

    return null; // All validations passed
  };

  // Get busy schedule info for a specific slot
  const getSlotBusyInfo = (
    date: Date,
    hour: number
  ): BusyScheduleResponse | null => {
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, 0, 0, 0);

    for (const schedule of busySchedules) {
      if (schedule.startDateTime && schedule.endDateTime) {
        const startDate = new Date(schedule.startDateTime);
        const endDate = new Date(schedule.endDateTime);

        if (slotDateTime >= startDate && slotDateTime < endDate) {
          return schedule;
        }
      } else if (schedule.startDate && schedule.endDate) {
        const startDate = new Date(schedule.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(schedule.endDate);
        endDate.setHours(23, 59, 59, 999);

        const slotDateOnly = new Date(date);
        slotDateOnly.setHours(0, 0, 0, 0);

        if (slotDateOnly >= startDate && slotDateOnly <= endDate) {
          return schedule;
        }
      }
    }
    return null;
  };

  // Check if a slot is busy
  const isSlotBusy = (date: Date, hour: number): boolean => {
    return getSlotBusyInfo(date, hour) !== null;
  };

  // Get slot type (APPOINTMENT, HOLD, or LEAVE)
  const getSlotType = (date: Date, hour: number): string | null => {
    const info = getSlotBusyInfo(date, hour);
    return info?.type || null;
  };

  // Check if a time slot is in the past
  const isPastTime = (date: Date, hour: number): boolean => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  // Handle block time form submission
  const handleBlockTime = async () => {
    // Comprehensive date validation
    const dateValidationError = validateDateSelection();
    if (dateValidationError) {
      setErrorMessage(dateValidationError);
      return;
    }

    // If not all day, validate time fields
    if (!blockFormData.isAllDay) {
      if (!blockFormData.startTime || !blockFormData.endTime) {
        setErrorMessage("Please select start and end time.");
        return;
      }

      // Validate time range (8h - 18h)
      const startHour = parseInt(blockFormData.startTime.split(":")[0]);
      const endHour = parseInt(blockFormData.endTime.split(":")[0]);

      if (startHour < 8 || startHour > 17) {
        setErrorMessage("Start time must be between 8:00 and 17:00.");
        return;
      }

      if (endHour <= startHour || endHour > 18) {
        setErrorMessage(
          "End time must be after start time and not exceed 18:00."
        );
        return;
      }
    }

    // Validate reason (required)
    if (!blockFormData.reason || blockFormData.reason.trim() === "") {
      setErrorMessage("Please enter a reason for blocking time.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      // Format dates (API expects date format YYYY-MM-DD)
      const startDate = blockFormData.startDate;
      const endDate = blockFormData.isMultipleDays
        ? blockFormData.endDate
        : blockFormData.startDate;

      // Build reason and prepare time strings
      let reason = blockFormData.reason || undefined;

      // Prepare request body - API expects startTime and endTime as LocalTime object
      const requestBody: {
        startDate: string;
        endDate: string;
        startTime?: LocalTime;
        endTime?: LocalTime;
        reason?: string;
      } = {
        startDate: startDate,
        endDate: endDate,
      };

      if (blockFormData.isAllDay) {
        // All day leave request - no startTime and endTime
        reason = blockFormData.reason
          ? `All Day - ${blockFormData.reason}`
          : "All Day";
        // Don't include startTime and endTime for all day - they will be undefined
      } else {
        // Specific time range leave request - convert from "HH:MM" to LocalTime object
        const startTimeParts = blockFormData.startTime.split(":");
        const endTimeParts = blockFormData.endTime.split(":");

        const startHour = parseInt(startTimeParts[0]);
        const startMinute = parseInt(startTimeParts[1]) || 0;
        const endHour = parseInt(endTimeParts[0]);
        const endMinute = parseInt(endTimeParts[1]) || 0;

        // Validate parsed values
        if (isNaN(startHour) || isNaN(endHour)) {
          setErrorMessage("Invalid time. Please select again.");
          setIsLoading(false);
          return;
        }

        // Convert to LocalTime object
        requestBody.startTime = {
          hour: startHour,
          minute: startMinute,
          second: 0,
        };
        requestBody.endTime = {
          hour: endHour,
          minute: endMinute,
          second: 0,
        };
      }

      // Add reason if provided
      if (reason) {
        requestBody.reason = reason;
      }

      // Call API to create leave request
      const leaveApi = getLeaveRequestManagement();
      const response = await leaveApi.createLeaveRequest(requestBody);

      // Check if request was successful
      if (response) {
        setShowBlockModal(false);
        setBlockFormData({
          startDate: "",
          endDate: "",
          startTime: "08:00",
          endTime: "18:00",
          reason: "",
          isAllDay: false,
          isMultipleDays: false,
        });
        setErrorMessage("");

        // Reload busy schedules and leave requests after blocking
        if (doctorId) {
          await Promise.all([
            loadBusySchedules(doctorId),
            loadMyLeaveRequests(),
          ]);
        }

        alert("Leave request created successfully! Please wait for admin approval.");
      }
    } catch (error: any) {
      console.error("Error blocking time:", error);

      // Parse error message from API response
      let errorMsg = "Error blocking time. Please try again.";

      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate week days and hours for the grid
  const weekStart = getWeekStart(selectedWeek);
  const weekDays = getWeekDays(weekStart);
  const hours = getHours(); // 8-17
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Get minimum date for block form (3 days from now)
  const getMinDate = (): string => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate.toISOString().split("T")[0];
  };

  // Generate hour options (8h to 18h)
  const getHourOptions = (): string[] => {
    const hours: string[] = [];
    for (let i = 8; i <= 18; i++) {
      hours.push(`${i.toString().padStart(2, "0")}:00`);
    }
    return hours;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📅 Schedule Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowBlockModal(true);
            setErrorMessage("");
            setBlockFormData({
              startDate: "",
              endDate: "",
              startTime: "08:00",
              endTime: "18:00",
              reason: "",
              isAllDay: false,
              isMultipleDays: false,
            });
          }}
        >
          <i className="fa fa-ban me-2"></i>Block Time
        </button>
      </div>

      <div className="alert alert-info">
        <i className="fa fa-info-circle me-2"></i>
        <strong>Note:</strong> Your work schedule directly affects patient appointments.
        <strong className="ms-2">
          Work schedule must be set at least 3 days in advance.
        </strong>
      </div>

      {/* Week Navigation */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToPreviousWeek}
              disabled={isLoading}
            >
              <i className="fa fa-chevron-left me-2"></i>Previous Week
            </button>
            <h6 className="mb-0">
              {isLoading && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
              )}
              {weekStart.toLocaleDateString("en-US", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
              })}{" "}
              -{" "}
              {weekDays[6].toLocaleDateString("en-US", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
              })}
            </h6>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToNextWeek}
              disabled={isLoading}
            >
              Next Week<i className="fa fa-chevron-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="fa fa-calendar-alt me-2"></i>
            This Week's Schedule
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table
              className="table table-bordered table-hover mb-0"
              style={{ fontSize: "0.9rem" }}
            >
              <thead
                className="table-light"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <tr>
                  <th
                    style={{
                      width: "80px",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "12px",
                    }}
                  >
                    <i className="fa fa-clock me-1"></i>Giờ
                  </th>
                  {weekDays.map((date, index) => (
                    <th
                      key={index}
                      style={{
                        textAlign: "center",
                        minWidth: "120px",
                        padding: "12px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        {dayNames[index]}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#666",
                          fontWeight: "normal",
                        }}
                      >
                        {date.toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "numeric",
                        })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour}>
                    <td
                      className="text-center fw-bold"
                      style={{ verticalAlign: "middle" }}
                    >
                      {hour}:00
                    </td>
                    {weekDays.map((date, dayIndex) => {
                      const isBusy = isSlotBusy(date, hour);
                      const isPast = isPastTime(date, hour);
                      const slotType = getSlotType(date, hour);
                      const busyInfo = getSlotBusyInfo(date, hour);

                      // Determine button class and color based on slot type
                      let btnClass = "btn btn-sm";
                      let btnStyle: React.CSSProperties = {
                        width: "100%",
                        minHeight: "45px",
                        position: "relative",
                      };

                      if (isBusy) {
                        if (slotType === "APPOINTMENT") {
                          btnClass += " btn-danger";
                          btnStyle.background =
                            "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";
                          btnStyle.color = "white";
                        } else if (slotType === "HOLD") {
                          btnClass += " btn-info";
                          btnStyle.background =
                            "linear-gradient(135deg, #17a2b8 0%, #138496 100%)";
                          btnStyle.color = "white";
                        } else if (slotType === "LEAVE") {
                          btnClass += " btn-warning";
                          btnStyle.background =
                            "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)";
                          btnStyle.color = "white";
                        } else {
                          btnClass += " btn-danger";
                        }
                      } else if (isPast) {
                        btnClass += " btn-secondary";
                        btnStyle.opacity = 0.5;
                      } else {
                        btnClass += " btn-outline-success";
                      }

                      // Build tooltip text
                      let tooltipText = "";
                      if (isPast) {
                        tooltipText = "Lịch đã qua";
                      } else if (isBusy && busyInfo) {
                        const startTime = busyInfo.startDateTime
                          ? new Date(busyInfo.startDateTime).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : busyInfo.startDate;
                        const endTime = busyInfo.endDateTime
                          ? new Date(busyInfo.endDateTime).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : busyInfo.endDate;

                        if (slotType === "APPOINTMENT") {
                          tooltipText = "📅 Patient Appointment\n";
                        } else if (slotType === "HOLD") {
                          tooltipText =
                            "⏳ On Hold (patient not confirmed)\n";
                        } else {
                          tooltipText = "🏖️ Leave\n";
                        }

                        if (startTime && endTime) {
                          tooltipText += `Time: ${startTime} - ${endTime}\n`;
                        }
                        if (busyInfo.reason) {
                          tooltipText += `Reason: ${busyInfo.reason}`;
                        }
                      } else {
                        tooltipText = `Available - Can book`;
                      }

                      return (
                        <td
                          key={dayIndex}
                          style={{
                            padding: "4px",
                            textAlign: "center",
                            position: "relative",
                          }}
                        >
                          <button
                            type="button"
                            className={btnClass}
                            style={btnStyle}
                            disabled={isPast}
                            title={tooltipText}
                            onMouseEnter={(e) => {
                              if (isBusy && busyInfo) {
                                const tooltip = document.createElement("div");
                                tooltip.className = "custom-slot-tooltip";
                                tooltip.style.cssText = `
                                  position: absolute;
                                  background: rgba(0, 0, 0, 0.9);
                                  color: white;
                                  padding: 8px 12px;
                                  border-radius: 6px;
                                  font-size: 0.85rem;
                                  z-index: 1000;
                                  white-space: pre-line;
                                  pointer-events: none;
                                  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                                  max-width: 250px;
                                `;

                                const startTime = busyInfo.startDateTime
                                  ? new Date(
                                      busyInfo.startDateTime
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : busyInfo.startDate;
                                const endTime = busyInfo.endDateTime
                                  ? new Date(
                                      busyInfo.endDateTime
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : busyInfo.endDate;

                                let typeLabel = "";
                                if (slotType === "APPOINTMENT") {
                                  typeLabel = "📅 Patient Appointment";
                                } else if (slotType === "HOLD") {
                                  typeLabel = "⏳ On Hold (not confirmed)";
                                } else {
                                  typeLabel = "🏖️ Leave";
                                }

                                tooltip.innerHTML = `
                                  <div style="font-weight: bold; margin-bottom: 4px;">
                                    ${typeLabel}
                                  </div>
                                  ${
                                    startTime && endTime
                                      ? `<div style="margin-bottom: 4px;">⏰ ${startTime} - ${endTime}</div>`
                                      : ""
                                  }
                                  ${
                                    busyInfo.reason
                                      ? `<div style="font-size: 0.8rem; opacity: 0.9;">${busyInfo.reason}</div>`
                                      : ""
                                  }
                                `;

                                document.body.appendChild(tooltip);
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                tooltip.style.left = `${
                                  rect.left +
                                  rect.width / 2 -
                                  tooltip.offsetWidth / 2
                                }px`;
                                tooltip.style.top = `${
                                  rect.top - tooltip.offsetHeight - 8
                                }px`;
                              }
                            }}
                            onMouseLeave={() => {
                              const tooltip = document.querySelector(
                                ".custom-slot-tooltip"
                              );
                              if (tooltip) {
                                tooltip.remove();
                              }
                            }}
                          >
                            {isBusy ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "2px",
                                }}
                              >
                                {slotType === "APPOINTMENT" ? (
                                  <>
                                    <i
                                      className="fa fa-calendar-check"
                                      style={{ fontSize: "1rem" }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Appt
                                    </span>
                                  </>
                                ) : slotType === "HOLD" ? (
                                  <>
                                    <i
                                      className="fa fa-clock"
                                      style={{ fontSize: "1rem" }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Hold
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <i
                                      className="fa fa-umbrella-beach"
                                      style={{ fontSize: "1rem" }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Leave
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.85rem" }}>Available</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-3 p-3 bg-light rounded border">
            <div className="row g-3">
              <div className="col-12">
                <h6 className="mb-3 fw-bold">
                  <i className="fa fa-info-circle me-2 text-primary"></i>
                  Legend:
                </h6>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-success"
                    disabled
                    style={{ minWidth: "70px", minHeight: "35px" }}
                  >
                    <span style={{ fontSize: "0.8rem" }}>Available</span>
                  </button>
                  <span style={{ fontSize: "0.85rem" }}>Can Book</span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-danger"
                    disabled
                    style={{
                      minWidth: "70px",
                      minHeight: "35px",
                      background:
                        "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                    }}
                  >
                    <i className="fa fa-calendar-check"></i>
                  </button>
                  <span style={{ fontSize: "0.85rem" }}>
                    📅 Patient Appointment
                  </span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-info"
                    disabled
                    style={{
                      minWidth: "70px",
                      minHeight: "35px",
                      background:
                        "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
                    }}
                  >
                    <i className="fa fa-clock"></i>
                  </button>
                  <span style={{ fontSize: "0.85rem" }}>⏳ On Hold</span>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-warning"
                    disabled
                    style={{
                      minWidth: "70px",
                      minHeight: "35px",
                      background:
                        "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                    }}
                  >
                    <i className="fa fa-umbrella-beach"></i>
                  </button>
                  <span style={{ fontSize: "0.85rem" }}>🏖️ Leave</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="fa fa-lightbulb me-1 text-warning"></i>
                <strong>Tip:</strong> Hover over busy slots to view detailed information
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* My Leave Requests Section */}
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fa fa-calendar-times me-2"></i>
            My Leave Requests
          </h5>
          <button
            className="btn btn-sm btn-light"
            onClick={loadMyLeaveRequests}
            disabled={isLoadingLeaveRequests}
          >
            <i
              className={`fa fa-${
                isLoadingLeaveRequests ? "spinner fa-spin" : "sync"
              } me-2`}
            ></i>
            Refresh
          </button>
        </div>
        <div className="card-body">
          {isLoadingLeaveRequests ? (
            <div className="text-center py-3">
              <div
                className="spinner-border text-primary spinner-border-sm"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : myLeaveRequests.length === 0 ? (
            <div className="text-center py-3">
              <i className="fa fa-calendar-times fa-2x text-muted mb-2"></i>
              <p className="text-muted mb-0">No leave requests found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        {request.startDate
                          ? new Date(request.startDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </td>
                      <td>
                        {request.endDate
                          ? new Date(request.endDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </td>
                      <td>{request.reason || "No reason"}</td>
                      <td>
                        <span
                          className={`badge ${
                            request.status === "APPROVED"
                              ? "bg-success"
                              : request.status === "REJECTED"
                              ? "bg-danger"
                              : "bg-warning"
                          }`}
                        >
                          {request.status === "APPROVED"
                            ? "Approved"
                            : request.status === "REJECTED"
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      <td>
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Block Time Modal */}
      {showBlockModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex={-1}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBlockModal(false);
              setErrorMessage("");
              setBlockFormData({
                startDate: "",
                endDate: "",
                startTime: "08:00",
                endTime: "18:00",
                reason: "",
                isAllDay: false,
                isMultipleDays: false,
              });
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title">
                  <i className="fa fa-ban me-2"></i>Block Time
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowBlockModal(false);
                    setErrorMessage("");
                    setBlockFormData({
                      startDate: "",
                      endDate: "",
                      startTime: "08:00",
                      endTime: "18:00",
                      reason: "",
                      isAllDay: false,
                      isMultipleDays: false,
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fa fa-exclamation-circle me-2"></i>
                    {errorMessage}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Time Block Type *</label>
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="dateType"
                      id="singleDay"
                      checked={!blockFormData.isMultipleDays}
                      onChange={() =>
                        setBlockFormData({
                          ...blockFormData,
                          isMultipleDays: false,
                          endDate: "",
                          isAllDay: false,
                        })
                      }
                    />
                    <label
                      className="btn btn-outline-primary"
                      htmlFor="singleDay"
                    >
                      <i className="fa fa-calendar-day me-2"></i>Single Day
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name="dateType"
                      id="multipleDays"
                      checked={blockFormData.isMultipleDays}
                      onChange={() =>
                        setBlockFormData({
                          ...blockFormData,
                          isMultipleDays: true,
                          isAllDay: true,
                        })
                      }
                    />
                    <label
                      className="btn btn-outline-primary"
                      htmlFor="multipleDays"
                    >
                      <i className="fa fa-calendar-alt me-2"></i>Multiple Days
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={blockFormData.startDate}
                    onChange={(e) =>
                      setBlockFormData({
                        ...blockFormData,
                        startDate: e.target.value,
                      })
                    }
                    min={getMinDate()}
                    required
                  />
                  <small className="text-muted">
                    Work schedule must be set at least 3 days in advance
                  </small>
                </div>
                {blockFormData.isMultipleDays && (
                  <div className="mb-3">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={blockFormData.endDate}
                      onChange={(e) =>
                        setBlockFormData({
                          ...blockFormData,
                          endDate: e.target.value,
                        })
                      }
                      min={blockFormData.startDate || getMinDate()}
                      required
                    />
                    <small className="text-muted">
                      End date must be after or equal to start date
                    </small>
                  </div>
                )}
                {!blockFormData.isMultipleDays && (
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isAllDay"
                        checked={blockFormData.isAllDay}
                        onChange={(e) =>
                          setBlockFormData({
                            ...blockFormData,
                            isAllDay: e.target.checked,
                          })
                        }
                      />
                      <label className="form-check-label" htmlFor="isAllDay">
                        <strong>All Day</strong>
                      </label>
                    </div>
                    <small className="text-muted d-block mt-1">
                      If "All Day" is selected, you will block the entire day
                    </small>
                  </div>
                )}
                {blockFormData.isMultipleDays && (
                  <div className="alert alert-info mb-3">
                    <i className="fa fa-info-circle me-2"></i>
                    <strong>Note:</strong> When selecting multiple days, the system will automatically block all days for the selected dates.
                  </div>
                )}
                {!blockFormData.isAllDay && !blockFormData.isMultipleDays && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">From Time *</label>
                      <select
                        className="form-select"
                        value={blockFormData.startTime}
                        onChange={(e) =>
                          setBlockFormData({
                            ...blockFormData,
                            startTime: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">-- Select Start Time --</option>
                        {getHourOptions()
                          .slice(0, -1)
                          .map((hour) => (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          ))}
                      </select>
                      <small className="text-muted">
                        Time from 8:00 AM to 5:00 PM (08:00 - 17:00)
                      </small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">To Time *</label>
                      <select
                        className="form-select"
                        value={blockFormData.endTime}
                        onChange={(e) =>
                          setBlockFormData({
                            ...blockFormData,
                            endTime: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">-- Select End Time --</option>
                        {getHourOptions()
                          .filter((hour) => {
                            // Only show hours after startTime
                            if (!blockFormData.startTime) return true;
                            const startHour = parseInt(
                              blockFormData.startTime.split(":")[0]
                            );
                            const endHour = parseInt(hour.split(":")[0]);
                            return endHour > startHour;
                          })
                          .map((hour) => (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          ))}
                      </select>
                      <small className="text-muted">
                        End time must be after start time (maximum 18:00)
                      </small>
                    </div>
                  </>
                )}
                <div className="mb-3">
                  <label className="form-label">
                    Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter reason for blocking time..."
                    value={blockFormData.reason}
                    onChange={(e) =>
                      setBlockFormData({
                        ...blockFormData,
                        reason: e.target.value,
                      })
                    }
                    required
                  ></textarea>
                  <small className="text-muted">Reason is required</small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowBlockModal(false);
                    setErrorMessage("");
                    setBlockFormData({
                      startDate: "",
                      endDate: "",
                      startTime: "08:00",
                      endTime: "18:00",
                      reason: "",
                      isAllDay: false,
                      isMultipleDays: false,
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleBlockTime}
                >
                  <i className="fa fa-ban me-2"></i>Block Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
