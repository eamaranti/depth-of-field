import { Outlet, NavLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Tooltip,
  useTheme,
} from "@mui/material";
import { useColorMode } from "./ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="default" elevation={1} sx={{ borderBottom: "1px solid", borderColor: theme.palette.divider }}>
        <Toolbar variant="dense">
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Fotografica Zebra
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mr: 2 }}>
            <Button
              component={NavLink}
              to="/"
              color="inherit"
              sx={{
                "&.active": {
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                },
              }}
            >
              Profundidad de Campo
            </Button>
            <Button
              component={NavLink}
              to="/triangulo"
              color="inherit"
              sx={{
                "&.active": {
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                },
              }}
            >
              Triángulo de Exposición
            </Button>
          </Box>
          <Tooltip
            title={colorMode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <IconButton
              aria-label="Toggle color mode"
              size="small"
              onClick={toggleColorMode}
            >
              {colorMode === "dark" ? <FiSun /> : <FiMoon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default App;
