"use client";

import { CharacterSearchForm } from "@/components/forms/character-search-form";

interface CharacterSearchProps {
  onSearchStart?: () => void;
}

export function CharacterSearch({ onSearchStart }: CharacterSearchProps) {
  return (
    <CharacterSearchForm onSearchStart={onSearchStart} />
  );
}
