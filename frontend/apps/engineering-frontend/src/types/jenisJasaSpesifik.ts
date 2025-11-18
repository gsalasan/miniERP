// JenisJasaSpesifik Enum
// This file contains 496 values of specific service types
// Generated from database enum: JenisJasaSpesifik

// NOTE: This is a placeholder. For full enum values, they should be fetched from the backend API
// or generated using the script in /scripts/generate-jenis-jasa-for-frontend.js

// For now, we'll define it as a string union type
export type JenisJasaSpesifik = string;

// Helper to validate if a value is a valid JenisJasaSpesifik
export const isValidJenisJasaSpesifik = (value: string): boolean => {
  // All valid values start with "JASA_"
  return value.startsWith("JASA_");
};

// Common jenis jasa values for quick reference (top 20 most used)
export const COMMON_JENIS_JASA = [
  "JASA_INSTALASI_KABEL_TERSTRUKTUR",
  "JASA_INSTALASI_FISIK_SERVER",
  "JASA_DESAIN_ARSITEKTUR_JARINGAN",
  "JASA_KONFIGURASI_SWITCH_INDUSTRIAL",
  "JASA_TESTING_COMMISSIONING_JARINGAN",
  "JASA_PEMASANGAN_PERANGKAT_JARINGAN",
  "JASA_INSTALASI_UNIT_UPS_BATERAI",
  "JASA_DESAIN_SISTEM_CCTV",
  "JASA_INSTALASI_PIPA_REFRIGERANT_DRAIN",
  "JASA_SURVEY_DESAIN_SISTEM_PLTS",
  "JASA_MANAJEMEN_PROYEK_NETWORK_INFRASTRUCTURE",
  "JASA_COMMISSIONING_TES_FUNGSI",
  "JASA_PERAWATAN_PREVENTIF_UPS_BATERAI",
  "JASA_IMPLEMENTASI_PLATFORM_IIOT",
  "JASA_DESAIN_ARSITEKTUR_CLOUD_IOT",
  "JASA_KONFIGURASI_PLATFORM_MANAJEMEN_PERTANIAN",
  "JASA_INSTALASI_SENSOR_LAPANGAN_STASIUN_CUACA",
  "JASA_TROUBLESHOOTING_PERBAIKAN_JARINGAN",
  "JASA_SITE_SURVEY_NIRKABEL",
  "JASA_PENGEMBANGAN_DASBOR_KUSTOM",
] as const;

// Type for common jenis jasa
export type CommonJenisJasa = (typeof COMMON_JENIS_JASA)[number];

// TODO: Generate full enum from database
// Run: node scripts/generate-jenis-jasa-for-frontend.js
// This will create the complete enum with all 496 values
