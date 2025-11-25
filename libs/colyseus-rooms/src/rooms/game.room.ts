import { Room, Client } from 'colyseus';
import { GameState, Player } from '../schemas';

export interface GameRoomOptions {
  maxPlayers?: number;
  roomName?: string;
}

export interface JoinOptions {
  playerName?: string;
}

export type GameMessage =
  | { type: 'move'; x: number; y: number }
  | { type: 'ready' }
  | { type: 'action'; action: string; data?: unknown };

export class GameRoom extends Room<GameState> {
  maxClients = 4;

  onCreate(options: GameRoomOptions): void {
    this.setState(new GameState());

    if (options.maxPlayers) {
      this.maxClients = options.maxPlayers;
      this.state.maxPlayers = options.maxPlayers;
    }

    // Register message handlers
    this.onMessage('move', (client, message: { x: number; y: number }) => {
      this.handleMove(client, message);
    });

    this.onMessage('ready', (client) => {
      this.handleReady(client);
    });

    this.onMessage('action', (client, message: { action: string; data?: unknown }) => {
      this.handleAction(client, message);
    });

    console.log(`GameRoom created: ${this.roomId}`);
  }

  onJoin(client: Client, options: JoinOptions): void {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.playerName || `Player-${client.sessionId.slice(0, 4)}`;

    this.state.players.set(client.sessionId, player);

    console.log(`Player joined: ${player.name} (${client.sessionId})`);

    // Notify all clients
    this.broadcast('player_joined', {
      playerId: client.sessionId,
      playerName: player.name,
      totalPlayers: this.state.players.size,
    });
  }

  onLeave(client: Client, consented: boolean): void {
    const player = this.state.players.get(client.sessionId);
    const playerName = player?.name || 'Unknown';

    this.state.players.delete(client.sessionId);

    console.log(`Player left: ${playerName} (${client.sessionId}), consented: ${consented}`);

    // Notify all clients
    this.broadcast('player_left', {
      playerId: client.sessionId,
      playerName,
      totalPlayers: this.state.players.size,
    });

    // Check if game should end
    if (this.state.phase === 'playing' && this.state.players.size < 2) {
      this.endGame();
    }
  }

  onDispose(): void {
    console.log(`GameRoom disposed: ${this.roomId}`);
  }

  private handleMove(client: Client, message: { x: number; y: number }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.x = message.x;
    player.y = message.y;
  }

  private handleReady(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.isReady = !player.isReady;

    // Check if all players are ready
    this.checkGameStart();
  }

  private handleAction(client: Client, message: { action: string; data?: unknown }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Handle custom game actions
    this.broadcast('action', {
      playerId: client.sessionId,
      action: message.action,
      data: message.data,
    });
  }

  private checkGameStart(): void {
    if (this.state.phase !== 'waiting') return;

    const players = Array.from(this.state.players.values());
    const allReady = players.length >= 2 && players.every((p) => p.isReady);

    if (allReady) {
      this.startGame();
    }
  }

  private startGame(): void {
    this.state.phase = 'playing';
    this.state.gameStartedAt = Date.now();

    // Set first player
    const firstPlayer = Array.from(this.state.players.values())[0];
    if (firstPlayer) {
      this.state.currentPlayerId = firstPlayer.id;
    }

    this.broadcast('game_started', {
      startedAt: this.state.gameStartedAt,
      currentPlayerId: this.state.currentPlayerId,
    });

    console.log(`Game started in room: ${this.roomId}`);
  }

  private endGame(): void {
    this.state.phase = 'finished';

    // Calculate winner
    const players = Array.from(this.state.players.values());
    const winner = players.reduce((a, b) => (a.score > b.score ? a : b), players[0]);

    this.broadcast('game_ended', {
      winnerId: winner?.id,
      winnerName: winner?.name,
      scores: players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
    });

    console.log(`Game ended in room: ${this.roomId}, winner: ${winner?.name}`);
  }
}
