import React, { useEffect, useRef, useState } from 'react';
import { RaceStats, Passage, Room, Player, WpmSample } from '../types/game';
import { Trophy, RefreshCw, Home, Clock, Gauge, Target, Award } from 'lucide-react';
import { formatTime } from '../utils/typingMath';
import SoloRaceHistoryPanel from './SoloRaceHistoryPanel';
import {
  loadSoloRaceHistory,
  saveSoloRaceHistory,
  SoloRaceRecord,
} from '../utils/raceHistory';
interface WpmHistoryChartProps {
  samples?: WpmSample[];
}

const WpmHistoryChart: React.FC<WpmHistoryChartProps> = ({
  samples = [],
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const validSamples = samples
    .filter(
      (sample) =>
        Number.isFinite(sample.timeSeconds) &&
        sample.timeSeconds >= 0 &&
        Number.isFinite(sample.wpm) &&
        sample.wpm >= 0
    )
    .sort((a, b) => a.timeSeconds - b.timeSeconds);

  if (validSamples.length < 2) {
    return null;
  }

  const width = 900;
  const height = 340;

  const padding = {
    top: 38,
    right: 35,
    bottom: 48,
    left: 55,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(
    1,
    validSamples[validSamples.length - 1].timeSeconds
  );

  const peakSample = validSamples.reduce((peak, sample) =>
    sample.wpm > peak.wpm ? sample : peak
  );

  const peakIndex = validSamples.indexOf(peakSample);

  const peakWpm = peakSample.wpm;

  const averageWpm =
    validSamples.reduce((sum, sample) => sum + sample.wpm, 0) /
    validSamples.length;

  const maxWpm = Math.max(
    20,
    Math.ceil((peakWpm * 1.2) / 20) * 20
  );

  const yTicks = Array.from(
    { length: 5 },
    (_, index) => (maxWpm / 4) * index
  );

  const xTicks = Array.from(
    { length: 5 },
    (_, index) => (maxTime / 4) * index
  );

  const points = validSamples.map((sample) => ({
    sample,
    x:
      padding.left +
      (sample.timeSeconds / maxTime) * plotWidth,
    y:
      padding.top +
      plotHeight -
      (sample.wpm / maxWpm) * plotHeight,
  }));

  // Smooth cubic curve
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlDistance = (point.x - previous.x) / 3;

    return (
      path +
      ` C ${previous.x + controlDistance} ${previous.y},` +
      ` ${point.x - controlDistance} ${point.y},` +
      ` ${point.x} ${point.y}`
    );
  }, '');

  // Filled area beneath the curve
  const areaPath = [
    linePath,
    `L ${points[points.length - 1].x} ${padding.top + plotHeight}`,
    `L ${points[0].x} ${padding.top + plotHeight}`,
    'Z',
  ].join(' ');

  // Average WPM reference position
  const averageY =
    padding.top +
    plotHeight -
    (averageWpm / maxWpm) * plotHeight;

  const activePoint =
    activeIndex !== null ? points[activeIndex] : null;

  const tooltipWidth = 150;
  const tooltipHeight = 58;

  const tooltipX = activePoint
    ? Math.max(
      5,
      Math.min(
        activePoint.x - tooltipWidth / 2,
        width - tooltipWidth - 5
      )
    )
    : 0;

  const tooltipY = activePoint
    ? Math.max(5, activePoint.y - tooltipHeight - 18)
    : 0;

  return (
    <section
      aria-label="Typing speed over time"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        textAlign: 'left',
      }}
    >

      {/* Chart heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Typing Speed Over Time
          </h3>

          <p
            style={{
              margin: '0.4rem 0 0',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            Your typing rhythm throughout the race.
          </p>
        </div>

        <div
          style={{
            padding: '0.55rem 0.85rem',
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          {validSamples.length} samples
        </div>
      </div>


      {/* Graph */}
      <div
        style={{
          width: '100%',
          minWidth: 0,
          padding: '0.75rem 0',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Interactive graph showing typing speed in words per minute over elapsed race time"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            overflow: 'visible',
            touchAction: 'pan-y',
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >

          <defs>
            <linearGradient
              id="wpm-area-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-primary)"
                stopOpacity="0.24"
              />

              <stop
                offset="100%"
                stopColor="var(--accent-primary)"
                stopOpacity="0.01"
              />
            </linearGradient>
          </defs>


          {/* Horizontal grid and Y-axis labels */}
          {yTicks.map((tick, index) => {
            const y =
              padding.top +
              plotHeight -
              (tick / maxWpm) * plotHeight;

            return (
              <g key={`y-${index}`}>

                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />

                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="var(--text-secondary)"
                >
                  {Math.round(tick)}
                </text>

              </g>
            );
          })}


          {/* Vertical grid and X-axis labels */}
          {xTicks.map((tick, index) => {
            const x =
              padding.left +
              (tick / maxTime) * plotWidth;

            return (
              <g key={`x-${index}`}>

                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="3 7"
                  opacity="0.7"
                />

                <text
                  x={x}
                  y={height - 13}
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === xTicks.length - 1
                        ? 'end'
                        : 'middle'
                  }
                  fontSize="12"
                  fill="var(--text-secondary)"
                >
                  {tick.toFixed(maxTime < 10 ? 1 : 0)}s
                </text>

              </g>
            );
          })}


          {/* Average WPM reference line */}
          <line
            x1={padding.left}
            y1={averageY}
            x2={width - padding.right}
            y2={averageY}
            stroke="var(--accent-secondary)"
            strokeWidth="1.5"
            strokeDasharray="7 5"
            opacity="0.85"
          />

          <text
            x={width - padding.right - 3}
            y={averageY - 9}
            textAnchor="end"
            fontSize="11"
            fontWeight="600"
            fill="var(--accent-secondary)"
          >
            AVG {averageWpm.toFixed(0)} WPM
          </text>


          {/* Filled graph area */}
          <path
            d={areaPath}
            fill="url(#wpm-area-gradient)"
          />


          {/* Smooth WPM curve */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />


          {/* Highlight peak point */}
          <circle
            cx={points[peakIndex].x}
            cy={points[peakIndex].y}
            r="11"
            fill="var(--accent-primary)"
            opacity="0.12"
          />

          <circle
            cx={points[peakIndex].x}
            cy={points[peakIndex].y}
            r="5"
            fill="var(--accent-primary)"
            stroke="var(--bg-surface)"
            strokeWidth="2"
          />


          {/* Individual interactive samples */}
          {points.map((point, index) => (
            <g
              key={`${point.sample.timeSeconds}-${index}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${point.sample.wpm} WPM at ${point.sample.timeSeconds.toFixed(1)} seconds`}
              style={{ cursor: 'pointer' }}
            >

              {/* Larger invisible hit area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
              />

              {/* Visible point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 6 : 3.5}
                fill="var(--bg-surface)"
                stroke="var(--accent-primary)"
                strokeWidth="2.5"
              />

            </g>
          ))}


          {/* Interactive tooltip */}
          {activePoint && (
            <g
              pointerEvents="none"
            >

              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="9"
                fill="var(--bg-surface)"
                stroke="var(--border-subtle)"
                strokeWidth="1.2"
              />

              <text
                x={tooltipX + 12}
                y={tooltipY + 23}
                fontSize="15"
                fontWeight="700"
                fill="var(--text-primary)"
              >
                {activePoint.sample.wpm} WPM
              </text>

              <text
                x={tooltipX + 12}
                y={tooltipY + 43}
                fontSize="11"
                fill="var(--text-secondary)"
              >
                {activePoint.sample.timeSeconds.toFixed(1)} seconds
              </text>

            </g>
          )}

        </svg>
      </div>


      {/* Chart legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 18,
              height: 3,
              backgroundColor: 'var(--accent-primary)',
              borderRadius: 3,
            }}
          />
          Typing speed
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 18,
              borderTop: '2px dashed var(--accent-secondary)',
            }}
          />
          Average speed:
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
            }}
          />
          Peak speed:
        </div>

      </div>


      {/* Graph footer */}
      <p
        style={{
          margin: 0,
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        Hover over any point to inspect your typing speed at that moment.
        Samples are recorded approximately once per second.
      </p>

    </section>
  );
};
interface MultiplayerWpmChartProps {
  players: Player[];
}

const MultiplayerWpmChart: React.FC<MultiplayerWpmChartProps> = ({
  players,
}) => {
  const series = players
    .map((player) => ({
      player,
      samples: (player.wpmHistory ?? [])
        .filter(
          (sample) =>
            Number.isFinite(sample.timeSeconds) &&
            sample.timeSeconds >= 0 &&
            Number.isFinite(sample.wpm) &&
            sample.wpm >= 0
        )
        .sort((a, b) => a.timeSeconds - b.timeSeconds),
    }))
    .filter((entry) => entry.samples.length > 0);

  if (series.length === 0) {
    return null;
  }

  const width = 640;
  const height = 260;

  const padding = {
    top: 18,
    right: 20,
    bottom: 38,
    left: 44,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(
    1,
    ...series.flatMap((entry) =>
      entry.samples.map((sample) => sample.timeSeconds)
    )
  );

  const peakWpm = Math.max(
    0,
    ...series.flatMap((entry) =>
      entry.samples.map((sample) => sample.wpm)
    )
  );

  const maxWpm = Math.max(10, Math.ceil(peakWpm / 10) * 10);

  const yTicks = [0, maxWpm / 2, maxWpm];
  const xTicks = [0, maxTime / 2, maxTime];

  const getX = (time: number) =>
    padding.left + (time / maxTime) * plotWidth;

  const getY = (wpm: number) =>
    padding.top + plotHeight - (wpm / maxWpm) * plotHeight;

  return (
    <section
      aria-label="Multiplayer typing speed comparison"
      style={{
        width: '100%',
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        textAlign: 'left',
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Race speed comparison
        </h3>

        <p
          style={{
            margin: '0.35rem 0 0',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          Compare each racer's WPM throughout the race.
        </p>
      </div>

      <div style={{ width: '100%', minWidth: 0 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="WPM over elapsed race time for each racer"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        >
          {yTicks.map((tick) => {
            const y = getY(tick);

            return (
              <g key={`y-${tick}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 5"
                />

                <text
                  x={padding.left - 9}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--text-secondary)"
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick, index) => {
            const x = getX(tick);

            return (
              <g key={`x-${index}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 6"
                />

                <text
                  x={x}
                  y={height - 10}
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === xTicks.length - 1
                        ? 'end'
                        : 'middle'
                  }
                  fontSize="11"
                  fill="var(--text-secondary)"
                >
                  {tick.toFixed(maxTime < 10 ? 1 : 0)}s
                </text>
              </g>
            );
          })}

          {series.map(({ player, samples }) => {
            const color = `#${player.colorHex
              .toString(16)
              .padStart(6, '0')}`;

            const points = samples.map((sample) => ({
              sample,
              x: getX(sample.timeSeconds),
              y: getY(sample.wpm),
            }));

            return (
              <g key={player.id}>
                {points.length > 1 && (
                  <polyline
                    points={points
                      .map((point) => `${point.x},${point.y}`)
                      .join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {points.map((point, index) => (
                  <circle
                    key={`${player.id}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="var(--bg-surface)"
                    stroke={color}
                    strokeWidth="2"
                  >
                    <title>
                      {`${player.name}: ${point.sample.wpm} WPM at ${point.sample.timeSeconds.toFixed(1)} seconds`}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem 1.25rem',
        }}
      >
        {series.map(({ player }) => (
          <div
            key={player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '18px',
                height: '3px',
                flexShrink: 0,
                borderRadius: '2px',
                backgroundColor: `#${player.colorHex
                  .toString(16)
                  .padStart(6, '0')}`,
              }}
            />
            {player.name}
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
        }}
      >
        WPM · Each line uses the corresponding player's car color.
      </div>
    </section>
  );
};
interface ResultsScreenProps {
  stats: RaceStats;
  passage: Passage;
  multiplayerRoom?: Room | null;
  currentPlayerId?: string;
  onPlayAgain: () => void;
  onNavigateHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  stats,
  passage,
  multiplayerRoom = null,
  currentPlayerId,
  onPlayAgain,
  onNavigateHome,
}) => {
  const isMultiplayer = !!multiplayerRoom;
  // Match the passage normalization used by the racing screen.
  const displayedPassage = passage.text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Historical incorrect keystrokes, including corrected mistakes.
  const mistakesCount = Math.max(
    0,
    stats.totalAttemptsCount - stats.correctAttemptsCount
  );

  // Solo personal best state.
  const [personalBestWpm, setPersonalBestWpm] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [personalBestAccuracy, setPersonalBestAccuracy] =
    useState<number | null>(null);

  const [raceHistory, setRaceHistory] = useState<SoloRaceRecord[]>([]);

  // Prevent the same completed result from being processed twice.
  const processedResultRef = useRef<string | null>(null);

  const resultSignature = [
    passage.id,
    stats.wpm,
    stats.accuracy,
    stats.elapsedTimeSeconds,
    stats.matchedCharCount,
    stats.totalAttemptsCount,
    stats.correctAttemptsCount,
  ].join(':');

  useEffect(() => {
    if (isMultiplayer) {
      processedResultRef.current = null;
      setPersonalBestWpm(null);
      setPersonalBestAccuracy(null);
      setIsNewPersonalBest(false);
      return;
    }

    if (processedResultRef.current === resultSignature) {
      return;
    }

    processedResultRef.current = resultSignature;

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const storageKey = 'keyrush:solo:best-wpm';
      const savedValue = window.localStorage.getItem(storageKey);
      const savedBest = savedValue === null ? 0 : Number(savedValue);

      const hasSavedBest =
        Number.isFinite(savedBest) && savedBest > 0;

      const currentWpm = Math.max(0, Number(stats.wpm) || 0);
      // Save the completed solo race to persistent history.
      const previousHistory = loadSoloRaceHistory();

      const currentAccuracy = Math.min(
        100,
        Math.max(0, Number(stats.accuracy) || 0)
      );

      const newRecord: SoloRaceRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playedAt: new Date().toISOString(),
        passageId: String(passage.id),
        passageTitle: passage.title,
        elapsedTimeSeconds: Math.max(
          0,
          Number(stats.elapsedTimeSeconds) || 0
        ),
        wpm: currentWpm,
        accuracy: currentAccuracy,
        matchedCharCount: Math.max(
          0,
          Number(stats.matchedCharCount) || 0
        ),
        totalAttemptsCount: Math.max(
          0,
          Number(stats.totalAttemptsCount) || 0
        ),
        correctAttemptsCount: Math.max(
          0,
          Number(stats.correctAttemptsCount) || 0
        ),
        mistakesCount: Math.max(
          0,
          (Number(stats.totalAttemptsCount) || 0) -
          (Number(stats.correctAttemptsCount) || 0)
        ),
      };

      const updatedHistory = [newRecord, ...previousHistory].slice(0, 500);

      saveSoloRaceHistory(updatedHistory);
      setRaceHistory(updatedHistory);

      // Maintain the all-time best accuracy separately from recent history.
      const accuracyStorageKey = 'keyrush:solo:best-accuracy';
      const savedAccuracyValue = window.localStorage.getItem(accuracyStorageKey);
      const savedBestAccuracy =
        savedAccuracyValue === null ? 0 : Number(savedAccuracyValue);

      const hasSavedBestAccuracy =
        Number.isFinite(savedBestAccuracy) &&
        savedBestAccuracy >= 0 &&
        savedAccuracyValue !== null;

      const bestAccuracy = Math.max(
        currentAccuracy,
        hasSavedBestAccuracy ? savedBestAccuracy : 0
      );

      if (!hasSavedBestAccuracy || currentAccuracy > savedBestAccuracy) {
        window.localStorage.setItem(
          accuracyStorageKey,
          String(currentAccuracy)
        );
      }

      setPersonalBestAccuracy(bestAccuracy);

      const achievedNewBest =
        currentWpm > 0 &&
        (!hasSavedBest || currentWpm > savedBest);

      const bestWpm = Math.max(
        currentWpm,
        hasSavedBest ? savedBest : 0
      );

      if (achievedNewBest) {
        window.localStorage.setItem(
          storageKey,
          String(currentWpm)
        );
      }

      setPersonalBestWpm(bestWpm > 0 ? bestWpm : null);
      setIsNewPersonalBest(achievedNewBest);
    } catch {
      // Results remain usable if browser storage is unavailable.
      setPersonalBestWpm(null);
      setIsNewPersonalBest(false);
    }
  }, [
    isMultiplayer,
    resultSignature,
    passage.id,
    passage.title,
    stats.wpm,
    stats.accuracy,
    stats.elapsedTimeSeconds,
    stats.matchedCharCount,
    stats.totalAttemptsCount,
    stats.correctAttemptsCount,
  ]);

  // Sort players by finishRank or progress
  const sortedPlayers: Player[] = multiplayerRoom
    ? [...multiplayerRoom.players].sort((a, b) => {
      if (a.finishRank && b.finishRank) return a.finishRank - b.finishRank;
      if (a.finishRank) return -1;
      if (b.finishRank) return 1;
      return b.progressRatio - a.progressRatio;
    })
    : [];
  // Solo performance insights
  const validWpmSamples = (stats.wpmHistory ?? []).filter(
    (sample) =>
      Number.isFinite(sample.timeSeconds) &&
      sample.timeSeconds >= 0 &&
      Number.isFinite(sample.wpm) &&
      sample.wpm >= 0
  );

  const averageWpm =
    validWpmSamples.length > 0
      ? validWpmSamples.reduce((sum, sample) => sum + sample.wpm, 0) /
      validWpmSamples.length
      : stats.wpm;

  const peakWpm =
    validWpmSamples.length > 0
      ? Math.max(...validWpmSamples.map((sample) => sample.wpm))
      : stats.wpm;

  const accuracyValue = Math.min(
    100,
    Math.max(0, Number(stats.accuracy) || 0)
  );

  const accuracyBarWidth = `${accuracyValue}%`;

  const currentPlayer = sortedPlayers.find((p) => p.id === currentPlayerId);
  const totalWords = displayedPassage
    .split(/\s+/)
    .filter(Boolean).length;

  const getWordsCompleted = (player: Player): number => {
    const ratio = Math.min(
      1,
      Math.max(0, Number(player.progressRatio) || 0)
    );

    const matchedCharacters = Math.round(
      ratio * displayedPassage.length
    );
    let completedWords = 0;
    let position = 0;

    for (const word of displayedPassage.split(' ')) {
      const wordEnd = position + word.length;

      // Count only words whose complete text has been typed.
      if (wordEnd <= matchedCharacters) {
        completedWords++;
      } else {
        break;
      }

      position = wordEnd + 1;
    }

    return completedWords;
  };

  return (
    <div className="results-screen">

      {/* =========================
        RESULTS HERO
    ========================= */}
      <section className="results-hero">

        <div className="results-eyebrow">
          <span className="results-finish-icon">
            <Trophy size={24} />
          </span>
          {isMultiplayer ? 'OFFICIAL RACE RESULTS' : 'RACE COMPLETED'}
        </div>

        <h1>
          {isMultiplayer
            ? currentPlayer?.isFinished && currentPlayer.finishRank
              ? `You Finished ${currentPlayer.finishRank === 1
                ? '1st Place'
                : currentPlayer.finishRank === 2
                  ? '2nd Place'
                  : currentPlayer.finishRank === 3
                    ? '3rd Place'
                    : `${currentPlayer.finishRank}th Place`
              }`
              : 'Race Ended'
            : 'Sprint Finished!'}
        </h1>

        <p>
          Passage: <strong>{passage.title}</strong>
        </p>

        {!isMultiplayer && isNewPersonalBest && (
          <div className="results-personal-best">
            <Award size={17} />
            New Personal Best!
          </div>
        )}

      </section>


      {/* =========================
        SOLO RACE STATISTICS
    ========================= */}
      {!isMultiplayer && (
        <section className="results-section">

          <div className="results-section-heading">
            <div>
              <h2>Race Overview</h2>
              <p>Your performance at a glance</p>
            </div>
          </div>

          <div className="results-stat-grid">

            <div className="results-stat-card">
              <div className="results-stat-icon">
                <Clock size={20} />
              </div>

              <div className="results-stat-value">
                {formatTime(stats.elapsedTimeSeconds)}
              </div>

              <div className="results-stat-label">
                Completion Time
              </div>
            </div>


            <div className="results-stat-card">
              <div className="results-stat-icon">
                <Gauge size={20} />
              </div>

              <div className="results-stat-value">
                {stats.wpm}
                <span> WPM</span>
              </div>

              <div className="results-stat-label">
                Typing Speed
              </div>
            </div>


            <div className="results-stat-card">
              <div className="results-stat-icon">
                <Target size={20} />
              </div>

              <div className="results-stat-value">
                {accuracyValue.toFixed(1)}%
              </div>

              <div className="results-stat-label">
                Accuracy
              </div>
            </div>


            <div className="results-stat-card">
              <div className="results-stat-icon">
                <Trophy size={20} />
              </div>

              <div className="results-stat-value">
                {peakWpm.toFixed(0)}
                <span> WPM</span>
              </div>

              <div className="results-stat-label">
                Peak Speed
              </div>
            </div>

          </div>


          {/* Personal Best */}
          {personalBestWpm !== null && (
            <div className="results-personal-best">
              <Award size={20} />

              <div>
                <strong>
                  {isNewPersonalBest
                    ? 'New Personal Best!'
                    : 'Your Personal Best'}
                </strong>

                <p>
                  {isNewPersonalBest
                    ? 'You just achieved a new typing speed record.'
                    : 'Your highest recorded solo typing speed.'}
                </p>
              </div>

              <strong className="results-personal-best-value">
                {personalBestWpm.toFixed(1)} WPM
              </strong>
            </div>
          )}

        </section>
      )}


      {/* =========================
        MULTIPLAYER RESULTS
    ========================= */}
      {isMultiplayer && (
        <section className="results-section">

          <div className="results-section-heading">
            <div>
              <h2>Race Standings</h2>
              <p>Final results from the race</p>
            </div>
          </div>


          {/* Podium */}
          <div className="results-podium">

            {sortedPlayers.slice(0, 3).map((player) => (
              <div
                key={player.id}
                className={`results-podium-card ${player.finishRank === 1 ? 'first-place' : ''
                  }`}
              >
                <div className="results-podium-rank">
                  {player.finishRank
                    ? `#${player.finishRank}`
                    : '—'}
                </div>

                <div
                  className="results-podium-color"
                  style={{
                    backgroundColor: `#${player.colorHex
                      .toString(16)
                      .padStart(6, '0')}`,
                  }}
                />

                <div className="results-podium-name">
                  {player.name}
                  {player.id === currentPlayerId && ' (You)'}
                </div>

                <div className="results-podium-wpm">
                  {player.wpm} WPM
                </div>

                <div className="results-podium-label">
                  {player.isFinished ? 'Finished' : 'Race ended'}
                </div>
              </div>
            ))}

          </div>


          {/* Full Standings */}
          <div className="results-standings">

            <div className="results-standings-header">
              <span>PLAYER</span>
              <span>WORDS</span>
              <span>TIME</span>
              <span>WPM</span>
              <span>ACCURACY</span>
            </div>

            {sortedPlayers.map((player) => {
              const playerFinished =
                player.isFinished || player.finishTimeSeconds != null;

              return (
                <div
                  key={player.id}
                  className={`results-standings-row ${player.id === currentPlayerId ? 'current-player' : ''
                    }`}
                >

                  <div className="results-standings-player">
                    <strong>
                      {player.finishRank
                        ? `#${player.finishRank}`
                        : '—'}
                    </strong>

                    <span
                      className="results-player-color"
                      style={{
                        backgroundColor: `#${player.colorHex
                          .toString(16)
                          .padStart(6, '0')}`,
                      }}
                    />

                    <span>
                      {player.name}
                      {player.id === currentPlayerId && ' (You)'}
                    </span>
                  </div>

                  <span>
                    {getWordsCompleted(player)}/{totalWords}
                  </span>

                  <span>
                    {player.finishTimeSeconds != null
                      ? formatTime(player.finishTimeSeconds)
                      : '—'}
                  </span>

                  <strong>{player.wpm}</strong>

                  <span>{player.accuracy.toFixed(1)}%</span>

                </div>
              );
            })}

          </div>


          {/* Multiplayer WPM Comparison */}
          <div className="results-chart-card">
            <div className="results-chart-header">
              <div>
                <h3>Speed Comparison</h3>
                <p>Typing speed throughout the race</p>
              </div>
            </div>

            <MultiplayerWpmChart players={sortedPlayers} />
          </div>

        </section>
      )}


      {/* =========================
        SOLO PERFORMANCE ANALYSIS
    ========================= */}
      {!isMultiplayer && (
        <section className="results-section">

          <div className="results-section-heading">
            <div>
              <h2>Performance Analysis</h2>
              <p>Understand how your typing speed changed during the race</p>
            </div>
          </div>


          {/* WPM Graph */}
          <div className="results-chart-card">

            <div className="results-chart-header">
              <div>
                <h3>Typing Speed Over Time</h3>
                <p>Your WPM progression during this race</p>
              </div>

              <div className="results-chart-legend">
                <span className="results-legend-item">
                  <span className="results-legend-dot" />
                  WPM
                </span>
              </div>
            </div>

            <div className="results-chart-container">
              <WpmHistoryChart samples={stats.wpmHistory} />
            </div>

            <div className="results-chart-summary">

              <div>
                <span>Average Speed</span>
                <strong>{averageWpm.toFixed(1)} WPM</strong>
              </div>

              <div>
                <span>Peak Speed</span>
                <strong>{peakWpm.toFixed(1)} WPM</strong>
              </div>

            </div>

          </div>


          {/* Accuracy */}
          <div className="results-breakdown-card">

            <div className="results-section-heading">
              <div>
                <h3>Typing Accuracy</h3>
                <p>How accurately you typed the passage</p>
              </div>

              <strong>{accuracyValue.toFixed(1)}%</strong>
            </div>

            <div className="results-progress-track">
              <div
                className="results-progress-fill"
                style={{ width: accuracyBarWidth }}
              />
            </div>

            <div className="results-breakdown-row">
              <span>Correct keystrokes</span>
              <strong>{stats.correctAttemptsCount}</strong>
            </div>

            <div className="results-breakdown-row">
              <span>Incorrect keystrokes</span>
              <strong>{mistakesCount}</strong>
            </div>

          </div>


          {/* Typing Breakdown */}
          <div className="results-section-heading">
            <div>
              <h2>Typing Breakdown</h2>
              <p>A detailed look at your keystrokes</p>
            </div>
          </div>

          <div className="results-breakdown-grid">

            <div className="results-breakdown-card">
              <div className="results-stat-icon">
                <Target size={19} />
              </div>

              <div className="results-stat-value">
                {stats.matchedCharCount}
              </div>

              <div className="results-stat-label">
                Characters Completed
              </div>
            </div>


            <div className="results-breakdown-card">
              <div className="results-stat-icon">
                <Award size={19} />
              </div>

              <div className="results-stat-value">
                {stats.correctAttemptsCount}
              </div>

              <div className="results-stat-label">
                Correct Keystrokes
              </div>
            </div>


            <div className="results-breakdown-card">
              <div className="results-stat-icon">
                <Target size={19} />
              </div>

              <div className="results-stat-value">
                {mistakesCount}
              </div>

              <div className="results-stat-label">
                Mistakes
              </div>
            </div>


            <div className="results-breakdown-card">
              <div className="results-stat-icon">
                <Gauge size={19} />
              </div>

              <div className="results-stat-value">
                {stats.totalAttemptsCount}
              </div>

              <div className="results-stat-label">
                Total Keystrokes
              </div>
            </div>

          </div>

        </section>
      )}


      {/* =========================
        SOLO RACE HISTORY
    ========================= */}
      {!isMultiplayer && (
        <section className="results-section">

          <div className="results-section-heading">
            <div>
              <h2>Race History</h2>
              <p>Track your previous solo performances</p>
            </div>
          </div>

          <div className="results-history-card">
            <SoloRaceHistoryPanel
              records={raceHistory}
              personalBestWpm={personalBestWpm}
              personalBestAccuracy={personalBestAccuracy}
            />
          </div>

        </section>
      )}


      {/* =========================
        RACE PASSAGE
    ========================= */}
      <section className="results-section">

        <div className="results-section-heading">
          <div>
            <h2>Race Passage</h2>
            <p>The text used during this race</p>
          </div>

          <span className="results-passage-title">
            {displayedPassage.length} characters
          </span>
        </div>

        <div className="results-passage-card">
          {displayedPassage}
        </div>

      </section>


      {/* =========================
        ACTION BUTTONS
    ========================= */}
      <div className="results-actions">

        <button
          onClick={onPlayAgain}
          className="btn btn-primary"
        >
          <RefreshCw size={18} />
          {isMultiplayer ? 'Return to Lobby' : 'Play Again'}
        </button>

        <button
          onClick={onNavigateHome}
          className="btn btn-secondary"
        >
          <Home size={18} />
          Home
        </button>

      </div>

    </div>
  );
};