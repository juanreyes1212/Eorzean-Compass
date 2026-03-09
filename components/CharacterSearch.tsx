"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader as Loader2, CircleAlert as AlertCircle, Info, Compass, UserCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { announceToScreenReader } from "@/lib/utils/accessibility";
import { SERVERS } from "@/lib/constants";

interface PossibleMatch {
  id: string;
  name: string;
  server: string;
  avatar: string;
}

const serverList = Object.entries(SERVERS).map(([name, datacenter]) => ({
  name,
  datacenter,
}));

interface CharacterSearchProps {
  onSearchStart?: () => void;
}

export function CharacterSearch({ onSearchStart }: CharacterSearchProps) {
  const [characterName, setCharacterName] = useState("");
  const [server, setServer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [possibleMatches, setPossibleMatches] = useState<PossibleMatch[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    characterName?: string;
    server?: string;
  }>({});
  const router = useRouter();
  const { toast } = useToast();

  const validateForm = () => {
    const errors: { characterName?: string; server?: string } = {};

    if (!characterName.trim()) {
      errors.characterName = "Character name is required";
    } else if (characterName.trim().length < 2) {
      errors.characterName = "Character name must be at least 2 characters";
    } else if (characterName.trim().length > 20) {
      errors.characterName = "Character name must be 20 characters or less";
    }

    if (!server) {
      errors.server = "Please select a server";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const navigateToAchievements = (name: string, serverName: string) => {
    const encodedName = encodeURIComponent(name);
    const encodedServer = encodeURIComponent(serverName);
    router.push(`/achievements?name=${encodedName}&server=${encodedServer}`);
  };

  const handleSelectMatch = (match: PossibleMatch) => {
    setPossibleMatches([]);
    toast({
      title: "Character Selected",
      description: `Loading data for ${match.name} on ${match.server}.`,
      variant: "default",
      icon: <Compass className="h-4 w-4" />,
    });
    navigateToAchievements(match.name, match.server);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      announceToScreenReader('Please fix the form errors before submitting', 'assertive');
      return;
    }

    setIsLoading(true);
    setPossibleMatches([]);
    onSearchStart?.();
    announceToScreenReader('Searching for character, please wait');

    try {
      const encodedName = encodeURIComponent(characterName.trim());
      const encodedServer = encodeURIComponent(server);

      const apiUrl = `/api/character?name=${encodedName}&server=${encodedServer}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));

        switch (response.status) {
          case 404:
            throw new Error('Character not found. Please check the name and server spelling.');
          case 429:
            throw new Error('Too many requests. Please wait a moment and try again.');
          case 503:
            throw new Error('Character search service is temporarily unavailable. Please try again later.');
          default:
            throw new Error(errorData.error || `Server error (${response.status}). Please try again.`);
        }
      }

      const data = await response.json();

      if (data.possibleMatches && data.possibleMatches.length > 0) {
        setPossibleMatches(data.possibleMatches);
        announceToScreenReader(`${data.possibleMatches.length} characters found. Please select one.`);
        toast({
          title: "Multiple Characters Found",
          description: `${data.possibleMatches.length} characters match your search. Please select the correct one.`,
          variant: "default",
          icon: <Info className="h-4 w-4" />,
        });
        return;
      }

      if (!data.character || !data.character.id) {
        throw new Error('Invalid character data received. Please try again.');
      }

      if (data._isMockData) {
        toast({
          title: "Using Demo Data",
          description: data._error || 'Lodestone search is temporarily unavailable. Showing demo data.',
          variant: "default",
          icon: <Info className="h-4 w-4" />,
        });
        announceToScreenReader('Character found using demo data');
      } else {
        toast({
          title: "Character Found!",
          description: `Successfully loaded data for ${data.character.name} on ${data.character.server}.`,
          variant: "default",
          icon: <Compass className="h-4 w-4" />,
        });
        announceToScreenReader(`Character ${data.character.name} found successfully`);
      }

      navigateToAchievements(characterName.trim(), server);
    } catch (error) {
      console.error("Error searching for character:", error);

      let errorMessage = 'An unexpected error occurred. Please check your internet connection and try again.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The character search service may be slow. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
      });
      announceToScreenReader(`Search failed: ${errorMessage}`, 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
    if (validationErrors.characterName) {
      setValidationErrors(prev => ({ ...prev, characterName: undefined }));
    }
    if (possibleMatches.length > 0) {
      setPossibleMatches([]);
    }
  };

  const handleServerChange = (value: string) => {
    setServer(value);
    if (validationErrors.server) {
      setValidationErrors(prev => ({ ...prev, server: undefined }));
    }
    if (possibleMatches.length > 0) {
      setPossibleMatches([]);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="character-name" className="text-compass-200 font-medium">
            Character Name
          </Label>
          <Input
            id="character-name"
            type="text"
            placeholder="Enter your character name"
            value={characterName}
            onChange={handleCharacterNameChange}
            className="bg-compass-800 border-compass-600 text-compass-100 placeholder:text-compass-400 focus:border-gold-500 focus:ring-gold-500/20"
            data-testid="character-name-input"
            disabled={isLoading}
            aria-describedby={validationErrors.characterName ? "character-name-error" : undefined}
            aria-invalid={!!validationErrors.characterName}
          />
          {validationErrors.characterName && (
            <p id="character-name-error" className="text-sm text-red-400" role="alert">
              {validationErrors.characterName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="server" className="text-compass-200 font-medium">
            Server
          </Label>
          <Select
            value={server}
            onValueChange={handleServerChange}
            disabled={isLoading}
            aria-describedby={validationErrors.server ? "server-error" : undefined}
            aria-invalid={!!validationErrors.server}
          >
            <SelectTrigger
              className="bg-compass-800 border-compass-600 text-compass-100 focus:border-gold-500 focus:ring-gold-500/20"
              data-testid="server-select"
            >
              <SelectValue placeholder="Select your server" className="text-compass-400" />
            </SelectTrigger>
            <SelectContent className="bg-compass-800 border-compass-600 max-h-[300px]">
              {serverList.map((serverOption) => (
                <SelectItem
                  key={serverOption.name}
                  value={serverOption.name}
                  className="text-compass-100 hover:bg-compass-700 focus:bg-compass-700"
                  data-testid={`server-option-${serverOption.name}`}
                >
                  <span className="text-compass-100">{serverOption.name}</span>
                  <span className="text-compass-400 ml-2">({serverOption.datacenter})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.server && (
            <p id="server-error" className="text-sm text-red-400" role="alert">
              {validationErrors.server}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full compass-button compass-glow"
          disabled={isLoading}
          data-testid="search-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Compass className="mr-2 h-4 w-4" />
              Search Character
            </>
          )}
        </Button>

        <div className="text-xs text-compass-400 text-center space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Info className="h-3 w-3" />
            Enter your character name exactly as it appears on the Lodestone
          </p>
        </div>
      </form>

      {possibleMatches.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-compass-200 font-medium">
            Multiple characters found -- select the correct one:
          </p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {possibleMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => handleSelectMatch(match)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-compass-800/60 border border-compass-600 hover:bg-compass-700/60 hover:border-gold-500/50 transition-all duration-200 text-left"
              >
                {match.avatar ? (
                  <img
                    src={match.avatar}
                    alt={match.name}
                    className="w-10 h-10 rounded-full border border-compass-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-compass-700 flex items-center justify-center border border-compass-500">
                    <UserCircle className="w-6 h-6 text-compass-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-compass-100 truncate">{match.name}</p>
                  <p className="text-xs text-compass-400">{match.server}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
