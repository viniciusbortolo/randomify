import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  spotifyId: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  popularity: z.number().optional(),
  uri: z.string().optional(),
  externalUrl: z.string().optional(),
});
export type Artist = z.infer<typeof ArtistSchema>;

export const RandomizeTypeSchema = z.enum(['track', 'album', 'single']);
export type RandomizeType = z.infer<typeof RandomizeTypeSchema>;

export const RandomizeRequestSchema = z.object({
  artistIds: z.array(z.string()).min(1, 'Please select at least one artist to randomize.'),
  type: RandomizeTypeSchema,
});
export type RandomizeRequest = z.infer<typeof RandomizeRequestSchema>;

export const TrackResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
  externalUrl: z.string(),
  imageUrl: z.string().nullable().optional(),
  artistNames: z.array(z.string()),
  durationMs: z.number().optional(),
  previewUrl: z.string().nullable().optional(),
  albumName: z.string().optional(),
  releaseDate: z.string().optional(),
});
export type TrackResult = z.infer<typeof TrackResultSchema>;

export const AlbumResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
  externalUrl: z.string(),
  imageUrl: z.string().nullable().optional(),
  artistNames: z.array(z.string()),
  totalTracks: z.number().optional(),
  releaseDate: z.string().optional(),
  albumType: z.string(),
});
export type AlbumResult = z.infer<typeof AlbumResultSchema>;

export const RandomizeResponseSchema = z.object({
  type: RandomizeTypeSchema,
  selectedArtist: ArtistSchema,
  track: TrackResultSchema.optional(),
  album: AlbumResultSchema.optional(),
});
export type RandomizeResponse = z.infer<typeof RandomizeResponseSchema>;

export const PresetArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable().optional(),
});
export type PresetArtist = z.infer<typeof PresetArtistSchema>;

export const CreatePresetSchema = z.object({
  name: z.string().min(1, 'Preset name is required.').max(50, 'Preset name is too long.'),
  artists: z.array(PresetArtistSchema).min(1, 'Please select at least one artist.'),
});
export type CreatePresetInput = z.infer<typeof CreatePresetSchema>;

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(PresetArtistSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Preset = z.infer<typeof PresetSchema>;

export const HistoryItemSchema = z.object({
  id: z.string(),
  type: RandomizeTypeSchema,
  itemName: z.string(),
  itemUri: z.string(),
  externalUrl: z.string(),
  artistNames: z.array(z.string()),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type HistoryItem = z.infer<typeof HistoryItemSchema>;
