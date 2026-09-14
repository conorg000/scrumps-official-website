/**
 * The Scrumps tracks that back the four collectable CDs.
 *
 * `name` must match the `songName` on the matching `cd_item` furniture in
 * client/public/*.js — that string is the key the game hands us on pickup.
 * Listed in the order you find them on the journey.
 */
export interface ScrumpsTrack {
  /** Matches `cd_item.songName`. */
  name: string;
  /** Spotify track id, used to build the embed URI. */
  spotifyId: string;
  /** Where the CD is lying about, phrased to follow "found". */
  foundIn: string;
}

export const SCRUMPS_TRACKS: readonly ScrumpsTrack[] = [
  { name: 'House of Peterson', spotifyId: '0U1EKk6jTJ7Ai98SPkqlEw', foundIn: 'in the backyard' },
  { name: 'HOT SHOT', spotifyId: '6FnqalRNEP5MPjQGMkPZ4E', foundIn: 'downstairs' },
  { name: 'She Knows', spotifyId: '36hUsrVI4VQ2uzNapvNi6U', foundIn: 'in the living room' },
  { name: 'Middle of the Night', spotifyId: '1fARsDtAXrFXlUFsOtkes4', foundIn: 'in the bedroom' },
];

export function findTrack(songName: string): ScrumpsTrack | undefined {
  return SCRUMPS_TRACKS.find((t) => t.name === songName);
}

/** Collected song names, sorted back into journey order. */
export function inTrackOrder(songNames: readonly string[]): ScrumpsTrack[] {
  return SCRUMPS_TRACKS.filter((t) => songNames.includes(t.name));
}
