// services/api.js
const BASE_URL = "/api/routes";

const apiService = {
  // GET all
  getPaths: async () => {
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error("Failed to fetch paths");
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, data: null };
    }
  },

  // POST new path
  addPath: async (pathData) => {
    try {
      console.log('Submitting path:', pathData);
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pathData)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Backend error response:", errorText);
        throw new Error("Failed to add path: " + errorText);
      }
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // PUT update path
  updatePath: async (id, pathData) => {
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pathData)
      });
      if (!res.ok) throw new Error("Failed to update path");
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // DELETE path
  deletePath: async (id) => {
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete path");
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
};

export default apiService;
