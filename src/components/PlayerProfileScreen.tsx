import React, { useEffect, useRef, useState } from 'react';

import {
  Award,
  Gauge,
  Target,
  Flag,
  Zap,
  ArrowLeft,
  Play,
  UserRound,
  Pencil,
} from 'lucide-react';

import {
  getLevelInfo,
  type ProgressionData,
} from '../utils/progression';

import {
  ACHIEVEMENTS,
  type UnlockedAchievement,
} from '../utils/achievements';

import { normalizeDisplayName } from '../utils/playerProfile';

interface PlayerProfileScreenProps {
  displayName: string;
  progression: ProgressionData;
  unlockedAchievements: UnlockedAchievement[];
  onSaveDisplayName: (name: string) => void;
  onNavigateHome: () => void;
  onStartPractice: () => void;
}


const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  displayName,
  progression,
  unlockedAchievements,
  onSaveDisplayName,
  onNavigateHome,
  onStartPractice,
}) => {
const [isEditingName, setIsEditingName] = useState(false);
const [draftName, setDraftName] = useState(displayName);
const [nameMessage, setNameMessage] = useState('');
const [showNameSaved, setShowNameSaved] = useState(false);

const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  setDraftName(displayName);
}, [displayName]);

useEffect(() => {
  return () => {
    if (messageTimer.current !== null) {
      clearTimeout(messageTimer.current);
    }
  };
}, []);

const levelInfo = getLevelInfo(progression.totalXp);

const unlockedIds = new Set(
  unlockedAchievements.map((achievement) => achievement.id)
);

const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const normalized = normalizeDisplayName(draftName);

  if (!normalized) {
    setNameMessage('Enter a display name before saving.');
    setShowNameSaved(false);
    return;
  }

  // Close the editor without showing a success message
  // when the name has not actually changed.
  if (normalized === displayName) {
    setDraftName(normalized);
    setIsEditingName(false);
    setNameMessage('');
    setShowNameSaved(false);
    return;
  }

  onSaveDisplayName(normalized);

  setDraftName(normalized);
  setIsEditingName(false);
  setNameMessage('');
  setShowNameSaved(true);

  // Clear any previous timer.
  if (messageTimer.current !== null) {
    clearTimeout(messageTimer.current);
  }

  // Automatically hide the confirmation after 2.5 seconds.
  messageTimer.current = setTimeout(() => {
    setShowNameSaved(false);
    messageTimer.current = null;
  }, 2500);
};

  const cardStyle: React.CSSProperties = {
    padding: '1.2rem',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-surface)',
    minWidth: 0,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.45rem',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '1.65rem',
    fontWeight: 750,
    lineHeight: 1.3,
    overflowWrap: 'anywhere',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    minHeight: '44px',
    padding: '0.7rem 1rem',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  };
  

  return (
    <div
      style={{
        maxWidth: '1040px',
        width: 'calc(100% - 2rem)',
        margin: '0 auto',
        padding: '1.5rem 0 2.5rem',
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
          <div
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              marginBottom: '0.4rem',
            }}
          >
            YOUR ACCOUNT
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 750,
            }}
          >
            Player Profile
          </h1>

          <p
            style={{
              margin: '0.5rem 0 0',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Your progress, records, and racing achievements.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            ...buttonStyle,
            color: 'var(--text-primary, var(--text-secondary))',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <ArrowLeft size={17} />
          Home
        </button>
      </div>

      {/* Profile identity */}
<section style={{ ...cardStyle, marginBottom: '1rem' }}>
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
    }}
  >
    {/* Player avatar */}
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '68px',
        height: '68px',
        flexShrink: 0,
        borderRadius: '16px',
        backgroundColor: '#F2E5D8',
        color: '#A6472D',
      }}
    >
      <UserRound size={32} />
    </div>

    {/* Player name */}
    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
      <div style={labelStyle}>PLAYER NAME</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: '1.45rem',
            fontWeight: 750,
            overflowWrap: 'anywhere',
          }}
        >
          {displayName}
        </div>

        {!isEditingName && (
          <button
            type="button"
            onClick={() => {
              setDraftName(displayName);
              setNameMessage('');
              setShowNameSaved(false);

              if (messageTimer.current !== null) {
                clearTimeout(messageTimer.current);
                messageTimer.current = null;
              }

              setIsEditingName(true);
            }}
            title="Change display name"
            aria-label="Change display name"
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.55rem',
              minHeight: '32px',
              fontSize: '0.75rem',
            }}
          >
            <Pencil size={13} />
            Change name
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: '0.3rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        Level {levelInfo.level} racer
      </div>
    </div>
  </div>

  {/* Name editor — shown only when Change name is clicked */}
  {isEditingName && (
    <form
      onSubmit={handleSave}
      style={{
        marginTop: '1.25rem',
        paddingTop: '1.1rem',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <label
        htmlFor="keyrush-display-name"
        style={{
          display: 'block',
          fontSize: '0.85rem',
          fontWeight: 650,
          marginBottom: '0.5rem',
        }}
      >
        Change display name
      </label>

      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          id="keyrush-display-name"
          type="text"
          value={draftName}
          maxLength={24}
          autoComplete="nickname"
          autoFocus
          required
          onChange={(event) => {
            setDraftName(event.target.value);
            setNameMessage('');
          }}
          placeholder="Enter your racing name"
          style={{
            flex: '1 1 220px',
            minWidth: 0,
            minHeight: '44px',
            padding: '0.7rem 0.8rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            color: 'inherit',
            font: 'inherit',
            fontSize: '16px',
          }}
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            ...buttonStyle,
            backgroundColor: '#A6472D',
            color: '#FFFFFF',
            borderColor: '#A6472D',
          }}
        >
          Save name
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={buttonStyle}
          onClick={() => {
            setDraftName(displayName);
            setNameMessage('');
            setIsEditingName(false);
          }}
        >
          Cancel
        </button>
      </div>

      {nameMessage && (
        <p
          role="alert"
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.8rem',
            color: '#A6472D',
          }}
        >
          {nameMessage}
        </p>
      )}
    </form>
  )}

  {/* Temporary confirmation */}
  {showNameSaved && !isEditingName && (
    <p
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        margin: '0.75rem 0 0',
        fontSize: '0.85rem',
        color: '#657155',
        fontWeight: 600,
      }}
    >
       Name changed successfully
    </p>
  )}
