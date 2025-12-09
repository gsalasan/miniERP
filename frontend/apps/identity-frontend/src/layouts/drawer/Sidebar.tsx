import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Select,
  MenuItem as MuiMenuItem
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import Logo from './Logo';

interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path?: string;
  requiresRoles?: string[];
  children?: MenuItemType[];
}

interface SidebarProps {
  menuItems: MenuItemType[];
  drawerWidth: number;
  locationPath: string;
  userRoles?: string[];
  handleMenuClick: (path: string) => void;
}

const apps = ['App 1', 'App 2', 'App 3']; // dummy apps

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  drawerWidth,
  locationPath,
  userRoles,
  handleMenuClick,
}) => {
  const [selectedApp, setSelectedApp] = useState(apps[0]);
  const [openSubMenu, setOpenSubMenu] = useState<{ [key: string]: boolean }>({});

  const isItemSelected = (item: MenuItemType) =>
    locationPath === item.path || (item.path === '/dashboard' && locationPath === '/');

  const hasRequiredRoles = (item: MenuItemType) =>
    !item.requiresRoles || item.requiresRoles.some((role) => userRoles?.includes(role));

  const toggleSubMenu = (text: string) => {
    setOpenSubMenu((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const renderMenuItem = (item: MenuItemType) => {
    const hasChildren = item.children && item.children.length > 0;
    if (!hasRequiredRoles(item)) return null;

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            selected={isItemSelected(item)}
            onClick={() => {
              if (hasChildren) toggleSubMenu(item.text);
              else if (item.path) handleMenuClick(item.path);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
            {hasChildren ? openSubMenu[item.text] ? <ExpandLess /> : <ExpandMore /> : null}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={openSubMenu[item.text]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {item.children!.map((child) => {
                if (!hasRequiredRoles(child)) return null;
                return (
                  <ListItem key={child.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      selected={isItemSelected(child)}
                      onClick={() => child.path && handleMenuClick(child.path)}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Logo />

      {/* App Select */}
      <Box sx={{ px: 2 }}>
        <Select
          fullWidth
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          size="small"
          sx={{ mt: 1 }}
        >
          {apps.map((app) => (
            <MuiMenuItem key={app} value={app}>
              {app}
            </MuiMenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ flexGrow: 1, px: 2, mt: 2 }}>
        <List>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #e9ecef', textAlign: 'center' }}>
        miniERP v.1.1
      </Box>
    </Box>
  );
};

export default Sidebar;
