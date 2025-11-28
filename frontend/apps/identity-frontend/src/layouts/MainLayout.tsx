import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 260;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'User';
    setUserEmail(email);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
    handleMenuClose();
  };

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'User Management', icon: <PeopleIcon />, path: '/users' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            U
          </Box>
          <div>
            <Typography sx={{ fontWeight: 700, color: '#1F2937', fontSize: '14px' }}>
              miniERP
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
              Identity
            </Typography>
          </div>
        </Box>
      </Box>

      {/* Menu Items */}
      <List sx={{ flex: 1, pt: 1.5 }}>
        {menuItems.map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                color: location.pathname === item.path ? '#3B82F6' : '#6B7280',
                bgcolor: location.pathname === item.path ? '#EFF6FF' : 'transparent',
                '&:hover': {
                  bgcolor: location.pathname === item.path ? '#EFF6FF' : '#F3F4F6',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                  minWidth: 40,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    fontSize: '14px',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            textTransform: 'none',
            color: '#EF4444',
            border: '1px solid #FCA5A5',
            '&:hover': { bgcolor: '#FEF2F2' },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'white',
          color: '#1F2937',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: 1201,
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
          {/* Hamburger + Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F2937' }}>
              Identity Service
            </Typography>
          </Box>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={handleMenuOpen}
              sx={{
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#1F2937',
                '&:hover': { bgcolor: '#F3F4F6' },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#3B82F6',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {userEmail[0]?.toUpperCase()}
              </Avatar>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                {userEmail.split('@')[0]}
              </Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography sx={{ fontSize: '14px' }}>{userEmail}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1, color: '#EF4444' }} />
                <Typography sx={{ color: '#EF4444', fontSize: '14px' }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Desktop */}
      <Box
        component="nav"
        sx={{
          width: { sm: DRAWER_WIDTH },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Add spacing for AppBar */}
        <Box sx={{ height: 64 }} />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
