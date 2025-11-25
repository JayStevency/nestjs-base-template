import { Schema, MapSchema, type } from '@colyseus/schema';
import { Player } from './player.schema';

export type GamePhase = 'waiting' | 'playing' | 'finished';

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type('string')
  phase: GamePhase = 'waiting';

  @type('number')
  maxPlayers: number = 4;

  @type('number')
  currentTurn: number = 0;

  @type('string')
  currentPlayerId: string = '';

  @type('number')
  gameStartedAt: number = 0;
}
