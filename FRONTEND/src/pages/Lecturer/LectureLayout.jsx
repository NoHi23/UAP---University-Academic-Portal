import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import EventNoteIcon from '@mui/icons-material/EventNote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
// CheckCircleIcon removed (attendance sidebar item deleted)
import FeedbackIcon from '@mui/icons-material/Feedback';
import StarIcon from '@mui/icons-material/Star';
import CreateIcon from '@mui/icons-material/Create';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import { notifySuccess, showConfirmDialog } from '../../services/notificationService';

import { Outlet, useNavigate } from 'react-router-dom';

const drawerWidth = 260;

//  Theme (reuse staff theme)
const theme = createTheme({
  palette: {
    primary: { main: '#282E4E' },
    secondary: { main: '#C8BDB0' },
    accent: { main: '#F4E3CF' },
    background: { default: '#f9fafb', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
  },
});

//  AppBar
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: '#282E4E',
  height: 55,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

//  Drawer
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      backgroundColor: '#F4E3CF',
      color: '#282E4E',
      transition: theme.transitions.create('width'),
      boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
      ...(open
        ? {}
        : {
          overflowX: 'hidden',
          width: theme.spacing(7),
          [theme.breakpoints.up('sm')]: { width: theme.spacing(9) },
        }),
    },
  }),
);

// Styled List Item
const StyledListItemButton = styled(ListItemButton)(({ selected }) => ({
  borderRadius: 8,
  margin: '4px 8px',
  transition: '0.2s',
  '&:hover': { backgroundColor: '#C8BDB030' },
  ...(selected && {
    backgroundColor: '#C8BDB050',
    '& .MuiListItemText-primary': { color: '#282E4E', fontWeight: 600 },
  }),
}));

export default function LecturerLayout() {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const [active, setActive] = React.useState('/lecturer/dashboard');
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    setTimeout(() => {
      setUser({
        fullName: 'Nguyễn Văn A',
        staffCode: 'GV123456',
      });
    }, 400);
  }, []);

  const handleNav = (path) => {
    setActive(path);
    navigate(path);
  };

  const handleSignOut = async () => {
    const result = await showConfirmDialog({
      title: 'Đăng xuất?',
      text: 'Bạn chắc chắn muốn đăng xuất?',
      icon: 'warning',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      notifySuccess('Đăng xuất thành công');
      navigate('/', { replace: true });
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/lecturer/dashboard' },
    { text: 'Hồ sơ', icon: <AccountBoxIcon />, path: '/lecturer/profile' },
    { text: 'Lớp', icon: <ImageIcon />, path: '/lecturer/class-info' },
    { text: 'TKB', icon: <EventNoteIcon />, path: '/lecturer/view-teaching-schedule' },
    // 'Điểm danh' removed from sidebar (attendance is accessible from attendance-list)

    { text: 'Tài liệu', icon: <MenuBookIcon />, path: '/lecturer/material' },
    { text: 'Góp ý', icon: <FeedbackIcon />, path: '/lecturer/feedback' },
    { text: 'Đánh giá', icon: <StarIcon />, path: '/lecturer/evaluations' },
    { text: 'Nhập điểm', icon: <CreateIcon />, path: '/lecturer/enter-grades' },
    { text: 'Điểm', icon: <BarChartIcon />, path: '/lecturer/student-grades' },

    { text: 'DS điểm danh', icon: <ListAltIcon />, path: '/lecturer/attendance-list' },
    { text: 'TB', icon: <NotificationsIcon />, path: '/lecturer/announcements' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        <AppBar position="fixed" open={open}>
          <Toolbar
            sx={{
              minHeight: 55,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setOpen(!open)}
                sx={{
                  mr: 1,
                  color: '#F4E3CF',
                }}
              >
                <MenuIcon />
              </IconButton>
              <Avatar
                src="/UAP.png"
                alt="UAP Logo"
                sx={{ width: 30, height: 30, bgcolor: 'transparent' }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#F4E3CF',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                UAP - University Academic Portal
              </Typography>
            </Box>

            {user ? (
              <Chip
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: '#C8BDB0',
                      width: 22,
                      height: 22,
                      color: '#282E4E',
                      fontSize: 12,
                    }}
                  >
                    {user.fullName.charAt(0)}
                  </Avatar>
                }
                label={`${user.fullName} (${user.staffCode})`}
                sx={{
                  color: '#282E4E',
                  bgcolor: '#C8BDB0',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                }}
              />
            ) : (
              <Chip label="Loading..." sx={{ bgcolor: '#C8BDB0', color: '#282E4E' }} />
            )}
          </Toolbar>
        </AppBar>

        <Drawer variant="permanent" open={open}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Toolbar
              sx={{
                minHeight: 50,
                display: 'flex',
                justifyContent: open ? 'space-between' : 'center',
                alignItems: 'center',
                px: 1,
              }}
            >
              {open && (
                <Typography sx={{ fontWeight: 600, color: '#282E4E' }}>Lecturer Menu</Typography>
              )}
              <IconButton onClick={() => setOpen(!open)}>
                {open ? (
                  <ChevronLeftIcon sx={{ color: '#282E4E' }} />
                ) : (
                  <MenuIcon sx={{ color: '#282E4E' }} />
                )}
              </IconButton>
            </Toolbar>
            <Divider />

            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {menuItems.map((item) => (
                <StyledListItemButton
                  key={item.text}
                  selected={active === item.path}
                  onClick={() => handleNav(item.path)}
                >
                  <ListItemIcon sx={{ color: '#282E4E' }}>{item.icon}</ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                </StyledListItemButton>
              ))}
            </List>

            <Divider />

            <Box sx={{ p: open ? 1 : 0.5, pb: 2 }}>
              <Tooltip title="Sign Out">
                <ListItemButton
                  onClick={handleSignOut}
                  sx={{
                    borderRadius: 2,
                    justifyContent: open ? 'flex-start' : 'center',
                    px: open ? 2 : 1,
                    py: 0.8,
                    transition: '0.2s',
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'error.main',
                      minWidth: open ? 36 : 0,
                    }}
                  >
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary="Sign Out"
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </Box>
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{
            backgroundColor: '#f9fafb',
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar sx={{ minHeight: 55 }} />
          <Container sx={{ mt: 4, mb: 4 }}>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                p: 3,
              }}
            >
              <Outlet />
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}