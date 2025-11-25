import { Client } from 'colyseus.js';

async function testConnection() {
  console.log('🧪 Colyseus Connection Test\n');

  const client = new Client('ws://localhost:2567');

  try {
    // Test 1: Connect to room
    console.log('1️⃣  Joining game room...');
    const room = await client.joinOrCreate('game', { playerName: 'TestPlayer1' });
    console.log(`   ✅ Joined room: ${room.roomId}`);
    console.log(`   ✅ Session ID: ${room.sessionId}`);

    // Test 2: Listen for state changes
    console.log('\n2️⃣  Listening for state changes...');
    room.onStateChange((state) => {
      console.log(`   📊 State updated - Players: ${state.players.size}, Phase: ${state.phase}`);
    });

    // Test 3: Listen for messages
    room.onMessage('player_joined', (message) => {
      console.log(`   👤 Player joined: ${message.playerName}`);
    });

    room.onMessage('player_left', (message) => {
      console.log(`   👋 Player left: ${message.playerName}`);
    });

    // Test 4: Send move message
    console.log('\n3️⃣  Sending move message...');
    room.send('move', { x: 100, y: 200 });
    console.log('   ✅ Move sent: { x: 100, y: 200 }');

    // Test 5: Toggle ready state
    console.log('\n4️⃣  Sending ready message...');
    room.send('ready');
    console.log('   ✅ Ready message sent');

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 6: Second player connection
    console.log('\n5️⃣  Connecting second player...');
    const client2 = new Client('ws://localhost:2567');
    const room2 = await client2.joinOrCreate('game', { playerName: 'TestPlayer2' });
    console.log(`   ✅ Player 2 joined: ${room2.sessionId}`);

    // Toggle ready for player 2
    room2.send('ready');
    console.log('   ✅ Player 2 ready');

    // Wait for game start
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check final state
    console.log('\n6️⃣  Final state check...');
    console.log(`   📊 Room state: ${room.state.phase}`);
    console.log(`   👥 Total players: ${room.state.players.size}`);

    // Cleanup
    console.log('\n7️⃣  Cleaning up...');
    await room2.leave();
    await room.leave();
    console.log('   ✅ Both players left');

    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
