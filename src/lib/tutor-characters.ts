export type TutorCharacterId = "orb" | "einstein" | "cappy" | "rusty" | "patch-cat" | "froge";

export type TutorCharacter = {
  id: TutorCharacterId;
  label: string;
  spritesheet: { src: string; cellWidth: number; cellHeight: number } | null;
};

const CODEX_CELL = { cellWidth: 192, cellHeight: 208 };

const ORB: TutorCharacter = {
  id: "orb",
  label: "Orb",
  spritesheet: null,
};

export const TUTOR_CHARACTERS: TutorCharacter[] = [
  ORB,
  { id: "einstein", label: "Einstein", spritesheet: { src: "/tutor-characters/einstein.webp", ...CODEX_CELL } },
  { id: "cappy", label: "Cappy", spritesheet: { src: "/tutor-characters/cappy.webp", ...CODEX_CELL } },
  { id: "rusty", label: "Rusty", spritesheet: { src: "/tutor-characters/rusty.webp", ...CODEX_CELL } },
  { id: "patch-cat", label: "Patch Cat", spritesheet: { src: "/tutor-characters/patch-cat.webp", ...CODEX_CELL } },
  { id: "froge", label: "Froge", spritesheet: { src: "/tutor-characters/froge.webp", ...CODEX_CELL } },
];

export const DEFAULT_TUTOR_CHARACTER: TutorCharacterId = "einstein";

const ALL_CHARACTER_IDS: readonly TutorCharacterId[] = ["orb", "einstein", "cappy", "rusty", "patch-cat", "froge"];

export function isTutorCharacterId(value: unknown): value is TutorCharacterId {
  return typeof value === "string" && (ALL_CHARACTER_IDS as readonly string[]).includes(value);
}

export function getTutorCharacter(id: TutorCharacterId): TutorCharacter {
  return TUTOR_CHARACTERS.find((character) => character.id === id) ?? TUTOR_CHARACTERS[1] ?? ORB;
}
