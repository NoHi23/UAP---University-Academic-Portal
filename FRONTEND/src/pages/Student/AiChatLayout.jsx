import React from 'react';
import { Box, Drawer, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';

const drawerWidth = 280;

const AiChatLayout = () => {
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative', 
            backgroundColor: '#f0f2f5' 
          },
        }}
      >
        <ChatSidebar />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 0,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Outlet /> 
      </Box>
    </Box>
  );
};

export default AiChatLayout;