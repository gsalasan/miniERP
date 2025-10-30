export async function login(email: string, password: string) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { 
        success: false,
        message: `Server error: ${text.substring(0, 100)}`, 
        token: null 
      };
    }

    // Check HTTP status
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP Error ${res.status}: ${res.statusText}`,
        token: null
      };
    }

    // Return the response data
    return data;
  } catch (err: any) {
    console.error("Login error:", err);
    return { 
      success: false,
      message: err?.message || "Tidak bisa terhubung ke server. Pastikan backend berjalan.", 
      token: null 
    };
  }
}
