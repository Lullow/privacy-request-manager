const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim();

function normalizeApiBase(base) {
    if (!base) return "/api";
    return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const API_BASE = normalizeApiBase(ENV_API_BASE);

export function getToken() {
    return localStorage.getItem("token");
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function removeToken() {
    localStorage.removeItem("token");
}

async function parseErrorResponse(res) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const error = await res.json().catch(() => ({}));

        if (typeof error.detail === "string" && error.detail.trim()) {
            return error.detail;
        }

        if (typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }

        if (error.detail !== undefined) {
            return JSON.stringify(error.detail);
        }
    }

    const text = await res.text().catch(() => "");
    if (text.trim()) {
        return text.slice(0, 300);
    }

    return `API error (${res.status})`;
}

export async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const shouldSendAuth = options.auth !== false;

    const headers = {
        "Content-Type": "application/json",
        ...(shouldSendAuth && token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: options.method || "GET",
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers,
    });

    if (!res.ok) {
        throw new Error(await parseErrorResponse(res));
    }

    return res.json();
}
