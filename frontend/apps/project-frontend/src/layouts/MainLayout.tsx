import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Folder as ProjectIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

// Logo Component with fallback
const LogoContainer: React.FC = () => {
  const [imageError, setImageError] = React.useState(false);
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          py: 2,
          px: 2,
          bgcolor: 'transparent',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!imageError ? (
          <img
            src="/unais.png"
            alt="Company Logo"
            style={{ width: 160, height: 80, objectFit: 'contain' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <WorkIcon sx={{ fontSize: 56, color: theme.palette.primary.main }} />
        )}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          color: theme.palette.primary.main,
          mb: 2,
        }}
      >
        Project Management
      </Typography>
    </Box>
  );
};

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    text: 'Project Workspace',
    icon: <ProjectIcon />,
    path: '/',
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const handleBackToDashboard = () => {
    window.location.href = 'http://localhost:3000/dashboard';
  };

  const isItemSelected = (item: MenuItem): boolean => {
    return location.pathname === item.path;
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
      }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 0, textAlign: 'center', bgcolor: '#ffffff' }}>
        <LogoContainer />
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, px: 2, mt: 2 }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isItemSelected(item)}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: (theme) => `${theme.palette.primary.light}33`,
                    color: (theme) => theme.palette.primary.main,
                    '& .MuiListItemIcon-root': {
                      color: (theme) => theme.palette.primary.main,
                    },
                    boxShadow: 'inset 4px 0 0 0 rgba(8,48,107,0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isItemSelected(item)
                      ? theme.palette.primary.main
                      : '#6c757d',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isItemSelected(item) ? 600 : 400,
                    color: isItemSelected(item)
                      ? theme.palette.primary.main
                      : '#495057',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e9ecef',
          textAlign: 'center',
          bgcolor: '#ffffff',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: '#6c757d', fontSize: '0.75rem' }}
        >
          miniERP Project Management
        </Typography>
        <Typography
          variant="caption"
          display="block"
          sx={{ color: '#adb5bd', fontSize: '0.7rem', mt: 0.5 }}
        >
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            miniERP - Project Management
          </Typography>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleBackToDashboard}
              sx={{ mr: 1 }}
              title="Kembali ke Dashboard"
            >
              <HomeIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleUserMenuClick}
              size="small"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '0.9rem',
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>

          {/* User Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.full_name || user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: 3,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
