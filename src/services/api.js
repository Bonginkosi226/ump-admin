// services/api.js
const ADMIN_BASE = "/api/admins";

const apiService = {
  // --------------------
  // ADMIN USER
  // --------------------

  // Get current admin info (from localStorage)
  getCurrentUser: async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?._id) {
        return { success: false, message: "No user ID found" };
      }
      const res = await fetch(`${ADMIN_BASE}/${user._id}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // Update admin info
  updateCurrentUser: async (updateData) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?._id) {
        return { success: false, message: "No user ID found" };
      }
      const res = await fetch(`${ADMIN_BASE}/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // Fetch all admins
getAdmins: async () => {
  try {
    const response = await fetch("/api/admins");
    if (!response.ok) throw new Error("Failed to fetch admins");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("❌ getAdmins error:", err);
    return [];
  }
},


  // Change password
  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?._id) {
        return { success: false, message: "No user ID found" };
      }
      const res = await fetch(`${ADMIN_BASE}/${user._id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to change password");
      }
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },
};

export default apiService;
