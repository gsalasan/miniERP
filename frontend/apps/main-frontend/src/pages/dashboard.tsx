import React, { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  roles: string[];
  employee_id?: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/"; // redirect ke login jika tidak ada token
      return;
    }

    // Decode token (jika JWT, bisa pakai jwt-decode)
    // Atau fetch profile dari backend
    fetch("http://localhost:3001/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        } else {
          window.location.href = "/";
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        window.location.href = "/";
      });
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h2>Berhasil Login!</h2>
      {user ? (
        <div>
          <p>
            Selamat datang, <b>{user.email}</b>
          </p>
          <p>
            Role: <b>{user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'Tidak ada role'}</b>
          </p>
        </div>
      ) : (
        <p>Memuat data user...</p>
      )}
    </div>
  );
};

export default Dashboard;
