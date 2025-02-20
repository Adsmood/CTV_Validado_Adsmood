import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import type { Project, ErrorResponse, SuccessResponse } from '../types/index.js';
import { generateApiKey } from '../utils/apiKey.js';
import { convertPrismaProject } from '../utils/typeConverters.js';

export const getProjects = async (_req: Request, res: Response<SuccessResponse<Project[]> | ErrorResponse>) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        campaigns: {
          include: {
            analytics: true
          }
        }
      }
    });

    const formattedProjects = projects.map(convertPrismaProject);

    res.json({
      data: formattedProjects
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      error: 'Error al obtener los proyectos',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const getProject = async (req: Request, res: Response<SuccessResponse<Project> | ErrorResponse>) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            analytics: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Proyecto no encontrado'
      });
    }

    const formattedProject = convertPrismaProject(project);

    res.json({
      data: formattedProject
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({
      error: 'Error al obtener el proyecto',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const createProject = async (req: Request, res: Response<SuccessResponse<Project> | ErrorResponse>) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'El nombre del proyecto es requerido'
      });
    }

    const apiKey = generateApiKey();
    const project = await prisma.project.create({
      data: {
        name,
        description: description || undefined,
        apiKey
      },
      include: {
        campaigns: {
          include: {
            analytics: true
          }
        }
      }
    });

    const formattedProject = convertPrismaProject(project);

    res.status(201).json({
      data: formattedProject,
      message: 'Proyecto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      error: 'Error al crear el proyecto',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const updateProject = async (req: Request, res: Response<SuccessResponse<Project> | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'El nombre del proyecto es requerido'
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description: description || undefined
      },
      include: {
        campaigns: {
          include: {
            analytics: true
          }
        }
      }
    });

    const formattedProject = convertPrismaProject(project);

    res.json({
      data: formattedProject,
      message: 'Proyecto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      error: 'Error al actualizar el proyecto',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const deleteProject = async (req: Request, res: Response<SuccessResponse<void> | ErrorResponse>) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id }
    });

    res.json({
      data: undefined,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      error: 'Error al eliminar el proyecto',
      details: error instanceof Error ? error.message : undefined
    });
  }
}; 