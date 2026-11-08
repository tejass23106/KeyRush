import {
  Flag,
  ChartNoAxesCombined,
  UserRound,
  Trophy,
  Settings,
} from 'lucide-react';
import type { ScreenState } from '../types/game';

interface NavbarProps {
  currentScreen: ScreenState;
  onNavigateHome: () => void;
  onStartPractice: () => void;
  onNavigateStatistics: () => void;
  onNavigateProfile: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigateHome,
  onStartPractice,
  onNavigateStatistics,
  onNavigateProfile,
  onNavigateLeaderboard,
  onNavigateSettings,
}) => {
  const navButtonStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    padding: '0.6rem 0.85rem',
  };

  const showProfile =
    currentScreen === 'home' ||
    currentScreen === 'statistics' ||
    currentScreen === 'profile';

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        padding: '1rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1040px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          aria-label="KeyRush home"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            cursor: 'pointer',
            userSelect: 'none',
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              backgroundColor: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Flag size={18} strokeWidth={2.2} />
          </span>

          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            KEYRUSH
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              padding: '0.15rem 0.4rem',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Phase 1
          </span>
        </button>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}

        >
          {currentScreen !== 'home' && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="btn btn-secondary"
              style={navButtonStyle}
            >
              Home
            </button>
          )}

          {(currentScreen === 'home' ||
            currentScreen === 'profile') && (
              <button
                type="button"
                onClick={onNavigateStatistics}
                className="btn btn-secondary"
                style={navButtonStyle}
                aria-label="Open statistics"
              >
                <ChartNoAxesCombined size={16} />
                Statistics
              </button>
            )}

          {showProfile && (
            <button
              type="button"
              onClick={onNavigateProfile}
              className="btn btn-secondary"
              style={navButtonStyle}
              aria-label="Open player profile"
              aria-current={
                currentScreen === 'profile' ? 'page' : undefined
              }
            >
              <UserRound size={16} />
              Profile
            </button>
          )}
          {!['lobby', 'racing', 'results'].includes(currentScreen) && (
            <button
              type="button"
              onClick={onNavigateLeaderboard}
              className="btn btn-secondary"
              style={navButtonStyle}
              aria-label="Open leaderboard"
              aria-current={currentScreen === 'leaderboard' ? 'page' : undefined}
            >
              <Trophy size={16} />
              Leaderboard
            </button>

          )}
          {!['lobby', 'racing', 'results'].includes(currentScreen) && (
            <button
              type="button"
              onClick={onNavigateSettings}
              className="btn btn-secondary"
              style={navButtonStyle}
              aria-label="Open settings"
              aria-current={currentScreen === 'settings' ? 'page' : undefined}
            >
              <Settings size={16} />
              Settings
            </button>
          )}

          {(currentScreen === 'home' ||
            currentScreen === 'statistics') && (
              <button
                type="button"
                onClick={onStartPractice}
                className="btn btn-primary"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.6rem 1.1rem',
                }}
              >
                Start Race
              </button>
            )}

        </nav>
      </div>
    </header>
  );
};