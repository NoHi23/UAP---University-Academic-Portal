import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  Avatar
} from '@mui/material';
import {
  Home as HomeIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NavbarLecturer = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const handleNavigate = (path) => {
    navigate(path);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const api = (await import('../../services/api')).default;
        const res = await api.get('lecturer/profile');
        if (mounted && res?.data?.success) setProfile(res.data.data);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1100
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px', px: 2 }}>
        {/* Left side - Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Logo */}
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'white',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigate('/lecturer/dashboard')}
          >
            <HomeIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 500,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigate('/lecturer/dashboard')}
          >
            UAP - University Academic Portal
          </Typography>
        </Box>

        {/* Right side - Navigation items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Trang chủ */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => handleNavigate('/lecturer/dashboard')} // ✅ Navigate to dashboard
          >
            <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
            <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
              Trang chủ
            </Typography>
          </Box>

          {/* Thông báo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => handleNavigate('/lecturer/announcements')} // ✅ Navigate to announcements
          >
            <NotificationsIcon sx={{ color: 'white', fontSize: 20 }} />
            <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
              Thông báo
            </Typography>
          </Box>

          {/* User Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => handleNavigate('/lecturer/profile')}
          >
            <Avatar src={profile?.lecturerAvatar || undefined} sx={{ width: 36, height: 36 }} imgProps={{ style: { objectFit: 'cover' } }} />
            <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
              {profile ? `${profile.firstName || ''} ${profile.lastName || ''} (${profile.lecturerCode || ''})` : '—'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavbarLecturer;
