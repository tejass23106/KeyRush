import type { ProgressionData } from './progression';

const STORAGE_KEY = 'keyrush:achievements:v1';

export interface AchievementDefinition {
id: string;
title: string;
description: string;
requirement: string;
}

export interface UnlockedAchievement extends AchievementDefinition {
unlockedAt: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
{
id: 'first-race',
title: 'First Race',
description: 'Complete your first race.',
requirement: 'Complete 1 race',
},
{
id: 'getting-faster',
title: 'Getting Faster',
description: 'Reach 30 WPM in a race.',
requirement: 'Reach 30 WPM',
},
{
id: 'speed-demon',
title: 'Speed Demon',
description: 'Reach 60 WPM in a race.',
requirement: 'Reach 60 WPM',
},
{
id: 'accuracy-master',
title: 'Accuracy Master',
description: 'Achieve at least 98% accuracy.',
requirement: 'Reach 98% accuracy',
},
{
id: 'dedicated-racer',
title: 'Dedicated Racer',
description: 'Complete 25 races.',
requirement: 'Complete 25 races',
},
{
id: 'century-club',
title: 'Century Club',
description: 'Reach 100 WPM in a race.',
requirement: 'Reach 100 WPM',
},
];

type AchievementProgress = Pick<
ProgressionData,
'totalRaces' | 'bestWpm' | 'bestAccuracy'

> ;

function isEligible(
achievementId: string,
progression: AchievementProgress
): boolean {
switch (achievementId) {
case 'first-race':
return progression.totalRaces >= 1;


case 'getting-faster':
  return progression.bestWpm >= 30;

case 'speed-demon':
  return progression.bestWpm >= 60;

case 'accuracy-master':
  return progression.bestAccuracy >= 98;

case 'dedicated-racer':
  return progression.totalRaces >= 25;

case 'century-club':
  return progression.bestWpm >= 100;

default:
  return false;


}
}

export function loadUnlockedAchievements(): UnlockedAchievement[] {
try {
const saved = localStorage.getItem(STORAGE_KEY);


if (!saved) {
  return [];
}

const parsed: unknown = JSON.parse(saved);

if (!Array.isArray(parsed)) {
  return [];
}

const validAchievements: UnlockedAchievement[] = [];

for (const item of parsed) {
  if (
    !item ||
    typeof item !== 'object' ||
    typeof item.id !== 'string' ||
    typeof item.unlockedAt !== 'string'
  ) {
    continue;
  }

  const definition = ACHIEVEMENTS.find(
    (achievement) => achievement.id === item.id
  );

  if (!definition) {
    continue;
  }

  if (
    validAchievements.some(
      (achievement) => achievement.id === definition.id
    )
  ) {
    continue;
  }

  validAchievements.push({
    ...definition,
    unlockedAt: item.unlockedAt,
  });
}

return validAchievements;


} catch {
return [];
}
}

function saveUnlockedAchievements(
achievements: UnlockedAchievement[]
): void {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
} catch (error) {
console.error('Could not save KeyRush achievements:', error);
}
}

export function checkAndUnlockAchievements(
progression: AchievementProgress
): {
unlocked: UnlockedAchievement[];
newlyUnlocked: UnlockedAchievement[];
} {
const existing = loadUnlockedAchievements();

const unlockedIds = new Set(
existing.map((achievement) => achievement.id)
);

const newlyUnlocked = ACHIEVEMENTS
.filter(
(achievement) =>
!unlockedIds.has(achievement.id) &&
isEligible(achievement.id, progression)
)
.map((achievement): UnlockedAchievement => ({
...achievement,
unlockedAt: new Date().toISOString(),
}));

const unlocked = [...existing, ...newlyUnlocked];

if (newlyUnlocked.length > 0) {
saveUnlockedAchievements(unlocked);
}

return {
unlocked,
newlyUnlocked,
};
}
