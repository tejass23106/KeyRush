import React from 'react';
import {
  getLevelInfo,
  type ProgressionData,
} from '../utils/progression';

interface PlayerProgressionBarProps {
  progression: ProgressionData;
  lastXpGain: number | null;
}

export const PlayerProgressionBar: React.FC<
  PlayerProgressionBarProps
> = ({ progression, lastXpGain }) => {
  const levelInfo = getLevelInfo(progression.totalXp);

  return (
    <div
      style={{
        padding: '0.75rem 1.25rem 1rem',
      }}
    >
      <section
        aria-label="Player progression"
        style={{
          maxWidth: '1040px',
          margin: '0 auto',
          padding: '0.9rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            minWidth: '75px',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            YOUR LEVEL
          </div>

          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {levelInfo.level}
          </div>
        </div>

        <div
          style={{
            flex: '1 1 200px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '0.45rem',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>
              Level {levelInfo.level + 1} progress
            </span>

            <span style={{ color: 'var(--text-secondary)' }}>
              {levelInfo.currentLevelXp} /{' '}
              {levelInfo.xpToNextLevel} XP
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Progress toward next level"
            aria-valuemin={0}
            aria-valuemax={levelInfo.xpToNextLevel}
            aria-valuenow={levelInfo.currentLevelXp}
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${levelInfo.progressPercent}%`,
                height: '100%',
                backgroundColor: '#A6472D',
                borderRadius: '999px',
                transition: 'width 250ms ease',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
        >
          <span>
            <strong>{progression.totalXp}</strong> total XP
          </span>

          <span style={{ color: 'var(--text-secondary)' }}>
            {progression.totalRaces} completed races
          </span>

          {lastXpGain !== null && lastXpGain > 0 && (
            <span
              style={{
                color: '#657155',
                fontWeight: 700,
              }}
            >
              +{lastXpGain} XP earned
            </span>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlayerProgressionBar;