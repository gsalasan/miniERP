import React, { useState } from 'react';
import { IconButton, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, Box } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

interface UserMenuProps {
  user?: any;
  logout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, logout }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="small">
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(0,0,0,0.1)', fontSize: '0.9rem' }}>
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="body2" fontWeight={600}>{user?.name || user?.email}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
