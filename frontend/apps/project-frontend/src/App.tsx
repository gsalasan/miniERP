import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Card, CardContent, Grid, Button, Alert } from "@mui/material";
import { Assignment, Timeline, Group, Assessment } from "@mui/icons-material";

const ProjectApp: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check for cross-app authentication
    const crossAppToken = localStorage.getItem("cross_app_token");
    const crossAppUser = localStorage.getItem("cross_app_user");
    
    if (crossAppToken && crossAppUser) {
      try {
        setUser(JSON.parse(crossAppUser));
        // Set the main token for API calls
        localStorage.setItem("token", crossAppToken);
      } catch (err) {
        setError("Invalid user data");
      }
    } else {
      setError("No authentication data found. Please login from the main dashboard.");
    }
  }, []);

  const handleBackToDashboard = () => {
    window.close();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Project Management
          </Typography>
          {user && (
            <Typography variant="subtitle1" color="text.secondary">
              Welcome, {user.email}
            </Typography>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {user ? (
          <Grid container spacing={3}>
            {/* Quick Stats */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Assignment color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Projects</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total projects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Timeline color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Tasks</Typography>
                  </Box>
                  <Typography variant="h4" color="secondary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending tasks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Group color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Team Members</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active members
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Assessment color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Reports</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generated reports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button variant="contained" color="primary">
                      Create Project
                    </Button>
                    <Button variant="outlined" color="primary">
                      Manage Tasks
                    </Button>
                    <Button variant="outlined" color="secondary">
                      View All Projects
                    </Button>
                    <Button variant="outlined" color="warning">
                      Generate Report
                    </Button>
                    <Button variant="outlined" onClick={handleBackToDashboard}>
                      Back to Dashboard
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" gutterBottom>
                Authentication Required
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please login from the main dashboard to access Project Management features.
              </Typography>
              <Button variant="contained" onClick={handleBackToDashboard}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ProjectApp;