</section>

      {/* Progress summary */}
      <section
        aria-label="Player statistics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '0.8rem',
          marginBottom: '1rem',
        }}
      >
        <div style={cardStyle}>
          <Zap
            size={21}
            color="#A6472D"
            aria-hidden="true"
          />
          <div style={{ ...labelStyle, marginTop: '0.7rem' }}>
            TOTAL XP
          </div>
          <div style={valueStyle}>
            {progression.totalXp.toLocaleString()}
          </div>
          <div
            style={{
              marginTop: '0.35rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            Level {levelInfo.level}
          </div>
        </div>

        <div style={cardStyle}>
          <Flag
            size={21}
            color="#657155"
            aria-hidden="true"
          />
          <div style={{ ...labelStyle, marginTop: '0.7rem' }}>
            COMPLETED RACES
          </div>
          <div style={valueStyle}>
            {progression.totalRaces.toLocaleString()}
          </div>
          <div
            style={{
              marginTop: '0.35rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            Races rewarded with XP
          </div>
        </div>

        <div style={cardStyle}>
          <Gauge
            size={21}
            color="#4A6984"
            aria-hidden="true"
          />
          <div style={{ ...labelStyle, marginTop: '0.7rem' }}>
            BEST WPM
          </div>
          <div style={valueStyle}>{progression.bestWpm}</div>
          <div
            style={{
              marginTop: '0.35rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            Personal speed record
          </div>
        </div>

        <div style={cardStyle}>
          <Target
            size={21}
            color="#8C6D46"
            aria-hidden="true"
          />
          <div style={{ ...labelStyle, marginTop: '0.7rem' }}>
            BEST ACCURACY
          </div>
          <div style={valueStyle}>
            {progression.bestAccuracy}%
          </div>
          <div
            style={{
              marginTop: '0.35rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            Personal accuracy record
          </div>
        </div>
      </section>

      {/* XP progress */}
      <section style={{ ...cardStyle, marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '0.65rem',
          }}
        >
          <strong>Level {levelInfo.level} progress</strong>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            {levelInfo.currentLevelXp} / {levelInfo.xpToNextLevel} XP
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Progress toward next level"
          aria-valuemin={0}
          aria-valuemax={levelInfo.xpToNextLevel}
          aria-valuenow={levelInfo.currentLevelXp}
          style={{
            height: '9px',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '999px',
            backgroundColor: 'var(--border-subtle)',
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

        <div
          style={{
            marginTop: '0.65rem',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
          }}
        >
          {levelInfo.xpToNextLevel - levelInfo.currentLevelXp} XP
          {' '}remaining until your next level.
        </div>
      </section>

      {/* Achievement summary */}
      <section style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: 750,
              }}
            >
              Achievement Collection
            </h2>

            <p
              style={{
                margin: '0.35rem 0 0',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              Milestones you've unlocked through racing.
            </p>
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {unlockedIds.size} / {ACHIEVEMENTS.length}
          </div>
        </div>

        {unlockedAchievements.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            <Award
              size={24}
              color="#A6472D"
              aria-hidden="true"
            />
            <p style={{ marginBottom: 0 }}>
              Your collection is waiting for its first badge.
              Complete a race to unlock your first achievement.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '0.75rem',
            }}
          >
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <Award
                  size={22}
                  color="#A6472D"
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {achievement.title}
                  </div>

                  <div
                    style={{
                      marginTop: '0.3rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {achievement.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={onStartPractice}
          style={{
            ...buttonStyle,
            backgroundColor: '#A6472D',
            color: '#FFFFFF',
            borderColor: '#A6472D',
            padding: '0.85rem 1.25rem',
          }}
        >
          <Play size={17} />
          Start a race
        </button>
      </div>
    </div>
  );
};

export default PlayerProfileScreen;