import watchPartyService from './watch-party-service';

// Script de test simple pour le service Watch Party
async function runTests() {
  console.log('🧪 Démarrage des tests pour WatchPartyService...\n');

  try {
    // Test 1: Création d'une nouvelle salle
    console.log('Test 1: Création d\'une nouvelle salle');
    const room = watchPartyService.createRoom('user1', 'User One', 'socket1', 'https://example.com/video.mp4');
    
    if (room && room.id && room.host === 'user1' && room.currentVideo === 'https://example.com/video.mp4') {
      console.log('✅ Test 1 réussi: Salle créée avec succès\n');
    } else {
      console.log('❌ Test 1 échoué: Problème lors de la création de la salle\n');
    }

    // Test 2: Rejoindre une salle existante
    console.log('Test 2: Rejoindre une salle existante');
    const joinedRoom = watchPartyService.joinRoom(room.id, 'user2', 'User Two', 'socket2');
    
    if (joinedRoom && joinedRoom.id === room.id && joinedRoom.participants.size === 2) {
      console.log('✅ Test 2 réussi: Utilisateur a rejoint la salle\n');
    } else {
      console.log('❌ Test 2 échoué: Problème lors du rejoindre la salle\n');
    }

    // Test 3: Quitter une salle
    console.log('Test 3: Quitter une salle');
    const leaveResult = watchPartyService.leaveRoom('user2');
    
    if (leaveResult && leaveResult.room.participants.size === 1) {
      console.log('✅ Test 3 réussi: Utilisateur a quitté la salle\n');
    } else {
      console.log('❌ Test 3 échoué: Problème lors du quitter la salle\n');
    }

    // Test 4: Synchronisation de la lecture
    console.log('Test 4: Synchronisation de la lecture');
    const playResult = watchPartyService.syncVideoPlay(room.id, 'user1', 120);
    
    if (playResult && playResult.shouldSync && playResult.room.isPlaying && playResult.room.currentTime === 120) {
      console.log('✅ Test 4 réussi: Synchronisation de la lecture\n');
    } else {
      console.log('❌ Test 4 échoué: Problème lors de la synchronisation de la lecture\n');
    }

    // Test 5: Synchronisation de la pause
    console.log('Test 5: Synchronisation de la pause');
    const pauseResult = watchPartyService.syncVideoPause(room.id, 'user1', 125);
    
    if (pauseResult && pauseResult.shouldSync && !pauseResult.room.isPlaying && pauseResult.room.currentTime === 125) {
      console.log('✅ Test 5 réussi: Synchronisation de la pause\n');
    } else {
      console.log('❌ Test 5 échoué: Problème lors de la synchronisation de la pause\n');
    }

    // Test 6: Changer de vidéo
    console.log('Test 6: Changer de vidéo');
    const changeVideoResult = watchPartyService.changeVideo(room.id, 'user1', 'https://example.com/new-video.mp4', 'New Video');
    
    if (changeVideoResult && changeVideoResult.isAuthorized && changeVideoResult.room.currentVideo === 'https://example.com/new-video.mp4') {
      console.log('✅ Test 6 réussi: Changement de vidéo\n');
    } else {
      console.log('❌ Test 6 échoué: Problème lors du changement de vidéo\n');
    }

    // Test 7: Envoyer un message
    console.log('Test 7: Envoyer un message');
    const message = watchPartyService.sendMessage(room.id, 'user1', 'User One', 'Hello everyone!');
    
    if (message && message.message === 'Hello everyone!') {
      console.log('✅ Test 7 réussi: Message envoyé\n');
    } else {
      console.log('❌ Test 7 échoué: Problème lors de l\'envoi du message\n');
    }

    // Test 8: Obtenir les statistiques
    console.log('Test 8: Obtenir les statistiques');
    const stats = watchPartyService.getStats();
    
    if (stats) {
      console.log(`✅ Test 8 réussi: Statistiques récupérées - ${stats.roomCount} salles, ${stats.participantCount} participants\n`);
    } else {
      console.log('❌ Test 8 échoué: Problème lors de la récupération des statistiques\n');
    }

    console.log('🎉 Tous les tests ont été exécutés!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  }
}

// Exécuter les tests si le script est lancé directement
if (require.main === module) {
  runTests();
}

export default runTests;
