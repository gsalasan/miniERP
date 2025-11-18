import { Project } from '@prisma/client';
import prisma from '../prisma/client';

export const getProjects = async () => {
  return prisma.project.findMany({
    include: {
      customer: true,
      estimations: true,
      project_boms: true,
      milestones: true,
    },
  });
};

export const getProjectById = async (id: string) => {
  return prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      estimations: true,
      project_boms: true,
      milestones: true,
    },
  });
};

export const createProject = async (data: Project) => {
  return prisma.project.create({ data });
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  return prisma.project.update({ where: { id }, data });
};

export const deleteProject = async (id: string) => {
  return prisma.project.delete({ where: { id } });
};
