import { auth } from "./firebase";

const API_BASE = "/api/v1";

async function getAuthHeader() {
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.warn("Could not get Firebase token, using active session:", e);
    }
  }
  
  // Local/demo fallback token stored in localStorage
  const savedToken = localStorage.getItem("finsight_auth_token") || "demo-token-alex-chen";
  return { Authorization: `Bearer ${savedToken}` };
}

async function request(endpoint, options = {}) {
  const headers = await getAuthHeader();
  
  const config = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  // If body is not FormData, ensure Content-Type is json
  if (options.body && !(options.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication & Profile
  auth: {
    getMe: () => request("/auth/me"),
    syncProfile: (fullName) => request("/auth/sync-profile", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName })
    })
  },

  // Bank Statements
  statements: {
    upload: (formData) => request("/statements/upload", {
      method: "POST",
      body: formData
    }),
    save: (data) => request("/statements/save", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    list: () => request("/statements/"),
    delete: (id) => request(`/statements/${id}`, { method: "DELETE" })
  },

  // Transactions
  transactions: {
    list: (params = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.append(k, v);
      });
      return request(`/transactions/?${qs.toString()}`);
    },
    update: (id, data) => request(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
    create: (data) => request("/transactions/", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    getCategories: () => request("/transactions/categories"),
    addCategory: (name, type = "expense") => request("/transactions/categories", {
      method: "POST",
      body: JSON.stringify({ category_name: name, category_type: type })
    })
  },

  // Financial Analytics
  analytics: {
    getOverview: (params = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.append(k, v);
      });
      return request(`/analytics/overview?${qs.toString()}`);
    },
    getCharts: (params = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.append(k, v);
      });
      return request(`/analytics/charts?${qs.toString()}`);
    }
  },

  // Recurring Payments
  recurring: {
    get: () => request("/recurring/"),
    refresh: () => request("/recurring/refresh", { method: "POST" })
  },

  // Anomaly Alerts
  anomalies: {
    list: () => request("/anomalies/"),
    review: (id, data) => request(`/anomalies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
    refresh: () => request("/anomalies/refresh", { method: "POST" })
  },

  // Financial Health
  health: {
    get: () => request("/health/")
  },

  // Cash-Flow Prediction
  cashflow: {
    getForecast: (days = 90) => request(`/cashflow/forecast?days=${days}`)
  },

  // Budget Planner
  budgets: {
    get: (month, year) => {
      const qs = new URLSearchParams();
      if (month) qs.append("month", month);
      if (year) qs.append("year", year);
      return request(`/budgets/?${qs.toString()}`);
    },
    upsert: (data) => request("/budgets/", {
      method: "POST",
      body: JSON.stringify(data)
    })
  },

  // AI Assistant
  assistant: {
    chat: (message, history = []) => request("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, history })
    })
  }
};
