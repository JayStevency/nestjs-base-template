import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server, Room } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer, Server as HttpServer } from 'http';
import { GameRoom } from '@app/colyseus-rooms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RoomConstructor = new (...args: any[]) => Room;

interface RoomDefinition {
  name: string;
  room: RoomConstructor;
  options?: Record<string, unknown>;
}

@Injectable()
export class ColyseusService implements OnModuleDestroy {
  private server: Server;
  private httpServer: HttpServer;
  private readonly logger = new Logger(ColyseusService.name);
  private readonly roomDefinitions: RoomDefinition[] = [];

  constructor() {
    this.httpServer = createServer();
    this.server = new Server({
      transport: new WebSocketTransport({
        server: this.httpServer,
      }),
    });

    // Register default rooms
    this.registerDefaultRooms();
  }

  private registerDefaultRooms(): void {
    // Register GameRoom from shared library
    this.defineRoom('game', GameRoom);
  }

  defineRoom(name: string, room: RoomConstructor, options?: Record<string, unknown>): void {
    this.roomDefinitions.push({ name, room, options });
    this.server.define(name, room, options);
    this.logger.log(`Room registered: ${name}`);
  }

  async listen(port: number): Promise<void> {
    await this.server.listen(port);
    this.logger.log(`Colyseus server listening on port ${port}`);
  }

  getServer(): Server {
    return this.server;
  }

  getRoomDefinitions(): RoomDefinition[] {
    return this.roomDefinitions;
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down Colyseus server...');
    await this.server.gracefullyShutdown();
  }
}
