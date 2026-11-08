import React, { useState, useEffect, useRef } from 'react';
import { ScreenState, Passage, RaceStats, Room } from './types/game';
import { PASSAGES, getRandomPassage } from './data/passages';
import { socketService } from './services/socketService';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { RaceScreen } from './components/RaceScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { MultiplayerModal } from './components/MultiplayerModal';
import StatisticsScreen from './components/StatisticsScreen';
import PlayerProgressionBar from './components/PlayerProgressionBar';
import AchievementsPanel from './components/AchievementsPanel';
import PlayerProfileScreen from './components/PlayerProfileScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import { getLevelInfo } from './utils/progression';
import {
  loadDisplayName,
  saveDisplayName,
} from './utils/playerProfile';

import AchievementNotification from './components/AchievementNotification';

import {
  loadUnlockedAchievements,
  checkAndUnlockAchievements,
} from './utils/achievements';

import type {
  UnlockedAchievement,
} from './utils/achievements';

import {
  loadProgression,
  awardRaceXp,
} from './utils/progression';

import type {
  ProgressionData,
} from './utils/progression';
function createRaceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [passage, setPassage] = useState<Passage>(PASSAGES[0]);
  const [soloStats, setSoloStats] = useState<RaceStats | null>(null);

  // Multiplayer State
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [initialInviteCode, setInitialInviteCode] = useState<string>('');
  const [multiplayerRoom, setMultiplayerRoom] = useState<Room | null>(null);
  const [multiplayerCountdown, setMultiplayerCountdown] = useState<number | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [playerLeftNotice, setPlayerLeftNotice] = useState<string | null>(null);
  // Player progression
  const [progression, setProgression] = useState<ProgressionData>(
    () => loadProgression()
  );
  const [unlockedAchievements, setUnlockedAchievements] =
    useState<UnlockedAchievement[]>(
      () => loadUnlockedAchievements()
    );

  const [achievementNotice, setAchievementNotice] =
    useState<UnlockedAchievement[]>([]);
  const [displayName, setDisplayName] = useState(
    () => loadDisplayName()
  );

  const [lastXpGain, setLastXpGain] = useState<number | null>(null);
  useEffect(() => {
    const STORAGE_KEY = 'keyrush:settings:v1';

    let theme = 'system';

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const settings = JSON.parse(saved);

        if (['light', 'dark', 'system'].includes(settings.theme)) {
          theme = settings.theme;
        }
      }
    } catch {
      theme = 'system';
    }

    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Race IDs prevent duplicate XP awards.
  const activeSoloRaceIdRef = useRef<string>('');
  const activeMultiplayerRaceIdRef = useRef<string>('');
  const currentPlayerIdRef = useRef<string>('');

  // 1. Check URL parameters for direct invite link e.g. ?room=RUSH42
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setInitialInviteCode(code.toUpperCase());
      setIsMultiplayerModalOpen(true);
    }
  }, []);

  // 2. Register Socket.IO listeners

  useEffect(() => {
    socketService.connect();
    socketService.onSessionRestored(({ room, playerId }) => {
      currentPlayerIdRef.current = playerId;
      activeMultiplayerRaceIdRef.current = '';

      setCurrentPlayerId(playerId);
      setMultiplayerRoom(room);
      setMultiplayerCountdown(null);

      if (room.state === 'WAITING') {
        setScreen('lobby');
      } else if (
        room.state === 'COUNTDOWN' ||
        room.state === 'RACING'
      ) {
        setScreen('racing');
      } else if (room.state === 'FINISHED') {
        setScreen('results');
      }
    });
    socketService.onPlayerLeft(({ playerName, remainingPlayerCount }) => {
      if (remainingPlayerCount <= 1) {
        setPlayerLeftNotice(
          `${playerName} left. You are the last player remaining. Race ended.`
        );

        activeMultiplayerRaceIdRef.current = '';
        currentPlayerIdRef.current = '';

        setTimeout(() => {
          socketService.leaveRoom();

          setMultiplayerRoom(null);
          setCurrentPlayerId('');
          setPlayerLeftNotice(null);
          setMultiplayerCountdown(null);

          setScreen('home');
        }, 4000);

        return;
      }

      // Two or more players remain: continue racing.
      setPlayerLeftNotice(`${playerName} left the race.`);

      setTimeout(() => {
        setPlayerLeftNotice(null);
      }, 4000);
    });

    socketService.onRoomUpdated((room) => {
      setMultiplayerRoom(room);
      if (room.state === 'WAITING') {
        setScreen('lobby');
      } else if (room.state === 'COUNTDOWN' || room.state === 'RACING') {
        setScreen('racing');
      } else if (room.state === 'FINISHED') {
        setScreen('results');
      }

    });


    socketService.onRaceCountdown((seconds) => {
      setMultiplayerCountdown(seconds);
    });

    socketService.onRaceStarted(({ passage: racePassage }) => {
      activeMultiplayerRaceIdRef.current = createRaceId('multiplayer');
      setLastXpGain(null);
      setPassage(racePassage);
      setMultiplayerCountdown(0);
      setScreen('racing');
    });

    socketService.onPlayerProgressUpdated(({ playerId, progressRatio, wpm, accuracy }) => {
      setMultiplayerRoom((room) => {
        if (!room) return room;
        const existing = room.players.find((player) => player.id === playerId);
        if (!existing) return room;
        return {
          ...room,
          players: room.players.map((player) =>
            player.id === playerId ? { ...player, progressRatio, wpm, accuracy } : player
          ),
        };
      });
    });

    socketService.onPlayerFinished(({ playerId, rank, finishTimeSeconds, wpm, accuracy }) => {
      if (
        playerId === currentPlayerIdRef.current &&
        activeMultiplayerRaceIdRef.current
      ) {
        const result = awardRaceXp(
          activeMultiplayerRaceIdRef.current,
          { wpm, accuracy }
        );

        setProgression(result.progression);

        if (result.xpAwarded > 0) {
          setLastXpGain(result.xpAwarded);
        }
        const achievementResult = checkAndUnlockAchievements(
          result.progression
        );

        setUnlockedAchievements(achievementResult.unlocked);

        if (achievementResult.newlyUnlocked.length > 0) {
          setAchievementNotice(achievementResult.newlyUnlocked);
        }
      }
      setMultiplayerRoom((room) => {
        if (!room) return room;
        const existing = room.players.find((player) => player.id === playerId);
        if (!existing) return room;
        return {
          ...room,
          players: room.players.map((player) =>
            player.id === playerId
              ? {
                ...player,
                isFinished: true,
                finishRank: rank,
                finishTimeSeconds,
                progressRatio: 1.0,
                wpm,
                accuracy,
              }
              : player
          ),
        };
      });
    });

    socketService.onRaceFinished(({ room }) => {
      setMultiplayerRoom(room);
      setScreen('results');
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  // Handlers
  const handleStartSoloRace = () => {
    activeSoloRaceIdRef.current = createRaceId('solo');
    activeMultiplayerRaceIdRef.current = '';
    currentPlayerIdRef.current = '';

    setLastXpGain(null);
    setAchievementNotice([]);

    setMultiplayerRoom(null);
    setCurrentPlayerId('');

    const selectedPassage = getRandomPassage();

    setPassage(selectedPassage);
    setSoloStats(null);
    setScreen('racing');
  };

  const handleJoinedMultiplayerRoom = (
    room: Room,
    playerId: string
  ) => {
    currentPlayerIdRef.current = playerId;
    activeMultiplayerRaceIdRef.current = '';

    setMultiplayerRoom(room);
    setCurrentPlayerId(playerId);
    setIsMultiplayerModalOpen(false);
    setScreen('lobby');
  };

  const handleRaceFinished = (stats: RaceStats) => {
    if (!multiplayerRoom) {
      // Fallback in case a solo race was started without an ID.
      if (!activeSoloRaceIdRef.current) {
        activeSoloRaceIdRef.current = createRaceId('solo');
      }


      const result = awardRaceXp(
        activeSoloRaceIdRef.current,
        stats
      );


      setProgression(result.progression);

      if (result.xpAwarded > 0) {
        setLastXpGain(result.xpAwarded);
      }

      const achievementResult = checkAndUnlockAchievements(
        result.progression
      );

      setUnlockedAchievements(achievementResult.unlocked);

      if (achievementResult.newlyUnlocked.length > 0) {
        setAchievementNotice(achievementResult.newlyUnlocked);
      }

      setSoloStats(stats);
      setScreen('results');
    }
  };

  const handlePlayAgain = () => {
    if (multiplayerRoom) {
      socketService.playAgain();
    } else {
      handleStartSoloRace();
      setPlayerLeftNotice(null);
    }
  };

  const handleNavigateHome = () => {
    if (multiplayerRoom) {
      socketService.leaveRoom();
      setMultiplayerRoom(null);
    }
    setScreen('home');
  };
  const handleNavigateStatistics = () => {
    // The Statistics page is for solo race records.
    setScreen('statistics');
  };
  const handleNavigateLeaderboard = () => {
    setScreen('leaderboard');
  };
  const handleNavigateSettings = () => {
    setScreen('settings');
  };
  const handleNavigateProfile = () => {
    setScreen('profile');
  };

  const handleSaveDisplayName = (name: string) => {
    const savedName = saveDisplayName(name);
    setDisplayName(savedName);
  };

  return (
    <div className="app-container">
      <Navbar
        currentScreen={screen}
        onNavigateHome={handleNavigateHome}
        onStartPractice={handleStartSoloRace}
        onNavigateStatistics={handleNavigateStatistics}
        onNavigateProfile={handleNavigateProfile}
        onNavigateLeaderboard={handleNavigateLeaderboard}
        onNavigateSettings={handleNavigateSettings}
      />
      <PlayerProgressionBar
        progression={progression}
        lastXpGain={lastXpGain}
      />
      <AchievementNotification
        achievements={achievementNotice}
        onDismiss={() => setAchievementNotice([])}
      />
      <main className="main-content">
        {screen === 'home' && (
          <>
            <HomeScreen
              onStartSoloRace={handleStartSoloRace}
              onOpenMultiplayerModal={() => setIsMultiplayerModalOpen(true)}
              displayName={displayName}
              totalXp={progression.totalXp}
              totalRaces={progression.totalRaces}
              bestWpm={progression.bestWpm}
              bestAccuracy={progression.bestAccuracy}
            />

            <AchievementsPanel
              unlockedAchievements={unlockedAchievements}
            />
          </>
        )}
        {screen === 'statistics' && (
          <StatisticsScreen
            displayName={displayName}
            onNavigateHome={handleNavigateHome}
            onStartPractice={handleStartSoloRace}
          />
        )}
        {screen === 'leaderboard' && <LeaderboardScreen />}
        {screen === 'settings' && (
          <SettingsScreen
            displayName={displayName}
            progressionLevel={getLevelInfo(progression.totalXp).level}
            onNavigateHome={handleNavigateHome}
            onNavigateProfile={handleNavigateProfile}
            onStartPractice={handleStartSoloRace}
          />
        )}
        {screen === 'profile' && (
          <PlayerProfileScreen
            displayName={displayName}
            progression={progression}
            unlockedAchievements={unlockedAchievements}
            onSaveDisplayName={handleSaveDisplayName}
            onNavigateHome={handleNavigateHome}
            onStartPractice={handleStartSoloRace}
          />
        )}

        {screen === 'lobby' && multiplayerRoom && (
          <LobbyScreen
            room={multiplayerRoom}
            currentPlayerId={currentPlayerId}
            onLeaveLobby={handleNavigateHome}
          />
        )}

        {screen === 'racing' && (
          <RaceScreen
            key={multiplayerRoom ? `mp-${multiplayerRoom.code}` : `solo-${passage.id}`}
            passage={multiplayerRoom ? multiplayerRoom.passage : passage}
            multiplayerRoom={multiplayerRoom}
            playerLeftNotice={playerLeftNotice}
            currentPlayerId={currentPlayerId}
            multiplayerCountdown={multiplayerCountdown}
            onRaceFinished={handleRaceFinished}
            onRestartRace={handleStartSoloRace}
            onLeaveRace={handleNavigateHome}
          />
        )}

        {screen === 'results' && (
          <ResultsScreen
            stats={soloStats || { elapsedTimeSeconds: 0, wpm: 0, accuracy: 100, progressRatio: 1, matchedCharCount: 0, totalAttemptsCount: 0, correctAttemptsCount: 0 }}
            passage={multiplayerRoom ? multiplayerRoom.passage : passage}
            multiplayerRoom={multiplayerRoom}
            currentPlayerId={currentPlayerId}
            onPlayAgain={handlePlayAgain}
            onNavigateHome={handleNavigateHome}
          />
        )}
      </main>


      {/* Multiplayer Join / Create Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        onJoinedRoom={handleJoinedMultiplayerRoom}
        initialRoomCode={initialInviteCode}
      />

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.25rem 2rem',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1040px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>KeyRush Phase 2 Multiplayer Arcade</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Typing is your Accelerator</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
