"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import { getClinicManagement } from "@/generated/api/endpoints/clinic-management/clinic-management";
import { getDoctorManagement } from "@/generated/api/endpoints/doctor-management/doctor-management";
import { getAppointmentManagement } from "@/generated/api/endpoints/appointment-management/appointment-management";
import { getUser, isAuthenticated, getToken } from "@/utils/auth";
import type { BusyScheduleResponse } from "@/generated/api/models";
import axios from "axios";

export default function OutdoorCheckupPage() {
  const router = useRouter();
  const [step, setStep] = useState<
    | "clinic"
    | "department"
    | "doctor"
    | "datetime"
    | "info"
    | "confirm"
    | "detail"
  >("clinic");
  const [departments, setDepartments] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>("GENERAL_MEDICINE"); // Default to "Nội tổng quát" (Lâm sàng)
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [busySchedules, setBusySchedules] = useState<BusyScheduleResponse[]>(
    []
  );
  const [isLoadingBusySchedules, setIsLoadingBusySchedules] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    symptoms: "",
  });
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [holdAppointmentId, setHoldAppointmentId] = useState<number | null>(
    null
  );
  const [isHoldingSlot, setIsHoldingSlot] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes in seconds
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<Date | null>(null);
  const [appointmentStatus, setAppointmentStatus] = useState<string>("PENDING");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [depositInfo, setDepositInfo] = useState<{
    depositAmount?: number;
    depositStatus?: string;
    depositTransferContent?: string;
  }>({});
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [isCheckingPendingAppointment, setIsCheckingPendingAppointment] = useState(false);

  // Department enum values with display names and icons
  const departmentList = [
    {
      value: "GENERAL_MEDICINE",
      label: "General Medicine",
      icon: "fa-stethoscope",
      color: "primary",
    },
    { value: "PEDIATRICS", label: "Pediatrics", icon: "fa-child", color: "info" },
    {
      value: "OBSTETRICS_GYNECOLOGY",
      label: "Obstetrics & Gynecology",
      icon: "fa-female",
      color: "danger",
    },
    {
      value: "SURGERY",
      label: "General Surgery",
      icon: "fa-cut",
      color: "warning",
    },
    {
      value: "CARDIOLOGY",
      label: "Cardiology",
      icon: "fa-heartbeat",
      color: "danger",
    },
    {
      value: "NEUROLOGY",
      label: "Neurology",
      icon: "fa-brain",
      color: "primary",
    },
    {
      value: "ORTHOPEDICS",
      label: "Orthopedics",
      icon: "fa-bone",
      color: "secondary",
    },
    {
      value: "ONCOLOGY",
      label: "Oncology",
      icon: "fa-ribbon",
      color: "warning",
    },
    {
      value: "GASTROENTEROLOGY",
      label: "Gastroenterology",
      icon: "fa-stomach",
      color: "success",
    },
    { value: "RESPIRATORY", label: "Respiratory", icon: "fa-lungs", color: "info" },
    {
      value: "NEPHROLOGY",
      label: "Nephrology",
      icon: "fa-kidneys",
      color: "primary",
    },
    {
      value: "ENDOCRINOLOGY",
      label: "Endocrinology",
      icon: "fa-flask",
      color: "success",
    },
    {
      value: "HEMATOLOGY",
      label: "Hematology",
      icon: "fa-tint",
      color: "danger",
    },
    {
      value: "RHEUMATOLOGY",
      label: "Rheumatology",
      icon: "fa-dumbbell",
      color: "secondary",
    },
    {
      value: "DERMATOLOGY",
      label: "Dermatology",
      icon: "fa-hand-sparkles",
      color: "warning",
    },
    {
      value: "INFECTIOUS_DISEASE",
      label: "Infectious Disease",
      icon: "fa-virus",
      color: "danger",
    },
  ];

  const loadClinics = useCallback(async () => {
    try {
      const clinicApi = getClinicManagement();
      const response = await clinicApi.getAllClinics();
      setClinics(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error loading clinics:", error);
      setClinics([]);
    }
  }, []);

  // Check for pending appointments waiting for deposit confirmation
  const checkPendingAppointment = useCallback(async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      setIsCheckingPendingAppointment(true);
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getMyAppointments();
      const appointments = Array.isArray(response) ? response : [];

      // Find pending appointment with depositStatus = PENDING
      // Only block if deposit is PENDING, not if deposit is CONFIRMED (doctor can confirm then)
      const pending = appointments.find(
        (apt: any) =>
          apt.status === "PENDING" &&
          ((apt as any).depositStatus === "PENDING" || (apt as any).depositStatus === null || (apt as any).depositStatus === undefined)
      );

      if (pending) {
        setPendingAppointment(pending);
        setAppointmentId(pending.id?.toString() || "");
        setAppointmentStatus(pending.status || "PENDING");
        setDepositInfo({
          depositAmount: (pending as any).depositAmount,
          depositStatus: (pending as any).depositStatus || "PENDING",
          depositTransferContent: (pending as any).depositTransferContent,
        });
        // Only auto-navigate to detail if we're on clinic step (first visit)
        if (step === "clinic") {
          setStep("detail");
          // Start polling will be handled by useEffect
        }
      } else {
        setPendingAppointment(null);
        // If no pending appointment and we're on detail step, go back to clinic
        if (step === "detail" && !appointmentId) {
          setStep("clinic");
        }
      }
    } catch (error) {
      console.error("Error checking pending appointment:", error);
    } finally {
      setIsCheckingPendingAppointment(false);
    }
  }, [step, appointmentId]);

  const loadDoctors = useCallback(
    async (department: string, clinicId?: number) => {
      try {
        const doctorApi = getDoctorManagement();
        let response;

        try {
          // Try new API endpoints first (if available after regenerating)
          if (clinicId && (doctorApi as any).getDoctorsByClinicAndDepartment) {
            response = await (doctorApi as any).getDoctorsByClinicAndDepartment(
              clinicId,
              department
            );
          } else if ((doctorApi as any).getDoctorsByDepartment) {
            response = await (doctorApi as any).getDoctorsByDepartment(
              department
            );
          } else {
            // Fallback: Load all doctors by clinic and filter by department
            if (clinicId) {
              response = await doctorApi.getDoctorsByClinic(clinicId);
            } else {
              // Load all doctors and filter client-side (not ideal but works)
              const allDoctorsResponse = await doctorApi.getAllDoctors({
                page: 0,
                size: 1000,
              });
              response = Array.isArray(allDoctorsResponse)
                ? allDoctorsResponse
                : [];
            }

            // Filter by department client-side
            if (response && Array.isArray(response)) {
              response = response.filter((doctor: any) => {
                const doctorDept = doctor.department || doctor.specialization;
                return (
                  doctorDept === department ||
                  (typeof doctorDept === "string" &&
                    doctorDept.toUpperCase() === department.toUpperCase())
                );
              });
            }
          }
        } catch (apiError) {
          // If new API doesn't exist, fallback to old method
          console.warn("New API not available, using fallback:", apiError);
          if (clinicId) {
            response = await doctorApi.getDoctorsByClinic(clinicId);
          } else {
            const allDoctorsResponse = await doctorApi.getAllDoctors({
              page: 0,
              size: 1000,
            });
            response = Array.isArray(allDoctorsResponse)
              ? allDoctorsResponse
              : [];
          }

          // Filter by department client-side
          if (response && Array.isArray(response)) {
            response = response.filter((doctor: any) => {
              const doctorDept = doctor.department || doctor.specialization;
              return (
                doctorDept === department ||
                (typeof doctorDept === "string" &&
                  doctorDept.toUpperCase() === department.toUpperCase())
              );
            });
          }
        }

        setDoctors(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error loading doctors:", error);
        setDoctors([]);
      }
    },
    []
  );

  useEffect(() => {
    // Kiểm tra authentication khi component mount
    const checkAuth = () => {
      if (typeof window === "undefined") {
        return;
      }

      const authenticated = isAuthenticated();
      setIsCheckingAuth(false);

      if (!authenticated) {
        // Nếu chưa đăng nhập, hiển thị login modal (không gọi API)
        setShowLoginModal(true);
      } else {
        // Nếu đã đăng nhập, load dữ liệu
        loadClinics();
        checkPendingAppointment(); // Check for pending appointments
        const user = getUser();
        if (user) {
          setPatientInfo({
            name: user.fullName || "",
            email: user.email || "",
            phone: "",
            age: "",
            gender: "",
            symptoms: "",
          });
        }
      }
    };

    checkAuth();

    // Listen for auth-change event (khi đăng nhập thành công)
    const handleAuthChange = () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        setShowLoginModal(false);
        setShowSignupModal(false);
        // Load dữ liệu sau khi đăng nhập
        loadClinics();
        checkPendingAppointment(); // Check for pending appointments
        const user = getUser();
        if (user) {
          setPatientInfo({
            name: user.fullName || "",
            email: user.email || "",
            phone: "",
            age: "",
            gender: "",
            symptoms: "",
          });
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-change", handleAuthChange);
      return () => {
        window.removeEventListener("auth-change", handleAuthChange);
      };
    }
  }, [loadClinics, checkPendingAppointment]);

  useEffect(() => {
    // Auto-load doctors when both clinic and department are selected
    if (selectedClinic && selectedDepartment) {
      loadDoctors(selectedDepartment, Number(selectedClinic));
    } else if (selectedDepartment && step === "doctor") {
      // If no clinic selected but in doctor step, load all doctors for department
      loadDoctors(selectedDepartment);
    }
  }, [selectedDepartment, selectedClinic, step, loadDoctors]);

  // Auto-load doctors when entering department step with clinic and default department
  useEffect(() => {
    if (
      step === "department" &&
      selectedClinic &&
      selectedDepartment === "GENERAL_MEDICINE"
    ) {
      // Auto-load doctors for default department when clinic is selected
      loadDoctors(selectedDepartment, Number(selectedClinic));
    }
  }, [step, selectedClinic, selectedDepartment, loadDoctors]);

  // Load busy schedules when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      loadBusySchedules(Number(selectedDoctor));
    } else {
      setBusySchedules([]);
      setBookedSlots(new Set());
    }
  }, [selectedDoctor, selectedWeek]);

  // Countdown timer when in 'info' step with holdAppointmentId
  useEffect(() => {
    if (step === "info" && holdAppointmentId && holdStartTime) {
      // Calculate remaining time
      const elapsed = Math.floor(
        (new Date().getTime() - holdStartTime.getTime()) / 1000
      );
      const remaining = Math.max(0, 300 - elapsed); // 5 minutes = 300 seconds
      setTimeRemaining(remaining);

      // If time already expired, show modal immediately
      if (remaining === 0) {
        setShowTimeExpiredModal(true);
        return;
      }

      // Start countdown timer
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            setShowTimeExpiredModal(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset timer when not in info step or no hold
      setTimeRemaining(300);
      setShowTimeExpiredModal(false);
    }
  }, [step, holdAppointmentId, holdStartTime]);

  // Load busy schedules for the selected doctor
  const loadBusySchedules = useCallback(async (doctorId: number) => {
    try {
      setIsLoadingBusySchedules(true);
      const appointmentApi = getAppointmentManagement();
      const response = await appointmentApi.getBusySchedules(doctorId);
      const schedules = Array.isArray(response) ? response : [];
      setBusySchedules(schedules);

      // Convert busy schedules to booked slots
      // Exclude HOLD slots that belong to current user if they've selected a different slot
      const slots = new Set<string>();
      schedules.forEach((schedule) => {
        // If this is a HOLD slot and user has selected a different slot, exclude it from booked slots
        if (
          schedule.type === "HOLD" &&
          schedule.appointmentId === holdAppointmentId &&
          selectedDate &&
          selectedTime
        ) {
          // Check if this HOLD slot matches the currently selected slot
          const scheduleDate = schedule.startDateTime
            ? new Date(schedule.startDateTime)
            : null;
          if (scheduleDate) {
            const [year, month, day] = selectedDate.split("-").map(Number);
            const selectedDateObj = new Date(year, month - 1, day);
            const selectedHour = parseInt(selectedTime.split(":")[0]);

            // If this HOLD slot doesn't match the selected slot, skip it
            if (
              scheduleDate.toDateString() !== selectedDateObj.toDateString() ||
              scheduleDate.getHours() !== selectedHour
            ) {
              return; // Skip this HOLD - it's being replaced
            }
          }
        }

        if (schedule.startDateTime) {
          const startDate = new Date(schedule.startDateTime);
          const endDate = schedule.endDateTime
            ? new Date(schedule.endDateTime)
            : startDate;

          // Add all hours between start and end
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const day = currentDate.getDate();
            const hour = currentDate.getHours();
            const slotKey = `${year}-${month}-${day}-${hour}`;
            slots.add(slotKey);

            // Move to next hour
            currentDate.setHours(currentDate.getHours() + 1);
          }
        } else if (schedule.startDate && schedule.endDate) {
          // Handle date range (for leave requests)
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);

          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            // Mark all hours (8-17) for this date as busy
            for (let hour = 8; hour <= 17; hour++) {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth() + 1;
              const day = currentDate.getDate();
              const slotKey = `${year}-${month}-${day}-${hour}`;
              slots.add(slotKey);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });

      setBookedSlots(slots);
    } catch (error) {
      console.error("Error loading busy schedules:", error);
      setBusySchedules([]);
      setBookedSlots(new Set());
    } finally {
      setIsLoadingBusySchedules(false);
    }
  }, []);

  const handleClinicSelect = (clinicId: string) => {
    // Chặn nếu có pending appointment chưa được xác nhận deposit
    if (pendingAppointment && pendingAppointment.depositStatus === "PENDING") {
      alert("You have an appointment waiting for deposit confirmation. Please wait for admin confirmation before booking a new appointment.");
      return;
    }
    
    setSelectedClinic(clinicId);
    setStep("department");
    // Clear selections when changing clinic
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
    setHoldAppointmentId(null);
    // Keep default department (GENERAL_MEDICINE) - already selected by default
    // Auto-load doctors when clinic is selected and department is already set
    if (selectedDepartment) {
      setTimeout(() => {
        loadDoctors(selectedDepartment, Number(clinicId));
      }, 100);
    }
  };

  const handleDepartmentSelect = (deptValue: string) => {
    setSelectedDepartment(deptValue);
    setStep("doctor");
    // Clear hold when changing department
    setHoldAppointmentId(null);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedDoctor("");
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setStep("datetime");
    // Clear hold when changing doctor
    setHoldAppointmentId(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  // This function is no longer used - handleSlotSelection now handles it
  const handleDateTimeSelect = (date: string, time: string) => {
    // This is handled by handleSlotSelection now
    setSelectedDate(date);
    setSelectedTime(time);
    setStep("info");
  };

  const handleInfoSubmit = () => {
    // Validate required fields
    if (!patientInfo.age || patientInfo.age.trim() === "") {
      setErrorMessage("Please enter your age.");
      return;
    }

    const ageNum = parseInt(patientInfo.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 200) {
      setErrorMessage("Tuổi phải từ 1 đến 200.");
      return;
    }

    if (!patientInfo.gender || patientInfo.gender.trim() === "") {
      setErrorMessage("Please select your gender.");
      return;
    }

    if (!patientInfo.symptoms || patientInfo.symptoms.trim() === "") {
      setErrorMessage("Please enter symptoms / reason for visit.");
      return;
    }

    setErrorMessage("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!holdAppointmentId) {
      setErrorMessage(
        "Hold information not found. Please select a time slot again."
      );
      return;
    }

    if (
      !selectedDoctor ||
      !selectedDepartment ||
      !selectedDate ||
      !selectedTime
    ) {
      setErrorMessage("Please fill in all required information.");
      return;
    }

    // Validate required fields: age, gender, symptoms
    if (!patientInfo.age || patientInfo.age.trim() === "") {
      setErrorMessage("Please enter your age.");
      return;
    }

    const ageNum = parseInt(patientInfo.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 200) {
      setErrorMessage("Tuổi phải từ 1 đến 200.");
      return;
    }

    if (!patientInfo.gender || patientInfo.gender.trim() === "") {
      setErrorMessage("Please select your gender.");
      return;
    }

    if (!patientInfo.symptoms || patientInfo.symptoms.trim() === "") {
      setErrorMessage("Please enter symptoms / reason for visit.");
      return;
    }

    try {
      setIsCreatingAppointment(true);
      setErrorMessage("");

      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = getToken();

      // Prepare confirm request body with age, gender, symptoms (all required)
      const confirmBody: any = {
        age: ageNum,
        gender: patientInfo.gender.toUpperCase(), // MALE, FEMALE, OTHER
        symptoms: patientInfo.symptoms.trim(),
      };

      // Confirm the appointment with age, gender, symptoms in body
      // API confirm now supports updating these fields (all required)
      const response = await axios.put(
        `${baseURL}/api/appointments/${holdAppointmentId}/confirm`,
        confirmBody,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      // Handle response
      const appointment = response.data?.data || response.data;

      if (appointment && appointment.id) {
        setAppointmentId(appointment.id.toString());
        setAppointmentStatus(appointment.status || "PENDING");
        setHoldAppointmentId(null); // Clear hold appointment ID
        setStep("detail");
        setErrorMessage(""); // Clear any previous errors
        
        // Set deposit info
        setDepositInfo({
          depositAmount: appointment.depositAmount,
          depositStatus: appointment.depositStatus,
          depositTransferContent: appointment.depositTransferContent,
        });

        // Reload busy schedules to update display
        await loadBusySchedules(Number(selectedDoctor));

        // Start checking appointment status if still PENDING
        if (appointment.status === "PENDING") {
          startStatusPolling(appointment.id);
        }
      } else {
        throw new Error(
          "Failed to confirm appointment: No appointment ID returned"
        );
      }
    } catch (error: any) {
      console.error("Error confirming appointment:", error);

      // Parse error message from API response
      const errorData = error?.response?.data || error?.data || error;
      const apiMessage = errorData?.message || error?.message || "";

      // Check if appointment slot is not in HOLD status (expired)
      if (
        apiMessage.includes("not in HOLD status") ||
        apiMessage.includes("HOLD status") ||
        apiMessage.includes("expired") ||
        apiMessage.includes("hết hạn")
      ) {
        // Show time expired modal
        setShowTimeExpiredModal(true);
        setErrorMessage("");
      } else {
        // Other errors - show error message
        let errorMsg = "An error occurred while confirming the appointment. Please try again.";

        if (apiMessage) {
          errorMsg = apiMessage;
        }

        setErrorMessage(errorMsg);
      }

      // Reload busy schedules to check current status
      if (selectedDoctor) {
        await loadBusySchedules(Number(selectedDoctor));
      }
    } finally {
      setIsCreatingAppointment(false);
    }
  };

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

  // Poll appointment status to check if it's been confirmed, rejected, or expired
  const startStatusPolling = useCallback((appointmentId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const appointmentApi = getAppointmentManagement();
        const response = await appointmentApi.getMyAppointments();
        const appointments = Array.isArray(response) ? response : [];
        const currentAppointment = appointments.find(
          (apt: any) => apt.id === appointmentId
        );

        if (currentAppointment) {
          const status = currentAppointment.status;
          setAppointmentStatus(status || "PENDING");
          
          // Update deposit info
          const aptDepositStatus = (currentAppointment as any).depositStatus;
          setDepositInfo({
            depositAmount: (currentAppointment as any).depositAmount,
            depositStatus: aptDepositStatus,
            depositTransferContent: (currentAppointment as any).depositTransferContent,
          });
          
          // Update pending appointment state
          if (status === "PENDING" && (aptDepositStatus === "PENDING" || aptDepositStatus === null)) {
            setPendingAppointment(currentAppointment);
          } else {
            // Deposit confirmed or appointment confirmed/rejected - clear pending
            setPendingAppointment(null);
          }

          // Stop polling if appointment is no longer PENDING
          if (status !== "PENDING") {
            clearInterval(pollInterval);
            setIsCheckingStatus(false);
            setPendingAppointment(null); // Clear pending when appointment is no longer pending

            // Show appropriate modal based on status
            if (status === "REJECTED") {
              setShowRejectedModal(true);
            } else if (status === "EXPIRED") {
              setShowExpiredModal(true);
            } else if (status === "CONFIRMED") {
              // Appointment confirmed - no action needed, just update display
              setPendingAppointment(null); // Clear pending when confirmed
            }
          } else if (aptDepositStatus === "CONFIRMED") {
            // Deposit confirmed but appointment still pending - allow new booking
            setPendingAppointment(null);
          }
        } else {
          // Appointment not found - might have been deleted
          clearInterval(pollInterval);
          setIsCheckingStatus(false);
          setPendingAppointment(null);
        }
      } catch (error) {
        console.error("Error polling appointment status:", error);
        // Continue polling on error
      }
    }, 10000); // Check every 10 seconds

    // Stop polling after 2 hours (timeout period)
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsCheckingStatus(false);
    }, 2 * 60 * 60 * 1000); // 2 hours

    setIsCheckingStatus(true);
  }, []);

  // Check appointment status when entering detail step
  useEffect(() => {
    if (step === "detail" && appointmentId) {
      const checkStatus = async () => {
        try {
          const appointmentApi = getAppointmentManagement();
          const response = await appointmentApi.getMyAppointments();
          const appointments = Array.isArray(response) ? response : [];
          const currentAppointment = appointments.find(
            (apt: any) => apt.id?.toString() === appointmentId
          );

          if (currentAppointment) {
            const status = currentAppointment.status;
            setAppointmentStatus(status || "PENDING");
            
            // Update deposit info
            setDepositInfo({
              depositAmount: (currentAppointment as any).depositAmount,
              depositStatus: (currentAppointment as any).depositStatus,
              depositTransferContent: (currentAppointment as any).depositTransferContent,
            });
            
            // Update pending appointment state
            const aptDepositStatus = (currentAppointment as any).depositStatus;
            if (status === "PENDING" && (aptDepositStatus === "PENDING" || aptDepositStatus === null)) {
              setPendingAppointment(currentAppointment);
            } else {
              setPendingAppointment(null);
            }

            // Show appropriate modal if rejected or expired
            if (status === "REJECTED") {
              setShowRejectedModal(true);
              setPendingAppointment(null);
            } else if (status === "EXPIRED") {
              setShowExpiredModal(true);
              setPendingAppointment(null);
            } else if (status === "PENDING") {
              // Start polling if still pending
              startStatusPolling(Number(appointmentId));
            } else if (status === "CONFIRMED") {
              // Appointment confirmed - clear pending
              setPendingAppointment(null);
            }
          }
        } catch (error) {
          console.error("Error checking appointment status:", error);
        }
      };

      checkStatus();
    }
  }, [step, appointmentId, startStatusPolling]);
  
  // Start polling for pending appointment when it's found and we're on detail step
  useEffect(() => {
    if (pendingAppointment && pendingAppointment.id && step === "detail" && !isCheckingStatus) {
      startStatusPolling(pendingAppointment.id);
    }
  }, [pendingAppointment?.id, step, isCheckingStatus, startStatusPolling]);

  // Get busy schedule info for a specific slot
  // Exclude HOLD slots that belong to the current user (holdAppointmentId) if user has selected a different slot
  const getSlotBusyInfo = (
    date: Date,
    hour: number
  ): BusyScheduleResponse | null => {
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, 0, 0, 0);

    // Check if this slot matches the currently selected slot
    const isCurrentSelectedSlot =
      selectedDate &&
      selectedTime &&
      (() => {
        const [year, month, day] = selectedDate.split("-").map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        return (
          date.toDateString() === selectedDateObj.toDateString() &&
          parseInt(selectedTime.split(":")[0]) === hour
        );
      })();

    for (const schedule of busySchedules) {
      // If this is a HOLD slot and user has selected a different slot, skip it
      // (This is the user's own HOLD that they're replacing)
      if (
        schedule.type === "HOLD" &&
        schedule.appointmentId === holdAppointmentId &&
        !isCurrentSelectedSlot
      ) {
        continue; // Skip this HOLD slot - it's being replaced
      }

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

  // Check if a slot is booked
  const isSlotBooked = (date: Date, hour: number): boolean => {
    return getSlotBusyInfo(date, hour) !== null;
  };

  // Get slot type (APPOINTMENT or LEAVE)
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

  // Check if a slot is selected
  // This function checks if the current slot matches the selectedDate and selectedTime
  // When user selects a new slot, selectedDate/selectedTime are updated, so the old slot
  // will automatically return false (deselected) and only the new slot will return true
  const isSlotSelected = (date: Date, hour: number): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    return (
      date.toDateString() === selectedDateObj.toDateString() &&
      parseInt(selectedTime.split(":")[0]) === hour
    );
  };

  // Format date to YYYY-MM-DD without timezone issues
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle slot selection - Only set selected date/time, don't call API
  const handleSlotSelection = (date: Date, hour: number) => {
    if (isPastTime(date, hour)) {
      setErrorMessage("Không thể chọn lịch trong quá khứ.");
      return;
    }

    if (isSlotBooked(date, hour)) {
      const slotType = getSlotType(date, hour);
      if (slotType === "HOLD") {
        setErrorMessage(
          "This time slot is being held by someone else. Please select another time slot."
        );
      } else {
        setErrorMessage("Lịch này đã được đặt hoặc bác sĩ không có sẵn.");
      }
      return;
    }

    const selectedDateStr = formatDateToString(date);
    const selectedTimeStr = `${hour.toString().padStart(2, "0")}:00`;

    // Update selected date/time - this will automatically deselect the previous slot
    // because isSlotSelected checks against current selectedDate/selectedTime
    setSelectedDate(selectedDateStr);
    setSelectedTime(selectedTimeStr);
    setErrorMessage("");
  };

  // Handle Continue button - Create or update HOLD appointment
  const handleContinueDateTime = async () => {
    if (!selectedDate || !selectedTime) {
      setErrorMessage("Please select a time slot before continuing.");
      return;
    }

    if (!selectedDoctor || !selectedDepartment) {
      setErrorMessage("Please select a doctor first.");
      return;
    }

    try {
      setIsHoldingSlot(true);
      setErrorMessage("");

      const appointmentApi = getAppointmentManagement();

      // If there's already a held appointment, cancel it first
      if (holdAppointmentId) {
        try {
          await appointmentApi.updateAppointmentStatus(holdAppointmentId, {
            status: "CANCELLED",
          });
          // Clear the old hold appointment ID
          setHoldAppointmentId(null);

          // Reload busy schedules immediately after cancelling to remove old HOLD slot from UI
          if (selectedDoctor) {
            await loadBusySchedules(Number(selectedDoctor));
          }
        } catch (cancelError: any) {
          console.warn("Error cancelling previous hold:", cancelError);
          // Continue anyway - might have already expired
          // Still try to reload busy schedules
          if (selectedDoctor) {
            await loadBusySchedules(Number(selectedDoctor));
          }
        }
      }

      // Create new appointment to HOLD the new slot
      // Always use exact time (without adding 1 second) since we're cancelling the old hold first
      // Format datetime without timezone offset (LocalDateTime format)
      // Backend uses LocalDateTime which doesn't support timezone offset
      // Backend timezone is already set to GMT+7 (Asia/Ho_Chi_Minh)
      const appointmentTime = `${selectedDate}T${selectedTime}:00`;

      // Get selected doctor to extract clinicId
      const selectedDoctorObj = doctors.find(
        (d) => d.id?.toString() === selectedDoctor
      );
      if (!selectedDoctorObj) {
        setErrorMessage("Doctor information not found. Please select again.");
        setIsHoldingSlot(false);
        return;
      }

      // Extract clinicId from doctor object (could be clinic.id or clinicId)
      const clinicId =
        selectedDoctorObj.clinic?.id ||
        selectedDoctorObj.clinicId ||
        (selectedClinic ? Number(selectedClinic) : null);

      if (!clinicId) {
        setErrorMessage("Clinic information not found. Please select again.");
        setIsHoldingSlot(false);
        return;
      }

      const createRequest = {
        doctorId: Number(selectedDoctor),
        clinicId: clinicId,
        appointmentTime: appointmentTime,
        durationMinutes: 60,
      };

      const response = await appointmentApi.createAppointment(createRequest);
      const appointment = Array.isArray(response) ? response[0] : response;

      if (appointment && appointment.id) {
        setHoldAppointmentId(appointment.id);
        setHoldStartTime(new Date()); // Record when hold started
        setErrorMessage("");

        // Reload busy schedules again to show new HOLD slot
        await loadBusySchedules(Number(selectedDoctor));

        // Move to next step
        setStep("info");
      } else {
        throw new Error("Failed to hold slot: No appointment ID returned");
      }
    } catch (error: any) {
      console.error("Error holding slot:", error);
      let errorMsg = "Có lỗi xảy ra khi giữ chỗ. Vui lòng thử lại.";

      // Parse error message from API response
      // API response structure: { message, path, status, success, timestamp }
      const errorData = error?.response?.data || error?.data || error;

      if (errorData?.message) {
        const apiMessage = errorData.message;

        // Map common API messages to user-friendly Vietnamese messages
        if (
          apiMessage.includes("already an appointment") ||
          apiMessage.includes("overlaps with an existing appointment") ||
          apiMessage.includes("slot overlaps") ||
          apiMessage.toLowerCase().includes("appointment at this time")
        ) {
          errorMsg =
            "⏰ This time slot has been booked by someone else. Please select another time slot.";
        } else if (
          apiMessage.includes("doctor is on leave") ||
          apiMessage.includes("doctor is not available") ||
          apiMessage.includes("on leave")
        ) {
          errorMsg =
            "🏖️ Doctor is not available at this time (on leave). Please select another time slot.";
        } else if (
          apiMessage.includes("conflicting appointments") ||
          apiMessage.includes("conflict")
        ) {
          errorMsg =
            "⚠️ There is an appointment overlapping with this time. Please select another time slot.";
        } else if (
          apiMessage.includes("not work at") ||
          apiMessage.includes("does not work")
        ) {
          errorMsg =
            "🏥 Doctor does not work at this clinic. Please select again.";
        } else {
          // Use the API message directly, but translate common phrases
          errorMsg = apiMessage
            .replace(
              "There is already an appointment at this time",
              "Lịch này đã được đặt"
            )
            .replace(
              "The slot overlaps with an existing appointment",
              "Lịch trùng với lịch hẹn khác"
            );
        }
      } else if (errorData?.error) {
        errorMsg = errorData.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);

      // Reload busy schedules to show updated availability
      if (selectedDoctor) {
        await loadBusySchedules(Number(selectedDoctor));
      }
    } finally {
      setIsHoldingSlot(false);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = async () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setSelectedWeek(newWeek);
    setSelectedDate("");
    setSelectedTime("");
    // Reload busy schedules for the new week
    if (selectedDoctor) {
      await loadBusySchedules(Number(selectedDoctor));
    }
  };

  // Navigate to next week
  const goToNextWeek = async () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setSelectedWeek(newWeek);
    setSelectedDate("");
    setSelectedTime("");
    // Reload busy schedules for the new week
    if (selectedDoctor) {
      await loadBusySchedules(Number(selectedDoctor));
    }
  };

  const handleCloseLoginModal = () => {
    // Nếu chưa đăng nhập, đóng modal sẽ redirect về trang chủ
    if (!isAuthenticated()) {
      router.push("/");
    } else {
      setShowLoginModal(false);
    }
  };

  const handleCloseSignupModal = () => {
    setShowSignupModal(false);
    // Chuyển về login modal nếu chưa đăng nhập
    if (!isAuthenticated()) {
      setShowLoginModal(true);
    }
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  // Calculate week days and hours for the grid
  const weekStart = getWeekStart(selectedWeek);
  const weekDays = getWeekDays(weekStart);
  const hours = getHours(); // 8-17
  const dayNames = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ];

  // Hiển thị loading khi đang kiểm tra authentication
  if (isCheckingAuth) {
    return (
      <>
        <Topbar />
        <Navbar />
        <div className="container-fluid py-5">
          <div className="container">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <Navbar />

      {/* Login Modal - hiển thị khi chưa đăng nhập */}
      <LoginModal
        show={showLoginModal && !isAuthenticated()}
        onHide={handleCloseLoginModal}
        onSwitchToSignup={handleSwitchToSignup}
      />
      <SignupModal
        show={showSignupModal && !isAuthenticated()}
        onHide={handleCloseSignupModal}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <div className="container-fluid py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Pending Appointment Warning */}
              {pendingAppointment && pendingAppointment.depositStatus === "PENDING" && step !== "detail" && (
                <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
                  <h5 className="alert-heading">
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    You have an appointment waiting for deposit confirmation
                  </h5>
                  <p className="mb-2">
                    You have an appointment (ID: #{pendingAppointment.id}) waiting for admin to confirm the deposit.
                    Please wait for admin confirmation before booking a new appointment.
                  </p>
                  <p className="mb-0">
                    <strong>Deposit Amount:</strong>{" "}
                    {pendingAppointment.depositAmount
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(pendingAppointment.depositAmount)
                      : "100,000 VND"}
                  </p>
                  <hr />
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setAppointmentId(pendingAppointment.id?.toString() || "");
                        setAppointmentStatus(pendingAppointment.status || "PENDING");
                        setDepositInfo({
                          depositAmount: pendingAppointment.depositAmount,
                          depositStatus: pendingAppointment.depositStatus || "PENDING",
                          depositTransferContent: pendingAppointment.depositTransferContent,
                        });
                        setStep("detail");
                      }}
                    >
                      <i className="fa fa-eye me-1"></i>
                      Xem chi tiết lịch hẹn
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="card shadow-sm mb-4 border-0">
                <div className="card-body py-4">
                  <div className="d-flex justify-content-between align-items-center">
                    {[
                      { label: "Clinic", step: "clinic" },
                      { label: "Department", step: "department" },
                      { label: "Doctor", step: "doctor" },
                      { label: "Date & Time", step: "datetime" },
                      { label: "Information", step: "info" },
                      { label: "Confirm", step: "confirm" },
                    ].map((item, index) => {
                      const steps = [
                        "clinic",
                        "department",
                        "doctor",
                        "datetime",
                        "info",
                        "confirm",
                      ];
                      const currentStepIndex = steps.indexOf(step);
                      const isActive = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div
                          key={item.step}
                          className="text-center flex-fill position-relative"
                        >
                          {/* Connector line */}
                          {index < 5 && (
                            <div
                              className={`position-absolute top-0 start-50 translate-middle-x ${
                                isActive ? "bg-primary" : "bg-light"
                              }`}
                              style={{
                                width: "100%",
                                height: "3px",
                                zIndex: 0,
                                marginTop: "18px",
                                marginLeft: "50%",
                              }}
                            />
                          )}
                          <div
                            className="position-relative"
                            style={{ zIndex: 1 }}
                          >
                            <div
                              className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                                isCurrent
                                  ? "bg-primary text-white shadow-lg"
                                  : isActive
                                  ? "bg-success text-white"
                                  : "bg-light text-muted"
                              }`}
                              style={{
                                width: "45px",
                                height: "45px",
                                transition: "all 0.3s ease",
                                border: isCurrent
                                  ? "3px solid #0d6efd"
                                  : "none",
                              }}
                            >
                              {isActive && !isCurrent ? (
                                <i className="fa fa-check"></i>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div
                              className={`mt-2 small fw-medium ${
                                isActive ? "text-primary" : "text-muted"
                              }`}
                            >
                              {item.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 1: Select Clinic */}
              {step === "clinic" && (
                <div className="card shadow-lg border-0">
                  <div
                    className="card-header bg-gradient-primary text-white py-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <h3 className="mb-0">
                      <i className="fa fa-hospital-o me-2"></i>
                      Select Hospital / Clinic
                    </h3>
                    <small className="text-white-50">
                      Please select where you want to have your appointment
                    </small>
                  </div>
                  <div className="card-body p-4">
                    {pendingAppointment && pendingAppointment.depositStatus === "PENDING" ? (
                      <div className="alert alert-warning text-center py-4">
                        <i className="fa fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                        <h5>Cannot Book New Appointment</h5>
                        <p className="mb-2">
                          You have an appointment (ID: #{pendingAppointment.id}) waiting for admin to confirm the deposit.
                        </p>
                        <p className="mb-3">
                          Please wait for admin to confirm the deposit before booking a new appointment.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setAppointmentId(pendingAppointment.id?.toString() || "");
                            setAppointmentStatus(pendingAppointment.status || "PENDING");
                            setDepositInfo({
                              depositAmount: pendingAppointment.depositAmount,
                              depositStatus: pendingAppointment.depositStatus || "PENDING",
                              depositTransferContent: pendingAppointment.depositTransferContent,
                            });
                            setStep("detail");
                          }}
                        >
                          <i className="fa fa-eye me-2"></i>
                          View Pending Appointment Details
                        </button>
                      </div>
                    ) : (
                      <>
                    {clinics.length === 0 ? (
                      <div className="text-center py-5">
                        <div
                          className="spinner-border text-primary mb-3"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">
                          Đang tải danh sách cơ sở...
                        </p>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {clinics.map((clinic) => (
                          <div key={clinic.id} className="col-md-6 col-lg-4">
                            <button
                              className={`btn w-100 p-4 text-start h-100 border-2 ${
                                selectedClinic === clinic.id?.toString()
                                  ? "btn-primary border-primary shadow"
                                  : "btn-outline-primary border-light"
                              }`}
                              onClick={() =>
                                handleClinicSelect(clinic.id.toString())
                              }
                              style={{
                                transition: "all 0.3s ease",
                                borderRadius: "12px",
                              }}
                            >
                              <div className="d-flex align-items-center mb-3">
                                <i
                                  className={`fa fa-hospital-o fa-2x me-3 ${
                                    selectedClinic === clinic.id?.toString()
                                      ? "text-white"
                                      : "text-primary"
                                  }`}
                                ></i>
                                <h5
                                  className={`mb-0 ${
                                    selectedClinic === clinic.id?.toString()
                                      ? "text-white"
                                      : ""
                                  }`}
                                >
                                  {clinic.name}
                                </h5>
                              </div>
                              {clinic.address && (
                                <p
                                  className={`small mb-2 ${
                                    selectedClinic === clinic.id?.toString()
                                      ? "text-white-50"
                                      : "text-muted"
                                  }`}
                                >
                                  <i className="fa fa-map-marker me-1"></i>
                                  {clinic.address}
                                </p>
                              )}
                              {clinic.phone && (
                                <p
                                  className={`small mb-0 ${
                                    selectedClinic === clinic.id?.toString()
                                      ? "text-white-50"
                                      : "text-muted"
                                  }`}
                                >
                                  <i className="fa fa-phone me-1"></i>
                                  {clinic.phone}
                                </p>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Department */}
              {step === "department" && (
                <div className="card shadow-lg border-0">
                  <div
                    className="card-header bg-gradient-success text-white py-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    }}
                  >
                    <h3 className="mb-0">
                      <i className="fa fa-stethoscope me-2"></i>
                      Select Department
                    </h3>
                    <small className="text-white-50">
                      {clinics.find((c) => c.id?.toString() === selectedClinic)
                        ?.name || "All clinics"}
                    </small>
                  </div>
                  <div className="card-body p-4">
                    <button
                      className="btn btn-outline-secondary mb-4"
                      onClick={() => {
                        setStep("clinic");
                        setSelectedClinic("");
                        setSelectedDepartment("GENERAL_MEDICINE");
                        setSelectedDoctor("");
                        setDoctors([]);
                      }}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    <div className="row g-3">
                      {departmentList.map((dept) => {
                        const isSelected = selectedDepartment === dept.value;
                        return (
                          <div key={dept.value} className="col-md-6 col-lg-4">
                            <button
                              className={`btn w-100 p-4 text-start h-100 border-2 ${
                                isSelected
                                  ? `btn-${dept.color} border-${dept.color} shadow`
                                  : "btn-outline-light border-light"
                              }`}
                              onClick={() => handleDepartmentSelect(dept.value)}
                              style={{
                                transition: "all 0.3s ease",
                                borderRadius: "12px",
                                backgroundColor: isSelected
                                  ? undefined
                                  : "white",
                              }}
                            >
                              <div className="d-flex align-items-center mb-2">
                                <i
                                  className={`fa ${dept.icon} fa-2x me-3 ${
                                    isSelected
                                      ? "text-white"
                                      : `text-${dept.color}`
                                  }`}
                                ></i>
                                <h5
                                  className={`mb-0 ${
                                    isSelected ? "text-white" : ""
                                  }`}
                                >
                                  {dept.label}
                                </h5>
                              </div>
                              {isSelected && (
                                <small className="text-white-50">
                                  <i className="fa fa-check-circle me-1"></i>
                                  Đã chọn
                                </small>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Select Doctor */}
              {step === "doctor" && (
                <div className="card shadow-lg border-0">
                  <div
                    className="card-header bg-gradient-info text-white py-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <h3 className="mb-0">
                      <i className="fa fa-user-md me-2"></i>
                      Select Doctor
                    </h3>
                    <small className="text-white-50">
                      {
                        departmentList.find(
                          (d) => d.value === selectedDepartment
                        )?.label
                      }
                      {selectedClinic &&
                        ` - ${
                          clinics.find(
                            (c) => c.id?.toString() === selectedClinic
                          )?.name
                        }`}
                    </small>
                  </div>
                  <div className="card-body p-4">
                    <button
                      className="btn btn-outline-secondary mb-4"
                      onClick={() => {
                        setStep("department");
                        setSelectedDoctor("");
                        setDoctors([]);
                      }}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>

                    {doctors.length === 0 ? (
                      <div className="alert alert-info border-0 shadow-sm">
                        <div className="d-flex align-items-center mb-3">
                          <i className="fa fa-info-circle fa-2x me-3 text-info"></i>
                          <div>
                            <h5 className="mb-1">Không tìm thấy bác sĩ</h5>
                            <p className="mb-0 text-muted">
                              {selectedClinic
                                ? "Không có bác sĩ nào trong chuyên khoa này tại cơ sở đã chọn."
                                : "Không có bác sĩ nào trong chuyên khoa này."}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setStep("department")}
                          >
                            <i className="fa fa-arrow-left me-2"></i>
                            Select Different Department
                          </button>
                          {selectedClinic && (
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setSelectedClinic("");
                                setSelectedDoctor("");
                              }}
                            >
                              Xem tất cả cơ sở
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {doctors.map((doctor) => {
                          const isSelected =
                            selectedDoctor === doctor.id?.toString();
                          return (
                            <div key={doctor.id} className="col-md-6 col-lg-4">
                              <div
                                className={`card h-100 border-2 ${
                                  isSelected
                                    ? "border-primary shadow-lg"
                                    : "border-light shadow-sm"
                                }`}
                                style={{
                                  transition: "all 0.3s ease",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleDoctorSelect(doctor.id.toString())
                                }
                              >
                                <div className="card-body p-4">
                                  <div className="d-flex align-items-start mb-3">
                                    <div
                                      className={`rounded-circle bg-${
                                        isSelected ? "primary" : "light"
                                      } text-${
                                        isSelected ? "white" : "primary"
                                      } d-flex align-items-center justify-content-center`}
                                      style={{
                                        width: "60px",
                                        height: "60px",
                                        minWidth: "60px",
                                      }}
                                    >
                                      <i className="fa fa-user-md fa-2x"></i>
                                    </div>
                                    <div className="ms-3 flex-grow-1">
                                      <h5 className="mb-1">
                                        {doctor.user?.fullName || "Doctor"}
                                      </h5>
                                      <p className="text-muted small mb-2">
                                        <i
                                          className={`fa fa-stethoscope me-1 text-${
                                            isSelected ? "white-50" : "muted"
                                          }`}
                                        ></i>
                                        {doctor.departmentDisplayName ||
                                          doctor.department ||
                                          doctor.specialization}
                                      </p>
                                    </div>
                                  </div>
                                  {doctor.clinic && (
                                    <p className="small text-muted mb-2">
                                      <i className="fa fa-hospital-o me-1"></i>
                                      {doctor.clinic.name || doctor.clinicName}
                                    </p>
                                  )}
                                  {doctor.experienceYears && (
                                    <p className="small mb-3">
                                      <i className="fa fa-calendar me-1"></i>
                                      Kinh nghiệm:{" "}
                                      <strong>
                                        {doctor.experienceYears} năm
                                      </strong>
                                    </p>
                                  )}
                                  <button
                                    className={`btn w-100 ${
                                      isSelected
                                        ? "btn-primary"
                                        : "btn-outline-primary"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDoctorSelect(doctor.id.toString());
                                    }}
                                  >
                                    {isSelected ? (
                                      <>
                                        <i className="fa fa-check me-2"></i>Đã
                                        chọn
                                      </>
                                    ) : (
                                      <>
                                        <i className="fa fa-arrow-right me-2"></i>
                                        Select This Doctor
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Select Date & Time */}
              {step === "datetime" && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">3️⃣ Select Date & Time</h3>
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={() => setStep("doctor")}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>

                    {/* Week Navigation */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="bg-light rounded p-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={goToPreviousWeek}
                              disabled={isLoadingBusySchedules}
                            >
                              <i className="fa fa-chevron-left me-2"></i>Tuần
                              trước
                            </button>
                            <h6 className="mb-0">
                              {isLoadingBusySchedules && (
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
                              disabled={isLoadingBusySchedules}
                            >
                              Next Week
                              <i className="fa fa-chevron-right ms-2"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="alert alert-danger" role="alert">
                        <i className="fa fa-exclamation-circle me-2"></i>
                        {errorMessage}
                      </div>
                    )}

                    {/* Success Message - Slot held */}
                    {holdAppointmentId && selectedDate && selectedTime && (
                      <div
                        className="alert alert-info d-flex align-items-center"
                        role="alert"
                      >
                        <i className="fa fa-clock me-2"></i>
                        <div>
                          <strong>Slot reserved successfully!</strong> Your time slot
                          has been held for 5 minutes. Please complete the information
                          and confirm before it expires.
                          <br />
                          <small className="text-muted">
                            Selected time:{" "}
                            {(() => {
                              const [year, month, day] = selectedDate
                                .split("-")
                                .map(Number);
                              return new Date(
                                year,
                                month - 1,
                                day
                              ).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                day: "numeric",
                                month: "numeric",
                                year: "numeric",
                              });
                            })()}{" "}
                            lúc {selectedTime}
                          </small>
                        </div>
                      </div>
                    )}

                    {/* Loading indicator when holding slot */}
                    {isHoldingSlot && (
                      <div
                        className="alert alert-warning d-flex align-items-center"
                        role="alert"
                      >
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        <span>Đang giữ chỗ...</span>
                      </div>
                    )}

                    {/* Schedule Table */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="bg-light rounded p-4">
                          <style jsx>{`
                            @keyframes pulse {
                              0%,
                              100% {
                                opacity: 1;
                              }
                              50% {
                                opacity: 0.7;
                              }
                            }
                            .pulse-animation {
                              animation: pulse 2s infinite;
                            }
                          `}</style>
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
                                    <i className="fa fa-clock me-1"></i>Time
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
                                      <div
                                        style={{
                                          fontWeight: "bold",
                                          marginBottom: "4px",
                                        }}
                                      >
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
                                      const isBooked = isSlotBooked(date, hour);
                                      const isSelected = isSlotSelected(
                                        date,
                                        hour
                                      );
                                      const isPast = isPastTime(date, hour);
                                      const isDisabled = isPast || isBooked;
                                      const slotType = getSlotType(date, hour);
                                      const busyInfo = getSlotBusyInfo(
                                        date,
                                        hour
                                      );

                                      // Determine button class and color based on slot type
                                      let btnClass = "btn btn-sm";
                                      let btnStyle: React.CSSProperties = {
                                        width: "100%",
                                        minHeight: "45px",
                                        position: "relative",
                                      };

                                      if (isSelected) {
                                        btnClass += " btn-primary";
                                      } else if (isBooked) {
                                        if (slotType === "APPOINTMENT") {
                                          btnClass += " btn-danger";
                                          btnStyle.background =
                                            "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";
                                          btnStyle.color = "white";
                                        } else if (slotType === "HOLD") {
                                          btnClass +=
                                            " btn-info pulse-animation";
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
                                        btnClass += " btn-outline-primary";
                                      }

                                      // Build tooltip text
                                      let tooltipText = "";
                                      if (isPast) {
                                        tooltipText = "Lịch đã qua";
                                      } else if (isBooked && busyInfo) {
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

                                        if (slotType === "APPOINTMENT") {
                                          tooltipText = "📅 Appointment\n";
                                        } else if (slotType === "HOLD") {
                                          tooltipText =
                                            "⏳ Holding slot (5 minutes)\n";
                                        } else {
                                          tooltipText = "🏖️ On Leave\n";
                                        }

                                        if (startTime && endTime) {
                                          tooltipText += `Time: ${startTime} - ${endTime}\n`;
                                        }
                                        if (busyInfo.reason) {
                                          tooltipText += `Reason: ${busyInfo.reason}`;
                                        }
                                      } else {
                                        tooltipText = `Select ${
                                          dayNames[dayIndex]
                                        } ${date.toLocaleDateString(
                                          "en-US"
                                        )} at ${hour}:00`;
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
                                            onClick={() =>
                                              handleSlotSelection(date, hour)
                                            }
                                            disabled={isDisabled}
                                            title={tooltipText}
                                            data-bs-toggle={
                                              isBooked ? "tooltip" : undefined
                                            }
                                            data-bs-placement="top"
                                            data-bs-html="true"
                                            onMouseEnter={(e) => {
                                              if (isBooked && busyInfo) {
                                                // Show custom tooltip on hover
                                                const tooltip =
                                                  document.createElement("div");
                                                tooltip.className =
                                                  "custom-slot-tooltip";
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

                                                const startTime =
                                                  busyInfo.startDateTime
                                                    ? new Date(
                                                        busyInfo.startDateTime
                                                      ).toLocaleTimeString(
                                                        "vi-VN",
                                                        {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                        }
                                                      )
                                                    : busyInfo.startDate;
                                                const endTime =
                                                  busyInfo.endDateTime
                                                    ? new Date(
                                                        busyInfo.endDateTime
                                                      ).toLocaleTimeString(
                                                        "vi-VN",
                                                        {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                        }
                                                      )
                                                    : busyInfo.endDate;

                                                let typeLabel = "";
                                                if (
                                                  slotType === "APPOINTMENT"
                                                ) {
                                                  typeLabel = "📅 Cuộc hẹn";
                                                } else if (
                                                  slotType === "HOLD"
                                                ) {
                                                  typeLabel =
                                                    "⏳ Đang giữ chỗ (5 phút)";
                                                } else {
                                                  typeLabel = "🏖️ Nghỉ phép";
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

                                                document.body.appendChild(
                                                  tooltip
                                                );
                                                const rect =
                                                  e.currentTarget.getBoundingClientRect();
                                                tooltip.style.left = `${
                                                  rect.left +
                                                  rect.width / 2 -
                                                  tooltip.offsetWidth / 2
                                                }px`;
                                                tooltip.style.top = `${
                                                  rect.top -
                                                  tooltip.offsetHeight -
                                                  8
                                                }px`;

                                                e.currentTarget.setAttribute(
                                                  "data-tooltip",
                                                  "true"
                                                );
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              const tooltip =
                                                document.querySelector(
                                                  ".custom-slot-tooltip"
                                                );
                                              if (tooltip) {
                                                tooltip.remove();
                                              }
                                            }}
                                          >
                                            {isBooked ? (
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
                                                      style={{
                                                        fontSize: "1rem",
                                                      }}
                                                    ></i>
                                                    <span
                                                      style={{
                                                        fontSize: "0.7rem",
                                                        fontWeight: "bold",
                                                      }}
                                                    >
                                                      Hẹn
                                                    </span>
                                                  </>
                                                ) : slotType === "HOLD" ? (
                                                  <>
                                                    <i
                                                      className="fa fa-clock"
                                                      style={{
                                                        fontSize: "1rem",
                                                      }}
                                                    ></i>
                                                    <span
                                                      style={{
                                                        fontSize: "0.7rem",
                                                        fontWeight: "bold",
                                                      }}
                                                    >
                                                      Giữ
                                                    </span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <i
                                                      className="fa fa-umbrella-beach"
                                                      style={{
                                                        fontSize: "1rem",
                                                      }}
                                                    ></i>
                                                    <span
                                                      style={{
                                                        fontSize: "0.7rem",
                                                        fontWeight: "bold",
                                                      }}
                                                    >
                                                      Nghỉ
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            ) : isSelected ? (
                                              <>
                                                <i className="fa fa-check-circle"></i>
                                                <div
                                                  style={{
                                                    fontSize: "0.7rem",
                                                    marginTop: "2px",
                                                  }}
                                                >
                                                  Selected
                                                </div>
                                              </>
                                            ) : (
                                              <span
                                                style={{ fontSize: "0.85rem" }}
                                              >
                                                Available
                                              </span>
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
                          <div className="mt-3 p-3 bg-white rounded border">
                            <div className="row g-3">
                              <div className="col-12">
                                <h6 className="mb-3 fw-bold">
                                  <i className="fa fa-info-circle me-2 text-primary"></i>
                                  Chú thích:
                                </h6>
                              </div>
                              <div className="col-md-6 col-lg-3">
                                <div className="d-flex align-items-center gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    disabled
                                    style={{
                                      minWidth: "70px",
                                      minHeight: "35px",
                                    }}
                                  >
                                    <span style={{ fontSize: "0.8rem" }}>
                                      Trống
                                    </span>
                                  </button>
                                  <span style={{ fontSize: "0.85rem" }}>
                                    Available
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-6 col-lg-3">
                                <div className="d-flex align-items-center gap-2">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    disabled
                                    style={{
                                      minWidth: "70px",
                                      minHeight: "35px",
                                    }}
                                  >
                                    <i className="fa fa-check-circle"></i>
                                  </button>
                                  <span style={{ fontSize: "0.85rem" }}>
                                    Đã chọn
                                  </span>
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
                                    📅 Cuộc hẹn
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
                                  <span style={{ fontSize: "0.85rem" }}>
                                    ⏳ Holding Slot
                                  </span>
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
                                  <span style={{ fontSize: "0.85rem" }}>
                                    🏖️ Nghỉ phép
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-6 col-lg-3">
                                <div className="d-flex align-items-center gap-2">
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    disabled
                                    style={{
                                      minWidth: "70px",
                                      minHeight: "35px",
                                      opacity: 0.5,
                                    }}
                                  ></button>
                                  <span style={{ fontSize: "0.85rem" }}>
                                    Past
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-top">
                              <small className="text-muted">
                                <i className="fa fa-lightbulb me-1 text-warning"></i>
                                <strong>Tip:</strong> Hover over busy slots
                                to see detailed information
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selected Date and Time Display */}
                    {selectedDate &&
                      selectedTime &&
                      (() => {
                        // Parse selectedDate correctly (YYYY-MM-DD format)
                        const [year, month, day] = selectedDate
                          .split("-")
                          .map(Number);
                        const selectedDateObj = new Date(year, month - 1, day);
                        return (
                          <div className="row mb-3">
                            <div className="col-12">
                              <div className="alert alert-info mb-0">
                                <strong>Lịch đã chọn:</strong>{" "}
                                {selectedDateObj.toLocaleDateString("vi-VN", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                })}{" "}
                                at {selectedTime}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {/* Continue Button - Always visible */}
                    <div className="mt-4">
                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={handleContinueDateTime}
                        disabled={
                          isHoldingSlot || !selectedDate || !selectedTime
                        }
                      >
                        {isHoldingSlot ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Đang giữ chỗ...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-arrow-right me-2"></i>
                            Continue
                          </>
                        )}
                      </button>
                      {!selectedDate || !selectedTime ? (
                        <small className="text-muted d-block mt-2 text-center">
                          <i className="fa fa-info-circle me-1"></i>
                          Please select a time slot before continuing
                        </small>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Patient Info */}
              {step === "info" && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">4️⃣ Patient Information</h3>
                    {holdAppointmentId && timeRemaining > 0 && (
                      <div className="d-flex align-items-center">
                        <i className="fa fa-clock me-2"></i>
                        <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                          {Math.floor(timeRemaining / 60)}:
                          {(timeRemaining % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <button
                      className="btn btn-outline-secondary mb-3"
                      onClick={async () => {
                        setStep("datetime");
                        setErrorMessage("");
                        // Clear selected slot when back to datetime (user can select new slot)
                        // Don't clear holdAppointmentId - will be handled when selecting new slot
                        // Reload busy schedules when back to datetime step
                        if (selectedDoctor) {
                          await loadBusySchedules(Number(selectedDoctor));
                        }
                      }}
                    >
                      <i className="fa fa-arrow-left me-2"></i>Back
                    </button>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={patientInfo.name}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={patientInfo.email}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={patientInfo.phone}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Age *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={patientInfo.age}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              age: e.target.value,
                            })
                          }
                          min="1"
                          max="200"
                          required
                        />
                        {patientInfo.age &&
                          (parseInt(patientInfo.age) < 1 ||
                            parseInt(patientInfo.age) > 200) && (
                            <div className="text-danger small mt-1">
                              Age must be between 1 and 200
                            </div>
                          )}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Gender *</label>
                        <select
                          className="form-select"
                          value={patientInfo.gender}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              gender: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Symptoms / Reason for visit *
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={patientInfo.symptoms}
                          onChange={(e) =>
                            setPatientInfo({
                              ...patientInfo,
                              symptoms: e.target.value,
                            })
                          }
                          placeholder="Describe your symptoms..."
                          required
                        ></textarea>
                      </div>
                    </div>
                    {errorMessage && (
                      <div className="alert alert-danger mt-3" role="alert">
                        <i className="fa fa-exclamation-circle me-2"></i>
                        {errorMessage}
                      </div>
                    )}
                    <div className="mt-4">
                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={handleInfoSubmit}
                        disabled={Boolean(
                          !patientInfo.name ||
                            !patientInfo.email ||
                            !patientInfo.phone ||
                            !patientInfo.age ||
                            !patientInfo.gender ||
                            !patientInfo.symptoms ||
                            (patientInfo.age &&
                              (parseInt(patientInfo.age) < 1 ||
                                parseInt(patientInfo.age) > 200))
                        )}
                      >
                        Continue to Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Expired Modal */}
              {showTimeExpiredModal && (
                <div
                  className="modal show d-block"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                  tabIndex={-1}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowTimeExpiredModal(false);
                    }
                  }}
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-content">
                      <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">
                          <i className="fa fa-exclamation-triangle me-2"></i>
                          Hết thời gian đặt lịch
                        </h5>
                      </div>
                      <div className="modal-body text-center">
                        <i className="fa fa-clock fa-4x text-danger mb-3"></i>
                        <h5>Hold time expired (5 minutes)</h5>
                        <p className="text-muted">
                          Your time slot has expired. Please select a new time slot.
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-primary w-100"
                          onClick={async () => {
                            // Cancel the expired appointment
                            if (holdAppointmentId) {
                              try {
                                const appointmentApi =
                                  getAppointmentManagement();
                                await appointmentApi.updateAppointmentStatus(
                                  holdAppointmentId,
                                  {
                                    status: "CANCELLED",
                                  }
                                );
                              } catch (error) {
                                console.warn(
                                  "Error cancelling expired appointment:",
                                  error
                                );
                              }
                            }

                            // Reset states
                            setHoldAppointmentId(null);
                            setHoldStartTime(null);
                            setSelectedDate("");
                            setSelectedTime("");
                            setShowTimeExpiredModal(false);
                            setTimeRemaining(300);

                            // Go back to datetime step
                            setStep("datetime");

                            // Reload busy schedules
                            if (selectedDoctor) {
                              await loadBusySchedules(Number(selectedDoctor));
                            }
                          }}
                        >
                          <i className="fa fa-calendar me-2"></i>
                          Select New Time Slot
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Confirm */}
              {step === "confirm" && (
                <div className="card shadow">
                  <div className="card-header bg-success text-white">
                    <h3 className="mb-0">5️⃣ Confirm Appointment</h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <h5>Appointment Information</h5>
                      <p>
                        <strong>Department:</strong>{" "}
                        {
                          departmentList.find(
                            (d) => d.value === selectedDepartment
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Doctor:</strong>{" "}
                        {
                          doctors.find(
                            (d) => d.id?.toString() === selectedDoctor
                          )?.user?.fullName
                        }
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {(() => {
                          const [year, month, day] = selectedDate
                            .split("-")
                            .map(Number);
                          return new Date(
                            year,
                            month - 1,
                            day
                          ).toLocaleDateString("vi-VN");
                        })()}
                      </p>
                      <p>
                        <strong>Time:</strong> {selectedTime}
                      </p>
                      <p>
                        <strong>Patient:</strong> {patientInfo.name}
                      </p>
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-success btn-lg"
                        onClick={handleConfirm}
                        disabled={isCreatingAppointment}
                      >
                        {isCreatingAppointment ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Booking appointment...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-check me-2"></i>Confirm
                            Appointment
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setStep("info");
                          setErrorMessage("");
                        }}
                        disabled={isCreatingAppointment}
                      >
                        Back
                      </button>
                    </div>
                    {errorMessage && (
                      <div className="alert alert-danger mt-3" role="alert">
                        <i className="fa fa-exclamation-circle me-2"></i>
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Appointment Detail */}
              {step === "detail" && (
                <div className="card shadow">
                  <div
                    className={`card-header text-white ${
                      appointmentStatus === "CONFIRMED"
                        ? "bg-success"
                        : appointmentStatus === "PENDING"
                        ? "bg-warning"
                        : appointmentStatus === "REJECTED" ||
                          appointmentStatus === "EXPIRED"
                        ? "bg-danger"
                        : "bg-info"
                    }`}
                  >
                    <h3 className="mb-0">
                      {appointmentStatus === "CONFIRMED" &&
                        "✅ Appointment Confirmed"}
                      {appointmentStatus === "PENDING" &&
                        "⏳ Waiting for Doctor Confirmation"}
                      {appointmentStatus === "REJECTED" &&
                        "❌ Appointment Rejected"}
                      {appointmentStatus === "EXPIRED" &&
                        "⏰ Appointment Expired"}
                      {![
                        "CONFIRMED",
                        "PENDING",
                        "REJECTED",
                        "EXPIRED",
                      ].includes(appointmentStatus) && "📅 Appointment Information"}
                    </h3>
                  </div>
                  <div className="card-body">
                    {appointmentStatus === "CONFIRMED" && (
                      <div className="alert alert-success">
                        <h5>
                          <i className="fa fa-check-circle me-2"></i>Appointment
                          ID: {appointmentId}
                        </h5>
                        <p className="mb-0">
                          Your appointment has been confirmed by the doctor!
                        </p>
                        <p className="mt-2 mb-0">
                          <strong>Please arrive on time.</strong>
                        </p>
                      </div>
                    )}

                    {appointmentStatus === "PENDING" && (
                      <>
                        <div className="alert alert-warning">
                          <h5>
                            <i className="fa fa-clock me-2"></i>Appointment ID:{" "}
                            {appointmentId}
                          </h5>
                          <p className="mb-2">
                            Your appointment is waiting for deposit payment and doctor confirmation.
                          </p>
                          <p className="mb-0">
                            <small>
                              <i className="fa fa-info-circle me-1"></i>
                              Please transfer the deposit according to the information below. 
                              After admin confirms receipt of payment, the doctor will confirm the appointment.
                              {isCheckingStatus && (
                                <span className="ms-2">
                                  <span
                                    className="spinner-border spinner-border-sm me-1"
                                    role="status"
                                  ></span>
                                  Checking status...
                                </span>
                              )}
                            </small>
                          </p>
                        </div>
                        
                        {/* Deposit Payment Section */}
                        {depositInfo.depositStatus === "PENDING" && (
                          <div className="card border-primary mt-3">
                            <div className="card-header bg-primary text-white">
                              <h5 className="mb-0">
                                <i className="fa fa-credit-card me-2"></i>
                                Deposit Payment
                              </h5>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-6">
                                  <h6 className="text-primary mb-3">
                                    <i className="fa fa-qrcode me-2"></i>
                                    Scan QR Code to Transfer
                                  </h6>
                                  <div className="text-center mb-3">
                                    <img
                                      src="/img/744685da-c6dd-454f-a4e3-0925e888f278.jpg"
                                      alt="QR Code"
                                      className="img-fluid"
                                      style={{ maxWidth: "300px", border: "2px solid #007bff", borderRadius: "8px" }}
                                    />
                                  </div>
                                  <div className="alert alert-info">
                                    <strong>Deposit Amount:</strong>{" "}
                                    {depositInfo.depositAmount
                                      ? new Intl.NumberFormat("vi-VN", {
                                          style: "currency",
                                          currency: "VND",
                                        }).format(depositInfo.depositAmount)
                                      : "100,000 VND"}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <h6 className="text-primary mb-3">
                                    <i className="fa fa-info-circle me-2"></i>
                                    Transfer Information
                                  </h6>
                                  <div className="bg-light p-3 rounded">
                                    <p className="mb-2">
                                      <strong>Bank:</strong> TECHCOMBANK
                                    </p>
                                    <p className="mb-2">
                                      <strong>Account Holder:</strong> HOANG VIET AN
                                    </p>
                                    <p className="mb-2">
                                      <strong>Account Number:</strong> 2405 0599 999
                                    </p>
                                    <p className="mb-2">
                                      <strong>Amount:</strong>{" "}
                                      {depositInfo.depositAmount
                                        ? new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                          }).format(depositInfo.depositAmount)
                                        : "100,000 VND"}
                                    </p>
                                    <p className="mb-0">
                                      <strong>Transfer Content:</strong>
                                    </p>
                                    <div className="alert alert-warning mb-0 mt-2">
                                      <code style={{ fontSize: "0.9rem", wordBreak: "break-word" }}>
                                        {depositInfo.depositTransferContent ||
                                          "Patient Name,Phone Number,Doctor Name,Appointment Date,Department"}
                                      </code>
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                      <i className="fa fa-exclamation-triangle me-1"></i>
                                      Please transfer with the exact content so admin can confirm quickly.
                                    </small>
                                  </div>
                                </div>
                              </div>
                              <div className="alert alert-warning mt-3 mb-0">
                                <i className="fa fa-clock me-2"></i>
                                <strong>Note:</strong> After transferring, please wait for admin confirmation. 
                                The appointment will be confirmed by the doctor after admin confirms receipt of the deposit.
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {depositInfo.depositStatus === "CONFIRMED" && (
                          <div className="alert alert-success mt-3">
                            <i className="fa fa-check-circle me-2"></i>
                            <strong>Deposit confirmed!</strong> Waiting for doctor to confirm the appointment.
                          </div>
                        )}
                      </>
                    )}

                    {appointmentStatus === "REJECTED" && (
                      <div className="alert alert-danger">
                        <h5>
                          <i className="fa fa-times-circle me-2"></i>Appointment
                          ID: {appointmentId}
                        </h5>
                        <p className="mb-2">
                          Sorry, your appointment has been rejected.
                        </p>
                        <p className="mb-0">
                          <strong>Reason:</strong> Doctor is not available at this time. Please select another time slot or doctor.
                        </p>
                      </div>
                    )}

                    {appointmentStatus === "EXPIRED" && (
                      <div className="alert alert-danger">
                        <h5>
                          <i className="fa fa-clock me-2"></i>Appointment ID:{" "}
                          {appointmentId}
                        </h5>
                        <p className="mb-2">Lịch hẹn của bạn đã hết hạn.</p>
                        <p className="mb-0">
                          <strong>Lý do:</strong> Bác sĩ không phản hồi trong
                          thời gian quy định. Vui lòng chọn lịch khác hoặc bác
                          sĩ khác.
                        </p>
                      </div>
                    )}

                    <div className="mt-3">
                      <h6>Appointment Information:</h6>
                      <ul className="list-unstyled">
                        <li>
                          <strong>Department:</strong>{" "}
                          {
                            departmentList.find(
                              (d) => d.value === selectedDepartment
                            )?.label
                          }
                        </li>
                        <li>
                          <strong>Doctor:</strong>{" "}
                          {
                            doctors.find(
                              (d) => d.id?.toString() === selectedDoctor
                            )?.user?.fullName
                          }
                        </li>
                        <li>
                          <strong>Date:</strong>{" "}
                          {(() => {
                            const [year, month, day] = selectedDate
                              .split("-")
                              .map(Number);
                            return new Date(
                              year,
                              month - 1,
                              day
                            ).toLocaleDateString("vi-VN");
                          })()}
                        </li>
                        <li>
                          <strong>Time:</strong> {selectedTime}
                        </li>
                        <li>
                          <strong>Patient:</strong> {patientInfo.name}
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 d-grid gap-2">
                      {(appointmentStatus === "REJECTED" ||
                        appointmentStatus === "EXPIRED") && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            // Reset and go back to department selection
                            setStep("department");
                            setSelectedDepartment("");
                            setSelectedDoctor("");
                            setSelectedDate("");
                            setSelectedTime("");
                            setAppointmentId("");
                            setAppointmentStatus("PENDING");
                            setShowRejectedModal(false);
                            setShowExpiredModal(false);
                          }}
                        >
                          <i className="fa fa-calendar me-2"></i>
                          Book New Appointment
                        </button>
                      )}
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => router.push("/dashboard")}
                      >
                        <i className="fa fa-home me-2"></i>
                          Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected Modal */}
              {showRejectedModal && (
                <div
                  className="modal show d-block"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                  tabIndex={-1}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowRejectedModal(false);
                    }
                  }}
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-content">
                      <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">
                          <i className="fa fa-times-circle me-2"></i>
                          Lịch hẹn đã bị từ chối
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={() => setShowRejectedModal(false)}
                        ></button>
                      </div>
                      <div className="modal-body text-center">
                        <i className="fa fa-exclamation-triangle fa-4x text-danger mb-3"></i>
                        <h5>Your appointment has been rejected</h5>
                        <p className="text-muted">
                          Doctor is not available at this time. Please select
                          another time slot or doctor.
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => {
                            setShowRejectedModal(false);
                            setStep("department");
                            setSelectedDepartment("");
                            setSelectedDoctor("");
                            setSelectedDate("");
                            setSelectedTime("");
                            setAppointmentId("");
                            setAppointmentStatus("PENDING");
                          }}
                        >
                          <i className="fa fa-calendar me-2"></i>
                          Book New Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expired Modal */}
              {showExpiredModal && (
                <div
                  className="modal show d-block"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                  tabIndex={-1}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowExpiredModal(false);
                    }
                  }}
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-content">
                      <div className="modal-header bg-warning text-dark">
                        <h5 className="modal-title">
                          <i className="fa fa-clock me-2"></i>
                          Appointment Expired
                        </h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowExpiredModal(false)}
                        ></button>
                      </div>
                      <div className="modal-body text-center">
                        <i className="fa fa-hourglass-end fa-4x text-warning mb-3"></i>
                        <h5>Lịch hẹn của bạn đã hết hạn</h5>
                        <p className="text-muted">
                          Bác sĩ không phản hồi trong thời gian quy định (2
                          giờ). Vui lòng chọn lịch khác hoặc bác sĩ khác.
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => {
                            setShowExpiredModal(false);
                            setStep("department");
                            setSelectedDepartment("");
                            setSelectedDoctor("");
                            setSelectedDate("");
                            setSelectedTime("");
                            setAppointmentId("");
                            setAppointmentStatus("PENDING");
                          }}
                        >
                          <i className="fa fa-calendar me-2"></i>
                          Book New Appointment
                        </button>
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
