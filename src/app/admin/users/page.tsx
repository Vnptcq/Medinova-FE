"use client";

import { useState, useEffect } from "react";
import { getUserManagement } from "@/generated/api/endpoints/user-management/user-management";
import { toast } from "@/utils/toast";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<Record<number, boolean>>(
    {}
  );

  const availableRoles = [
    { value: "PATIENT", label: "PATIENT" },
    { value: "DOCTOR", label: "DOCTOR" },
    { value: "ADMIN", label: "ADMIN" },
    { value: "DRIVER", label: "DRIVER" },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userApi = getUserManagement();
      const response = await userApi.getAllUsers();

      // API function already extracts response.data, so response is the data itself
      const usersData =
        (response as any)?.data || (response as any)?.content || response;
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (
    userId: number,
    newRole: string,
    currentRole: string
  ) => {
    // Nếu role không thay đổi, không cần update
    if (newRole === currentRole) {
      return;
    }

    // Update UI ngay lập tức (optimistic update) để dropdown hiển thị giá trị mới
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    // Confirm trước khi update
    if (
      !confirm(
        `Are you sure you want to change role from ${currentRole} to ${newRole}?`
      )
    ) {
      // User cancel - reset về giá trị cũ ngay lập tức
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: currentRole } : user
        )
      );
      return;
    }

    try {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));
      const userApi = getUserManagement();

      // Prepare payload matching UpdateUserRoleRequest
      const payload: { role: string; clinicId?: number } = { role: newRole };

      console.log("🔄 Updating role:", {
        userId,
        newRole,
        currentRole,
        payload,
      });
      console.log(
        "🔄 API endpoint will be: PUT /api/users/" + userId + "/role"
      );
      console.log("🔄 Payload:", JSON.stringify(payload));

      // If changing to DOCTOR, you might want to allow clinic selection
      // For now, backend will use first clinic if clinicId is not provided
      // TODO: Add clinic selection UI if needed

      console.log("🔄 Calling API...");
      const response = await userApi.updateUserRole(userId, payload);
      console.log("🔄 API call completed");
      console.log("✅ Update role response:", response);
      console.log("✅ Response type:", typeof response);
      console.log(
        "✅ Response keys:",
        response ? Object.keys(response) : "null"
      );

      // Backend trả về User object trực tiếp (không có .data wrapper)
      // Vì api() function đã extract response.data rồi
      const updatedUser = response;
      const updatedRole = updatedUser?.role || newRole;

      console.log("✅ Updated user from response:", updatedUser);
      console.log("✅ Updated role:", updatedRole);
      console.log(
        "✅ Full response object:",
        JSON.stringify(response, null, 2)
      );

      // Update state với response từ backend để đảm bảo đúng giá trị
      setUsers((prevUsers) => {
        const newUsers = prevUsers.map((user) =>
          user.id === userId
            ? { ...user, ...updatedUser, role: updatedRole } // Merge toàn bộ updatedUser để đảm bảo có tất cả fields
            : user
        );
        const updatedUserInState = newUsers.find((u) => u.id === userId);
        console.log("✅ State after update:", updatedUserInState);
        console.log("✅ Role in state:", updatedUserInState?.role);
        return newUsers;
      });

      toast.success("Role updated successfully!");

      // KHÔNG reload để tránh reset về giá trị cũ
      // State đã được update với response từ API rồi
    } catch (error: any) {
      console.error("Error updating user role:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data,
        responseStatus: error?.response?.status,
        stack: error?.stack,
      });

      // Reset về giá trị cũ ngay lập tức khi có lỗi
      console.log("❌ Error occurred, resetting to old role:", currentRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: currentRole } : user
        )
      );

      // Extract detailed error message from backend
      let errorMessage =
        "Error updating role. Please try again!";

      if (error?.response?.data) {
        // Backend error response
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          // Try to extract from validation errors
          const validationErrors =
            errorData.errors || errorData.validationErrors;
          if (validationErrors && Array.isArray(validationErrors)) {
            errorMessage = validationErrors
              .map((e: any) => e.message || e.defaultMessage)
              .join(", ");
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Check if it's a validation error (zod or backend)
      if (
        error?.message?.includes("regex") ||
        error?.message?.includes("pattern")
      ) {
        errorMessage = `Role "${newRole}" is invalid. Please select PATIENT, DOCTOR, ADMIN, or DRIVER.`;
      }

      toast.error(errorMessage, { duration: 7000 });
    } finally {
      setUpdatingRoles((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  return (
    <div>
      <h2 className="mb-4">Users</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.fullName || user.name || "N/A"}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${
                            updatingRoles[user.id!] ? "opacity-50" : ""
                          } ${user.role === "ADMIN" ? "bg-light" : ""}`}
                          value={user.role || ""}
                          onChange={(e) =>
                            handleUpdateRole(
                              user.id!,
                              e.target.value,
                              user.role || ""
                            )
                          }
                          disabled={
                            updatingRoles[user.id!] || user.role === "ADMIN"
                          }
                          style={{
                            minWidth: "120px",
                            borderRadius: "8px",
                            border: "1px solid #dee2e6",
                            padding: "6px 12px",
                            cursor:
                              updatingRoles[user.id!] || user.role === "ADMIN"
                                ? "not-allowed"
                                : "pointer",
                            backgroundColor:
                              user.role === "ADMIN" ? "#f8f9fa" : "white",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {availableRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {updatingRoles[user.id!] && (
                          <span className="ms-2">
                            <i className="fa fa-spinner fa-spin text-primary"></i>
                          </span>
                        )}
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.status === "ACTIVE" || user.status === "active"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {user.status || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
