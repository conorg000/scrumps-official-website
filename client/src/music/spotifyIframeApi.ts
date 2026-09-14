/**
 * Loader for Spotify's embed IFrame API.
 *
 * The plain `<iframe src="open.spotify.com/embed/...">` needs no credentials but
 * is also a black box — it never tells us whether it is playing. The IFrame API
 * wraps the same anonymous embed (still no client id, no secret, no login) and
 * emits `playback_update`, which is what lets the game duck its own music while
 * a track is on and bring it back when the track stops.
 */

/** The subset of the controller we actually use. */
export interface SpotifyController {
  addListener(event: 'ready', cb: () => void): void;
  addListener(event: 'playback_update', cb: (e: { data: PlaybackData }) => void): void;
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  destroy(): void;
}

export interface PlaybackData {
  isPaused: boolean;
  isBuffering: boolean;
  /** Milliseconds. 0 until the embed has loaded a track. */
  duration: number;
  /** Milliseconds. */
  position: number;
}

export interface SpotifyIFrameApi {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: number | string; height?: number | string },
    callback: (controller: SpotifyController) => void,
  ): void;
}

const SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1';

let pending: Promise<SpotifyIFrameApi> | null = null;

/**
 * Injects Spotify's embed script and resolves once it hands back the API.
 * Cached, so reopening the boombox reuses the already-loaded script.
 * Rejects if the script cannot load — blocked by an extension, or offline.
 */
export function loadSpotifyIframeApi(): Promise<SpotifyIFrameApi> {
  if (pending) return pending;

  pending = new Promise<SpotifyIFrameApi>((resolve, reject) => {
    const win = window as unknown as {
      onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void;
    };

    // Spotify calls this global exactly once, when the script finishes booting.
    win.onSpotifyIframeApiReady = (api) => resolve(api);

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => {
      pending = null; // let a later attempt retry from scratch
      reject(new Error('Could not load the Spotify embed script'));
    };
    document.body.appendChild(script);
  });

  return pending;
}

/** Deep link used when the embed will not load, so the track is still reachable. */
export function spotifyTrackUrl(spotifyId: string): string {
  return `https://open.spotify.com/track/${spotifyId}`;
}
