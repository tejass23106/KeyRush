import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { soundService } from '../services/soundService';
import {
  Passage,
  RaceStats,
  Room,
  CAR_COLORS,
  WpmSample,
} from '../types/game';
const PhaserCanvas = lazy(() =>
  import('./PhaserCanvas').then((module) => ({
    default: module.PhaserCanvas,
  }))
);
import {
  computeMatching,
  calculateWpm,
  calculateAccuracy,
  formatTime,
} from '../utils/typingMath';
import { socketService } from '../services/socketService';
import {
  Clock,
  Gauge,
  Target,
  RefreshCw,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface RaceScreenProps {
  playerLeftNotice?: string | null;
  passage: Passage;
  multiplayerRoom?: Room | null;
  currentPlayerId?: string;
  multiplayerCountdown?: number | null;
  onLeaveRace: () => void;
  onRaceFinished: (stats: RaceStats) => void;
  onRestartRace: () => void;
}
// Small top-down racing-car icon matching the track cars.
const MiniCarIcon: React.FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden="true"
    style={{
      position: 'relative',
      display: 'inline-block',
      width: '25px',
      height: '14px',
      flexShrink: 0,
    }}
  >
    {/* Rear wing */}
    <span
      style={{
        position: 'absolute',
        left: '1px',
        top: '1px',
        width: '4px',
        height: '12px',
        borderRadius: '1px',
        backgroundColor: '#242622',
      }}
    />

    {/* Main body */}
    <span
      style={{
        position: 'absolute',
        left: '4px',
        top: '2px',
        width: '17px',
        height: '10px',
        borderRadius: '5px',
        backgroundColor: color,
        boxShadow: '0 0 0 1px rgba(36, 38, 34, 0.2)',
      }}
    />

    {/* Cockpit */}
    <span
      style={{
        position: 'absolute',
        left: '10px',
        top: '4px',
        width: '7px',
        height: '6px',
        borderRadius: '2px',
        backgroundColor: '#34474a',
      }}
    />

    {/* Headlights */}
    <span
      style={{
        position: 'absolute',
        right: '3px',
        top: '3px',
        width: '2px',
        height: '2px',
        backgroundColor: '#f4f2ec',
      }}
    />

    <span
      style={{
        position: 'absolute',
        right: '3px',
        bottom: '3px',
        width: '2px',
        height: '2px',
        backgroundColor: '#f4f2ec',
      }}
    />
  </span>
);

