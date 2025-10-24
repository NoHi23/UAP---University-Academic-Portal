import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import NavbarStudent from '../../components/NavBar/NavbarStudent';

const StudentLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Navbar */}
            <NavbarStudent />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: '#f5f5f5',
                    minHeight: 'calc(100vh - 64px)'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default StudentLayout;