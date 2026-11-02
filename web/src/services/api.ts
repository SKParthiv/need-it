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

export class ApiError extends Error {
  status: number;
  data: any;
  isForbidden?: boolean;
  reason?: string;
  appealHint?: string;

  constructor(status: number, data: any, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    if (status === 403) {
      this.isForbidden = true;
      this.reason =
        data?.detail ||
        data?.reason ||
        'This action is blocked by campus safety policy or verified student requirements.';
      this.appealHint =
        data?.appeal_hint ||
        'If you believe this restriction is an error, please file an appeal through the Report a Problem page.';
    }
  }
}

interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  // Fast timeout prevents hanging when remote cloud backend is sleeping/cold (Render cold start)
  const timeoutMs = options.timeoutMs ?? (endpoint.includes('/auth/') ? 3500 : 5000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

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
      const errorMsg =
        data?.detail ||
        (typeof data === 'object' ? (data.error || JSON.stringify(data)) : 'API Error');
      throw new ApiError(response.status, data, errorMsg);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s (backend instance may be cold or waking up).`);
    }
    throw err;
  }
}

export const api = {
  // --- Auth ---
  async login(email: string, password?: string) {
    const trimmed = email.trim().toLowerCase();
    const finalPassword =
      password ||
      (trimmed === '130180058@sastra.ac.in' ? 'needit82111' : 'TestPass123!');
    const res = await apiFetch<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email: trimmed, password: finalPassword }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async googleAuth(idToken: string, role?: 'customer' | 'helper') {
    const res = await apiFetch<{ token: string; user: any }>('/auth/google/', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken, role }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async register(data: {
    email: string;
    password?: string;
    role: 'customer' | 'helper';
    first_name?: string;
    last_name?: string;
    hostel_block?: string;
    pickup_point?: string;
  }) {
    const password = data.password || 'TestPass123!';
    const res = await apiFetch<{ user: any; verification_token: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        email: data.email.trim().toLowerCase(),
        password,
      }),
    });
    // Auto-verify for student pilot convenience
    if (res.verification_token) {
      await this.verifyEmail(res.verification_token);
    }
    // Then log in
    return this.login(data.email, password);
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

  /**
   * Fast 1-tap sign in: attempts to login with seeded password,
   * or auto-creates and verifies the account if not present yet.
   */
  async quickLoginAs(role: 'customer' | 'helper', email: string, name?: string) {
    try {
      return await this.login(email);
    } catch {
      const parts = (name || email.split('@')[0]).split(' ');
      const first_name = parts[0] || 'Student';
      const last_name = parts.slice(1).join(' ') || (role === 'helper' ? 'Helper' : 'Customer');
      return await this.register({
        email,
        role,
        first_name,
        last_name,
        hostel_block: role === 'helper' ? 'Girls’ Hostel Area' : 'Hostel Block A, Room 312',
        pickup_point: role === 'helper' ? 'Girls’ Hostel Area' : 'Boys’ Hostel Area',
      });
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
    const urlToSend = evidencePhotoUrl && (evidencePhotoUrl.startsWith('http://') || evidencePhotoUrl.startsWith('https://'))
      ? evidencePhotoUrl
      : undefined;
    return apiFetch(`/requests/${requestId}/items/${itemId}/propose-price/`, {
      method: 'POST',
      body: JSON.stringify({ actualPrice, evidencePhotoUrl: urlToSend }),
    });
  },

  async getUploadSignature() {
    return apiFetch<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>(
      '/uploads/signature/'
    );
  },

  /**
   * Checks whether Cloudinary photo uploads are active.
   * Per Issue #28: If signature returns 503, hide photo buttons and continue without photos.
   */
  async isPhotoUploadAvailable(): Promise<boolean> {
    try {
      const sig = await this.getUploadSignature();
      return Boolean(sig && sig.cloudName && sig.apiKey && sig.signature);
    } catch (err: any) {
      if (err?.status === 503 || err?.message?.includes('503')) {
        return false;
      }
      return false;
    }
  },

  /** Direct browser→Cloudinary signed upload. Per Issue #28, if signature fails or returns 503, photo upload is disabled. */
  async uploadEvidencePhoto(file: File): Promise<string> {
    const sig = await this.getUploadSignature().catch((err: any) => {
      const is503 = err?.status === 503 || err?.message?.includes('503');
      throw new Error(is503 ? 'Photo upload service unavailable (HTTP 503).' : (err?.message || 'Upload signature failed'));
    });

    if (!sig || !sig.cloudName || !sig.apiKey || !sig.signature) {
      throw new Error('Photo storage signature is missing or unavailable (HTTP 503).');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('folder', sig.folder || 'needit-evidence');
    form.append('signature', sig.signature);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });

    if (!resp.ok) {
      throw new Error(`Cloudinary upload failed with HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (!data?.secure_url) {
      throw new Error('Cloudinary response missing secure_url');
    }
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

  // --- Payments ---
  async getPaymentStatus(orderId: string | number) {
    return apiFetch<{
      status: string;
      item_cost?: number;
      helper_fee?: number;
      total?: number;
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
      body: JSON.stringify({ text, photoUrl: photoUrl || undefined }),
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

  // --- Notifications ---
  async getNotifications() {
    return apiFetch<{ unreadCount: number; notifications: any[] }>('/notifications/');
  },

  async markNotificationRead(id: string | number) {
    return apiFetch<{ id: number; read: boolean }>(`/notifications/${id}/read/`, {
      method: 'POST',
    });
  },

  async markAllNotificationsRead() {
    return apiFetch<{ markedRead: number }>('/notifications/read-all/', {
      method: 'POST',
    });
  },

  // --- Reports ---
  async fileReport(data: {
    orderId: number | string;
    issueType: string;
    details: string;
    photoUrl?: string;
    priority?: string;
  }) {
    return apiFetch<any>('/reports/file/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyReports() {
    return apiFetch<{ reports: any[] }>('/reports/');
  },

  // --- Ratings ---
  async rateOrder(orderId: string | number, rating: number, feedback?: string) {
    return apiFetch<any>(`/orders/${orderId}/rate/`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  },

  async updateMe(data: { upi_id?: string; hostel_block?: string; pickup_point?: string }) {
    return apiFetch('/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
