import React from 'react';
import { Award, X } from 'lucide-react';
import type { UnlockedAchievement } from '../utils/achievements';

interface AchievementNotificationProps {
achievements: UnlockedAchievement[];
onDismiss: () => void;
}

export const AchievementNotification: React.FC<
AchievementNotificationProps

> = ({ achievements, onDismiss }) => {
 if (achievements.length === 0) {
 return null;
 }

return (
<aside
role="status"
aria-live="polite"
style={{
maxWidth: '1000px',
width: 'calc(100% - 2rem)',
margin: '0.25rem auto 1rem',
padding: '1rem',
border: '1px solid #D7C4AA',
borderRadius: '12px',
backgroundColor: '#F8F3EA',
color: '#37362F',
}}
>
<div
style={{
display: 'flex',
alignItems: 'center',
gap: '0.75rem',
}}
> <Award
       size={24}
       color="#A6472D"
       aria-hidden="true"
     />

```
    <div style={{ flex: 1, minWidth: 0 }}>
      <strong style={{ fontSize: '0.95rem' }}>
        Achievement unlocked!
      </strong>

      <p
        style={{
          margin: '0.2rem 0 0',
          color: '#625D53',
          fontSize: '0.82rem',
        }}
      >
        Nice work. You reached a new milestone.
      </p>
    </div>

    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss achievement notification"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '40px',
        height: '40px',
        border: '1px solid #D7C4AA',
        borderRadius: '8px',
        background: 'transparent',
        color: '#37362F',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <X size={18} />
    </button>
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
      gap: '0.5rem',
      marginTop: '0.85rem',
    }}
  >
    {achievements.map((achievement) => (
      <div
        key={achievement.id}
        style={{
          padding: '0.65rem 0.75rem',
          border: '1px solid #E4D5C2',
          borderRadius: '8px',
          backgroundColor: '#FFFDF8',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
          {achievement.title}
        </div>

        <div
          style={{
            marginTop: '0.2rem',
            color: '#625D53',
            fontSize: '0.78rem',
          }}
        >
          {achievement.description}
        </div>
      </div>
    ))}
  </div>
</aside>


);
};

export default AchievementNotification;
