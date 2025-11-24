import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { configurations } from './config';

const getLokiHost = (): string => {
  return process.env.LOKI_HOST || 'http://localhost:3100';
};

const isLokiEnabled = (): boolean => {
  return process.env.LOKI_ENABLED === 'true';
};

interface PinoTarget {
  target: string;
  options: Record<string, unknown>;
  level: string;
}

const getPinoTransport = (serviceName: string) => {
  // In production, use JSON stdout logging (no transport workers for better compatibility)
  if (process.env.NODE_ENV === 'production') {
    // Note: For Loki integration in production, use a log collector sidecar (e.g., Promtail)
    // that reads JSON logs from stdout, which is more reliable than pino-loki transport
    return undefined;
  }

  // In development/local, use pino-pretty for readable logs
  const targets: PinoTarget[] = [
    {
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'debug',
    },
  ];

  // Add Loki transport in non-production if enabled
  if (isLokiEnabled()) {
    targets.push({
      target: 'pino-loki',
      options: {
        batching: true,
        interval: 5,
        host: getLokiHost(),
        labels: {
          app: serviceName,
          env: process.env.NODE_ENV || 'local',
        },
        silenceErrors: false,
      },
      level: 'info',
    });
  }

  return { targets };
};

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurations],
      envFilePath: ['.env.local', '.env.dev', '.env.prod', '.env'],
    }),
  ],
  exports: [ConfigModule],
})
export class CoreModule {
  static forRoot(serviceName: string) {
    const logLevel = process.env.LOG_LEVEL || 'info';

    return {
      module: CoreModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configurations],
          envFilePath: ['.env.local', '.env.dev', '.env.prod', '.env'],
        }),
        LoggerModule.forRoot({
          pinoHttp: {
            level: logLevel,
            transport: getPinoTransport(serviceName),
          },
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
