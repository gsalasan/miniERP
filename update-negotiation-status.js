// Script untuk mengupdate status NEGOTIATION ke PROPOSAL_DELIVERED
// sebelum menghapus enum NEGOTIATION dari schema

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNegotiationStatus() {
  try {
    console.log('Checking for projects with NEGOTIATION status...');
    
    // Cek berapa banyak project dengan status NEGOTIATION
    const negotiationProjects = await prisma.projects.findMany({
      where: {
        status: 'NEGOTIATION'
      },
      select: {
        id: true,
        project_name: true,
        status: true
      }
    });

    console.log(`Found ${negotiationProjects.length} projects with NEGOTIATION status`);

    if (negotiationProjects.length > 0) {
      console.log('Projects to be updated:');
      negotiationProjects.forEach(project => {
        console.log(`- ${project.project_name} (${project.id})`);
      });

      // Update semua project dengan status NEGOTIATION ke PROPOSAL_DELIVERED
      const updateResult = await prisma.projects.updateMany({
        where: {
          status: 'NEGOTIATION'
        },
        data: {
          status: 'PROPOSAL_DELIVERED'
        }
      });

      console.log(`Successfully updated ${updateResult.count} projects from NEGOTIATION to PROPOSAL_DELIVERED`);
    } else {
      console.log('No projects with NEGOTIATION status found. Safe to proceed with schema update.');
    }

  } catch (error) {
    console.error('Error updating project statuses:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateNegotiationStatus();