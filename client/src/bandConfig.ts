// Central place for all of The Scrumps' real-world links and song metadata.
// Swap the placeholder URLs below for the band's actual pages, and drop
// per-song preview mp3s into client/public/ then point `previewSrc` at them.

export interface BandLink {
  label: string;
  href: string;
  icon: string;
}

export interface Song {
  id: string;
  title: string;
  /** Which collectible CD unlocks this track in the jukebox */
  cd: string;
  /** Where the CD is hidden, shown while the track is locked */
  foundAt: string;
  /** Local preview audio (placeholder uses the site's main track) */
  previewSrc: string;
  /** Link out to the full track on streaming */
  streamHref: string;
}

// TODO(band): replace with real URLs
export const SOCIAL_LINKS: BandLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/thescrumps', icon: '📸' },
  { label: 'TikTok', href: 'https://tiktok.com/@thescrumps', icon: '🎬' },
  { label: 'YouTube', href: 'https://youtube.com/@thescrumps', icon: '▶️' },
];

export const STREAMING_LINKS: BandLink[] = [
  { label: 'Spotify', href: 'https://open.spotify.com/', icon: '🟢' },
  { label: 'Apple Music', href: 'https://music.apple.com/', icon: '🍎' },
  { label: 'Bandcamp', href: 'https://bandcamp.com/', icon: '🔵' },
  { label: 'YouTube', href: 'https://youtube.com/', icon: '▶️' },
];

export const MERCH_URL = 'https://thescrumps.bandcamp.com/merch';
export const SHOWS_URL = 'https://www.songkick.com/';

export const SONGS: Song[] = [
  { id: 'house-of-peterson', title: 'House of Peterson', cd: 'House of Peterson', foundAt: 'the backyard', previewSrc: '/background-music.mp3', streamHref: 'https://open.spotify.com/' },
  { id: 'hot-shot', title: 'HOT SHOT', cd: 'HOT SHOT', foundAt: 'downstairs', previewSrc: '/background-music.mp3', streamHref: 'https://open.spotify.com/' },
  { id: 'she-knows', title: 'She Knows', cd: 'She Knows', foundAt: 'the living room', previewSrc: '/background-music.mp3', streamHref: 'https://open.spotify.com/' },
  { id: 'middle-of-the-night', title: 'Middle of the Night', cd: 'Middle of the Night', foundAt: 'the bedroom', previewSrc: '/background-music.mp3', streamHref: 'https://open.spotify.com/' },
];

export const SHARE_TEXT =
  'I escaped inspection day as a sentient crisp 🥔 Play The Scrumps’ absurd backyard adventure:';
