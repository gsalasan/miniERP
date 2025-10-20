export async function login(email: string, password: string) {
  try {
    const res = await fetch("http://localhost:3001/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { message: "Server error atau response tidak valid", token: null };
    }
  } catch (err) {
    return { message: "Tidak bisa terhubung ke server", token: null };
  }
}