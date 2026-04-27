export interface Episode {
  id: string;
  number: number;
  title: string;
  file: string;
  cover?: string;
}

export interface Series {
  id: string;
  title: string;
  cover: string;
  episodes: Episode[];
}

export interface Catalog {
  series: Series[];
}

export interface EpisodeProgress {
  userId: string;
  episodeId: string;
  seriesId: string;
  status: 'playing' | 'played' | 'unplayed';
  offsetMs: number;
  lastPlayed: string;
}

export interface DeviceState {
  userId: string;
  deviceId: string;
  episodeId: string;
  seriesId: string;
  offsetMs: number;
  lastActive: string;
}
