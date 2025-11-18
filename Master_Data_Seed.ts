// ============================================================
// PRISMA SEED FILE: Master Data Import
// File: prisma/seed-master-data.ts
// Purpose: Seed database with master categories from CE Excel
// Usage: npm run prisma:seed:master-data
// ============================================================

import { PrismaClient } from '@prisma/client';
import * as console_table from 'console.table';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Master Data Seeding...\n');

  try {
    // 1. Cost Types
    console.log('📋 Setting up Cost Types...');
    const costTypes = [
      { code: 'DL', name: 'Direct Labor', markup: 35.0 },
      { code: 'MAT', name: 'Material', markup: 40.0 },
      { code: 'EQUIP', name: 'Equipment Rental', markup: 50.0 },
      { code: 'SUB', name: 'Subcontractor', markup: 35.0 },
      { code: 'OTHER', name: 'Other', markup: 30.0 },
    ];

    for (const ct of costTypes) {
      await prisma.costType.upsert({
        where: { costTypeCode: ct.code },
        update: {},
        create: {
          costTypeCode: ct.code,
          costTypeName: ct.name,
          markupPercentage: new Prisma.Decimal(ct.markup),
          isActive: true,
        },
      });
    }
    console.log(`✅ ${costTypes.length} Cost Types created\n`);

    // 2. Service Types
    console.log('🔧 Setting up Service Types...');
    const serviceTypes = [
      // Pre-Project Services
      { code: 'PRAPRO-PS', name: 'Pra-Proyek (Penyusunan Proposal)', category: 'Pre-Project Services' },
      { code: 'PRAPRO-ADMIN', name: 'Jasa Administrasi & Dokumentasi Proyek', category: 'Pre-Project Services' },
      { code: 'PRAPRO-DESIGN', name: 'Jasa Desain Sistem Kelistrikan Data Center', category: 'Pre-Project Services' },
      { code: 'PRAPRO-AIRFLOW', name: 'Jasa Desain Tata Udara & Aliran Udara (Airflow)', category: 'Pre-Project Services' },
      { code: 'PRAPRO-CABLE', name: 'Jasa Desain Jaringan Kabel Terstruktur', category: 'Pre-Project Services' },
      { code: 'PRAPRO-ASBUILT', name: 'Jasa Pembuatan As-Built Drawing', category: 'Design Services' },

      // Implementation Services
      { code: 'IMPL-PHYS', name: 'Jasa Manajemen Proyek Physical Infrastructure', category: 'Implementation Services' },
      { code: 'IMPL-PWR', name: 'Jasa Manajemen Proyek Power Infrastructure', category: 'Implementation Services' },
      { code: 'IMPL-COOL', name: 'Jasa Manajemen Proyek Cooling Infrastructure', category: 'Implementation Services' },
      { code: 'IMPL-NETWORK', name: 'Jasa Manajemen Proyek Network Infrastructure', category: 'Implementation Services' },
      { code: 'IMPL-SERVER', name: 'Jasa Manajemen Proyek Server Infrastructure', category: 'Implementation Services' },

      // Installation Services
      { code: 'INSTALL-RF', name: 'Jasa Instalasi Raised Floor System', category: 'Installation Services' },
      { code: 'INSTALL-PANEL', name: 'Jasa Instalasi & Terminasi Panel Listrik IT', category: 'Installation Services' },
      { code: 'INSTALL-UPS', name: 'Jasa Instalasi Unit UPS & Baterai', category: 'Installation Services' },
      { code: 'INSTALL-COOL', name: 'Jasa Instalasi Pipa Refrigerant & Drain', category: 'Installation Services' },
      { code: 'INSTALL-PIPING', name: 'Jasa Instalasi Pipa Seamless & Nozzle', category: 'Installation Services' },
      { code: 'INSTALL-CABLE', name: 'Jasa Instalasi Kabel Terstruktur (UTP & FO)', category: 'Installation Services' },
      { code: 'INSTALL-RACK', name: 'Jasa Pemasangan & Grounding Rack Server Cabinet', category: 'Installation Services' },

      // Configuration Services
      { code: 'CONFIG-VIRTUALIZATION', name: 'Jasa Implementasi Platform Virtualisasi (Hypervisor)', category: 'Configuration Services' },
      { code: 'CONFIG-STORAGE', name: 'Jasa Konfigurasi Storage Area Network (SAN)', category: 'Configuration Services' },
      { code: 'CONFIG-BACKUP', name: 'Jasa Implementasi Solusi Backup & Recovery', category: 'Configuration Services' },
      { code: 'CONFIG-NMS', name: 'Jasa Implementasi Platform NMS', category: 'Configuration Services' },

      // Testing Services
      { code: 'TEST-CABLE', name: 'Jasa Uji Sertifikasi Kabel Tembaga (Fluke Test)', category: 'Testing Services' },
      { code: 'TEST-FIBER', name: 'Jasa Splicing & OTDR Test Fiber Optic', category: 'Testing Services' },
      { code: 'TEST-UPS', name: 'Jasa Commissioning & Uji Beban UPS (Load Bank Test)', category: 'Testing Services' },
      { code: 'TEST-INTEG', name: 'Jasa Pengujian Integrasi Sistem (System Integration Test)', category: 'Testing Services' },
    ];

    for (const st of serviceTypes) {
      await prisma.serviceType.upsert({
        where: { serviceTypeCode: st.code },
        update: {},
        create: {
          serviceTypeCode: st.code,
          serviceTypeName: st.name,
          category: st.category,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${serviceTypes.length} Service Types created\n`);

    // 3. Strategic Business Units (SBU)
    console.log('🏢 Setting up SBU (Strategic Business Units)...');
    const sbus = [
      { code: 'SBU-IT', name: 'IT Infrastructure', desc: 'Business unit untuk infrastruktur IT' },
      { code: 'SBU-MEP', name: 'MEP (Mechanical, Electrical, Plumbing)', desc: 'Business unit untuk layanan MEP' },
      { code: 'SBU-CONSULTING', name: 'Consulting', desc: 'Business unit untuk consulting services' },
    ];

    for (const sbu of sbus) {
      await prisma.sbu.upsert({
        where: { sbuCode: sbu.code },
        update: {},
        create: {
          sbuCode: sbu.code,
          sbuName: sbu.name,
          description: sbu.desc,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${sbus.length} SBU created\n`);

    // 4. Systems
    console.log('🔌 Setting up Systems...');
    const systems = [
      { code: 'SYS-DCF', name: 'Data Center Facilities', sbu: 'IT Infrastructure' },
      { code: 'SYS-PWR', name: 'Power Infrastructure', sbu: 'IT Infrastructure' },
      { code: 'SYS-COOL', name: 'Cooling Infrastructure', sbu: 'IT Infrastructure' },
      { code: 'SYS-FP', name: 'Fire Protection', sbu: 'MEP' },
      { code: 'SYS-ELEC', name: 'Electrical Systems', sbu: 'MEP' },
      { code: 'SYS-NET', name: 'Network & Security', sbu: 'IT Infrastructure' },
      { code: 'SYS-SERVER', name: 'Server & Storage', sbu: 'IT Infrastructure' },
      { code: 'SYS-IT-OPS', name: 'IT Management & Operations Software', sbu: 'IT Infrastructure' },
    ];

    for (const sys of systems) {
      await prisma.system.upsert({
        where: { systemCode: sys.code },
        update: {},
        create: {
          systemCode: sys.code,
          systemName: sys.name,
          sbu: sys.sbu,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${systems.length} Systems created\n`);

    // 5. Subsystems
    console.log('📦 Setting up Subsystems...');
    const subsystems = [
      { code: 'SUBSYS-PHYS', name: 'Physical Infrastructure', systemCode: 'SYS-DCF' },
      { code: 'SUBSYS-PWR-MAIN', name: 'Main Power Distribution', systemCode: 'SYS-PWR' },
      { code: 'SUBSYS-PWR-UPS', name: 'UPS & Battery Systems', systemCode: 'SYS-PWR' },
      { code: 'SUBSYS-PWR-RACK', name: 'Rack Power Distribution', systemCode: 'SYS-PWR' },
      { code: 'SUBSYS-COOL-PAC', name: 'Precision Air Conditioning', systemCode: 'SYS-COOL' },
      { code: 'SUBSYS-COOL-PIPING', name: 'Refrigerant Piping', systemCode: 'SYS-COOL' },
      { code: 'SUBSYS-FP-GAS', name: 'Gaseous System', systemCode: 'SYS-FP' },
      { code: 'SUBSYS-FP-DETECT', name: 'Fire Detection', systemCode: 'SYS-FP' },
      { code: 'SUBSYS-ELEC-AC', name: 'Access Control System', systemCode: 'SYS-ELEC' },
      { code: 'SUBSYS-ELEC-CCTV', name: 'CCTV System', systemCode: 'SYS-ELEC' },
      { code: 'SUBSYS-ELEC-CABLE', name: 'Network Cabling System', systemCode: 'SYS-ELEC' },
      { code: 'SUBSYS-NET-INFRA', name: 'Network Infrastructure', systemCode: 'SYS-NET' },
      { code: 'SUBSYS-NET-SEC', name: 'Network Security', systemCode: 'SYS-NET' },
      { code: 'SUBSYS-SRV-INFRA', name: 'Server Infrastructure', systemCode: 'SYS-SERVER' },
      { code: 'SUBSYS-SRV-STOR', name: 'Storage Systems', systemCode: 'SYS-SERVER' },
      { code: 'SUBSYS-ITOPS-VIRT', name: 'Virtualization & Containerization', systemCode: 'SYS-IT-OPS' },
      { code: 'SUBSYS-ITOPS-BACKUP', name: 'Backup & Disaster Recovery', systemCode: 'SYS-IT-OPS' },
      { code: 'SUBSYS-ITOPS-NMS', name: 'Network Management & Monitoring', systemCode: 'SYS-IT-OPS' },
      { code: 'SUBSYS-ITOPS-OPS', name: 'IT Operations & Automation', systemCode: 'SYS-IT-OPS' },
    ];

    for (const subsys of subsystems) {
      const sys = await prisma.system.findFirst({
        where: { systemCode: subsys.systemCode },
      });

      if (sys) {
        await prisma.subsystem.upsert({
          where: { subsystemCode: subsys.code },
          update: {},
          create: {
            subsystemCode: subsys.code,
            subsystemName: subsys.name,
            systemId: sys.id,
            isActive: true,
          },
        });
      }
    }
    console.log(`✅ ${subsystems.length} Subsystems created\n`);

    // 6. Units of Measure
    console.log('📏 Setting up Units of Measure...');
    const units = [
      { code: 'DAY', name: 'Days', abbr: 'Day' },
      { code: 'HOUR', name: 'Hours', abbr: 'Hr' },
      { code: 'PCS', name: 'Pieces', abbr: 'Pcs' },
      { code: 'SET', name: 'Sets', abbr: 'Set' },
      { code: 'METER', name: 'Meters', abbr: 'M' },
      { code: 'SQM', name: 'Square Meters', abbr: 'M²' },
      { code: 'LOT', name: 'Lot', abbr: 'Lot' },
      { code: 'UNIT', name: 'Units', abbr: 'Unit' },
    ];

    for (const u of units) {
      await prisma.unitOfMeasure.upsert({
        where: { unitCode: u.code },
        update: {},
        create: {
          unitCode: u.code,
          unitName: u.name,
          abbreviation: u.abbr,
          isActive: true,
        },
      });
    }
    console.log(`✅ ${units.length} Units of Measure created\n`);

    // 7. Project Types (for overhead allocation)
    console.log('🎯 Setting up Project Types...');
    const projectTypes = [
      { code: 'DC', name: 'Data Center', overhead: 12.5 },
      { code: 'MEP', name: 'MEP Installation', overhead: 10.0 },
      { code: 'IT-INFRA', name: 'IT Infrastructure', overhead: 15.0 },
      { code: 'GENERAL', name: 'General Project', overhead: 8.0 },
    ];

    for (const pt of projectTypes) {
      await prisma.projectType.upsert({
        where: { projectTypeCode: pt.code },
        update: {},
        create: {
          projectTypeCode: pt.code,
          projectTypeName: pt.name,
          overheadAllocationPercentage: new Prisma.Decimal(pt.overhead),
          isActive: true,
        },
      });
    }
    console.log(`✅ ${projectTypes.length} Project Types created\n`);

    // 8. Resource Types
    console.log('👥 Setting up Resource Types...');
    const resourceTypes = [
      { code: 'INTERNAL', name: 'Direct Labor (Internal)', markup: 35.0 },
      { code: 'FREELANCE', name: 'Freelance', markup: 60.0 },
      { code: 'SUBCON', name: 'Subcontractor', markup: 35.0 },
      { code: 'PRINCIPAL', name: 'Principal Tech Support', markup: 35.0 },
    ];

    for (const rt of resourceTypes) {
      await prisma.resourceType.upsert({
        where: { resourceTypeCode: rt.code },
        update: {},
        create: {
          resourceTypeCode: rt.code,
          resourceTypeName: rt.name,
          markupPercentage: new Prisma.Decimal(rt.markup),
          isActive: true,
        },
      });
    }
    console.log(`✅ ${resourceTypes.length} Resource Types created\n`);

    // Summary
    console.log('🎉 Master Data Seeding Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log(`  ✓ Cost Types: ${costTypes.length}`);
    console.log(`  ✓ Service Types: ${serviceTypes.length}`);
    console.log(`  ✓ SBU: ${sbus.length}`);
    console.log(`  ✓ Systems: ${systems.length}`);
    console.log(`  ✓ Subsystems: ${subsystems.length}`);
    console.log(`  ✓ Units of Measure: ${units.length}`);
    console.log(`  ✓ Project Types: ${projectTypes.length}`);
    console.log(`  ✓ Resource Types: ${resourceTypes.length}`);
    console.log(`\nTotal Master Data Records: ${
      costTypes.length +
      serviceTypes.length +
      sbus.length +
      systems.length +
      subsystems.length +
      units.length +
      projectTypes.length +
      resourceTypes.length
    }\n`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    console.log('✅ Master data seed completed successfully');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });

/* 
  UPDATE package.json with:
  
  {
    "scripts": {
      ...
      "prisma:seed:master": "ts-node --transpile-only prisma/seed-master-data.ts"
    },
    "prisma": {
      "seed": "ts-node --transpile-only prisma/seed.ts"
    }
  }

  Usage:
  npm run prisma:seed:master
*/