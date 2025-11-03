import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Store as VendorsIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as PurchasesIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { NAVIGATION } from "../config/environments";

const drawerWidth = 280;interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleHomeClick = () => {
    window.location.href = NAVIGATION.HOME;
  };

  const handleLogoutClick = () => {
    // Clear any stored auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    // Redirect to login page
    window.location.href = NAVIGATION.LOGIN;
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Vendors", icon: <VendorsIcon />, path: "/vendors" },
    { text: "Purchases", icon: <PurchasesIcon />, path: "/purchases" },
  ];

  const drawer = (
    <Box sx={{ overflow: "auto", height: "100%", bgcolor: "#F4F4F4" }}>
      <Box
        sx={{
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 96,
          width: "100%",
        }}
      >
        <img
          src="/unais.png"
          alt="UNAIS Logo"
          style={{ height: 72, width: "auto", objectFit: "contain", padding: 4 }}
        />
      </Box>
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  backgroundColor: isActive ? "#06103A" : "transparent",
                  color: isActive ? "white" : "#333333",
                  "&:hover": { backgroundColor: isActive ? "#4E88BE" : "rgba(6,16,58,0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "white" : "#6B6E70", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          bgcolor: "white",
          color: "text.primary",
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Procurement
          </Typography>

          {/* Right side icons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleHomeClick}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(6, 16, 58, 0.08)",
                },
              }}
              title="Home"
            >
              <HomeIcon />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleLogoutClick}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(6, 16, 58, 0.08)",
                },
              }}
              title="Logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                border: "none",
                borderRight: "1px solid #dee2e6",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "#F4F4F4",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;