import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Avatar } from '@mui/material';
import { Menu as MenuIcon, Home as HomeIcon } from '@mui/icons-material';
import UserMenu from './UserMenu';

interface NavbarProps {
  handleDrawerToggle: () => void;
  isMobile: boolean;
  user?: any;
  logout: () => void;
  sidebarOpen: boolean; // baru
  drawerWidth: number;  // baru
}

const Navbar: React.FC<NavbarProps> = ({ handleDrawerToggle, isMobile, user, logout, sidebarOpen, drawerWidth }) => {

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: '#fff',
        color: '#000',
        boxShadow: 1,
        width: { md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
        ml: { md: sidebarOpen ? `${drawerWidth}px` : 0 },
        transition: 'all 0.3s',
      }}
    >
      <Toolbar>
        <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => (window.location.href = 'http://localhost:3000/dashboard')}
            title="Kembali ke Dashboard"
          >
            <HomeIcon />
          </IconButton>
          <UserMenu user={user} logout={logout} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
