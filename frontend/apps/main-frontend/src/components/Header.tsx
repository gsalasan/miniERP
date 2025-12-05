import React from "react";

const MobileHamburger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    className="sidebar-hamburger"
    onClick={onClick}
    style={{
      background: "#fff",
      border: "none",
      borderRadius: 7,
      boxShadow: "0 1px 6px #0001",
      padding: 4,
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s',
      marginRight: 10,
    }}
    aria-label="Open sidebar"
  >
    <span style={{ fontSize: 18, color: '#2563eb' }}>☰</span>
  </button>
);

export default MobileHamburger;
