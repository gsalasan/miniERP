import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme, Drawer } from '@mui/material';
import Navbar from './drawer/Navbar';
import Sidebar from './drawer/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface LayoutProps { children: React.ReactNode }

const drawerWidth = 280;

// Menu items dummy
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    text: 'User Management',
    icon: <DashboardIcon />,
    children: [
      { text: 'Users', icon: <DashboardIcon />, path: '/users' },
      { text: 'Roles', icon: <DashboardIcon />, path: '/roles' },
    ],
  },
];

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => setSidebarOpen(prev => !prev);

  const handleMenuClick = (path: string) => {
    window.location.pathname = path;
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
        user={user}
        logout={logout}
        sidebarOpen={sidebarOpen}   // pass
        drawerWidth={drawerWidth}   // pass
      />

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Sidebar
          menuItems={menuItems}
          drawerWidth={drawerWidth}
          locationPath={window.location.pathname}
          userRoles={user?.roles}
          handleMenuClick={handleMenuClick}
        />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: 'all 0.3s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
