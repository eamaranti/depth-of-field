import { useState, useMemo } from "react";
import {
  Slider,
  Box,
  Typography,
  Select,
  Button,
  Grid,
  Chip,
  Tooltip,
  Divider,
  MenuItem,
  useTheme,
  Stack,
  FormControl,
} from "@mui/material";
import { TbRuler, TbAperture, TbZoomIn, TbUser } from "react-icons/tb";
import { FiCamera } from "react-icons/fi";
import { toImperial, toMetric } from "../utils/units";

import PhotographyGraphic, { SUBJECTS } from "../PhotographyGraphic";

import Telephoto from "../assets/100-400.png";
import Fisheye from "../assets/fishey.png";

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
  const cardBg = theme.palette.mode === "light" ? "white" : theme.palette.grey[800];
  const borderColor = theme.palette.divider;
  const mutedText = theme.palette.text.secondary;
  const graphicTextColor = theme.palette.mode === "light" ? "#1A202C" : "#F7FAFC";

  const distanceMarks = useMemo(() => {
    if (system === "Imperial") {
      return new Array(Math.floor(farDistanceInInches / 24) + 1)
        .fill(0)
        .map((_v, i) => (i + 1) * 24)
        .map((val) => ({
          value: val,
          label: `${val / 12}'`,
        }));
    } else {
      const farDistanceInMeters = farDistanceInInches * 0.0254;
      const convertMetersToInches = (meters: number) => meters * 39.3701;
      return new Array(Math.floor(farDistanceInMeters) + 1)
        .fill(0)
        .map((_val, val) => ({
          value: convertMetersToInches(val + 1),
          label: `${val + 1}m`,
        }));
    }
  }, [system, farDistanceInInches]);

  const focalLengthMarks = [14, 28, 35, 50, 70, 85, 100, 135, 155, 200].map(v => ({ value: v, label: v.toString() }));
  const apertureMarks = [0.8, 1.4, 1.8, 2.8, 4, 5.6, 8, 11, 16, 22].map(v => ({ value: v, label: v.toString() }));

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 4, pb: 1, maxWidth: 1200, margin: "0 auto" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Calculadora de Profundidad de Campo e Hiperfocal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ingresa la distancia focal, la apertura y el tamaño del sensor para graficar el área exacta de nitidez y la hiperfocal.
        </Typography>
      </Box>
      <Box sx={{ p: 1, pt: 2, maxWidth: 1200, margin: "0 auto" }}>
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
      </Box>

      {/* ── DoF Stats Panel ── */}
      <Box sx={{ px: 3, pt: 1, maxWidth: 1200, margin: "0 auto" }}>
        <Grid container spacing={1.5}>
          {[
            {
              label: "Foco Cercano",
              value: convertUnits(nearFocalPointInInches, 0),
            },
            {
              label: "Foco Lejano",
              value: isInfinityFar
                ? "∞"
                : convertUnits(farFocalPointInInches, 0),
            },
            {
              label: "PdC Total",
              value: isInfinityFar ? "∞" : convertUnits(totalDofInches, 0),
            },
            {
              label: "Hiperfocal",
              value: convertUnits(hyperFocalDistanceInInches, 0),
            },
          ].map(({ label, value }) => (
            <Grid size={{ xs: 6, sm: 3 }} key={label}>
              <Box
                sx={{
                  backgroundColor: cardBg,
                  borderRadius: 2,
                  p: 1.5,
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: borderColor,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: mutedText,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                  }}
                >
                  {label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", mt: 0.5 }}>
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* DoF character badge + Set Hyperfocal action */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          <Chip
            color={dofCharacter.color as any}
            size="small"
            label={dofCharacter.label}
          />
          <Tooltip
            title={
              canSetHyperfocal
                ? "Enfocar a distancia hiperfocal — todo desde la mitad de esta distancia hasta ∞ estará nítido"
                : `La hiperfocal (${convertUnits(hyperFocalDistanceInInches, 0)}) está más allá del rango de la escena`
            }
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                disabled={!canSetHyperfocal}
                onClick={() =>
                  setDistanceToSubjectInInches(
                    Math.round(hyperFocalDistanceInInches)
                  )
                }
              >
                Fijar Hiperfocal
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ mt: 4, mb: 2, borderColor }} />

      {/* Quick Presets */}
      <Box sx={{ pt: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: mutedText,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "block",
            mb: 2,
          }}
        >
          Ajustes Rápidos
        </Typography>
        <Grid container spacing={1} sx={{ justifyContent: "center" }}>
          {COMMON_SETUPS.map((setup) => (
            <Grid key={setup.name}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setFocalLengthInMillimeters(setup.focalLength);
                  setAperture(setup.aperture);
                  setSensor(setup.sensor);
                  setDistanceToSubjectInInches(setup.idealDistance);
                }}
              >
                {setup.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* ── Controls ── */}
      <Box sx={{ px: 3, pb: 4, maxWidth: 1200, margin: "0 auto" }}>
        {/* Subject Distance */}
        <Box sx={{ pt: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1} sx={{ width: "20%", justifyContent: "flex-end", alignItems: "center" }}>
              <TbRuler size={16} color={mutedText} />
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                Distancia ({system === "Imperial" ? "pies" : "m"})
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1, px: 2 }}>
              <Slider
                aria-label="distance to subject"
                value={distanceToSubjectInInches}
                onChange={(_, val) => setDistanceToSubjectInInches(val as number)}
                min={10}
                max={400}
                step={1}
                marks={distanceMarks}
              />
            </Box>
          </Stack>
        </Box>

        {/* Focal Length */}
        <Box sx={{ pt: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1} sx={{ width: "20%", justifyContent: "flex-end", alignItems: "center" }}>
              <TbZoomIn size={16} color={mutedText} />
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                Distancia Focal (mm)
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1, px: 2 }}>
              <Slider
                aria-label="focal length"
                value={focalLengthInMillimeters}
                onChange={(_, val) => setFocalLengthInMillimeters(val as number)}
                min={3}
                max={400}
                step={1}
                marks={focalLengthMarks}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ width: "20%" }}></Box>
            <Box sx={{ flexGrow: 1, px: 2 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <img src={Fisheye} alt="Lente ojo de pez" style={{ height: 50 }} />
                {sensor !== "35mm (formato completo)" && (
                  <Typography variant="caption" sx={{ color: mutedText }}>
                    ≈ {equivalentFocalLength}mm equivalente en formato completo
                  </Typography>
                )}
                <img src={Telephoto} alt="100-400 lens" style={{ height: 50 }} />
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Aperture */}
        <Box sx={{ pt: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1} sx={{ width: "20%", justifyContent: "flex-end", alignItems: "center" }}>
              <TbAperture size={16} color={mutedText} />
              <Typography variant="body2">Apertura</Typography>
            </Stack>
            <Box sx={{ flexGrow: 1, px: 2 }}>
              <Slider
                aria-label="aperture"
                value={aperture}
                onChange={(_, val) => setAperture(val as number)}
                min={0.8}
                max={22}
                step={0.1}
                marks={apertureMarks}
              />
            </Box>
          </Stack>
          {hasDiffractionRisk && (
            <Stack direction="row" sx={{ mt: 1, pl: "calc(20% + 16px)" }}>
              <Chip
                color="warning"
                variant="outlined"
                size="small"
                label={`⚠ La difracción puede reducir la nitidez por encima de f/${diffractionLimitFStop.toFixed(1)} en este sensor`}
              />
            </Stack>
          )}
        </Box>

        {/* Sensor + Subject */}
        <Box sx={{ pt: 3 }}>
          {isCustomSensor && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" sx={{ width: 80, color: mutedText }}>Ancho (mm)</Typography>
                <input
                  type="number"
                  value={customSensorWidth}
                  onChange={(e) => setCustomSensorWidth(Number(e.target.value))}
                  style={{ width: 70, padding: "2px 6px", borderRadius: 6, border: "1px solid #ccc" }}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="caption" sx={{ width: 80, color: mutedText }}>Alto (mm)</Typography>
                <input
                  type="number"
                  value={customSensorHeight}
                  onChange={(e) => setCustomSensorHeight(Number(e.target.value))}
                  style={{ width: 70, padding: "2px 6px", borderRadius: 6, border: "1px solid #ccc" }}
                />
              </Stack>
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Stack direction="row" spacing={1} sx={{ width: { xs: 72, md: "30%" }, justifyContent: "flex-end", alignItems: "center" }}>
                  <FiCamera size={16} color={mutedText} />
                  <Typography variant="body2" sx={{ textAlign: "right" }}>Sensor</Typography>
                </Stack>
                <FormControl size="small" sx={{ flexGrow: 1 }}>
                  <Select
                    value={sensor}
                    onChange={(evt) => setSensor(evt.target.value as string)}
                    displayEmpty
                  >
                    {Object.entries(CIRCLES_OF_CONFUSION).map(([key]) => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                    <MenuItem value="Personalizado">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Stack direction="row" spacing={1} sx={{ width: { xs: 72, md: "30%" }, justifyContent: "flex-end", alignItems: "center" }}>
                  <TbUser size={16} color={mutedText} />
                  <Typography variant="body2" sx={{ textAlign: "right" }}>Sujeto</Typography>
                </Stack>
                <FormControl size="small" sx={{ flexGrow: 1 }}>
                  <Select
                    value={subject}
                    onChange={(evt) => {
                      if (SUBJECTS[evt.target.value as keyof typeof SUBJECTS]) {
                        setSubject(evt.target.value as string);
                      }
                    }}
                    displayEmpty
                  >
                    {Object.entries(SUBJECTS).map(([key]) => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </Box>


      </Box>
    </>
  );
}

export default DepthOfFieldPage;
