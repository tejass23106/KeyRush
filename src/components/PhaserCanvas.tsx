import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import TrackScene from '../game/PhaserTrackScene';
import { Player, CAR_COLORS } from '../types/game';

const TRACK_HEIGHT = 360;
const SETTINGS_STORAGE_KEY = 'keyrush:settings:v1';

const getPreferredCarColor = (): number => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (saved) {
      const settings = JSON.parse(saved);

      if (CAR_COLORS.includes(settings.carColor)) {
        return settings.carColor;
      }
    }
  } catch {
    // Fall back to the default car colour.
  }

  return CAR_COLORS[0];
};

interface PhaserCanvasProps {
  progressRatio?: number;
  players?: Player[];
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ progressRatio = 0, players }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<TrackScene | null>(null);
  const playersRef = useRef(players);
  const progressRef = useRef(progressRatio);
  const SETTINGS_STORAGE_KEY = 'keyrush:settings:v1';

  const getPreferredCarColor = (): number => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

      if (saved) {
        const settings = JSON.parse(saved);

        if (CAR_COLORS.includes(settings.carColor)) {
          return settings.carColor;
        }
      }
    } catch {
      // Fall back to the default car colour.
    }

    return CAR_COLORS[0];
  };
  const syncIntervalRef = useRef<number | undefined>(undefined);
  playersRef.current = players;
  progressRef.current = progressRatio;

  // Reads only from refs — safe to call from any closure age.
  const pushPlayersToScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ratio = progressRef.current ?? 0;
    const currentPlayers = playersRef.current;

    if (currentPlayers && currentPlayers.length > 0) {
      scene.updatePlayers(currentPlayers, true);
    } else {
      scene.updatePlayers([
        {
          id: 'solo-player',
          name: 'You',
          isHost: true,
          isReady: true,
          lane: 0,
          progressRatio: ratio,
          wpm: 0,
          accuracy: 100,
          isFinished: false,
          isConnected: true,
          colorHex: getPreferredCarColor(),
        },
      ], false);
    }
  };

  // Phaser game init — runs once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const parent = containerRef.current;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent,
      width: Math.max(parent.clientWidth, 320),
      height: Math.max(parent.clientHeight, TRACK_HEIGHT),
      backgroundColor: '#F4F2EC',
      transparent: false,
      scene: [TrackScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      banner: false,
      audio: { noAudio: true },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const onSceneReady = (scene: TrackScene) => {
      sceneRef.current = scene;
      pushPlayersToScene(); // set initial position

      // Polling sync: pushes the latest progressRef/playersRef into Phaser
      // every 100ms. Because pushPlayersToScene reads only refs (not props/state
      // from closure), this is correct even though it's a stale closure.
      syncIntervalRef.current = window.setInterval(pushPlayersToScene, 100);
    };

    game.events.on('track-scene-ready', onSceneReady);

    return () => {
      window.clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = undefined;
      game.events.off('track-scene-ready', onSceneReady);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate push when props change (faster than waiting for the 100ms poll)
  useEffect(() => {
    pushPlayersToScene();
  }, [players, progressRatio]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${TRACK_HEIGHT}px`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-subtle)',
        backgroundColor: '#F4F2EC',
      }}
    />
  );
};
