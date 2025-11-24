import { ModuleMetadata } from '@nestjs/common';

export interface TelemetryModuleOptions {
  serviceName: string;
  serviceVersion: string;
}

export interface TelemetryModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<TelemetryModuleOptions> | TelemetryModuleOptions;
  inject?: any[];
}
