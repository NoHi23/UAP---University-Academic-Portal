import React, { useContext, useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    useTheme,
    Avatar,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon
} from '@mui/material';
import {
    Home as HomeIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    AccountCircle as AccountIcon,
    ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const NavbarStudent = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // State to store student info
    const [studentInfo, setStudentInfo] = useState({
        fullName: '',
        studentCode: '',
        avatarUrl: 'https://i.pravatar.cc/150', // Default avatar
    });

    const [anchorEl, setAnchorEl] = useState(null);  // State to control the dropdown menu

    // Fetch student profile information
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:9999/api/student/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const studentData = await res.json();
                setStudentInfo({
                    fullName: `${studentData.firstName} ${studentData.lastName}`,
                    studentCode: studentData.studentCode,
                    avatarUrl: studentData.studentAvatar || 'https://i.pravatar.cc/150', // Default avatar if not available
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Fetch profile when the component mounts
    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle navigation
    const handleNavigate = (path) => {
        navigate(path);
    };

    // Handle click on the avatar to open the dropdown menu
    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Clear token from localStorage
        navigate('/'); // Redirect to login page
        setAnchorEl(null); // Close the menu
    };

    // Close the dropdown menu
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: theme.palette.primary.main,
                zIndex: 1100,
                height: 55,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <Toolbar sx={{ minHeight: '55px', display: 'flex', justifyContent: 'space-between', px: 2 }}>
                {/* Left side - Logo and Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src="/UAP.png"
                        alt="UAP Logo"
                        sx={{ width: 30, height: 30, bgcolor: 'transparent' }}
                    />

                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '1rem',
                            cursor: 'pointer',
                        }}
                        onClick={() => handleNavigate('/student/dashboard')}
                    >
                        UAP - University Academic Portal
                    </Typography>
                </Box>

                {/* Right side - Navigation items */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* Home */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => handleNavigate('/student/dashboard')}
                    >
                        <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
                        <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Trang chủ</Typography>
                    </Box>

                    {/* Notifications */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => handleNavigate('/student/announcements')}
                    >
                        <NotificationsIcon sx={{ color: 'white', fontSize: 20 }} />
                        <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Thông báo</Typography>
                    </Box>

                    {/* User Info with Dropdown */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                        onClick={handleMenuClick} // Open dropdown menu
                    >
                        {studentInfo.fullName ? (
                            <Chip
                                avatar={<Avatar src={studentInfo.avatarUrl} />}
                                label={`${studentInfo.fullName} - ${studentInfo.studentCode}`}
                                sx={{
                                    color: 'white',
                                    bgcolor: '#C8BDB0',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    height: 36,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            />
                        ) : (
                            <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>Sinh viên</Typography>
                        )}
                    </Box>
                </Box>
            </Toolbar>

            {/* Dropdown Menu for User */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{ mt: 1, minWidth: 200 }}
            >

                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </AppBar>
    );
};

export default NavbarStudent;
