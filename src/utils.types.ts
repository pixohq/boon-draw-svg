import TextToSVG, { Metrics } from "text-to-svg";

import { PROPERTY_FONT_FAMILY, PROPERTY_FONT_SRC } from "./constants";

export interface CanvasSize {
  canvasWidth: number;
  canvasHeight: number;
}

export interface Position {
  x: number;
  y: number;
}

export type FONT_FACE_PROPERTIES =
  | typeof PROPERTY_FONT_FAMILY
  | typeof PROPERTY_FONT_SRC;

export interface BoonDrawSVGOptions {
  fullWidth?: boolean;
}

export interface FontInfo {
  property: string;
  value: string;
}

export type MetricsCallback = (metrics: Metrics) => void;

export interface GetMetricsProps {
  fontURL: string;
  text: string;
  options: TextToSVG.GenerationOptions;
  metricsCallback: MetricsCallback;
}
