import { useState } from "react";
import {
  Box,
  Typography,
  Slider,
  Paper,
  Stack,
  ThemeProvider,
  createTheme,
} from "@mui/material";

const F_STOPS = [1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16, 22];

export default function ApertureSimulatorPage() {
  const [apertureIdx, setApertureIdx] = useState(0); // f/1.4 default
  const currentFStop = F_STOPS[apertureIdx];

  // We force a dark theme for this specific page to make the light pop
  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#000000",
        paper: "#111111",
      },
      primary: {
        main: "#2196f3",
      },
    },
  });

  // Radius calculation:
  // Base radius for f/1.4 is 140.
  // The radius should scale inversely with the f-stop value.
  const r = Math.max(8, 140 * (1.4 / currentFStop));

  // Light calculation:
  // Light is inversely proportional to the square of the f-stop.
  // But we want a percentage for the progress bar.
  // Area = pi * r^2. Max area = pi * 140^2.
  const lightPercentage = ((r * r) / (140 * 140)) * 100;

  // Depth of field text
  let dofText = "";
  if (currentFStop <= 2.8) dofText = "Mínima (Fondo muy desenfocado / Bokeh)";
  else if (currentFStop <= 5.6) dofText = "Poca (Sujeto nítido, fondo suave)";
  else if (currentFStop <= 11) dofText = "Media (Buena nitidez general)";
  else dofText = "Máxima (Toda la escena nítida)";

  return (
    <ThemeProvider theme={darkTheme}>
      {/* We apply a local dark background to this page wrapper so we don't mess up the global layout background, 
          but we ensure the components inside use dark mode styling */}
      <Box sx={{ minHeight: "calc(100vh - 48px)", bgcolor: "background.default", color: "text.primary", pt: 4, pb: 8 }}>
        <Box sx={{ px: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Simulador de Diafragma
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Observa el comportamiento mecánico del lente. Valores pequeños de f/ (gran apertura) dejan entrar mucha luz pero reducen la zona de nitidez.
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ alignItems: "flex-start" }}>
            
            {/* LENS GRAPHIC (SVG) */}
            <Box sx={{ flex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 500, aspectRatio: "1/1", position: "relative" }}>
                <svg viewBox="-200 -200 400 400" style={{ width: "100%", height: "100%", filter: "drop-shadow(0px 0px 20px rgba(255,255,255,0.1))" }}>
                  <defs>
                    <radialGradient id="lensGlass" cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor="#2a2a2a" />
                      <stop offset="90%" stopColor="#111" />
                      <stop offset="100%" stopColor="#050505" />
                    </radialGradient>
                    <radialGradient id="lightHole" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                      <stop offset="50%" stopColor="#fffae6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ffb74d" stopOpacity={0.4} />
                    </radialGradient>
                  </defs>

                  {/* Outer Lens Barrel */}
                  <circle cx="0" cy="0" r="195" fill="#1a1a1a" stroke="#333" strokeWidth="4" />
                  <circle cx="0" cy="0" r="180" fill="url(#lensGlass)" stroke="#0a0a0a" strokeWidth="8" />
                  
                  {/* The Light entering the hole */}
                  {/* It's always a circle, but the blades will cover it, making it look like an octagon! */}
                  <circle cx="0" cy="0" r={160} fill="url(#lightHole)" />

                  {/* Aperture Blades */}
                  <g>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                      const angle = i * 45;
                      return (
                        <g 
                          key={i} 
                          style={{
                            transform: `rotate(${angle}deg) translate(0px, -${r}px)`,
                            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        >
                          <polygon 
                            points="-200,0 200,0 200,-250 -200,-250" 
                            fill="#151515" 
                            stroke="#333" 
                            strokeWidth="1.5"
                            strokeOpacity="0.8"
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* Inner Lens Ring Overlay (to cover the sharp edges of blades flying outside the barrel) */}
                  <path 
                    d="M 0 -200 A 200 200 0 1 0 0 200 A 200 200 0 1 0 0 -200 Z M 0 -175 A 175 175 0 1 1 0 175 A 175 175 0 1 1 0 -175 Z" 
                    fill="#111" 
                  />
                  <circle cx="0" cy="0" r="175" fill="none" stroke="#222" strokeWidth="2" />
                  <circle cx="0" cy="0" r="160" fill="none" stroke="#000" strokeWidth="4" />

                </svg>
              </Box>
            </Box>

            {/* CONTROLS & FEEDBACK */}
            <Stack spacing={4} sx={{ flex: 1, width: "100%" }}>
              
              <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "#333" }} elevation={4}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: "bold" }}>
                  Apertura Seleccionada
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: "900", fontFamily: "monospace", color: "primary.main", mb: 2 }}>
                  f/{currentFStop.toFixed(1).replace('.0', '')}
                </Typography>

                <Box sx={{ mt: 4, mb: 2 }}>
                  <Slider
                    value={apertureIdx}
                    min={0}
                    max={F_STOPS.length - 1}
                    step={1}
                    marks={F_STOPS.map((val, idx) => ({ value: idx, label: `f/${val}` }))}
                    onChange={(_, val) => setApertureIdx(val as number)}
                    sx={{
                      '& .MuiSlider-markLabel': { color: 'text.secondary', fontSize: '0.75rem', mt: 1 },
                      '& .MuiSlider-markLabelActive': { color: 'text.primary', fontWeight: 'bold' },
                      '& .MuiSlider-thumb': { width: 28, height: 28 }, // large touch target
                      padding: "20px 0",
                    }}
                  />
                </Box>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "#333" }} elevation={4}>
                <Stack spacing={3}>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Luz Entrante
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      <Typography variant="body2" sx={{ width: 60 }}>Mínima</Typography>
                      <Box sx={{ flexGrow: 1, position: "relative", height: 10, borderRadius: 5, overflow: "hidden", bgcolor: "#333" }}>
                        <Box 
                          sx={{ 
                            position: "absolute", top: 0, left: 0, height: "100%", width: `${lightPercentage}%`,
                            background: "linear-gradient(90deg, #f57f17 0%, #ffee58 100%)",
                            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                          }} 
                        />
                      </Box>
                      <Typography variant="body2" sx={{ width: 60, textAlign: "right" }}>Máxima</Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Profundidad de Campo (Zona Nítida)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {dofText}
                    </Typography>
                  </Box>

                </Stack>
              </Paper>

            </Stack>
          </Stack>

        </Box>
      </Box>
    </ThemeProvider>
  );
}
