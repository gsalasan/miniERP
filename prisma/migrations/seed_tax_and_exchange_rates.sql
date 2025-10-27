-- Sample data untuk Tax Rates
INSERT INTO tax_rates (tax_name, tax_code, rate, description, is_active, created_at, updated_at) VALUES
('PPN', 'PPN-11', 11.00, 'Pajak Pertambahan Nilai 11%', true, NOW(), NOW()),
('PPh 21', 'PPH21', 5.00, 'Pajak Penghasilan Pasal 21', true, NOW(), NOW()),
('PPh 23', 'PPH23', 2.00, 'Pajak Penghasilan Pasal 23', true, NOW(), NOW()),
('PPh 4(2)', 'PPH4-2', 10.00, 'Pajak Penghasilan Final Pasal 4 ayat 2', true, NOW(), NOW()),
('PPN Import', 'PPN-IMP', 11.00, 'PPN untuk barang impor', true, NOW(), NOW())
ON CONFLICT (tax_code) DO NOTHING;

-- Sample data untuk Exchange Rates
INSERT INTO exchange_rates (currency_from, currency_to, rate, effective_date, is_active, created_at, updated_at) VALUES
('USD', 'IDR', 15750.50, '2025-10-24', true, NOW(), NOW()),
('EUR', 'IDR', 17250.75, '2025-10-24', true, NOW(), NOW()),
('SGD', 'IDR', 11680.25, '2025-10-24', true, NOW(), NOW()),
('JPY', 'IDR', 105.50, '2025-10-24', true, NOW(), NOW()),
('CNY', 'IDR', 2180.30, '2025-10-24', true, NOW(), NOW()),
('USD', 'IDR', 15700.00, '2025-10-23', false, NOW(), NOW()),
('EUR', 'IDR', 17200.00, '2025-10-23', false, NOW(), NOW())
ON CONFLICT (currency_from, currency_to, effective_date) DO NOTHING;
