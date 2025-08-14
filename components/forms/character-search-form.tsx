"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Info, Compass } from 'lucide-react';
import { characterSearchSchema, type CharacterSearchSchema, SERVER_GROUPS } from '@/lib/schemas/character';
import { useCharacterData } from '@/lib/hooks/useCharacterData';

interface CharacterSearchFormProps {
  onSearchStart?: () => void;
}

export function CharacterSearchForm({ onSearchStart }: CharacterSearchFormProps) {
  const router = useRouter();
  const { isLoading, error, clearError } = useCharacterData();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CharacterSearchSchema>({
    resolver: zodResolver(characterSearchSchema),
    defaultValues: {
      characterName: '',
      server: undefined,
    },
  });

  const selectedServer = watch('server');

  const onSubmit = async (data: CharacterSearchSchema) => {
    try {
      clearError();
      onSearchStart?.();

      // Encode for URL
      const encodedName = encodeURIComponent(data.characterName);
      const encodedServer = encodeURIComponent(data.server);

      // Navigate to achievements page
      router.push(`/achievements?name=${encodedName}&server=${encodedServer}`);
    } catch (submitError) {
      console.error('Form submission error:', submitError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-600 bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="characterName" className="text-compass-200 font-medium">
          Character Name
        </Label>
        <Input
          id="characterName"
          {...register('characterName')}
          placeholder="Enter your character name"
          className="bg-compass-800 border-compass-600 text-compass-100 placeholder:text-compass-400 focus:border-gold-500 focus:ring-gold-500/20"
          disabled={isLoading || isSubmitting}
        />
        {errors.characterName && (
          <p className="text-sm text-red-400">{errors.characterName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="server" className="text-compass-200 font-medium">
          Server
        </Label>
        <Select
          value={selectedServer}
          onValueChange={(value) => setValue('server', value as any)}
          disabled={isLoading || isSubmitting}
        >
          <SelectTrigger className="bg-compass-800 border-compass-600 text-compass-100 focus:border-gold-500 focus:ring-gold-500/20">
            <SelectValue placeholder="Select your server" />
          </SelectTrigger>
          <SelectContent className="bg-compass-800 border-compass-600">
            {Object.entries(SERVER_GROUPS).map(([datacenter, servers]) => (
              <div key={datacenter}>
                <div className="px-2 py-1.5 text-xs font-semibold text-compass-400 uppercase tracking-wider">
                  {datacenter}
                </div>
                {servers.map((server) => (
                  <SelectItem
                    key={server}
                    value={server}
                    className="text-compass-100 hover:bg-compass-700 focus:bg-compass-700"
                  >
                    {server}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {errors.server && (
          <p className="text-sm text-red-400">{errors.server.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gold-600 hover:bg-gold-700 text-compass-900 font-semibold"
        disabled={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? (
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