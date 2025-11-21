import React, { useState } from "react";
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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Engineering as EngineeringIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Build as BuildIcon,
  Calculate as CalculateIcon,
  Queue as QueueIcon,
  CheckCircle as ApprovalIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          py: 2,
          px: 2,
          bgcolor: "transparent",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {!imageError ? (
          <img
            src="/unais.png"
            alt="Company Logo"
            style={{ width: 160, height: 80, objectFit: "contain" }}
            onError={() => setImageError(true)}
          />
        ) : (
          <EngineeringIcon sx={{ fontSize: 56, color: theme.palette.primary.main }} />
        )}
      </Box>
    </Box>
  );
};

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiresRoles?: string[]; // Optional: only show for specific roles
}

const menuItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    text: "Items",
    icon: <BuildIcon />,
    path: "/items",
  },
  {
    text: "Antrian Estimasi",
    icon: <QueueIcon />,
    path: "/estimations/queue",
  },
  {
    text: "Approval Queue",
    icon: <ApprovalIcon />,
    path: "/estimations/approval-queue",
    requiresRoles: ["CEO", "PROJECT_MANAGER", "OPERATIONAL_MANAGER"],
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isItemSelected = (item: MenuItem): boolean => {
    if (item.path === "/dashboard" && location.pathname === "/") {
      return true;
    }
    if (item.path === "/items") {
      return location.pathname.startsWith("/items");
    }
    if (item.path === "/estimations/queue") {
      return location.pathname === "/estimations/queue";
    }
    if (item.path === "/estimations/approval-queue") {
      return location.pathname === "/estimations/approval-queue";
    }

    return location.pathname === item.path;
  };

  // Check if user has required roles for a menu item
  const hasRequiredRoles = (item: MenuItem): boolean => {
    if (!item.requiresRoles || item.requiresRoles.length === 0) {
      return true; // No role requirement, show to everyone
    }
    return item.requiresRoles.some(role => user?.roles?.includes(role));
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
      }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 0, textAlign: "center", bgcolor: "#ffffff" }}>
        <LogoContainer />
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, px: 2, mt: 2 }}>
        <List sx={{ p: 0 }}>
          {menuItems
            .filter(item => hasRequiredRoles(item))
            .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isItemSelected(item)}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  "&.Mui-selected": {
                    bgcolor: (theme) => `${theme.palette.primary.light}33`, // subtle translucent accent
                    color: (theme) => theme.palette.primary.main,
                    "& .MuiListItemIcon-root": {
                      color: (theme) => theme.palette.primary.main,
                    },
                    boxShadow: "inset 4px 0 0 0 rgba(8,48,107,0.08)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isItemSelected(item) ? (theme.palette.primary.main as any) : "#6c757d",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: isItemSelected(item) ? 600 : 400,
                    color: isItemSelected(item) ? (theme.palette.primary.main as any) : "#495057",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid #e9ecef", textAlign: "center", bgcolor: "#ffffff" }}>
        <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.75rem" }}>
          miniERP Engineering
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
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
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            miniERP Engineering - Cost Estimation
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => window.open("http://localhost:3000/dashboard", "_blank")}
            sx={{ mr: 1 }}
          >
            <HomeIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "http://localhost:3000";
            }}
          >
            <LogoutIcon />
          </IconButton>
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
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "none",
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
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
              boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
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
