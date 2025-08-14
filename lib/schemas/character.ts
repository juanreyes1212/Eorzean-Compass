import { z } from 'zod';

// Valid FFXIV servers
const VALID_SERVERS = [
  // Aether
  'Adamantoise', 'Cactuar', 'Faerie', 'Gilgamesh', 'Jenova', 'Midgardsormr', 'Sargatanas', 'Siren',
  // Crystal
  'Balmung', 'Brynhildr', 'Coeurl', 'Diabolos', 'Goblin', 'Malboro', 'Mateus', 'Zalera',
  // Primal
  'Behemoth', 'Excalibur', 'Exodus', 'Famfrit', 'Hyperion', 'Lamia', 'Leviathan', 'Ultros',
] as const;

export const characterSearchSchema = z.object({
  characterName: z
    .string()
    .min(2, 'Character name must be at least 2 characters')
    .max(20, 'Character name must be 20 characters or less')
    .regex(/^[a-zA-Z'\s-]+$/, 'Character name contains invalid characters')
    .transform(str => str.trim()),
  server: z
    .enum(VALID_SERVERS, {
      errorMap: () => ({ message: 'Please select a valid server' }),
    }),
});

export type CharacterSearchSchema = z.infer<typeof characterSearchSchema>;

// Server grouping for UI
export const SERVER_GROUPS = {
  Aether: ['Adamantoise', 'Cactuar', 'Faerie', 'Gilgamesh', 'Jenova', 'Midgardsormr', 'Sargatanas', 'Siren'],
  Crystal: ['Balmung', 'Brynhildr', 'Coeurl', 'Diabolos', 'Goblin', 'Malboro', 'Mateus', 'Zalera'],
  Primal: ['Behemoth', 'Excalibur', 'Exodus', 'Famfrit', 'Hyperion', 'Lamia', 'Leviathan', 'Ultros'],
} as const;