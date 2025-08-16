"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Keep Alert for validation errors if needed, but remove for API feedback
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Info, Compass } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

const servers = [
  // NA Data Centers
  { name: "Adamantoise", datacenter: "Aether" },
  { name: "Cactuar", datacenter: "Aether" },
  { name: "Faerie", datacenter: "Aether" },
  { name: "Gilgamesh", datacenter: "Aether" },
  { name: "Jenova", datacenter: "Aether" },
  { name: "Midgardsormr", datacenter: "Aether" },
  { name: "Sargatanas", datacenter: "Aether" },
  { name: "Siren", datacenter: "Aether" },
  // Crystal
  { name: "Balmung", datacenter: "Crystal" },
  { name: "Brynhildr", datacenter: "Crystal" },
  { name: "Coeurl", datacenter: "Crystal" },
  { name: "Diabolos", datacenter: "Crystal" },
  { name: "Goblin", datacenter: "Crystal" },
  { name: "Malboro", datacenter: "Crystal" },
  { name: "Mateus", datacenter: "Crystal" },
  { name: "Zalera", datacenter: "Crystal" },
  // Primal
  { name: "Behemoth", datacenter: "Primal" },
  { name: "Excalibur", datacenter: "Primal" },
  { name: "Exodus", datacenter: "Primal" },
  { name: "Famfrit", datacenter: "Primal" },
  { name: "Hyperion", datacenter: "Primal" },
  { name: "Lamia", datacenter: "Primal" },
  { name: "Leviathan", datacenter: "Primal" },
  { name: "Ultros", datacenter: "Primal" },
];

export function CharacterSearch() {
  const [characterName, setCharacterName] = useState("");
  const [server, setServer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    characterName?: string;
    server?: string;
  }>({});
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: characterName.trim(),
          server: server,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        
        // Handle specific error cases
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
      
      if (!data.character || !data.character.id) {
        throw new Error('Invalid character data received. Please try again.');
      }

      // Show success or warning toast
      if (data._isMockData) {
        toast({
          title: "Using Demo Data",
          description: data._error || 'XIVAPI may be temporarily unavailable. Showing demo data.',
          variant: "default", // Use default for warning/info
          icon: <Info className="h-4 w-4" />,
        });
      } else {
        toast({
          title: "Character Found!",
          description: `Successfully loaded data for ${data.character.name} on ${data.character.server}.`,
          variant: "default", // Use default for success
          icon: <Compass className="h-4 w-4" />,
        });
      }
      
      // Encode the character name and server for the URL
      const encodedName = encodeURIComponent(characterName.trim());
      const encodedServer = encodeURIComponent(server);
      
      // Redirect to the achievements page
      router.push(`/achievements?name=${encodedName}&server=${encodedServer}`);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
    // Clear validation error when user starts typing
    if (validationErrors.characterName) {
      setValidationErrors(prev => ({ ...prev, characterName: undefined }));
    }
  };

  const handleServerChange = (value: string) => {
    setServer(value);
    // Clear validation error when user selects a server
    if (validationErrors.server) {
      setValidationErrors(prev => ({ ...prev, server: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Removed error and warning Alert components, now handled by toasts */}
      
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
        />
        {validationErrors.characterName && (
          <p className="text-sm text-red-400">{validationErrors.characterName}</p>
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
        >
          <SelectTrigger 
            className="bg-compass-800 border-compass-600 text-compass-100 focus:border-gold-500 focus:ring-gold-500/20"
            data-testid="server-select"
          >
            <SelectValue placeholder="Select your server" className="text-compass-400" />
          </SelectTrigger>
          <SelectContent className="bg-compass-800 border-compass-600">
            {servers.map((serverOption) => (
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
          <p className="text-sm text-red-400">{validationErrors.server}</p>
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
          Try "Test Character", "Demo User", or "Example Player" on any server for demo data
        </p>
        <p>Real character names will attempt to fetch from XIVAPI</p>
      </div>
    </form>
  );
}