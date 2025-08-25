export interface DataSource {
  url: string;
  type: 'geojson';
}

export interface LayerSettings {
  fillColor: [number, number, number, number];
  pointRadius: number;
  pointRadiusScale: number;
  pointRadiusMinPixels: number;
}

export interface TooltipField {
  key: string;
  label: string;
}

export interface TooltipSettings {
  nameField: string;
  fields: TooltipField[];
}

export interface StatsSettings {
  countField: string;
  groupByFields: string[];
  labels: Record<string, string>;
}

export interface DisplaySettings {
  title: string;
  description: string;
  layer: LayerSettings;
  tooltip: TooltipSettings;
  stats: StatsSettings;
}

export interface AppConfig {
  dataSource: DataSource;
  displaySettings: DisplaySettings;
  systemPrompt: string;
  exampleQuestions: string[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, string | number | boolean | null>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface GeoJsonData {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface HoveredFeature {
  object: GeoJsonFeature;
  x: number;
  y: number;
}