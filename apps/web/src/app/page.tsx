'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/Header';
import { ArtistSelection } from '@/components/ArtistSelection';
import { RandomizerAction } from '@/components/RandomizerAction';
import { RandomizeResult } from '@/components/RandomizeResult';
import { HistoryModal } from '@/components/HistoryModal';
import { PresetsModal } from '@/components/PresetsModal';
import { Button } from '@/components/ui/button';
import { Dices, Music2, Disc3, Radio, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { Artist, RandomizeType, RandomizeResponse } from '@randomify/shared';

export default function Home() {
  const { isAuthenticated, isLoading, login, authError, clearAuthError } = useAuth();

  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [selectedType, setSelectedType] = useState<RandomizeType>('track');
  const [drawResult, setDrawResult] = useState<RandomizeResponse | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // Toggle artista individual
  const handleToggleArtist = (artist: Artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  };

  // Limpar todos selecionados
  const handleClearSelected = () => {
    setSelectedArtists([]);
  };

  // Selecionar múltiplos (ex: preset ou todos os seguidos)
  const handleSelectMultiple = (artists: Artist[]) => {
    setSelectedArtists(artists);
  };

  return (
    <div className="min-h-screen flex flex-col bg-radial from-zinc-900 via-zinc-950 to-black">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={clearAuthError}
              className="text-red-400 hover:text-white p-1 rounded-lg hover:bg-red-900/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400">Carregando seu Randomify...</p>
          </div>
        ) : !isAuthenticated ? (
          /* Hero Section para visitantes não autenticados */
          <div className="py-12 sm:py-20 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Sorteios aleatórios conectados ao Spotify
            </div>

            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Que tal uma música aleatória do seu artista preferido?
              </h1>
              <p className="text-base sm:text-lg text-zinc-400">
                Escolha um ou vários artistas e deixe o Randomify sortear uma música surpresa,
                um álbum completo ou um single/EP direto do catálogo do Spotify.
              </p>
            </div>

            <Button
              variant="spotify"
              size="lg"
              onClick={login}
              className="h-14 px-8 text-base font-bold shadow-2xl shadow-[#1DB954]/30"
            >
              Conectar com o Spotify para Começar
            </Button>

            {/* Destaques de Funcionalidades */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 w-full max-w-3xl text-left">
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Music2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Músicas & Álbuns</h3>
                <p className="text-xs text-zinc-400">
                  Sorteie músicas isoladas, álbuns de estúdio inteiros ou lançamentos curtos (EPs/singles).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Dices className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Catálogo & Seguidos</h3>
                <p className="text-xs text-zinc-400">
                  Acesse instantaneamente quem você já segue ou busque qualquer artista do mundo.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Presets & Histórico</h3>
                <p className="text-xs text-zinc-400">
                  Salve grupos de artistas personalizados no banco PostgreSQL e consulte seus sorteios anteriores.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Aplicação Principal (Logado) */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Seção de Sorteio */}
            <div className="space-y-6">
              <RandomizerAction
                selectedArtists={selectedArtists}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                onResult={(result) => {
                  setDrawResult(result);
                  // Rola suavemente até o resultado
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Resultado do Sorteio */}
              {drawResult && (
                <RandomizeResult
                  result={drawResult}
                  onDrawAgain={() => {
                    const actionBtn = document.querySelector('button[type="button"]') as HTMLElement;
                    actionBtn?.click();
                  }}
                />
              )}
            </div>

            {/* Seção de Seleção de Artistas */}
            <div className="pt-4 border-t border-zinc-800/80">
              <ArtistSelection
                selectedArtists={selectedArtists}
                onToggleArtist={handleToggleArtist}
                onClearSelected={handleClearSelected}
                onSelectMultiple={handleSelectMultiple}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modais de Histórico e Presets */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onApplyPreset={handleSelectMultiple}
      />
    </div>
  );
}
