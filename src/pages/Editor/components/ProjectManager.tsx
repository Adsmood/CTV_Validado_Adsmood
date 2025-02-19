import React, { useState } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Stack,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as FolderIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import useProjectStore from '../../../stores/projectStore';
import { useEditorStore } from '../../../stores/editorStore';

const ProjectManager: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const { projects, currentProject, saveProject, loadProject, deleteProject, closeProject } = useProjectStore();
  const { elements } = useEditorStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!projectName.trim()) {
      console.log('Nombre de proyecto vacío');
      return;
    }
    
    try {
      console.log('Iniciando guardado del proyecto:', projectName);
      setIsSaving(true);
      const savedProject = await saveProject(projectName);
      console.log('Proyecto guardado exitosamente:', savedProject);
      setProjectName('');
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    console.log('Abriendo diálogo de guardado');
    setSaveDialogOpen(true);
  };

  const handleLoad = async (id: string) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      if (currentProject && elements.length > 0) {
        setCloseDialogOpen(true);
        return;
      }
      await loadProject(id);
      setOpen(false);
    } catch (error) {
      console.error('Error al cargar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || isDeleting) return;
    
    try {
      setIsDeleting(true);
      if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
        await deleteProject(id);
        if (currentProject?.id === id) {
          await closeProject();
        }
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseProject = async (shouldSave: boolean) => {
    try {
      if (shouldSave && elements.length > 0) {
        setSaveDialogOpen(true);
        setCloseDialogOpen(false);
      } else {
        await closeProject();
        setCloseDialogOpen(false);
      }
    } catch (error) {
      console.error('Error al cerrar el proyecto:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Stack spacing={1}>
      <span>
        <Tooltip title="Guardar proyecto" placement="right">
          <Box>
            <IconButton 
              onClick={handleSaveClick}
              disabled={isSaving}
              sx={{
                width: '44px',
                height: '44px',
                '&.Mui-disabled': {
                  opacity: 0.5,
                }
              }}
            >
              <SaveIcon />
            </IconButton>
          </Box>
        </Tooltip>
      </span>
      
      <span>
        <Tooltip title="Abrir proyecto" placement="right">
          <Box>
            <IconButton 
              onClick={() => setOpen(true)}
              sx={{
                width: '44px',
                height: '44px',
              }}
            >
              <FolderIcon />
            </IconButton>
          </Box>
        </Tooltip>
      </span>

      <span>
        <Tooltip title="Cerrar proyecto" placement="right">
          <Box>
            <IconButton 
              onClick={() => setCloseDialogOpen(true)}
              disabled={!currentProject && elements.length === 0}
              sx={{
                width: '44px',
                height: '44px',
                '&.Mui-disabled': {
                  opacity: 0.5,
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Tooltip>
      </span>

      {/* Diálogo de guardado */}
      <Dialog 
        open={saveDialogOpen} 
        onClose={() => !isSaving && setSaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Guardar proyecto
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isSaving}
              autoFocus
              error={projectName.trim() === ''}
              helperText={projectName.trim() === '' ? 'El nombre es requerido' : ''}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isSaving && projectName.trim()) {
                  handleSave();
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSaveDialogOpen(false)} 
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!projectName.trim() || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de cerrar proyecto */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle>
          Cerrar proyecto
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Deseas guardar los cambios antes de cerrar el proyecto?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseProject(false)} color="error">
            No guardar
          </Button>
          <Button onClick={() => handleCloseProject(true)} color="primary">
            Guardar
          </Button>
          <Button onClick={() => setCloseDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de proyectos */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mis proyectos
          </Typography>

          {projects.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                No hay proyectos guardados
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={project.thumbnail || '/placeholder.png'}
                      alt={project.name}
                      sx={{
                        bgcolor: 'action.hover',
                        objectFit: 'contain',
                      }}
                    />
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Modificado: {formatDate(project.lastModified)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => {
                          handleLoad(project.id);
                        }}
                      >
                        Abrir
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(project.id)}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Dialog>
    </Stack>
  );
};

export default ProjectManager; 