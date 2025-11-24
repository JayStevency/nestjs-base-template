export interface DatabaseProps {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export interface TelemetryProps {
  enabled: boolean;
  endpoint: string;
}

export interface ConfigProps {
  environment: string;
  appName: string;
  version: string;
  port: number;
  database: DatabaseProps;
  telemetry: TelemetryProps;
}