export const RaceScreen: React.FC<RaceScreenProps> = ({
  onLeaveRace,
  playerLeftNotice,
  passage,
  multiplayerRoom = null,
  currentPlayerId,
  multiplayerCountdown = null,
  onRaceFinished,
  onRestartRace,
}) => {
  // local race state
  const [soloCountdown, setSoloCountdown] = useState<number>(3);
  const [userInput, setUserInput] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Historical typing statistics.
  const totalAttemptsRef = useRef<number>(0);
  const correctAttemptsRef = useRef<number>(0);

  // Mistakes permanently reduce accuracy.
  const mistakeCountRef = useRef<number>(0);
  const accuracyRef = useRef<number>(100);

  const [currentAccuracy, setCurrentAccuracy] =
    useState<number>(100);
  const wpmHistoryRef = useRef<WpmSample[]>([]);
  const lastWpmSampleSecondRef = useRef<number>(-1);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const passageWindowRef = useRef<HTMLDivElement>(null);

  const isMultiplayer = !!multiplayerRoom;
  const isRaceInterrupted = Boolean(
    playerLeftNotice?.toLowerCase().includes('last player remaining')
  );

  const activeCountdown = isMultiplayer
    ? multiplayerCountdown !== null
      ? multiplayerCountdown
      : 0
    : soloCountdown;
  // Countdown sound effects
  const previousCountdownRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeCountdown > 0) {
      if (previousCountdownRef.current !== activeCountdown) {
        soundService.playCountdown(activeCountdown);
        previousCountdownRef.current = activeCountdown;
      }
      return;
    }

    // Play the GO sound only when a real countdown reaches zero.
    if (
      previousCountdownRef.current !== null &&
      previousCountdownRef.current > 0
    ) {
      previousCountdownRef.current = 0;
      soundService.playCountdown('go');
    } else if (previousCountdownRef.current === null) {
      previousCountdownRef.current = 0;
    }
  }, [activeCountdown]);

  // normalize passage to lowercase without punctuation
  const raceText = passage.text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // character matching
  const matching = computeMatching(raceText, userInput);

  const progressRatio =
    raceText.length > 0 ? matching.matchedCount / raceText.length : 0;

  // solo countdown
  useEffect(() => {
    let countdownTimer: ReturnType<typeof setInterval> | undefined;
    // Countdown sound effects



    if (!isMultiplayer && soloCountdown > 0) {
      countdownTimer = setInterval(() => {
        setSoloCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimer) clearInterval(countdownTimer);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };


  }, [isMultiplayer, soloCountdown]);


  // Start race timer and focus input when countdown reaches zero.
  useEffect(() => {
    if (
      activeCountdown === 0 &&
      !isFinished &&
      !isRaceInterrupted
    ) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      }

      // Start the engine when the race begins.
      soundService.startEngine();

      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current && !isFinishedRef.current) {
          const now = performance.now();
          const elapsed = (now - startTimeRef.current) / 1000;
          setElapsedSeconds(elapsed);
        }
      }, 50);

      inputRef.current?.focus();
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Fade out and stop the engine on finish or cleanup.
      soundService.stopEngine();
    };
  }, [activeCountdown, isFinished, isRaceInterrupted]);



  const handleWorkspaceClick = () => {
    if (
      activeCountdown === 0 &&
      !isFinished &&
      !isRaceInterrupted
    ) {
      inputRef.current?.focus();
    }
  };

  // live statistics
  const liveElapsed = startTimeRef.current
    ? (performance.now() - startTimeRef.current) / 1000
    : elapsedSeconds;

  const currentWpm = calculateWpm(matching.matchedCount, liveElapsed);
  useEffect(() => {
    if (activeCountdown === 0 && !isFinished) {
      soundService.setEngineThrottle(currentWpm);
    }
  }, [currentWpm, activeCountdown, isFinished]);
  // Record WPM once per second for the solo results graph.
  useEffect(() => {
    if (
      isMultiplayer ||
      activeCountdown !== 0 ||
      isFinishedRef.current ||
      !startTimeRef.current
    ) {
      return;
    }

    const sampleSecond = Math.floor(elapsedSeconds);

    // Avoid recording multiple samples during the same second.
    if (sampleSecond <= lastWpmSampleSecondRef.current) {
      return;
    }

    lastWpmSampleSecondRef.current = sampleSecond;

    wpmHistoryRef.current.push({
      timeSeconds: sampleSecond,
      wpm: currentWpm,
    });
  }, [
    isMultiplayer,
    activeCountdown,
    elapsedSeconds,
    currentWpm,
  ]);



  const activePlayerId =
    currentPlayerId || socketService.getSocketId() || '';

  const canvasPlayers =
    isMultiplayer && multiplayerRoom
      ? multiplayerRoom.players.map((player) =>
        player.id === activePlayerId
          ? {
            ...player,
            progressRatio,
            wpm: currentWpm,
            accuracy: currentAccuracy,
          }
          : player
      )
      : undefined;

  // Focus input when the user starts typing.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        !isRaceInterrupted &&
        !isFinished &&
        (e.key.length === 1 || e.key === 'Backspace')
      ) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [activeCountdown, isFinished, isRaceInterrupted]);


  // count typing attempts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeCountdown > 0 || isFinished || isRaceInterrupted) return;


    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key.startsWith('Arrow') ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'Delete' ||
      e.key === 'CapsLock'
    ) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (isMultiplayer) {
        socketService.sendTypingAction(e.key);
      }
      return;
    }

    if (e.key.length === 1) {
      if (isMultiplayer) {
        socketService.sendTypingAction(e.key);
      }
      const currentPos = userInput.length;
      const expectedChar = raceText[currentPos];

      // Record every character key pressed, including mistakes
      // that the player will later correct.
      totalAttemptsRef.current += 1;

      const isCorrectAttempt =
        currentPos < raceText.length &&
        e.key === expectedChar &&
        !matching.hasError;

      if (isCorrectAttempt) {
        correctAttemptsRef.current += 1;
        soundService.playTyping();
      } else {
        // Record a permanent mistake.
        mistakeCountRef.current += 1;

        // Accuracy is based on the full passage length.
        // Correct typing and Backspace cannot restore lost accuracy.
        const remainingScore = Math.max(
          0,
          raceText.length - mistakeCountRef.current
        );

        const nextAccuracy = calculateAccuracy(
          remainingScore,
          raceText.length
        );

        accuracyRef.current = Math.min(
          accuracyRef.current,
          nextAccuracy
        );

        setCurrentAccuracy(accuracyRef.current);
      }
    }


  };

  // handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCountdown > 0 || isFinished || isRaceInterrupted) return;


    const val = e.target.value;

    if (val.length > raceText.length + 10) return;

    setUserInput(val);

    const matchResult = computeMatching(raceText, val);

    if (matchResult.isFinished && !isFinishedRef.current) {
      isFinishedRef.current = true;
      setIsFinished(true);
      soundService.stopEngine();
      soundService.playFinish();

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const finalElapsed = startTimeRef.current
        ? (performance.now() - startTimeRef.current) / 1000
        : elapsedSeconds;

      const finalWpm = calculateWpm(raceText.length, finalElapsed);

      const finalAcc = accuracyRef.current;
      const finalWpmHistory = [...wpmHistoryRef.current];

      const finalSample: WpmSample = {
        timeSeconds: Math.round(finalElapsed * 10) / 10,
        wpm: finalWpm,
      };

      const lastSample =
        finalWpmHistory[finalWpmHistory.length - 1];

      // Replace a sample at the same time rather than creating duplicates.
      if (lastSample && finalSample.timeSeconds <= lastSample.timeSeconds) {
        finalWpmHistory[finalWpmHistory.length - 1] = finalSample;
      } else {
        finalWpmHistory.push(finalSample);
      }
      setElapsedSeconds(finalElapsed);

      if (isMultiplayer) {

        socketService.finishRace();
      } else {
        setTimeout(() => {
          onRaceFinished({
            elapsedTimeSeconds: finalElapsed,
            wpm: finalWpm,
            accuracy: finalAcc,
            progressRatio: 1,
            matchedCharCount: raceText.length,
            totalAttemptsCount: totalAttemptsRef.current,
            correctAttemptsCount: correctAttemptsRef.current,
            wpmHistory: finalWpmHistory,
          });
        }, 400);
      }
    }


  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={handleWorkspaceClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%',
      }}
    >

      {/* Show normal departure notices above the race.
    Last-player interruption is displayed inside the typing area. */}
      {playerLeftNotice && !isRaceInterrupted && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '12px 22px',
            background: '#2F332D',
            color: '#F4F2EC',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          {playerLeftNotice}
        </div>
      )}


      {/* track canvas */}
