import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "./theme";
import CRMHome from "./pages";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CRMHome />
    </ThemeProvider>
  );
}

export default App;
