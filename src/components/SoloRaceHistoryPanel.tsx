import React from 'react';
import { Award, History, TrendingUp } from 'lucide-react';
import { formatTime } from '../utils/typingMath';
import { SoloRaceRecord } from '../utils/raceHistory';

interface SoloRaceHistoryPanelProps {
  records: SoloRaceRecord[];
  personalBestWpm: number | null;
  personalBestAccuracy: number | null;
}

const SoloRaceHistoryPanel: React.FC<SoloRaceHistoryPanelProps> = ({
  records,
  personalBestWpm,
  personalBestAccuracy,
}) => {
  const sortedRecords = [...records].sort(
    (a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt)
  );

  const recentRecords = sortedRecords.slice(0, 5);

  // Show the latest 10 races from oldest to newest in the chart.
  const chartRecords = sortedRecords.slice(0, 10).reverse();

  const averageWpm =
    sortedRecords.length > 0
      ? sortedRecords.reduce((total, record) => total + record.wpm, 0) /
        sortedRecords.length
      : 0;

  const width = 640;
  const height = 220;

  const padding = {
    top: 18,
    right: 20,
    bottom: 34,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (!Number.isFinite(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const summaryCardStyle: React.CSSProperties = {
    minWidth: 0,
    padding: '1rem',
    backgroundColor: 'var(--bg-page)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    marginBottom: '0.4rem',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  return (
    <section
      aria-label="Solo race history and statistics"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        textAlign: 'left',
      }}
    >
      {/* Section heading */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--accent-primary)',
            marginBottom: '0.4rem',
          }}
        >
          <History size={19} />
          <h3
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Your race history
          </h3>
        </div>

        <p
          style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
          }}
        >
          Track your typing performance across completed solo races.
        </p>
      </div>

      {/* Summary statistics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div style={summaryCardStyle}>
          <div style={labelStyle}>Races recorded</div>
          <div style={valueStyle}>{sortedRecords.length}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={labelStyle}>Average WPM</div>
          <div style={valueStyle}>{averageWpm.toFixed(1)}</div>
        </div>

        <div style={summaryCardStyle}>
          <div style={labelStyle}>Best WPM</div>
          <div style={valueStyle}>
            {personalBestWpm !== null
              ? personalBestWpm.toFixed(1)
              : '—'}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={labelStyle}>Best accuracy</div>
          <div style={valueStyle}>
            {personalBestAccuracy !== null
              ? `${personalBestAccuracy.toFixed(1)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* Across-race progress chart */}
      {chartRecords.length >= 2 ? (
        <div
          style={{
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.35rem',
            }}
          >
            <TrendingUp size={17} color="var(--accent-primary)" />
            <h4
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Typing progress
            </h4>
          </div>

          <p
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            WPM across your last {chartRecords.length} completed races.
          </p>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Chart of typing speed across recent solo races"
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
                  r="4"
                  fill="var(--bg-surface)"
                  stroke="var(--accent-primary)"
                  strokeWidth="2"
                >
                  <title>
                    {`Race ${index + 1}: ${record.wpm} WPM`}
                  </title>
                </circle>
              </g>
            ))}

            {[0, Math.floor((chartRecords.length - 1) / 2), chartRecords.length - 1]
              .filter((index, position, values) => values.indexOf(index) === position)
              .map((index) => (
                <text
                  key={`race-${index}`}
                  x={getX(index)}
                  y={height - 8}
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === chartRecords.length - 1
                        ? 'end'
                        : 'middle'
                  }
                  fontSize="11"
                  fill="var(--text-secondary)"
                >
                  Race {index + 1}
                </text>
              ))}
          </svg>
        </div>
      ) : (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
          }}
        >
          Complete another solo race to unlock your typing progress chart.
        </div>
      )}

      {/* Recent results */}
      <div
        style={{
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <h4
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Recent races
        </h4>

        {recentRecords.length === 0 ? (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}
          >
            Your completed solo races will appear here.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {recentRecords.map((record) => (
              <div
                key={record.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.9rem',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    flex: '1 1 150px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {record.passageTitle || 'Typing race'}
                  </div>

                  <div
                    style={{
                      marginTop: '0.3rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatDate(record.playedAt)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>
                    <strong>{record.wpm}</strong> WPM
                  </span>

                  <span>
                    <strong>{record.accuracy.toFixed(1)}%</strong> acc.
                  </span>

                  <span>
                    <strong>{formatTime(record.elapsedTimeSeconds)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          fontSize: '0.75rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}
      >
        <Award size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />

        <span>
          Your history is stored in this browser. Clearing this site's browser
          storage will remove saved race history.
        </span>
      </div>
    </section>
  );
};

export default SoloRaceHistoryPanel;