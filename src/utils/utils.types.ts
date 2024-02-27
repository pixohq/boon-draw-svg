import TextToSVG, { Metrics } from 'text-to-svg';

export type FONT_FACE_PROPERTIES =
  | 'font-family'
  | 'src';

export interface CanvasSize {
  canvasWidth: number;
  canvasHeight: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface FontInfo {
  property: string;
  value: string;
}

export interface GetMetricsProps {
  fontURL: string;
  text: string;
  options: TextToSVG.GenerationOptions;
  metricsCallback: (metrics: Metrics) => void;
}

export interface GetFontStyleOptionProps {
  fontSize: number;
  letterSpacing: number;
  scale: number;
}
