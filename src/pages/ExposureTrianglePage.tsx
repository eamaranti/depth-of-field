import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Slider,
  Grid,
  Paper,
  Stack,
  useTheme,
  Chip,
} from "@mui/material";
import { TbAperture, TbClock, TbActivity } from "react-icons/tb";

import sampleImg from "../assets/cyclist_sample.png";

// Arrays of standard values for the exposure triangle
const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const SHUTTER_SPEEDS = [
  1 / 1000,
  1 / 500,
  1 / 250,
  1 / 125,
  1 / 60,
  1 / 30,
  1 / 15,
  1 / 8,
  1 / 4,
  1 / 2,
  1,
];
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];

// The target EV for a properly exposed scene
const TARGET_EV = 12;

function formatShutterSpeed(val: number) {
  if (val >= 1) return `${val}s`;
  return `1/${Math.round(1 / val)}`;
}

export default function ExposureTrianglePage() {
  const theme = useTheme();

  // Selected indices instead of raw values to easily snap to standard stops
  const [apertureIdx, setApertureIdx] = useState(4); // f/5.6
  const [shutterIdx, setShutterIdx] = useState(3); // 1/125
  const [isoIdx, setIsoIdx] = useState(2); // 400

  const aperture = APERTURES[apertureIdx];
  const shutter = SHUTTER_SPEEDS[shutterIdx];
  const iso = ISOS[isoIdx];

  // Calculate Exposure Value (EV)
  // EV = log2(N^2) - log2(t) - log2(ISO/100)
  const currentEV = useMemo(() => {
    const av = Math.log2(aperture * aperture);
    const tv = Math.log2(shutter);
    const sv = Math.log2(iso / 100);
    return av - tv - sv;
  }, [aperture, shutter, iso]);

  const evDiff = TARGET_EV - currentEV;

  // Visual Effects Calculations
  // Brightness: every 1 EV diff doubles or halves the light
  // Cap it between 0.1 (pitch black) and 5 (blown out white)
  const brightness = Math.min(5, Math.max(0.05, Math.pow(2, evDiff)));

  // Bokeh (Depth of Field): Wider aperture (smaller number) = more blur
  // f/1.4 => ~14px blur, f/22 => ~0.9px blur
  const bokehBlur = Math.max(0, 20 / aperture);

  // Motion Blur: Longer shutter = more horizontal blur.
  // 1/1000 => 0px, 1s => 50px
  const motionBlurX = shutter * 100;

  // Noise (Grain): Higher ISO = more noise overlay opacity
  // ISO 100 => 0, ISO 12800 => 0.8
  const isoStops = Math.log2(iso / 100);
  const maxIsoStops = Math.log2(12800 / 100);
  const noiseOpacity = (isoStops / maxIsoStops) * 0.8;

  // EV Meter Value (clamp for the UI meter between -3 and +3)
  const uiEvDiff = Math.min(3, Math.max(-3, evDiff));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Simulador del Triángulo de Exposición
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Ajusta la apertura, la velocidad de obturación y el ISO para ver cómo afectan la luz (exposición), la profundidad de campo (bokeh), el desenfoque de movimiento y el ruido digital en la fotografía.
      </Typography>

      <Grid container spacing={4}>
        {/* Visualizer Section */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ width: "100%" }}>
          <Paper
            elevation={3}
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              overflow: "hidden",
              backgroundColor: "#000",
              borderRadius: 2,
            }}
          >
            {/* SVG Filters Definition */}
            <svg style={{ width: 0, height: 0, position: "absolute" }}>
              <defs>
                {/* Motion Blur Filter */}
                <filter id="motion-blur" x="-20%" y="0%" width="140%" height="100%">
                  <feGaussianBlur stdDeviation={`${motionBlurX},0`} />
                </filter>
                {/* Noise Generator */}
                <filter id="noise">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.8"
                    numOctaves="3"
                    stitchTiles="stitch"
                  />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
              </defs>
            </svg>

            {/* Base Image Container (Brightness applied here) */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                filter: `brightness(${brightness})`,
                transition: "filter 0.3s ease-out",
              }}
            >
              {/* 1. Sharp Image with Motion Blur */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${sampleImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: motionBlurX > 0 ? "url(#motion-blur)" : "none",
                }}
              />

              {/* 2. Bokeh Overlay (Depth of Field) */}
              {/* Uses a radial mask to blur only the edges/background, keeping center sharp */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${sampleImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: `blur(${bokehBlur}px) ${motionBlurX > 0 ? "url(#motion-blur)" : ""}`,
                  maskImage:
                    "radial-gradient(circle at 50% 50%, transparent 15%, black 60%)",
                  WebkitMaskImage:
                    "radial-gradient(circle at 50% 50%, transparent 15%, black 60%)",
                }}
              />

              {/* 3. Noise Overlay */}
              {noiseOpacity > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: noiseOpacity,
                    filter: "url(#noise)",
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Box>

            {/* EV Meter Overlay */}
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "8px 16px",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                backdropFilter: "blur(4px)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                EV: {evDiff > 0 ? "+" : ""}{evDiff.toFixed(1)}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <Typography variant="caption">-3</Typography>
                <Box sx={{ width: 100, height: 6, backgroundColor: "#444", borderRadius: 3, position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      left: "50%",
                      width: 2,
                      height: 10,
                      backgroundColor: "white",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: `${50 + (uiEvDiff / 3) * 50}%`,
                      width: 4,
                      height: 6,
                      backgroundColor: Math.abs(evDiff) < 0.5 ? "#4caf50" : evDiff > 0 ? "#f44336" : "#2196f3",
                      borderRadius: "50%",
                      transform: "translateX(-50%)",
                      transition: "all 0.2s",
                    }}
                  />
                </Box>
                <Typography variant="caption">+3</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Controls Section */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: theme.palette.divider, borderRadius: 2 }}>
            <Stack spacing={4}>
              {/* Aperture */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbAperture size={20} color={theme.palette.text.secondary} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Apertura (f-stop)</Typography>
                  </Stack>
                  <Chip size="small" label={`f/${aperture}`} color="primary" variant="outlined" />
                </Stack>
                <Slider
                  value={apertureIdx}
                  min={0}
                  max={APERTURES.length - 1}
                  step={1}
                  marks={APERTURES.map((v, i) => ({ value: i, label: i % 2 === 0 ? `f/${v}` : "" }))}
                  onChange={(_, val) => setApertureIdx(val as number)}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Controla la cantidad de luz y la profundidad de campo (Bokeh).
                </Typography>
              </Box>

              {/* Shutter Speed */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbClock size={20} color={theme.palette.text.secondary} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Velocidad de Obturación</Typography>
                  </Stack>
                  <Chip size="small" label={formatShutterSpeed(shutter)} color="secondary" variant="outlined" />
                </Stack>
                <Slider
                  value={shutterIdx}
                  min={0}
                  max={SHUTTER_SPEEDS.length - 1}
                  step={1}
                  marks={SHUTTER_SPEEDS.map((v, i) => ({ value: i, label: i % 2 === 0 ? formatShutterSpeed(v) : "" }))}
                  onChange={(_, val) => setShutterIdx(val as number)}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Controla el tiempo que entra luz y congela/desenfoca el movimiento.
                </Typography>
              </Box>

              {/* ISO */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbActivity size={20} color={theme.palette.text.secondary} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>ISO</Typography>
                  </Stack>
                  <Chip size="small" label={iso} color="info" variant="outlined" />
                </Stack>
                <Slider
                  value={isoIdx}
                  min={0}
                  max={ISOS.length - 1}
                  step={1}
                  marks={ISOS.map((v, i) => ({ value: i, label: i % 2 === 0 ? v.toString() : "" }))}
                  onChange={(_, val) => setIsoIdx(val as number)}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Controla la sensibilidad a la luz y añade ruido digital (Grano).
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
