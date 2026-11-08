import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Gauge,
  History,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
} from 'lucide-react';

import {
  loadSoloRaceHistory,
  saveSoloRaceHistory,
  SoloRaceRecord,
} from '../utils/raceHistory';

import { formatTime } from '../utils/typingMath';

interface MultiplayerRaceRecord {
  id: string;
  raceId: string;
  playerId: string;
  playerName: string;
  roomCode: string;
  playedAt: string;
  passageId: string;
  passageTitle: string;
  rank: number;
  wpm: number;
  accuracy: number;
  progressRatio: number;
  isFinished: boolean;
  finishTimeSeconds?: number;
  wpmHistory: {
    timeSeconds: number;
    wpm: number;
  }[];
}

const API_URL =
  import.meta.env.VITE_SERVER_URL ||
  (window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:3001');

interface StatisticsScreenProps {
  displayName: string;
  onNavigateHome: () => void;
  onStartPractice: () => void;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  displayName,
  onNavigateHome,
  onStartPractice,
}) => {
  const [records, setRecords] = useState<SoloRaceRecord[]>([]);
  const [multiplayerRecords, setMultiplayerRecords] = useState<
    MultiplayerRaceRecord[]
  >([]);
  const [multiplayerLoading, setMultiplayerLoading] = useState(false);
  const [multiplayerError, setMultiplayerError] = useState('');
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly'>('daily');

  // Load saved statistics whenever the dashboard opens.
  useEffect(() => {
    setRecords(loadSoloRaceHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMultiplayerStatistics = async () => {
      if (!displayName.trim()) {
        setMultiplayerRecords([]);
        return;
      }

      setMultiplayerLoading(true);
      setMultiplayerError('');

      try {
        const response = await fetch(
          `${API_URL}/api/statistics?name=${encodeURIComponent(displayName)}`
        );

        if (!response.ok) {
          throw new Error('Unable to load multiplayer statistics.');
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid multiplayer statistics response.');
        }

        if (!cancelled) {
          setMultiplayerRecords(data as MultiplayerRaceRecord[]);
        }
      } catch {
        if (!cancelled) {
          setMultiplayerError(
            'Could not load multiplayer statistics. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setMultiplayerLoading(false);
        }
      }
    };

    void loadMultiplayerStatistics();

    return () => {
      cancelled = true;
    };
  }, [displayName]);

  const combinedRecords = [
    ...records.map((record) => ({
      ...record,
      mode: 'Solo' as const,
    })),
    ...multiplayerRecords.map((record) => ({
      ...record,
      mode: 'Multiplayer' as const,
      elapsedTimeSeconds: record.finishTimeSeconds ?? null,
    })),
  ].sort(
    (a, b) =>
      new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );

  const averageWpm =
    combinedRecords.length > 0
      ? combinedRecords.reduce((total, record) => total + record.wpm, 0) /
      combinedRecords.length
      : 0;

  const averageAccuracy =
    combinedRecords.length > 0
      ? combinedRecords.reduce((total, record) => total + record.accuracy, 0) /
      combinedRecords.length
      : 0;

  const bestWpm =
    combinedRecords.length > 0
      ? Math.max(...combinedRecords.map((record) => record.wpm))
      : null;

  const bestAccuracy =
    combinedRecords.length > 0
      ? Math.max(...combinedRecords.map((record) => record.accuracy))
      : null;

  // The stored history is newest first.
  // Reverse the ten latest records for a chronological progress chart.
  const chartRecords = [...combinedRecords].slice(0, 10).reverse();

  const visibleRecords = combinedRecords.slice(0, 20);

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getWeekStart = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);
    result.setHours(0, 0, 0, 0);

    return result;
  };

  const calculatePerformance = (
    groupedRecords: typeof combinedRecords
  ) => ({
    races: groupedRecords.length,
    averageWpm:
      groupedRecords.length > 0
        ? groupedRecords.reduce((sum, record) => sum + record.wpm, 0) /
        groupedRecords.length
        : 0,
    averageAccuracy:
      groupedRecords.length > 0
        ? groupedRecords.reduce((sum, record) => sum + record.accuracy, 0) /
        groupedRecords.length
        : 0,
  });

  const dailyPerformance = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = getDateKey(date);

    const dayRecords = combinedRecords.filter(
      (record) => getDateKey(new Date(record.playedAt)) === key
    );

    return {
      key,
      label: date.toLocaleDateString(undefined, {
        weekday: 'short',
      }),
      ...calculatePerformance(dayRecords),
    };
  });

  const weeklyPerformance = Array.from({ length: 8 }, (_, index) => {
    const currentWeek = getWeekStart(new Date());
    currentWeek.setDate(currentWeek.getDate() - (7 - index) * 7);

    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const weekRecords = combinedRecords.filter((record) => {
      const playedAt = new Date(record.playedAt);

      return playedAt >= currentWeek && playedAt < nextWeek;
    });

    return {
      key: getDateKey(currentWeek),
      label: `Week ${index + 1}`,
      ...calculatePerformance(weekRecords),
    };
  });

  const activePerformance =
    trendPeriod === 'daily' ? dailyPerformance : weeklyPerformance;

  const getTrendX = (index: number) =>
    activePerformance.length === 1
      ? 280
      : 24 + index * (512 / (activePerformance.length - 1));

  const getTrendY = (value: number, maxValue: number) =>
    146 - (value / maxValue) * 120;

  const trendMaxWpm =
    Math.max(10, ...activePerformance.map((item) => item.averageWpm)) * 1.15;

  const wpmPoints = activePerformance
    .map(
      (item, index) =>
        `${getTrendX(index)},${getTrendY(item.averageWpm, trendMaxWpm)}`
    )
    .join(' ');

  const accuracyPoints = activePerformance
    .map(
      (item, index) =>
        `${getTrendX(index)},${getTrendY(item.averageAccuracy, 100)}`
    )
    .join(' ');

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearHistory = () => {
    if (records.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      'Clear all solo race history and personal records? This cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    saveSoloRaceHistory([]);

    try {
      window.localStorage.removeItem('keyrush:solo:best-wpm');
      window.localStorage.removeItem('keyrush:solo:best-accuracy');
    } catch {
      // Keep the dashboard usable if browser storage is unavailable.
    }

    setRecords([]);
  };

  // Chart dimensions.
  const width = 640;
  const height = 230;

  const padding = {
    top: 18,
    right: 24,
    bottom: 38,
    left: 44,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const peakWpm = Math.max(
    0,
    ...chartRecords.map((record) => record.wpm)
  );

  const maxWpm = Math.max(10, Math.ceil(peakWpm / 10) * 10);

  const getX = (index: number) =>
    padding.left +
    (index / Math.max(1, chartRecords.length - 1)) * plotWidth;

  const getY = (wpm: number) =>
    padding.top + plotHeight - (wpm / maxWpm) * plotHeight;

  const linePoints = chartRecords
    .map((record, index) => `${getX(index)},${getY(record.wpm)}`)
    .join(' ');

  const yTicks = [0, maxWpm / 2, maxWpm];

  const xLabelIndexes = [
    ...new Set([
      0,
      Math.floor((chartRecords.length - 1) / 2),
      chartRecords.length - 1,
    ]),
  ];

  const cardStyle: React.CSSProperties = {
    minWidth: 0,
    padding: '1.25rem',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
  };

  const labelStyle: React.CSSProperties = {
    margin: '0.65rem 0 0.35rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    overflowWrap: 'anywhere',
  };
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '2rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
      }}
    >
      {/* Page heading */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: 'var(--accent-primary)',
              marginBottom: '0.5rem',
            }}
          >
            <TrendingUp size={21} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Your progress
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 750,
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
            }}
          >
            Statistics
          </h1>

          <p
            style={{
              margin: '0.6rem 0 0',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
          >
            Measure your speed, accuracy, and improvement over time.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="btn btn-secondary"
          style={{
            padding: '0.7rem 1rem',
          }}
        >
          <ArrowLeft size={17} />
          Home
        </button>
      </div>

      {/* Summary cards */}
      <section
        aria-label="Overall typing statistics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={cardStyle}>
          <History size={20} color="var(--text-secondary)" />
          <div style={labelStyle}>Total races played</div>
          <div style={valueStyle}>{combinedRecords.length}</div>
        </div>

        <div style={cardStyle}>
          <Gauge size={20} color="var(--accent-primary)" />
          <div style={labelStyle}>Average speed</div>
          <div style={valueStyle}>
            {averageWpm.toFixed(1)}
            <span
              style={{
                marginLeft: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              WPM
            </span>
          </div>
        </div>

        <div style={cardStyle}>
          <Trophy size={20} color="var(--accent-primary)" />
          <div style={labelStyle}>Personal best</div>
          <div style={valueStyle}>
            {bestWpm !== null ? bestWpm.toFixed(1) : '—'}
            {bestWpm !== null && (
              <span
                style={{
                  marginLeft: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                WPM
              </span>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <Target size={20} color="var(--text-secondary)" />
          <div style={labelStyle}>Best accuracy</div>
          <div style={valueStyle}>
            {bestAccuracy !== null
              ? `${bestAccuracy.toFixed(1)}%`
              : '—'}
          </div>
        </div>

        <div style={cardStyle}>
          <Target size={20} color="var(--text-secondary)" />
          <div style={labelStyle}>Average accuracy</div>
          <div style={valueStyle}>
            {combinedRecords.length > 0
              ? `${averageAccuracy.toFixed(1)}%`
              : '—'}
          </div>
        </div>
      </section>

      {/* NEW: Performance trends */}
      <section
        className="surface-card"
        aria-label="Daily and weekly performance trends"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Performance trends
            </h2>

            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Track your speed and accuracy over time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['daily', 'weekly'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTrendPeriod(period)}
                aria-pressed={trendPeriod === period}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background:
                    trendPeriod === period
                      ? 'var(--text-primary)'
                      : 'transparent',
                  color:
                    trendPeriod === period
                      ? 'var(--bg-surface)'
                      : 'var(--text-primary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
          }}
        >
          {/* Average WPM chart */}
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                margin: '0 0 4px',
                color: 'var(--text-primary)',
              }}
            >
              Average WPM
            </h3>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Words per minute
            </p>

            <svg
              viewBox="0 0 560 180"
              style={{
                width: '100%',
                overflow: 'visible',
                display: 'block',
                marginTop: 12,
              }}
              role="img"
              aria-label="Average words per minute trend"
            >
              {[40, 80, 120].map((y) => (
                <line
                  key={y}
                  x1="24"
                  y1={y}
                  x2="536"
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 5"
                />
              ))}

              <polyline
                points={wpmPoints}
                fill="none"
                stroke="#b77b45"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activePerformance.map((item, index) => (
                <circle
                  key={item.key}
                  cx={getTrendX(index)}
                  cy={getTrendY(item.averageWpm, trendMaxWpm)}
                  r="5"
                  fill="#b77b45"
                >
                  <title>
                    {`${item.label}: ${item.averageWpm.toFixed(1)} WPM`}
                  </title>
                </circle>
              ))}
            </svg>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            >
              {activePerformance.map((item) => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>
          </div>

          {/* Average accuracy chart */}
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: 15,
                margin: '0 0 4px',
                color: 'var(--text-primary)',
              }}
            >
              Average Accuracy
            </h3>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Percentage of correct typing
            </p>

            <svg
              viewBox="0 0 560 180"
              style={{
                width: '100%',
                overflow: 'visible',
                display: 'block',
                marginTop: 12,
              }}
              role="img"
              aria-label="Average typing accuracy trend"
            >
              {[40, 80, 120].map((y) => (
                <line
                  key={y}
                  x1="24"
                  y1={y}
                  x2="536"
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 5"
                />
              ))}

              <polyline
                points={accuracyPoints}
                fill="none"
                stroke="#64836b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activePerformance.map((item, index) => (
                <circle
                  key={item.key}
                  cx={getTrendX(index)}
                  cy={getTrendY(item.averageAccuracy, 100)}
                  r="5"
                  fill="#64836b"
                >
                  <title>
                    {`${item.label}: ${item.averageAccuracy.toFixed(1)}%`}
                  </title>
                </circle>
              ))}
            </svg>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}
            >
              {activePerformance.map((item) => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Race activity summary */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {activePerformance.map((item) => (
            <div
              key={item.key}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>
                {item.races}
              </strong>{' '}
              races · {item.label}
            </div>
          ))}
        </div>
      </section>
      {/* Typing progress chart */}
      <section
        className="surface-card"
        aria-label="Typing speed progress"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Typing speed progress
            </h2>
            <p
              style={{
                margin: '0.35rem 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              WPM across your recent races
            </p>
          </div>

          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            Last {chartRecords.length} races
          </span>
        </div>

        {chartRecords.length >= 2 ? (
          (() => {
            const width = 700;
            const height = 240;
            const padding = {
              top: 20,
              right: 25,
              bottom: 45,
              left: 45,
            };

            const values = chartRecords.map((record) => record.wpm);
            const maxValue = Math.max(20, Math.ceil(Math.max(...values) / 10) * 10);
            const minValue = 0;
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            const getX = (index: number) =>
              padding.left +
              (index / (chartRecords.length - 1)) * chartWidth;

            const getY = (value: number) =>
              padding.top +
              chartHeight -
              ((value - minValue) / (maxValue - minValue)) * chartHeight;

            const linePoints = chartRecords
              .map((record, index) => `${getX(index)},${getY(record.wpm)}`)
              .join(' ');

            const yTicks = [0, 0.25, 0.5, 0.75, 1].map(
              (fraction) => Math.round(maxValue * fraction)
            );

            const xLabelIndexes = chartRecords.map((_, index) => index);

            return (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  role="img"
                  aria-label="Line chart showing typing speed across recent races"
                  style={{
                    width: '100%',
                    minWidth: '450px',
                    display: 'block',
                  }}
                >
                  {yTicks.map((tick, index) => {
                    const y = getY(tick);

                    return (
                      <g key={`tick-${index}`}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="var(--border-subtle)"
                          strokeDasharray="4 5"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="var(--text-secondary)"
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartRecords.map((record, index) => (
                    <g key={record.id}>
                      <circle
                        cx={getX(index)}
                        cy={getY(record.wpm)}
                        r="5"
                        fill="#b77b45"
                        stroke="var(--bg-surface)"
                        strokeWidth="2"
                      />
                      <title>
                        {`${record.wpm} WPM — ${formatDate(record.playedAt)}`}
                      </title>
                    </g>
                  ))}

                  {xLabelIndexes.map((index) => (
                    <text
                      key={`label-${index}`}
                      x={getX(index)}
                      y={height - 15}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--text-secondary)"
                    >
                      {index === 0 ||
                        index === chartRecords.length - 1 ||
                        index % 2 === 0
                        ? formatDate(chartRecords[index].playedAt)
                        : ''}
                    </text>
                  ))}
                </svg>
              </div>
            );
          })()
        ) : (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            Complete at least two races to compare your typing speed.
          </div>
        )}
      </section>
      {/* Race history */}
      <section
        className="surface-card"
        aria-label="Recent race history"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Race history
            </h2>
            <p
              style={{
                margin: '0.35rem 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Your recent solo and multiplayer races
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={records.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: records.length === 0
                ? 'var(--text-secondary)'
                : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: records.length === 0 ? 'not-allowed' : 'pointer',
              opacity: records.length === 0 ? 0.5 : 1,
            }}
          >
            <Trash2 size={15} />
            Clear solo history
          </button>
        </div>

        {visibleRecords.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            No race history yet. Your completed solo and multiplayer races
            will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleRecords.map((record) => (
              <div
                key={`${record.mode}-${record.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) repeat(3, minmax(65px, auto))',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 650,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {record.passageTitle}
                    </span>

                    <span
                      style={{
                        padding: '0.2rem 0.45rem',
                        borderRadius: '5px',
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {record.mode}
                    </span>

                    {record.mode === 'Multiplayer' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {record.rank > 0 ? `Rank #${record.rank}` : 'DNF'}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatDate(record.playedAt)}
                  </span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {Math.round(record.wpm)}
                  </div>
                  <div style={labelStyle}>WPM</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {Math.round(record.accuracy)}%
                  </div>
                  <div style={labelStyle}>Accuracy</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {record.elapsedTimeSeconds !== null
                      ? formatTime(record.elapsedTimeSeconds)
                      : 'DNF'}
                  </div>
                  <div style={labelStyle}>Time</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            textAlign: 'right',
          }}
        >
          Showing {visibleRecords.length} of {combinedRecords.length} races
        </div>
      </section>

      {/* Bottom actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onStartPractice}
          className="primary-button"
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '9px',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Start a new race
        </button>

        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '9px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Home
        </button>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          margin: 0,
        }}
      >
        Solo statistics are stored locally. Multiplayer statistics are stored
        on the KeyRush server.
      </p>
    </div>
  );
};

export default StatisticsScreen;

