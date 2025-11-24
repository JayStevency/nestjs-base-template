import { Injectable, Inject, Optional } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { TELEMETRY_OPTIONS } from './telemetry.constants';
import { TelemetryModuleOptions } from './telemetry.interface';

@Injectable()
export class TelemetryService {
  private sdk: NodeSDK | null = null;
  private initialized = false;

  constructor(
    @Optional()
    @Inject(TELEMETRY_OPTIONS)
    private readonly options?: TelemetryModuleOptions,
  ) {
    if (this.options) {
      this.init(this.options.serviceName, this.options.serviceVersion);
    }
  }

  init(serviceName: string, version: string): void {
    if (this.initialized) {
      return;
    }

    const isOtelEnabled = process.env.OTEL_ENABLED === 'true';
    const otelEndpoint =
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

    if (!isOtelEnabled) {
      console.log(`OpenTelemetry is disabled for ${serviceName}`);
      return;
    }

    const traceExporter = new OTLPTraceExporter({
      url: otelEndpoint,
    });

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: version,
        'service.namespace': 'nestjs-microservices',
        'deployment.environment': process.env.NODE_ENV || 'development',
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
          // Enable HTTP instrumentation for tracing API calls
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          // Enable amqplib instrumentation for RabbitMQ tracing
          '@opentelemetry/instrumentation-amqplib': {
            enabled: true,
          },
        }),
      ],
    });

    this.sdk.start();
    this.initialized = true;
    console.log(`OpenTelemetry initialized for ${serviceName} (${version})`);

    process.on('SIGTERM', () => {
      this.shutdown()
        .then(() => console.log('OpenTelemetry shut down'))
        .catch((err) => console.error('Error shutting down OpenTelemetry', err))
        .finally(() => process.exit(0));
    });
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Standalone function for backward compatibility
export const initTelemetry = (serviceName: string, version: string): void => {
  const service = new TelemetryService();
  service.init(serviceName, version);
};

export const shutdownTelemetry = async (): Promise<void> => {
  const service = new TelemetryService();
  await service.shutdown();
};
