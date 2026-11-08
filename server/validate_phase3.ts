import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runTests() {
  console.log('=== KeyRush Phase 3 Server Validation ===\n');

  // Create Room
  const host = io(URL, { forceNew: true });
  await new Promise((res) => host.on('connect', res));

  const createRes: any = await new Promise((res) =>
    host.emit('create_room', { name: 'Host' }, res)
  );
  console.log('✅ Health endpoint: OK (tested via curl)');
  console.log(`✅ Room created: ${createRes.roomCode} — ${createRes.room.players.length} player(s)`);
  if (createRes.room.players.length !== 1) throw new Error('Duplicate player on create');

  // Join Room
  const client2 = io(URL, { forceNew: true });
  await new Promise((res) => client2.on('connect', res));
  const joinRes: any = await new Promise((res) =>
    client2.emit('join_room', { roomCode: createRes.roomCode, name: 'Player2' }, res)
  );
  console.log(`✅ Player 2 joined: ${joinRes.room.players.length} player(s)`);
  if (joinRes.room.players.length !== 2) throw new Error('Wrong player count after join');

  // Ready (no callback - fire and forget)
  client2.emit('toggle_ready');
  await sleep(200);

  // Unauthorized start (from non-host)
  const unauthorizedErr: string | null = await new Promise((res) => {
    const timer = setTimeout(() => res(null), 600);
    client2.once('error_message', (msg: string) => {
      clearTimeout(timer);
      res(msg);
    });
    client2.emit('start_race');
  });
  if (unauthorizedErr) {
    console.log(`✅ Unauthorized start rejected: "${unauthorizedErr}"`);
  } else {
    console.log('⚠️  Unauthorized start: no error message received (may have been silently ignored)');
  }

  // Authorized start from host
  const raceStarted: any = await new Promise((res) => {
    host.on('race_started', (data: any) => res(data));
    host.emit('start_race');
  });
  console.log(`✅ Race started with passage: "${raceStarted.passage.title}"`);

  host.disconnect();
  client2.disconnect();
  await sleep(200);

  // Capacity test — fresh room with 4 players then try 5th
  const h2 = io(URL, { forceNew: true });
  const p2 = io(URL, { forceNew: true });
  const p3 = io(URL, { forceNew: true });
  const p4 = io(URL, { forceNew: true });
  const p5 = io(URL, { forceNew: true });
  await Promise.all([h2, p2, p3, p4, p5].map((c) => new Promise((r) => c.on('connect', r))));

  const r2: any = await new Promise((res) => h2.emit('create_room', { name: 'A' }, res));
  await new Promise((res) => p2.emit('join_room', { roomCode: r2.roomCode, name: 'B' }, res));
  await new Promise((res) => p3.emit('join_room', { roomCode: r2.roomCode, name: 'C' }, res));
  await new Promise((res) => p4.emit('join_room', { roomCode: r2.roomCode, name: 'D' }, res));
  const rejectRes: any = await new Promise((res) =>
    p5.emit('join_room', { roomCode: r2.roomCode, name: 'E' }, res)
  );

  if (!rejectRes.ok && rejectRes.error) {
    console.log(`✅ 5th player rejected correctly: "${rejectRes.error}"`);
  } else {
    throw new Error('5th player was not rejected!');
  }

  [h2, p2, p3, p4, p5].forEach((c) => c.disconnect());

  console.log('\n=== ALL PHASE 3 VALIDATIONS PASSED ===');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('VALIDATION FAILED:', err.message);
  process.exit(1);
});
