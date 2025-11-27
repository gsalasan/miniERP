import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMilestoneTemplates() {
  console.log('🌱 Seeding milestone templates...');

  const templates = [
    {
      template_name: 'Instalasi Fire Alarm',
      project_type: 'Fire Alarm System',
      milestones: [
        { name: 'Persiapan & Site Survey', duration_days: 3, status: 'PLANNED' },
        { name: 'Penarikan Kabel', duration_days: 7, status: 'PLANNED' },
        { name: 'Instalasi Perangkat', duration_days: 5, status: 'PLANNED' },
        { name: 'Testing & Commissioning', duration_days: 3, status: 'PLANNED' },
        { name: 'Training & Handover', duration_days: 2, status: 'PLANNED' },
      ],
    },
    {
      template_name: 'Proyek Konstruksi Standar',
      project_type: 'Construction',
      milestones: [
        { name: 'Project Initiation', duration_days: 7, status: 'PLANNED' },
        { name: 'Design & Planning', duration_days: 14, status: 'PLANNED' },
        { name: 'Procurement', duration_days: 21, status: 'PLANNED' },
        { name: 'Construction Phase 1', duration_days: 30, status: 'PLANNED' },
        { name: 'Construction Phase 2', duration_days: 30, status: 'PLANNED' },
        { name: 'Testing & Commissioning', duration_days: 14, status: 'PLANNED' },
        { name: 'Project Handover', duration_days: 7, status: 'PLANNED' },
      ],
    },
    {
      template_name: 'Implementasi Sistem IT',
      project_type: 'IT System',
      milestones: [
        { name: 'Requirements Gathering', duration_days: 7, status: 'PLANNED' },
        { name: 'System Design', duration_days: 14, status: 'PLANNED' },
        { name: 'Development', duration_days: 45, status: 'PLANNED' },
        { name: 'Testing & QA', duration_days: 14, status: 'PLANNED' },
        { name: 'User Training', duration_days: 7, status: 'PLANNED' },
        { name: 'Go-Live & Support', duration_days: 7, status: 'PLANNED' },
      ],
    },
    {
      template_name: 'Engineering Services Project',
      project_type: 'Engineering',
      milestones: [
        { name: 'Site Survey & Assessment', duration_days: 5, status: 'PLANNED' },
        { name: 'Engineering Design', duration_days: 21, status: 'PLANNED' },
        { name: 'Material Procurement', duration_days: 14, status: 'PLANNED' },
        { name: 'Installation', duration_days: 30, status: 'PLANNED' },
        { name: 'Testing & Integration', duration_days: 10, status: 'PLANNED' },
        { name: 'Documentation & Training', duration_days: 5, status: 'PLANNED' },
        { name: 'Final Acceptance', duration_days: 3, status: 'PLANNED' },
      ],
    },
    {
      template_name: 'CCTV & Security System',
      project_type: 'Security System',
      milestones: [
        { name: 'Site Survey & Design', duration_days: 5, status: 'PLANNED' },
        { name: 'Penarikan Kabel & Conduit', duration_days: 10, status: 'PLANNED' },
        { name: 'Instalasi Camera & DVR', duration_days: 7, status: 'PLANNED' },
        { name: 'Konfigurasi & Testing', duration_days: 3, status: 'PLANNED' },
        { name: 'Training Pengguna', duration_days: 2, status: 'PLANNED' },
      ],
    },
  ];

  for (const template of templates) {
    try {
      await prisma.milestoneTemplate.upsert({
        where: { template_name: template.template_name },
        update: {
          project_type: template.project_type,
          milestones: template.milestones,
        },
        create: {
          template_name: template.template_name,
          project_type: template.project_type,
          milestones: template.milestones,
        },
      });
      console.log(`✅ Template created/updated: ${template.template_name}`);
    } catch (error) {
      console.error(`❌ Failed to seed template ${template.template_name}:`, error);
    }
  }

  console.log('✅ Milestone templates seeding completed!');
}

seedMilestoneTemplates()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
