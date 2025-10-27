import React, { useState, useCallback, useEffect } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  TextField,
  InputAdornment,
  Card,
  CardContent
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { MaterialsPage } from "../materials";
import { ServicesPage } from "../services";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`items-tabpanel-${index}`}
      aria-labelledby={`items-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `items-tab-${index}`,
    "aria-controls": `items-tabpanel-${index}`,
  };
}

export const ItemsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle global search with debounce
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalSearch(value);

    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      // Global search is passed to child components via props
      // They will handle their own filtering based on globalSearch
      console.log('Global search updated:', value);
    }, 300);

    setSearchDebounce(timeout);
  }, [searchDebounce]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Items Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage materials and services for engineering projects
        </Typography>
      </Box>

      {/* Global Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search across all items (materials & services)..."
            value={globalSearch}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* Tab Bar */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="items tabs"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                minHeight: 60,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "2px 2px 0 0",
              },
            }}
          >
            <Tab 
              label="Materials" 
              {...a11yProps(0)}
              sx={{ minWidth: 120 }}
            />
            <Tab 
              label="Services" 
              {...a11yProps(1)}
              sx={{ minWidth: 120 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <MaterialsPage embedded={true} globalSearch={globalSearch} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ServicesPage embedded={true} globalSearch={globalSearch} />
        </TabPanel>
      </Paper>
    </Container>
  );
};
