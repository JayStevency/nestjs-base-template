import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ConfigProps } from './config.type';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
);

export default (): ConfigProps => {
  let data: Record<string, string> = {};
  const environment: string = process.env.NODE_ENV || 'local';
  const envPath = `.env.${environment}`;

  if (fs.existsSync(envPath)) {
    Object.assign(data, dotenv.parse(fs.readFileSync(envPath)));
  }

  // Merge with process.env (process.env takes priority)
  data = { ...data, ...process.env };

  return {
    environment,
    appName: packageJson.name,
    version: packageJson.version,
    port: parseInt(data.PORT, 10) || 3000,
    database: {
      host: data.DB_HOST || 'localhost',
      port: parseInt(data.DB_PORT, 10) || 5432,
      username: data.DB_USERNAME || 'postgres',
      password: data.DB_PASSWORD || 'postgres',
      name: data.DB_NAME || 'nestjs',
    },
  };
};
