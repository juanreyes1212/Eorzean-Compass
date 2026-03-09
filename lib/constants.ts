import { UserPreferences } from "./types";

export const APP_CONFIG = {
  name: 'Eorzean Compass',
  description: 'The definitive companion tool for FFXIV achievement hunters',
  version: '1.0.0',
  author: 'FFXIV Community',
} as const;

export const API_ENDPOINTS = {
  character: '/api/character',
  achievements: '/api/achievements',
} as const;

export const CACHE_DURATION = {
  ACHIEVEMENTS: 6 * 60 * 60 * 1000, // 6 hours
  CHARACTERS: 6 * 60 * 60 * 1000,   // 6 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [25, 50, 100, 200],
  MAX_PAGE_SIZE: 500,
} as const;

export const TSRG_CONFIG = {
  MIN_SCORE: 1,
  MAX_SCORE: 10,
  TIER_THRESHOLDS: {
    1: 8,   // Foundational: 4-8
    2: 16,  // Systematic: 9-16
    3: 24,  // Dedicated: 17-24
    4: 40,  // Apex: 25+
  },
  TIER_NAMES: {
    1: 'Foundational',
    2: 'Systematic',
    3: 'Dedicated',
    4: 'Apex',
  },
  TIER_COLORS: {
    1: 'bg-earth-600',
    2: 'bg-compass-600',
    3: 'bg-gold-600',
    4: 'bg-gradient-to-r from-gold-500 to-compass-600',
  },
} as const;

export const SERVERS: Record<string, string> = {
  // NA - Aether
  "Adamantoise": "Aether",
  "Cactuar": "Aether",
  "Faerie": "Aether",
  "Gilgamesh": "Aether",
  "Jenova": "Aether",
  "Midgardsormr": "Aether",
  "Sargatanas": "Aether",
  "Siren": "Aether",
  // NA - Crystal
  "Balmung": "Crystal",
  "Brynhildr": "Crystal",
  "Coeurl": "Crystal",
  "Diabolos": "Crystal",
  "Goblin": "Crystal",
  "Malboro": "Crystal",
  "Mateus": "Crystal",
  "Zalera": "Crystal",
  // NA - Primal
  "Behemoth": "Primal",
  "Excalibur": "Primal",
  "Exodus": "Primal",
  "Famfrit": "Primal",
  "Hyperion": "Primal",
  "Lamia": "Primal",
  "Leviathan": "Primal",
  "Ultros": "Primal",
  // NA - Dynamis
  "Halicarnassus": "Dynamis",
  "Maduin": "Dynamis",
  "Marilith": "Dynamis",
  "Seraph": "Dynamis",
  // EU - Chaos
  "Cerberus": "Chaos",
  "Louisoix": "Chaos",
  "Moogle": "Chaos",
  "Omega": "Chaos",
  "Phantom": "Chaos",
  "Ragnarok": "Chaos",
  "Sagittarius": "Chaos",
  "Spriggan": "Chaos",
  // EU - Light
  "Alpha": "Light",
  "Lich": "Light",
  "Odin": "Light",
  "Phoenix": "Light",
  "Raiden": "Light",
  "Shiva": "Light",
  "Twintania": "Light",
  "Zodiark": "Light",
  // JP - Elemental
  "Aegis": "Elemental",
  "Atomos": "Elemental",
  "Carbuncle": "Elemental",
  "Garuda": "Elemental",
  "Gungnir": "Elemental",
  "Kujata": "Elemental",
  "Tonberry": "Elemental",
  "Typhon": "Elemental",
  // JP - Gaia
  "Alexander": "Gaia",
  "Bahamut": "Gaia",
  "Durandal": "Gaia",
  "Fenrir": "Gaia",
  "Ifrit": "Gaia",
  "Ridill": "Gaia",
  "Tiamat": "Gaia",
  "Ultima": "Gaia",
  // JP - Mana
  "Anima": "Mana",
  "Asura": "Mana",
  "Chocobo": "Mana",
  "Hades": "Mana",
  "Ixion": "Mana",
  "Masamune": "Mana",
  "Pandaemonium": "Mana",
  "Titan": "Mana",
  // JP - Meteor
  "Belias": "Meteor",
  "Mandragora": "Meteor",
  "Ramuh": "Meteor",
  "Shinryu": "Meteor",
  "Unicorn": "Meteor",
  "Valefor": "Meteor",
  "Yojimbo": "Meteor",
  "Zeromus": "Meteor",
  // OCE - Materia
  "Bismarck": "Materia",
  "Ravana": "Materia",
  "Sephirot": "Materia",
  "Sophia": "Materia",
  "Zurvan": "Materia",
} as const;

export const ACHIEVEMENT_CATEGORIES = [
  "Battle",
  "Character",
  "Items",
  "Crafting & Gathering",
  "Quests",
  "Exploration",
  "PvP",
  "Grand Company",
  "Legacy"
] as const;

export const STORAGE_KEYS = {
  CHARACTERS: 'eorzean_compass_characters',
  PREFERENCES: 'eorzean_compass_preferences',
  ACHIEVEMENTS: 'eorzean_compass_achievements',
  RECENT_SEARCHES: 'eorzean_compass_recent_searches',
  CHARACTER_ACHIEVEMENTS: 'eorzean_compass_character_achievements',
} as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  maxTimeScore: 10,
  maxSkillScore: 10,
  maxRngScore: 10,
  maxGroupScore: 10,
  hideCompleted: false,
  hideUnobtainable: true,
  selectedTiers: [1, 2, 3, 4],
  preferredCategories: [],
  excludedCategories: [],
  prioritizeRareAchievements: false,
  prioritizeHighPoints: true,
} as const;

export const EXTERNAL_APIS = {
  FFXIV_COLLECT_BASE: 'https://ffxivcollect.com/api',
} as const;
