import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';

const router = Router();

// Obtener todos los proyectos
router.get('/', getProjects);

// Obtener un proyecto específico
router.get('/:id', getProject);

// Crear un nuevo proyecto
router.post('/', createProject);

// Actualizar un proyecto
router.put('/:id', updateProject);

// Eliminar un proyecto
router.delete('/:id', deleteProject);

export default router; 