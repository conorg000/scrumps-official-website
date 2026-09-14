import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadSpotifyIframeApi,
  spotifyTrackUrl,
  type SpotifyController,
} from '../music/spotifyIframeApi';
import { inTrackOrder, type ScrumpsTrack } from '../music/tracks';

/** Spotify's compact embed. Tall enough for the controls, short enough for a phone. */
const EMBED_HEIGHT = 152;

interface BoomboxProps {
  /** Song name of the CD currently in the tray. */
  songName: string;
  /** Every CD collected so far, so you can flip between them. */
  collectedCDs: string[];
  /** Fires true while Spotify is actually playing, false when it stops. */
  onPlayingChange: (playing: boolean) => void;
  /** Swap the CD in the tray. */
  onSelectSong: (songName: string) => void;
  onClose: () => void;
}

export const Boombox: React.FC<BoomboxProps> = ({
  songName,
  collectedCDs,
  onPlayingChange,
  onSelectSong,
  onClose,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const [embedFailed, setEmbedFailed] = useState(false);

  const tracks = inTrackOrder(collectedCDs);
  const track = tracks.find((t) => t.name === songName) ?? tracks[0];
  const uri = track ? `spotify:track:${track.spotifyId}` : '';

  // Read inside async callbacks that outlive the render they were created in.
  const uriRef = useRef(uri);
  uriRef.current = uri;
  const playingChangeRef = useRef(onPlayingChange);
  playingChangeRef.current = onPlayingChange;

  // Build the embed once; Spotify replaces the mount node with its own iframe,
  // so it lives outside React's tree and React must never render into the host.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !uriRef.current) return;

    let cancelled = false;
    const mount = document.createElement('div');
    host.appendChild(mount);
    const initialUri = uriRef.current;

    loadSpotifyIframeApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(
          mount,
          { uri: initialUri, width: '100%', height: EMBED_HEIGHT },
          (controller) => {
            if (cancelled) {
              controller.destroy();
              return;
            }
            controllerRef.current = controller;

            controller.addListener('ready', () => {
              // The CD may have been swapped while the script was loading.
              if (uriRef.current !== initialUri) controller.loadUri(uriRef.current);
              // Autoplay may be refused, in which case the embed's own play
              // button takes over and playback_update still drives the music.
              controller.play();
            });

            controller.addListener('playback_update', (e) => {
              playingChangeRef.current(!e.data.isPaused);
            });
          },
        );
      })
      .catch(() => {
        if (!cancelled) setEmbedFailed(true);
      });

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      host.replaceChildren();
      playingChangeRef.current(false);
    };
  }, []);

  // Swapping CDs once the controller is up.
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !uri) return;
    controller.loadUri(uri);
    controller.play();
  }, [uri]);

  const handleClose = useCallback(() => {
    controllerRef.current?.pause();
    onPlayingChange(false);
    onClose();
  }, [onClose, onPlayingChange]);

  if (!track) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border-4 border-yellow-500 bg-gradient-to-b from-zinc-900 to-black p-4 font-mono text-white shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-yellow-400">
              💿 Now playing
            </div>
            <div className="truncate text-lg font-bold leading-tight">{track.name}</div>
            <div className="text-xs text-gray-400">
              The Scrumps · found {track.foundIn}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 rounded-lg border-2 border-gray-600 bg-zinc-800 px-3 py-1 text-sm font-bold transition-colors hover:border-gray-400 hover:bg-zinc-700"
            data-testid="button-boombox-close"
          >
            ✕
          </button>
        </div>

        {embedFailed ? (
          <div className="rounded-lg border-2 border-dashed border-gray-600 p-4 text-center text-sm text-gray-300">
            <p className="mb-3">The stereo's cactus. Spotify wouldn't load.</p>
            <a
              href={spotifyTrackUrl(track.spotifyId)}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg bg-green-600 px-4 py-2 font-bold text-black transition-colors hover:bg-green-500"
            >
              Open in Spotify ↗
            </a>
          </div>
        ) : (
          <div
            ref={hostRef}
            className="overflow-hidden rounded-xl"
            style={{ minHeight: EMBED_HEIGHT }}
          />
        )}

        {tracks.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tracks.map((t: ScrumpsTrack) => (
              <button
                key={t.spotifyId}
                onClick={() => onSelectSong(t.name)}
                className={`rounded-lg border-2 px-2 py-1 text-xs font-bold transition-colors ${
                  t.name === track.name
                    ? 'border-yellow-400 bg-yellow-500 text-black'
                    : 'border-gray-600 bg-zinc-800 text-gray-300 hover:border-gray-400'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-center text-[10px] text-gray-500">
          Game music picks back up when the track stops.
        </p>
      </div>
    </div>
  );
};
