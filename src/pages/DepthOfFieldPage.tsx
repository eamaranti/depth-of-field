import { useState } from "react";
import {
  Slider,
  Box,
  Typography,
  Select,
  Button,
  Grid,
  Chip,
  Divider,
  MenuItem,
  useTheme,
  Stack,
  FormControl,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { TbRuler, TbAperture, TbZoomIn, TbUser } from "react-icons/tb";
import { FiCamera, FiChevronDown } from "react-icons/fi";
import { toImperial, toMetric } from "../utils/units";

import PhotographyGraphic, { SUBJECTS } from "../PhotographyGraphic";

const CIRCLES_OF_CONFUSION: Record<
  string,
  {
    coc: number;
    sensorHeight: number;
    cropFactor: number;
  }
> = {
  Webcam: {
    coc: 0.002,
    sensorHeight: 3.6,
    cropFactor: 9.6
  },
  Smartphone: {
    coc: 0.002,
    sensorHeight: 7.3,
    cropFactor: 6.1
  },
  "35mm (formato completo)": {
    coc: 0.029,
    sensorHeight: 24,
    cropFactor: 1.0
  },
  "APS-C": {
    coc: 0.019,
    sensorHeight: 15.6,
    cropFactor: 1.52
  },
  "Micro Cuatro Tercios": {
    coc: 0.015,
    sensorHeight: 13,
    cropFactor: 2.0
  },
  "6x6 (Formato Medio)": {
    coc: 0.02,
    sensorHeight: 60,
    cropFactor: 0.55
  },
  "6x7 (Formato Medio)": {
    coc: 0.025,
    sensorHeight: 70,
    cropFactor: 0.47
  },
};

const COMMON_SETUPS: {
  name: string;
  focalLength: number;
  aperture: number;
  idealDistance: number;
  sensor: string;
}[] = [
    {
      name: "Webcam",
      focalLength: 3.6,
      aperture: 2.8,
      idealDistance: 36,
      sensor: "Webcam",
    },
    {
      name: "Smartphone",
      focalLength: 4.3,
      aperture: 2.0,
      idealDistance: 36,
      sensor: "Smartphone",
    },
    {
      name: "APS-C - 35mm",
      focalLength: 35,
      aperture: 1.8,
      idealDistance: 72,
      sensor: "APS-C",
    },
    {
      name: "FF - 28mm",
      focalLength: 28,
      aperture: 1.4,
      idealDistance: 48,
      sensor: "35mm (formato completo)",
    },
    {
      name: "FF - 35mm",
      focalLength: 35,
      aperture: 1.4,
      idealDistance: 60,
      sensor: "35mm (formato completo)",
    },
    {
      name: "FF - 50mm",
      focalLength: 50,
      aperture: 1.8,
      idealDistance: 72,
      sensor: "35mm (formato completo)",
    },
    {
      name: "FF - 70mm",
      focalLength: 70,
      aperture: 2.8,
      idealDistance: 96,
      sensor: "35mm (formato completo)",
    },
    {
      name: "6x6 - 80mm",
      focalLength: 80,
      aperture: 2.8,
      idealDistance: 90,
      sensor: "6x6 (Formato Medio)",
    },
    {
      name: "6x7 - 80mm",
      focalLength: 80,
      aperture: 2.8,
      idealDistance: 80,
      sensor: "6x7 (Formato Medio)",
    },
  ];

const SYSTEMS = ["Métrico", "Imperial"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function DepthOfFieldPage() {
  const [distanceToSubjectInInches, setDistanceToSubjectInInches] =
    useState(72);
  const [focalLengthInMillimeters, setFocalLengthInMillimeters] = useState(50);
  const [aperture, setAperture] = useState(1.8);
  const [subject, setSubject] = useState("Humano");
  const [system] = useState<(typeof SYSTEMS)[number]>("Métrico");
  const [sensor, setSensor] = useState("35mm (formato completo)");
  const [customSensorWidth, setCustomSensorWidth] = useState(36);
  const [customSensorHeight, setCustomSensorHeight] = useState(24);

  const theme = useTheme();

  const convertUnits = system === "Imperial" ? toImperial : toMetric;

  const distanceToSubjectInMM = distanceToSubjectInInches * 25.4;

  const isCustomSensor = sensor === "Personalizado";
  const customCocCalculated = Math.sqrt(customSensorWidth ** 2 + customSensorHeight ** 2) / 1500;
  const circleOfConfusionInMillimeters = isCustomSensor
    ? customCocCalculated
    : CIRCLES_OF_CONFUSION[sensor].coc;
  const cropFactor = isCustomSensor
    ? 43.27 / Math.sqrt(customSensorWidth ** 2 + customSensorHeight ** 2)
    : CIRCLES_OF_CONFUSION[sensor].cropFactor;

  const hyperFocalDistanceInMM =
    focalLengthInMillimeters +
    (focalLengthInMillimeters * focalLengthInMillimeters) /
    (aperture * circleOfConfusionInMillimeters);
  const depthOfFieldFarLimitInMM =
    (hyperFocalDistanceInMM * distanceToSubjectInMM) /
    (hyperFocalDistanceInMM -
      (distanceToSubjectInMM - focalLengthInMillimeters));
  const depthOfFieldNearLimitInMM =
    (hyperFocalDistanceInMM * distanceToSubjectInMM) /
    (hyperFocalDistanceInMM +
      (distanceToSubjectInMM - focalLengthInMillimeters));

  const farDistanceInInches = 360;
  const nearFocalPointInInches = clamp(
    depthOfFieldNearLimitInMM / 25.4,
    0,
    farDistanceInInches
  );
  let farFocalPointInInches = clamp(
    depthOfFieldFarLimitInMM / 25.4,
    0,
    farDistanceInInches
  );
  if (farFocalPointInInches < nearFocalPointInInches) {
    farFocalPointInInches = farDistanceInInches;
  }

  const sensorHeight = isCustomSensor
    ? customSensorHeight
    : CIRCLES_OF_CONFUSION[sensor].sensorHeight;
  const verticalFieldOfView =
    (2 * Math.atan(sensorHeight / 2 / focalLengthInMillimeters) * 180) /
    Math.PI;

  // ── Derived photography values
  const hyperFocalDistanceInInches = hyperFocalDistanceInMM / 25.4;
  const isInfinityFar =
    depthOfFieldFarLimitInMM / 25.4 > farDistanceInInches ||
    depthOfFieldFarLimitInMM <= 0;
  const totalDofInches = farFocalPointInInches - nearFocalPointInInches;
  const canSetHyperfocal = hyperFocalDistanceInInches <= farDistanceInInches;

  // 35mm equivalent focal length (only relevant when not on full frame)
  const equivalentFocalLength = Math.round(
    focalLengthInMillimeters * cropFactor
  );

  // Diffraction: airy disk (0.001342 × N mm) should not exceed CoC
  const diffractionLimitFStop =
    circleOfConfusionInMillimeters / 0.001342;
  const hasDiffractionRisk = aperture > diffractionLimitFStop;

  // DoF use-case character based on total depth
  const totalDofFeet = totalDofInches / 12;
  const dofCharacter =
    totalDofFeet < 0.5
      ? { label: "Macro / Producto", color: "secondary" }
      : totalDofFeet < 3
        ? { label: "Rango de Retrato", color: "primary" }
        : totalDofFeet < 10
          ? { label: "Grupo / Evento", color: "info" }
          : totalDofFeet < 30
            ? { label: "Calle / Arquitectura", color: "success" }
            : { label: "Paisaje", color: "default" };

  // ── Theme-aware colors 
  const borderColor = theme.palette.divider;
  const mutedText = theme.palette.text.secondary;
  const graphicTextColor = theme.palette.mode === "light" ? "#1A202C" : "#F7FAFC";

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1400, margin: "0 auto" }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "900", mb: 1, letterSpacing: "-0.5px" }}>
          Calculadora de Profundidad de Campo e Hiperfocal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
          Ingresa la distancia focal, la apertura y el tamaño del sensor para graficar el área exacta de nitidez y la hiperfocal. Utiliza los preajustes para configuraciones comunes.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: CONTROLS */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          
          {/* PRESETS */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid", borderColor }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mutedText, textTransform: "uppercase", letterSpacing: "0.05em", mb: 2 }}>
              Ajustes Rápidos (Presets)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {COMMON_SETUPS.map((setup) => (
                <Chip
                  key={setup.name}
                  label={setup.name}
                  onClick={() => {
                    setFocalLengthInMillimeters(setup.focalLength);
                    setAperture(setup.aperture);
                    setSensor(setup.sensor);
                    setDistanceToSubjectInInches(setup.idealDistance);
                  }}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2, 
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "primary.main", color: "primary.contrastText", borderColor: "primary.main" }
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* MAIN CONTROLS */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mutedText, textTransform: "uppercase", letterSpacing: "0.05em", mb: 3 }}>
              Controles de Lente
            </Typography>

            <Stack spacing={4}>
              {/* Distance */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbRuler size={18} color={theme.palette.primary.main} />
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>Distancia al Sujeto</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    {convertUnits(distanceToSubjectInInches, 1)}
                  </Typography>
                </Stack>
                <Slider
                  value={distanceToSubjectInInches}
                  onChange={(_, val) => setDistanceToSubjectInInches(val as number)}
                  min={10}
                  max={400}
                  step={1}
                />
              </Box>

              {/* Focal Length */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbZoomIn size={18} color={theme.palette.primary.main} />
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>Distancia Focal</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    {focalLengthInMillimeters} mm
                  </Typography>
                </Stack>
                <Slider
                  value={focalLengthInMillimeters}
                  onChange={(_, val) => setFocalLengthInMillimeters(val as number)}
                  min={3}
                  max={400}
                  step={1}
                />
                {sensor !== "35mm (formato completo)" && (
                  <Typography variant="caption" sx={{ color: mutedText, display: 'block', mt: 0.5 }}>
                    ≈ {equivalentFocalLength}mm equiv. en FF
                  </Typography>
                )}
              </Box>

              {/* Aperture */}
              <Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TbAperture size={18} color={theme.palette.primary.main} />
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>Apertura</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    f/{aperture.toFixed(1)}
                  </Typography>
                </Stack>
                <Slider
                  value={aperture}
                  onChange={(_, val) => setAperture(val as number)}
                  min={0.8}
                  max={22}
                  step={0.1}
                />
                {hasDiffractionRisk && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    ⚠ Riesgo de difracción en este sensor
                  </Typography>
                )}
              </Box>

            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* ADVANCED SETTINGS ACCORDION */}
            <Accordion elevation={0} disableGutters sx={{ bgcolor: "transparent", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<FiChevronDown />} sx={{ px: 0, minHeight: 0, "& .MuiAccordionSummary-content": { my: 1 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>Configuración Avanzada</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 0 }}>
                <Stack spacing={3}>
                  {/* Sensor */}
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                      <FiCamera size={16} color={mutedText} />
                      <Typography variant="body2">Tamaño de Sensor</Typography>
                    </Stack>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={sensor}
                        onChange={(evt) => setSensor(evt.target.value as string)}
                      >
                        {Object.entries(CIRCLES_OF_CONFUSION).map(([key]) => (
                          <MenuItem key={key} value={key}>{key}</MenuItem>
                        ))}
                        <MenuItem value="Personalizado">Personalizado</MenuItem>
                      </Select>
                    </FormControl>
                    {isCustomSensor && (
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption">Ancho (mm)</Typography>
                          <input type="number" value={customSensorWidth} onChange={(e) => setCustomSensorWidth(Number(e.target.value))} style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption">Alto (mm)</Typography>
                          <input type="number" value={customSensorHeight} onChange={(e) => setCustomSensorHeight(Number(e.target.value))} style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
                        </Box>
                      </Stack>
                    )}
                  </Box>

                  {/* Subject icon */}
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                      <TbUser size={16} color={mutedText} />
                      <Typography variant="body2">Ícono de Sujeto</Typography>
                    </Stack>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={subject}
                        onChange={(evt) => setSubject(evt.target.value as string)}
                      >
                        {Object.entries(SUBJECTS).map(([key]) => (
                          <MenuItem key={key} value={key}>{key}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: VISUALIZATION & STATS */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 1, sm: 3 }, 
              mb: 3, 
              borderRadius: 3, 
              border: "1px solid", 
              borderColor,
              background: theme.palette.mode === "dark" 
                ? "linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(30,30,30,1) 100%)"
                : "linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(255,255,255,1) 100%)",
            }}
          >
            <PhotographyGraphic
              distanceToSubjectInInches={distanceToSubjectInInches}
              nearFocalPointInInches={nearFocalPointInInches}
              farFocalPointInInches={farFocalPointInInches}
              farDistanceInInches={farDistanceInInches}
              hyperFocalDistanceInInches={hyperFocalDistanceInInches}
              subject={subject as keyof typeof SUBJECTS}
              focalLength={focalLengthInMillimeters}
              aperture={aperture}
              system={system}
              verticalFieldOfView={verticalFieldOfView}
              textColor={graphicTextColor}
              onChangeDistance={(val) => setDistanceToSubjectInInches(val)}
            />
          </Paper>

          {/* STATS TILES */}
          <Grid container spacing={2}>
            {[
              {
                label: "Foco Cercano",
                value: convertUnits(nearFocalPointInInches, 1),
                color: theme.palette.info.main,
              },
              {
                label: "Foco Lejano",
                value: isInfinityFar ? "∞" : convertUnits(farFocalPointInInches, 1),
                color: theme.palette.info.main,
              },
              {
                label: "Profundidad (PdC)",
                value: isInfinityFar ? "∞" : convertUnits(totalDofInches, 1),
                color: theme.palette.success.main,
                badge: dofCharacter,
              },
              {
                label: "Hiperfocal",
                value: convertUnits(hyperFocalDistanceInInches, 1),
                color: theme.palette.secondary.main,
                action: canSetHyperfocal ? (
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="secondary" 
                    sx={{ mt: 1, width: "100%", py: 0.5, fontSize: "0.7rem", fontWeight: "bold", textTransform: "none" }}
                    onClick={() => setDistanceToSubjectInInches(Math.round(hyperFocalDistanceInInches))}
                  >
                    Enfocar a H
                  </Button>
                ) : null
              },
            ].map(({ label, value, color, badge, action }) => (
              <Grid size={{ xs: 6, sm: 3 }} key={label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[4],
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ color: mutedText, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                    {label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color }}>
                    {value}
                  </Typography>
                  
                  {badge && (
                    <Chip size="small" label={badge.label} color={badge.color as any} sx={{ mt: 1, height: 20, fontSize: "0.65rem", fontWeight: "bold" }} />
                  )}
                  {action && action}

                </Paper>
              </Grid>
            ))}
          </Grid>

        </Grid>
      </Grid>
    </Box>
  );
}

export default DepthOfFieldPage;
