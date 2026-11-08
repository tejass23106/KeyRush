import React from 'react';
import {
  Play,
  Users,
  Zap,
  Target,
  ShieldCheck,
  Trophy,
  Gauge,
  Flag,
  ArrowUpRight,
  Keyboard,
} from 'lucide-react';

import { getLevelInfo } from '../utils/progression';

interface HomeScreenProps {
  onStartSoloRace: () => void;
  onOpenMultiplayerModal: () => void;
  displayName: string;
  totalXp: number;
  totalRaces: number;
  bestWpm: number;
  bestAccuracy: number;
}

// F1-inspired SVG circuit illustration
const RacingCircuit: React.FC = () => {
  const circuitPath =
    'M 105 95 C 105 55 145 38 195 38 L 405 38 C 475 38 510 65 510 110 C 510 145 475 155 430 155 L 375 155 C 330 155 315 180 340 210 C 365 240 420 235 455 215 C 495 190 540 205 540 250 C 540 295 495 320 445 320 L 180 320 C 105 320 65 285 65 235 C 65 195 95 175 145 175 L 205 175 C 245 175 260 150 235 125 C 215 105 180 110 155 125 C 125 140 105 125 105 95 Z';

  return (
    <div className="home-circuit">
      <div className="circuit-label circuit-label-top">
        KEYRUSH CIRCUIT <span>01 / RACE</span>
      </div>

      <svg
        viewBox="0 0 620 360"
        className="circuit-svg"
        role="img"
        aria-label="Illustration of an F1-style racing circuit with four cars"
      >
        <defs>
          <pattern
            id="grassTexture"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="5" cy="5" r="1" fill="#FFFFFF" opacity=".08" />
            <circle cx="17" cy="15" r="1" fill="#FFFFFF" opacity=".06" />
          </pattern>

          <pattern
            id="checkers"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="#F4F2EC" />
            <rect x="8" y="8" width="8" height="8" fill="#F4F2EC" />
            <rect x="8" width="8" height="8" fill="#242621" />
            <rect y="8" width="8" height="8" fill="#242621" />
          </pattern>
        </defs>

        {/* Grass background */}
        <rect width="620" height="360" rx="16" fill="#53634B" />
        <rect
          width="620"
          height="360"
          rx="16"
          fill="url(#grassTexture)"
        />

        {/* Circuit kerbs */}
        <path
          d={circuitPath}
          fill="none"
          stroke="#E5E0D4"
          strokeWidth="96"
          strokeLinejoin="round"
        />

        <path
          d={circuitPath}
          fill="none"
          stroke="#A6472D"
          strokeWidth="96"
          strokeDasharray="18 18"
          strokeLinejoin="round"
        />

        {/* Asphalt */}
        <path
          d={circuitPath}
          fill="none"
          stroke="#393C36"
          strokeWidth="78"
          strokeLinejoin="round"
        />

        {/* Track center line */}
        <path
          d={circuitPath}
          fill="none"
          stroke="#D3D0C5"
          strokeWidth="2"
          strokeDasharray="12 13"
          opacity=".4"
        />

        {/* Start / Finish line */}
        <g transform="translate(105 52) rotate(-90)">
          <rect
            x="-13"
            y="-7"
            width="26"
            height="14"
            fill="url(#checkers)"
          />
        </g>

        {/* Track labels */}
        <text
          x="300"
          y="78"
          fill="#D3D0C5"
          opacity=".65"
          fontSize="10"
          fontFamily="monospace"
          letterSpacing="2"
        >
          KEYRUSH GP
        </text>

        {/* Cars */}
        <g transform="translate(180 38) rotate(0)">
          <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#A6472D" />
          <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#E9E2D5" />
          <rect x="-19" y="-9" width="5" height="18" rx="1" fill="#242621" />
          <rect x="14" y="-9" width="5" height="18" rx="1" fill="#242621" />
        </g>

        <g transform="translate(410 155) rotate(180)">
          <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#657155" />
          <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#E9E2D5" />
          <rect x="-19" y="-9" width="5" height="18" rx="1" fill="#242621" />
          <rect x="14" y="-9" width="5" height="18" rx="1" fill="#242621" />
        </g>

        <g transform="translate(450 320) rotate(180)">
          <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#4A6984" />
          <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#E9E2D5" />
          <rect x="-19" y="-9" width="5" height="18" rx="1" fill="#242621" />
          <rect x="14" y="-9" width="5" height="18" rx="1" fill="#242621" />
        </g>

        <g transform="translate(145 175) rotate(0)">
          <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#C49A55" />
          <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#E9E2D5" />
          <rect x="-19" y="-9" width="5" height="18" rx="1" fill="#242621" />
          <rect x="14" y="-9" width="5" height="18" rx="1" fill="#242621" />
        </g>
      </svg>

      <div className="circuit-label circuit-label-bottom">
        <span>EST. 4 RACERS</span>
        <span>PRECISION • SPEED • CONTROL</span>
      </div>
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSoloRace,
  onOpenMultiplayerModal,
  displayName,
  totalXp,
  totalRaces,
  bestWpm,
  bestAccuracy,
}) => {
  const levelInfo = getLevelInfo(totalXp);

  return (
    <div className="home-screen">

      {/* HERO */}
      <section className="home-hero-grid">

        <div className="home-hero-content">

          <div className="home-eyebrow">
            <span className="home-status-dot" />
            THE TYPING RACE EXPERIENCE
          </div>

          <h1>
            Your fingers.
            <br />
            <span>Your speed.</span>
            <br />
            Your victory.
          </h1>

          <p className="home-hero-description">
            Welcome back, {displayName}. Turn every keystroke into
            acceleration. Improve your typing, challenge your friends,
            and race your way to the top.
          </p>

          <div className="home-hero-actions">
            <button
              onClick={onStartSoloRace}
              className="btn btn-primary home-main-button"
            >
              <Play size={18} fill="currentColor" />
              Start Racing
              <ArrowUpRight size={17} />
            </button>

            <button
              onClick={onOpenMultiplayerModal}
              className="btn btn-secondary home-secondary-button"
            >
              <Users size={18} />
              Race with Friends
            </button>
          </div>

          <div className="home-hero-note">
            <Keyboard size={15} />
            ACCURACY IS YOUR ACCELERATOR
          </div>
        </div>

        {/* CIRCUIT ILLUSTRATION */}
        <div className="home-circuit-card surface-card">
          <div className="home-circuit-heading">
            <div>
              <span className="home-section-label">THE TRACK</span>
              <h2>Ready. Set. Type.</h2>
            </div>

            <span className="home-live-badge">
              <span />
              LIVE RACING
            </span>
          </div>

          <RacingCircuit />

          <div className="home-circuit-footer">
            <div>
              <Users size={17} />
              <span>2–4 Players</span>
            </div>

            <div>
              <Zap size={17} />
              <span>Real-time Sync</span>
            </div>

            <div>
              <ShieldCheck size={17} />
              <span>Verified Results</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLAYER DASHBOARD */}
      <section className="home-dashboard">

        <div className="home-section-heading">
          <div>
            <span className="home-section-label">YOUR PERFORMANCE</span>
            <h2>Racer Dashboard</h2>
          </div>

          <span className="home-level-badge">
            LEVEL {levelInfo.level}
          </span>
        </div>

        {/* XP PROGRESS */}
        <div className="home-xp-card surface-card">
          <div className="home-xp-top">
            <div>
              <span className="home-stat-label">EXPERIENCE POINTS</span>
              <div className="home-xp-value">
                {totalXp.toLocaleString()} <span>XP</span>
              </div>
            </div>

            <div className="home-xp-next">
              {levelInfo.xpToNextLevel > 0
                ? `${levelInfo.xpToNextLevel} XP to next level`
                : 'Maximum level reached'}
            </div>
          </div>

          <div className="home-xp-track">
            <div
              className="home-xp-fill"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="home-stats-grid">

          <div className="home-stat-card surface-card">
            <div className="home-stat-icon">
              <Flag size={19} />
            </div>
            <span className="home-stat-label">TOTAL RACES</span>
            <strong>{totalRaces.toLocaleString()}</strong>
            <span className="home-stat-caption">Races completed</span>
          </div>

          <div className="home-stat-card surface-card">
            <div className="home-stat-icon">
              <Gauge size={19} />
            </div>
            <span className="home-stat-label">BEST SPEED</span>
            <strong>{bestWpm}</strong>
            <span className="home-stat-caption">Words per minute</span>
          </div>

          <div className="home-stat-card surface-card">
            <div className="home-stat-icon">
              <Target size={19} />
            </div>
            <span className="home-stat-label">BEST ACCURACY</span>
            <strong>{bestAccuracy}%</strong>
            <span className="home-stat-caption">Typing precision</span>
          </div>

          <div className="home-stat-card surface-card">
            <div className="home-stat-icon">
              <Trophy size={19} />
            </div>
            <span className="home-stat-label">CURRENT LEVEL</span>
            <strong>{levelInfo.level}</strong>
            <span className="home-stat-caption">Racer progression</span>
          </div>

        </div>
      </section>

      {/* GAME MODES */}
      <section className="home-modes-section">

        <div className="home-section-heading">
          <div>
            <span className="home-section-label">CHOOSE YOUR CHALLENGE</span>
            <h2>Pick Your Race</h2>
          </div>
        </div>

        <div className="home-modes-grid">

          <button
            className="home-mode-card home-solo-card surface-card"
            onClick={onStartSoloRace}
          >
            <div className="home-mode-top">
              <div className="home-mode-icon">
                <Play size={22} />
              </div>
              <ArrowUpRight size={20} />
            </div>

            <div>
              <span className="home-mode-tag">PRACTICE MODE</span>
              <h3>Solo Practice</h3>
              <p>
                Improve your WPM, sharpen your accuracy and
                build consistency at your own pace.
              </p>
            </div>

            <span className="home-mode-action">
              Start practicing →
            </span>
          </button>

          <button
            className="home-mode-card home-multiplayer-card surface-card"
            onClick={onOpenMultiplayerModal}
          >
            <div className="home-mode-top">
              <div className="home-mode-icon">
                <Users size={22} />
              </div>
              <ArrowUpRight size={20} />
            </div>

            <div>
              <span className="home-mode-tag">COMPETITIVE MODE</span>
              <h3>Multiplayer Race</h3>
              <p>
                Create a private lobby, invite your friends
                and compete in synchronized typing races.
              </p>
            </div>

            <span className="home-mode-action">
              Challenge friends →
            </span>
          </button>

        </div>
      </section>

      {/* FEATURES */}
      <section className="home-features-section">

        <div className="home-section-heading">
          <div>
            <span className="home-section-label">BUILT FOR COMPETITION</span>
            <h2>What Makes KeyRush Different</h2>
          </div>
        </div>

        <div className="home-feature-grid">

          <div className="home-feature-card surface-card">
            <div className="home-feature-icon">
              <Zap size={21} />
            </div>
            <h3>Real-time Racing</h3>
            <p>
              Live multiplayer progress keeps every racer
              synchronized throughout the competition.
            </p>
          </div>

          <div className="home-feature-card surface-card">
            <div className="home-feature-icon">
              <Target size={21} />
            </div>
            <h3>Accuracy Matters</h3>
            <p>
              Correct typing drives your car forward.
              Mistakes must be corrected before you advance.
            </p>
          </div>

          <div className="home-feature-card surface-card">
            <div className="home-feature-icon">
              <ShieldCheck size={21} />
            </div>
            <h3>Fair Competition</h3>
            <p>
              Server-authoritative race results and
              synchronized starts keep multiplayer fair.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};