/**
 * Need It - Backend API Service
 * Connects the web frontend to the Django REST API via Vite's proxy (/api)
 */

const TOKEN_KEY = 'needit_auth_token';

// Dev: empty base -> Vite proxy forwards /api to Django.
// Prod: set VITE_API_URL to the deployed backend origin (e.g. https://needit-api.onrender.com).
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const USER_KEY = 'needit_user_data';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredAuth = (token: string, user: any) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  const data = localStorage.getItem(USER_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    const errorMsg = data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'API Error');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // --- Auth ---
  // Real auth only: the backend checks the password and issues the token.
  // No client-side shortcuts, no seeded-password fallbacks.
  async login(email: string, password: string) {
    const res = await apiFetch<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    role: 'customer' | 'helper';
    first_name?: string;
    last_name?: string;
    hostel_block?: string;
    pickup_point?: string;
  }) {
    const res = await apiFetch<{ user: any; verification_token: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        email: data.email.trim().toLowerCase(),
        policy_accept: true,
      }),
    });
    // Pilot mode returns the verification token in the response (DEBUG /
    // no-SMTP); auto-verify so registration completes in one step.
    if (res.verification_token) {
      await this.verifyEmail(res.verification_token);
    }
    // Then log in with the credentials the user just chose
    return this.login(data.email, data.password);
  },

  // Google Workspace sign-in: the backend verifies the ID token against
  // GOOGLE_CLIENT_ID, enforces the @sastra.ac.in hosted domain, and
  // auto-verifies the student. `role` is required only on FIRST sign-in.
  async googleLogin(idToken: string, role?: 'customer' | 'helper') {
    const res = await apiFetch<{ token: string; user: any }>('/auth/google/', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken, role }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async verifyEmail(token: string) {
    return apiFetch('/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async getMe() {
    return apiFetch('/me/');
  },

  async logout() {
    try {
      await apiFetch('/auth/logout/', { method: 'POST' });
    } finally {
      clearStoredAuth();
    }
  },

  // --- Orders & Requests ---
  async getFeed() {
    return apiFetch<any[]>('/feed/');
  },

  async getMyRequests() {
    return apiFetch<any[]>('/requests/');
  },

  async getRequest(id: string | number) {
    return apiFetch<any>(`/requests/${id}/`);
  },

  async createRequest(payload: {
    neededBy: string;
    pickupPoint: string;
    isUrgent?: boolean;
    expectedTotal: number;
    items: Array<{
      name: string;
      quantity: number;
      expectedPrice: number;
      notes?: string;
    }>;
  }) {
    return apiFetch<any>('/requests/create/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async acceptRequest(id: string | number) {
    return apiFetch<{ id: number; status: string }>(`/requests/${id}/accept/`, {
      method: 'POST',
    });
  },

  async markPurchased(id: string | number) {
    return apiFetch<{ id: number; status: string }>(`/requests/${id}/mark-purchased/`, {
      method: 'POST',
    });
  },

  async releaseRequest(id: string | number) {
    return apiFetch<{ id: number; status: string }>(`/requests/${id}/release/`, {
      method: 'POST',
    });
  },

  async cancelRequest(id: string | number, reason = '', helperAgree = false) {
    return apiFetch<{ id: number; status: string }>(`/requests/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason, helperAgree }),
    });
  },

  async proposePrice(requestId: string | number, itemId: string | number, actualPrice: number, evidencePhotoUrl?: string) {
    return apiFetch(`/requests/${requestId}/items/${itemId}/propose-price/`, {
      method: 'POST',
      body: JSON.stringify({ actualPrice, evidencePhotoUrl }),
    });
  },

  async getUploadSignature() {
    return apiFetch<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>(
      '/uploads/signature/'
    );
  },

  /** Direct browser→Cloudinary signed upload. Returns the secure_url to attach
   *  as evidence — our server signs, Cloudinary stores. */
  async uploadEvidencePhoto(file: File): Promise<string> {
    const sig = await this.getUploadSignature();
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('folder', sig.folder);
    form.append('signature', sig.signature);
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!resp.ok) {
      throw new Error('Photo upload failed. Try again.');
    }
    const data = await resp.json();
    return data.secure_url as string;
  },

  async approvePrice(requestId: string | number, itemIds?: number[]) {
    return apiFetch(`/requests/${requestId}/approve-price/`, {
      method: 'POST',
      body: JSON.stringify({ itemIds: itemIds || [] }),
    });
  },

  async markUnavailable(requestId: string | number, itemId: string | number) {
    return apiFetch(`/requests/${requestId}/items/${itemId}/unavailable/`, {
      method: 'POST',
    });
  },

  async proposeReplacement(requestId: string | number, itemId: string | number, data: {
    name: string;
    price: number;
    photoUrl?: string;
    reason?: string;
  }) {
    return apiFetch(`/requests/${requestId}/items/${itemId}/replacement/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approveReplacement(requestId: string | number, itemId: string | number, approved = true) {
    return apiFetch(`/requests/${requestId}/items/${itemId}/approve-replacement/`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  },

  async confirmHandover(requestId: string | number, code: string) {
    return apiFetch<{ id: number; status: string }>(`/requests/${requestId}/confirm-handover/`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

    // Trust: one rating per order per rater, completed orders only (PR #34).
    // 409 = already rated — callers treat that as "submitted".
    async rate(orderId: string | number, stars: number, note = '') {
      return apiFetch<{ detail?: string }>(`/orders/${orderId}/rate/`, {
        method: 'POST',
        body: JSON.stringify({ stars, note }),
      });
    },

  // --- Payments ---
  async getPaymentStatus(orderId: string | number) {
    return apiFetch<{
      status: string;
      item_cost?: number;
      helper_fee?: number;
      total?: number;
        // Active provider ("manual" | "razorpay_base") — drives which pay UI
        // renders: client-composed UPI QR vs gateway payment link.
        provider?: string;
    }>(`/orders/${orderId}/payment-status/`);
  },

  async pay(orderId: string | number, helperFee = 30) {
    return apiFetch<{ status: string; total: number; paymentUrl?: string | null }>(`/orders/${orderId}/pay/`, {
      method: 'POST',
      body: JSON.stringify({ helperFee }),
    });
  },

  async confirmPayment(orderId: string | number) {
    return apiFetch<{ status: string }>(`/orders/${orderId}/confirm-payment/`, {
      method: 'POST',
    });
  },

  // --- Chat Messages ---
  async getMessages(orderId: string | number) {
    return apiFetch<any[]>(`/orders/${orderId}/messages/`);
  },

    async sendMessage(orderId: string | number, text: string, photoUrl?: string) {
      return apiFetch<any>(`/orders/${orderId}/messages/`, {
        method: 'POST',
        body: JSON.stringify(photoUrl ? { text, photoUrl } : { text }),
      });
    },

  // --- Payouts (merchant of record) ---
  async getAdminPayouts(status: 'due' | 'paid' | 'all' = 'due') {
    return apiFetch<any[]>(`/admin/payouts/?status=${status}`);
  },

  async markPayoutPaid(payoutId: number, utr: string) {
    return apiFetch<any>(`/admin/payouts/${payoutId}/mark-paid/`, {
      method: 'POST',
      body: JSON.stringify({ utr }),
    });
  },

  async getEarnings() {
    return apiFetch<{ dueTotal: number; paidTotal: number; payouts: any[] }>('/earnings/');
  },

  async updateMe(data: { upi_id?: string; hostel_block?: string; pickup_point?: string }) {
    return apiFetch('/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
