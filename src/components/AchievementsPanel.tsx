import React from 'react';
import { Award, Lock } from 'lucide-react';
import {
ACHIEVEMENTS,
type UnlockedAchievement,
} from '../utils/achievements';

interface AchievementsPanelProps {
unlockedAchievements: UnlockedAchievement[];
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
unlockedAchievements,
}) => {
const unlockedIds = new Set(
unlockedAchievements.map((achievement) => achievement.id)
);

const unlockedCount = unlockedIds.size;

return (
<section
aria-labelledby="achievements-heading"
style={{
maxWidth: '1040px',
width: 'calc(100% - 2rem)',
margin: '2rem auto',
}}
>
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
gap: '1rem',
flexWrap: 'wrap',
marginBottom: '1rem',
}}
> <div>
<h2
id="achievements-heading"
style={{
margin: 0,
fontSize: '1.3rem',
fontWeight: 700,
}}
>
Achievements </h2>

```
      <p
        style={{
          margin: '0.35rem 0 0',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        Milestones earned through your races.
      </p>
    </div>

    <div
      style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}
    >
      {unlockedCount} / {ACHIEVEMENTS.length} unlocked
    </div>
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
      gap: '0.75rem',
    }}
  >
    {ACHIEVEMENTS.map((achievement) => {
      const isUnlocked = unlockedIds.has(achievement.id);

      return (
        <article
          key={achievement.id}
          style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
            padding: '1rem',
            minWidth: 0,
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-surface)',
            opacity: isUnlocked ? 1 : 0.68,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: isUnlocked ? '#F2E5D8' : 'var(--bg-surface)',
              color: isUnlocked ? '#A6472D' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {isUnlocked ? (
              <Award size={21} />
            ) : (
              <Lock size={18} />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: '0 0 0.3rem',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            >
              {achievement.title}
            </h3>

            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            >
              {isUnlocked
                ? achievement.description
                : `Locked: ${achievement.requirement}`}
            </p>

            {isUnlocked && (
              <div
                style={{
                  marginTop: '0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#657155',
                }}
              >
                UNLOCKED
              </div>
            )}
          </div>
        </article>
      );
    })}
  </div>
</section>


);
};

export default AchievementsPanel;
