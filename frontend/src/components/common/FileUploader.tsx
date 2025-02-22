import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface FileUploaderProps {
  onFileAccepted: (file: File) => void;
  accept: Record<string, string[]>;
  maxSize?: number;
  title: string;
  icon?: React.ReactNode;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileAccepted,
  accept,
  maxSize = 10485760, // 10MB por defecto
  title,
  icon = <AddIcon />,
}) => {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    onDropAccepted: ([file]) => onFileAccepted(file),
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Box
        {...getRootProps()}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: isDragReject
            ? 'error.main'
            : isDragActive
            ? 'primary.main'
            : 'grey.500',
          borderRadius: 1,
          bgcolor: isDragActive ? 'action.hover' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <IconButton
          sx={{
            mb: 1,
            bgcolor: 'action.selected',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          {icon}
        </IconButton>
        <Typography variant="body2" color="text.secondary" align="center">
          {isDragActive
            ? '¡Suelta el archivo aquí!'
            : isDragReject
            ? 'Archivo no válido'
            : title}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default FileUploader; 