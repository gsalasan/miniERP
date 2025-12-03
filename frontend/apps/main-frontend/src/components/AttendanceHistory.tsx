import React, { useEffect } from "react";

export interface AttendanceHistoryItem {
  date: string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

export function AttendanceHistory({ records = [] }: { records: AttendanceHistoryItem[] }) {
  useEffect(() => {
    const styleId = "attendance-history-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        .att-card-container {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
        }
        .att-times-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 600px) {
          .att-card-container {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .att-date-section {
            padding-bottom: 10px;
            border-bottom: 1px solid #E5E7EB;
          }
          .att-times-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            padding: 8px 0;
          }
          .att-badge-mobile {
            justify-self: end;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!records.length) {
    return <div style={{ marginTop: 24, color: "#888", fontSize: 14 }}>Belum ada riwayat absen.</div>;
  }

  const recentRecords = records.slice(0, 2);

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#1F2937", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Latest Attendance
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {recentRecords.map((rec, idx) => {
          const dateObj = new Date(rec.date);
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
          const dateFormat = dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
          const hasCheckOut = !!rec.checkOut;
          return (
            <div key={rec.date + idx} style={{ borderRadius: 10, border: "1px solid #E5E7EB", background: "#FFFFFF", padding: "12px 14px", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)" }}>
              <div className="att-card-container">
                <div className="att-date-section" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: hasCheckOut ? "#10B981" : "#F59E0B", flexShrink: 0 }}/>
                  <div style={{ minWidth: 42 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", lineHeight: 1.1 }}>{dayName}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.1, marginTop: 3 }}>{dateFormat}</div>
                  </div>
                </div>
                <div className="att-times-grid">
                  <div>
                    <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Check In</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>{rec.checkIn || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Check Out</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: hasCheckOut ? "#EF4444" : "#D1D5DB" }}>{rec.checkOut || "-"}</div>
                  </div>
                </div>
                <div className="att-badge-mobile">
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 5, background: hasCheckOut ? "#D1FAE5" : "#FEF3C7", color: hasCheckOut ? "#065F46" : "#92400E", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-block" }}>
                    {hasCheckOut ? "Present" : "Incomplete"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