<div style={{ position: 'relative', order: 2 }}>
  <Suspense
    fallback={
      <div
        style={{
          width: '100%',
          minHeight: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading track...
      </div>
    }
  >
    <PhaserCanvas
      progressRatio={progressRatio}
      players={canvasPlayers}
    />
  </Suspense>

        ```
        {activeCountdown > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(36, 38, 33, 0.75)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FCFBF8',
              borderRadius: 'var(--radius-md)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4.5rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}
            >
              {activeCountdown}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--track-markings)',
              }}
            >
              {isMultiplayer
                ? 'Synchronized Race Starting'
                : 'Get Ready to Type'}
            </div>
          </div>
        )}
      </div>

      {/* live metrics */}
      <div className={`race-metrics-grid ${isMultiplayer ? 'multiplayer' : 'solo'}`}>
        {[
          {
            label: 'Time',
            value: formatTime(elapsedSeconds),
            icon: <Clock size={18} />,
            color: 'var(--text-secondary)',
          },
          {
            label: 'Speed (WPM)',
            value: String(currentWpm),
            icon: <Gauge size={18} />,
            color: 'var(--accent-primary)',
          },
          {
            label: 'Accuracy',
            value: `${currentAccuracy.toFixed(1)}%`,
            icon: <Target size={18} />,
            color: 'var(--accent-secondary)',
          },
          {
            label: 'Progress',
            value: `${Math.round(progressRatio * 100)}%`,
            icon: <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>%</span>,
            color: 'var(--text-primary)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="surface-card"
            style={{
              minWidth: 0,
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                flexShrink: 0,
                backgroundColor: 'var(--bg-page)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
              }}
            >
              {stat.icon}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
        {/* Multiplayer racers panel */}
        {isMultiplayer && multiplayerRoom && (
          <div
            aria-label="Multiplayer racers"
            className="surface-card"
            style={{
              minWidth: 0,
              boxSizing: 'border-box',
              padding: '0.7rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {/* Panel heading */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                paddingBottom: '0.3rem',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                Racers
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {multiplayerRoom.players.length}/4
              </span>
            </div>

            {/* Player list */}
            {multiplayerRoom.players.map((player, index) => {
              const colorHex =
                player.colorHex ??
                CAR_COLORS[index % CAR_COLORS.length];

              const carColor = `#${colorHex
                .toString(16)
                .padStart(6, '0')}`;

              const connected = player.isConnected !== false;

              return (
                <div
                  key={player.id}
                  title={`${player.name} — ${connected
                    ? 'Connected'
                    : 'Disconnected; reconnecting may be possible'
                    }`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    minWidth: 0,
                    padding: '0.15rem 0',
                    opacity: connected ? 1 : 0.5,
                  }}
                >
                  <MiniCarIcon color={carColor} />

                  {/* Player name */}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {player.name}
                  </span>

                  {/* Connection status */}
                  <span
                    title={
                      connected
                        ? 'Connected'
                        : 'Disconnected — waiting for reconnection'
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: connected ? '#24834d' : '#B54738',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: connected ? '#24834d' : '#DC6B5D',
                      }}
                    />
                    {connected ? 'ONLINE' : 'RECONNECTING'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* passage and typing workspace */}

      <div
        className="surface-card race-workspace"
        style={{
          order: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div className="race-workspace-actions">
          {!isMultiplayer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestartRace();
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={14} />
              restart
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();

              const confirmed = window.confirm(
                'Are you sure you want to leave this race? Your current race progress will not be saved.'
              );

              if (confirmed) {
                onLeaveRace();
              }
            }}
            className="btn btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#B54738',
              borderColor: '#B54738',
            }}
          >
            <LogOut size={14} />
            Leave Race
          </button>
        </div>

        {/* single line passage window */}
        <div
          ref={passageWindowRef}
          className="race-passage-window"
          onClick={() => {
            if (!isRaceInterrupted && !isFinished) {
              inputRef.current?.focus();
            }
          }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            whiteSpace: 'nowrap',

            display: 'flex',
            alignItems: 'center',

            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
            fontFamily: 'var(--font-mono)',

            cursor: 'text',
          }}
        >
          {isRaceInterrupted ? (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                whiteSpace: 'normal',
                textAlign: 'center',
                backgroundColor: '#FEF2F0',
                border: '1px solid #DC6B5D',
                borderRadius: '999px',
                color: '#B42318',
                fontFamily: 'var(--font-sans)',
                padding: '0.4rem 1rem',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '0.08em',
                }}
              >
                <AlertTriangle size={19} />
                RACE INTERRUPTED
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#8F2119',
                }}
              >
                {playerLeftNotice}
              </span>

              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#B54738',
                }}
              >
                Returning to Home shortly...
              </span>
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'pre',
                flexShrink: 0,
                transform: (() => {
                  const width = passageWindowRef.current?.clientWidth ?? 0;
                  const fontSize = passageWindowRef.current
                    ? parseFloat(
                      getComputedStyle(passageWindowRef.current).fontSize
                    )
                    : 18;

                  const charWidth = fontSize * 0.6 * 1.15;
                  const threshold = width * 0.45;
                  const typedWidth = userInput.length * charWidth;
                  const scrollDistance = Math.max(0, typedWidth - threshold);

                  return `translate(${width ? -scrollDistance : 0}px, -50%)`;
                })(),
                transition: 'transform 0.08s linear',
              }}
            >
              {raceText.split('').map((char, index) => {
                const hasTyped = index < userInput.length;
                const isMatch = hasTyped && userInput[index] === char;
                const isMismatch = hasTyped && userInput[index] !== char;
                const isCurrent = index === userInput.length;

                let color = 'var(--text-secondary)';

                if (isMatch) {
                  color = '#16a34a';
                } else if (isMismatch) {
                  color = '#dc2626';
                } else if (isCurrent) {
                  color = 'var(--text-primary)';
                }

                return (
                  <span
                    key={index}
                    style={{
                      color,
                      fontWeight:
                        isCurrent || isMatch || isMismatch ? 600 : 400,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* typing input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            const input = e.currentTarget;
            input.setSelectionRange(input.value.length, input.value.length);
          }}
          onSelect={(e) => {
            const input = e.currentTarget;

            if (input.selectionStart !== input.value.length) {
              input.setSelectionRange(input.value.length, input.value.length);
            }
          }}
          onPaste={handlePaste}
          onDrop={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          disabled={
            activeCountdown > 0 ||
            isFinished ||
            isRaceInterrupted
          }
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={
            activeCountdown > 0
              ? 'race starting soon'
              : matching.hasError
                ? 'press backspace to correct your typo'
                : 'start typing to move your car'
          }
          style={{
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            padding: '1rem 1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
            outline: 'none',
          }}
        />

        <div className="race-workspace-footer">
          <span>
            {matching.hasError
              ? 'backspace to correct'
              : isFinished
                ? 'race complete'
                : 'keep typing accurately'}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}
          >
            {matching.matchedCount}/{raceText.length}
          </span>
        </div>
      </div>
    </div >


  );
};
