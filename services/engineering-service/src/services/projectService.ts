import { Project } from '@prisma/client';
import prisma from '../prisma/client';

export const getProjects = async () => {
  return prisma.projects.findMany({
    include: {
      customers: true,
      estimations: true,
      project_boms: true,
      milestones: true,
    },
  });
};

export const getProjectById = async (id: string) => {
  return prisma.projects.findUnique({
    where: { id },
    include: {
      customers: true,
      estimations: true,
      project_boms: true,
      milestones: true,
    },
  });
};

export const createProject = async (data: Project) => {
  return prisma.projects.create({ data });
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  return prisma.projects.update({ where: { id }, data });
};

export const deleteProject = async (id: string) => {
  return prisma.projects.delete({ where: { id } });
};
