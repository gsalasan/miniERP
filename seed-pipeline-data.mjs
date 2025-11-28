import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPipelineData() {
  console.log('🌱 Seeding pipeline test data...');

  try {
    // Create test customers first
    const customers = await Promise.all([
      prisma.customers.upsert({
        where: { id: 'cust-001' },
        update: {},
        create: {
          id: 'cust-001',
          customer_name: 'PT Maju Teknologi',
          channel: 'Direct Sales',
          city: 'Jakarta',
          status: 'ACTIVE',
          top_days: 30,
          assigned_sales_id: 'sales-001',
          credit_limit: 100000000,
          no_npwp: '01.234.567.8-901.000',
        }
      }),
      prisma.customers.upsert({
        where: { id: 'cust-002' },
        update: {},
        create: {
          id: 'cust-002',
          customer_name: 'CV Digital Solusi',
          channel: 'Online',
          city: 'Bandung',
          status: 'ACTIVE',
          top_days: 14,
          assigned_sales_id: 'sales-002',
          credit_limit: 50000000,
          no_npwp: '02.345.678.9-012.000',
        }
      }),
      prisma.customers.upsert({
        where: { id: 'cust-003' },
        update: {},
        create: {
          id: 'cust-003',
          customer_name: 'Universitas Teknologi Indonesia',
          channel: 'Partnership',
          city: 'Surabaya',
          status: 'PROSPECT',
          top_days: 45,
          assigned_sales_id: 'sales-001',
          credit_limit: 200000000,
          no_npwp: '03.456.789.0-123.000',
        }
      }),
    ]);

    console.log(`✅ Created ${customers.length} test customers`);

    // Create test projects in different pipeline stages
    const projects = await Promise.all([
      // PROSPECT stage
      prisma.projects.upsert({
        where: { id: 'proj-001' },
        update: {},
        create: {
          id: 'proj-001',
          project_name: 'Sistem CCTV Kantor Pusat',
          project_number: 'PRJ-2024-001',
          description: 'Pemasangan sistem CCTV untuk kantor pusat dengan 20 titik kamera',
          customer_id: 'cust-001',
          sales_user_id: 'sales-001',
          status: 'PROSPECT',
          estimated_value: 75000000,
          lead_score: 7,
          priority: 'HIGH',
          expected_close_date: new Date('2024-12-31'),
          notes: 'Client tertarik dengan solusi IP camera terbaru',
          created_by: 'sales-001'
        }
      }),

      // MEETING_SCHEDULED stage
      prisma.projects.upsert({
        where: { id: 'proj-002' },
        update: {},
        create: {
          id: 'proj-002',
          project_name: 'Upgrade Network Infrastructure',
          project_number: 'PRJ-2024-002',
          description: 'Upgrade infrastruktur jaringan kantor cabang',
          customer_id: 'cust-002',
          sales_user_id: 'sales-002',
          status: 'MEETING_SCHEDULED',
          estimated_value: 120000000,
          lead_score: 8,
          priority: 'MEDIUM',
          expected_close_date: new Date('2025-01-15'),
          notes: 'Meeting dijadwalkan minggu depan untuk survey lokasi',
          created_by: 'sales-002'
        }
      }),

      // PRE_SALES stage
      prisma.projects.upsert({
        where: { id: 'proj-003' },
        update: {},
        create: {
          id: 'proj-003',
          project_name: 'Smart Campus Solution',
          project_number: 'PRJ-2024-003',
          description: 'Implementasi smart campus dengan IoT sensors dan digital signage',
          customer_id: 'cust-003',
          sales_user_id: 'sales-001',
          status: 'PRE_SALES',
          estimated_value: 250000000,
          lead_score: 9,
          priority: 'URGENT',
          expected_close_date: new Date('2025-02-28'),
          notes: 'Perlu estimasi detail dari tim engineering',
          created_by: 'sales-001'
        }
      }),

      // PROPOSAL_DELIVERED stage
      prisma.projects.upsert({
        where: { id: 'proj-004' },
        update: {},
        create: {
          id: 'proj-004',
          project_name: 'Data Center Monitoring System',
          project_number: 'PRJ-2024-004',
          description: 'Sistem monitoring data center real-time dengan dashboard',
          customer_id: 'cust-001',
          sales_user_id: 'sales-001',
          status: 'PROPOSAL_DELIVERED',
          estimated_value: 180000000,
          contract_value: 175000000,
          lead_score: 8,
          priority: 'HIGH',
          estimation_status: 'APPROVED',
          expected_close_date: new Date('2024-11-30'),
          notes: 'Proposal sudah dikirim, menunggu feedback dari client',
          created_by: 'sales-001'
        }
      }),

      // NEGOTIATION stage
      prisma.projects.upsert({
        where: { id: 'proj-005' },
        update: {},
        create: {
          id: 'proj-005',
          project_name: 'ERP Integration Project',
          project_number: 'PRJ-2024-005',
          description: 'Integrasi sistem ERP dengan sistem existing',
          customer_id: 'cust-002',
          sales_user_id: 'sales-002',
          status: 'NEGOTIATION',
          estimated_value: 300000000,
          contract_value: 285000000,
          lead_score: 9,
          priority: 'URGENT',
          estimation_status: 'APPROVED',
          expected_close_date: new Date('2024-12-15'),
          notes: 'Sedang negosiasi final harga dan timeline implementasi',
          created_by: 'sales-002'
        }
      }),
    ]);

    console.log(`✅ Created ${projects.length} test projects`);

    // Create some project activities
    const activities = await Promise.all([
      prisma.project_activities.create({
        data: {
          project_id: 'proj-001',
          activity_type: 'STATUS_CHANGE',
          description: 'Project created as new prospect',
          performed_by: 'sales-001',
          metadata: {
            old_status: null,
            new_status: 'PROSPECT',
            changed_by: 'Sales Person 1',
            changed_by_id: 'sales-001'
          }
        }
      }),
      prisma.project_activities.create({
        data: {
          project_id: 'proj-002',
          activity_type: 'MEETING',
          description: 'Initial meeting scheduled with client',
          performed_by: 'sales-002',
          metadata: {
            meeting_date: '2024-11-10',
            attendees: ['Sales Person 2', 'Client Technical Team']
          }
        }
      }),
      prisma.project_activities.create({
        data: {
          project_id: 'proj-003',
          activity_type: 'CALL',
          description: 'Follow-up call with procurement team',
          performed_by: 'sales-001',
          metadata: {
            call_duration: '45 minutes',
            outcome: 'Positive response, proceeding to technical evaluation'
          }
        }
      }),
    ]);

    console.log(`✅ Created ${activities.length} test activities`);

    // Summary
    console.log('\n📊 Pipeline Test Data Summary:');
    console.log('===============================');
    
    const pipelineSummary = await prisma.projects.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      _sum: {
        estimated_value: true
      }
    });

    pipelineSummary.forEach(stage => {
      console.log(`${stage.status}: ${stage._count.status} projects (Total Value: ${stage._sum.estimated_value || 0})`);
    });

    console.log('\n🎉 Pipeline test data seeded successfully!');
    console.log('\nYou can now test the pipeline API with:');
    console.log('npm run dev:crm');
    console.log('Then run: .\\test-pipeline-api.ps1');

  } catch (error) {
    console.error('❌ Error seeding pipeline data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPipelineData();