import { registerAs } from '@nestjs/config';

export interface GameServerConfigProps {
  appName: string;
  environment: string;
  colyseus: {
    port: number;
    maxRooms: number;
  };
}

export const gameServerConfig = registerAs(
  'gameServer',
  (): GameServerConfigProps => ({
    appName: process.env.GAME_SERVER_NAME || 'game-server',
    environment: process.env.NODE_ENV || 'local',
    colyseus: {
      port: parseInt(process.env.COLYSEUS_PORT, 10) || 2567,
      maxRooms: parseInt(process.env.COLYSEUS_MAX_ROOMS, 10) || 100,
    },
  }),
);

// Re-export flat config for easy access
export const gameServerConfigFactory = () => ({
  appName: process.env.GAME_SERVER_NAME || 'game-server',
  environment: process.env.NODE_ENV || 'local',
  colyseus: {
    port: parseInt(process.env.COLYSEUS_PORT, 10) || 2567,
    maxRooms: parseInt(process.env.COLYSEUS_MAX_ROOMS, 10) || 100,
  },
});
