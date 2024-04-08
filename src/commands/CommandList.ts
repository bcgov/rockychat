import { CommandInt } from '../interfaces/CommandInt';
import { ping } from './ping';
import { help } from './help';

// Manually defined response for the following situation:
export const CommandList: CommandInt[] = [ping, help];
