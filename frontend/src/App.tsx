import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import Editor from './pages/Editor';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app-root">
          <Editor />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App; 