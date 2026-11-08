import { Passage } from '../types/game';

export const PASSAGES: Passage[] = [
{
id: 'passage-1',
title: 'late night vibes',
text: 'the whole squad is online and nobody wants to sleep tonight we started one game and somehow ended up talking for hours',
author: 'keyrush'
},
{
id: 'passage-2',
title: 'college chaos',
text: 'woke up late rushed to college and still managed to miss the first class at this point the attendance is fighting for its life',
author: 'keyrush'
},
{
id: 'passage-3',
title: 'weekend plans',
text: 'we should go somewhere this weekend grab some food play good music and forget about all the assignments waiting for us on monday',
author: 'keyrush'
},
{
id: 'passage-4',
title: 'main character energy',
text: 'put on your favorite playlist walk outside and pretend life is a movie sometimes the smallest moments deserve the biggest memories',
author: 'keyrush'
},
{
id: 'passage-5',
title: 'one more game',
text: 'bro said one last match three hours ago and somehow we are still here blaming the internet every time we lose',
author: 'keyrush'
},
{
id: 'passage-6',
title: 'midnight thoughts',
text: 'why do the most random thoughts appear at two in the morning when your body is tired but your brain wants to discuss everything',
author: 'keyrush'
},
{
id: 'passage-7',
title: 'food is everything',
text: 'nothing can ruin a good day when your favorite food is waiting at home except finding out someone already finished the last piece',
author: 'keyrush'
},
{
id: 'passage-8',
title: 'that one friend',
text: 'everyone has that one friend who disappears for weeks and returns with absolutely no explanation like nothing happened at all',
author: 'keyrush'
},
{
id: 'passage-9',
title: 'playlist therapy',
text: 'some songs hit differently when you are walking alone at night with your headphones on and a thousand thoughts running through your mind',
author: 'keyrush'
},
{
id: 'passage-10',
title: 'exam season',
text: 'opened the book to study for five minutes then somehow cleaned the entire room checked every notification and forgot why the book was open',
author: 'keyrush'
},
{
id: 'passage-11',
title: 'soft life',
text: 'all i want is good sleep tasty food peaceful mornings and people who match my energy without making everything unnecessarily complicated',
author: 'keyrush'
},
{
id: 'passage-12',
title: 'online at three',
text: 'the group chat becomes a completely different place after midnight and suddenly everyone has the energy to solve problems nobody mentioned before',
author: 'keyrush'
},
{
id: 'passage-13',
title: 'small wins',
text: 'finished the task drank enough water cleaned the desk and finally replied to that message honestly today feels like a solid win',
author: 'keyrush'
},
{
id: 'passage-14',
title: 'weekend loading',
text: 'five days of lectures assignments and pretending to understand everything just to spend saturday sleeping until the afternoon sounds like a fair deal',
author: 'keyrush'
},
{
id: 'passage-15',
title: 'the real struggle',
text: 'having enough time to do everything but somehow choosing to stare at the ceiling for twenty minutes before starting anything at all',
author: 'keyrush'
},
{
id: 'passage-16',
title: 'good company',
text: 'life gets a little easier when you find people who laugh at the same nonsense and make even the most boring days feel special',
author: 'keyrush'
},
{
id: 'passage-17',
title: 'gaming mindset',
text: 'stay calm learn the map trust your timing and never blame your teammates unless you have absolutely no other explanation for that loss',
author: 'keyrush'
},
{
id: 'passage-18',
title: 'random adventures',
text: 'the best plans usually begin with absolutely no plan at all just a few friends some free time and a reason to leave the house',
author: 'keyrush'
},
{
id: 'passage-19',
title: 'phone battery',
text: 'the battery stays at one hundred all morning then drops to ten percent the moment you actually need to leave the house',
author: 'keyrush'
},
{
id: 'passage-20',
title: 'zero motivation',
text: 'the deadline is getting closer the work is still untouched and somehow watching random videos feels like the most important task today',
author: 'keyrush'
},
{
id: 'passage-21',
title: 'little things',
text: 'fresh bedsheets a cool breeze your favorite song and absolutely no urgent plans can turn an ordinary evening into the best part of your week',
author: 'keyrush'
},
{
id: 'passage-22',
title: 'the comeback',
text: 'not every day needs to be productive sometimes taking a break getting your mind together and trying again tomorrow is enough',
author: 'keyrush'
},
{
id: 'passage-23',
title: 'just one scroll',
text: 'picked up the phone to check one message and somehow discovered an entire new internet before remembering what i came here to do',
author: 'keyrush'
}
];

export function getRandomPassage(): Passage {
const index = Math.floor(Math.random() * PASSAGES.length);
return PASSAGES[index];
}
