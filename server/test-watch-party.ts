#!/usr/bin/env tsx

/**
 * Script de test pour le système Watch Party amélioré
 * Ce script teste les fonctionnalités principales du Watch Party
 */

import { io, Socket } from 'socket.io-client';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

class WatchPartyTester {
  private results: TestResult[] = [];
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:5000') {
    this.serverUrl = serverUrl;
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        test: testName,
        status: 'PASS',
        message: 'Test réussi',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${testName} - PASS (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        test: testName,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      });
      console.log(`❌ ${testName} - FAIL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private createSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      socket.on('connect', () => {
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        reject(new Error(`Erreur de connexion: ${error.message}`));
      });

      setTimeout(() => {
        reject(new Error('Timeout de connexion'));
      }, 10000);
    });
  }

  async testConnection(): Promise<void> {
    const socket = await this.createSocket();
    
    if (!socket.connected) {
      throw new Error('Socket non connecté');
    }

    socket.disconnect();
  }

  async testRoomCreation(): Promise<void> {
    const socket = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      const testData = {
        roomId: 'TEST123',
        userId: 'user1',
        username: 'TestUser1'
      };

      socket.emit('join-watch-party', testData);

      socket.on('watch-party-joined', (data) => {
        if (data.roomId === testData.roomId && data.isHost) {
          socket.disconnect();
          resolve();
        } else {
          socket.disconnect();
          reject(new Error('Données de salle incorrectes'));
        }
      });

      socket.on('error', (error) => {
        socket.disconnect();
        reject(new Error(`Erreur serveur: ${error.message}`));
      });

      setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout de création de salle'));
      }, 5000);
    });
  }

  async testMultipleParticipants(): Promise<void> {
    const socket1 = await this.createSocket();
    const socket2 = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      let participantsJoined = 0;
      const roomId = 'MULTI123';

      const joinSocket = (socket: Socket, userId: string, username: string) => {
        socket.emit('join-watch-party', { roomId, userId, username });
        
        socket.on('watch-party-joined', () => {
          participantsJoined++;
          if (participantsJoined === 2) {
            socket1.disconnect();
            socket2.disconnect();
            resolve();
          }
        });

        socket.on('participant-joined', () => {
          participantsJoined++;
          if (participantsJoined === 2) {
            socket1.disconnect();
            socket2.disconnect();
            resolve();
          }
        });
      };

      joinSocket(socket1, 'user1', 'User1');
      joinSocket(socket2, 'user2', 'User2');

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('Timeout de test multi-participants'));
      }, 10000);
    });
  }

  async testVideoSync(): Promise<void> {
    const socket1 = await this.createSocket();
    const socket2 = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      const roomId = 'SYNC123';
      let syncReceived = false;

      // Socket 1 (hôte)
      socket1.emit('join-watch-party', { roomId, userId: 'host', username: 'Host' });
      
      socket1.on('watch-party-joined', () => {
        // Socket 2 (participant)
        socket2.emit('join-watch-party', { roomId, userId: 'participant', username: 'Participant' });
      });

      socket2.on('watch-party-joined', () => {
        // Écouter la synchronisation vidéo
        socket2.on('video-play-sync', (data) => {
          if (data.triggeredBy === 'host') {
            syncReceived = true;
            socket1.disconnect();
            socket2.disconnect();
            resolve();
          }
        });

        // Déclencher la synchronisation
        setTimeout(() => {
          socket1.emit('video-play', { currentTime: 10 });
        }, 1000);
      });

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('Timeout de test de synchronisation'));
      }, 10000);
    });
  }

  async testChat(): Promise<void> {
    const socket1 = await this.createSocket();
    const socket2 = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      const roomId = 'CHAT123';
      let messageReceived = false;

      // Socket 1 (hôte)
      socket1.emit('join-watch-party', { roomId, userId: 'user1', username: 'User1' });
      
      socket1.on('watch-party-joined', () => {
        // Socket 2 (participant)
        socket2.emit('join-watch-party', { roomId, userId: 'user2', username: 'User2' });
      });

      socket2.on('watch-party-joined', () => {
        // Écouter les messages
        socket2.on('new-message', (message) => {
          if (message.userId === 'user1' && message.message === 'Test message') {
            messageReceived = true;
            socket1.disconnect();
            socket2.disconnect();
            resolve();
          }
        });

        // Envoyer un message
        setTimeout(() => {
          socket1.emit('send-message', { message: 'Test message' });
        }, 1000);
      });

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('Timeout de test de chat'));
      }, 10000);
    });
  }

  async testDisconnection(): Promise<void> {
    const socket1 = await this.createSocket();
    const socket2 = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      const roomId = 'DISCONNECT123';
      let disconnectReceived = false;

      // Socket 1 (hôte)
      socket1.emit('join-watch-party', { roomId, userId: 'user1', username: 'User1' });
      
      socket1.on('watch-party-joined', () => {
        // Socket 2 (participant)
        socket2.emit('join-watch-party', { roomId, userId: 'user2', username: 'User2' });
      });

      socket2.on('watch-party-joined', () => {
        // Écouter les déconnexions
        socket2.on('participant-disconnected', (data) => {
          if (data.userId === 'user1') {
            disconnectReceived = true;
            socket2.disconnect();
            resolve();
          }
        });

        // Déconnecter socket1
        setTimeout(() => {
          socket1.disconnect();
        }, 1000);
      });

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('Timeout de test de déconnexion'));
      }, 10000);
    });
  }

  async testHostTransfer(): Promise<void> {
    const socket1 = await this.createSocket();
    const socket2 = await this.createSocket();
    
    return new Promise((resolve, reject) => {
      const roomId = 'HOST123';
      let hostTransferReceived = false;

      // Socket 1 (hôte initial)
      socket1.emit('join-watch-party', { roomId, userId: 'host', username: 'Host' });
      
      socket1.on('watch-party-joined', () => {
        // Socket 2 (participant)
        socket2.emit('join-watch-party', { roomId, userId: 'participant', username: 'Participant' });
      });

      socket2.on('watch-party-joined', () => {
        // Écouter le changement d'hôte
        socket2.on('host-changed', (data) => {
          if (data.newHost === 'participant') {
            hostTransferReceived = true;
            socket2.disconnect();
            resolve();
          }
        });

        // Déconnecter l'hôte
        setTimeout(() => {
          socket1.disconnect();
        }, 1000);
      });

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('Timeout de test de transfert d\'hôte'));
      }, 10000);
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Démarrage des tests Watch Party...\n');

    await this.runTest('Connexion Socket.IO', () => this.testConnection());
    await this.runTest('Création de salle', () => this.testRoomCreation());
    await this.runTest('Participants multiples', () => this.testMultipleParticipants());
    await this.runTest('Synchronisation vidéo', () => this.testVideoSync());
    await this.runTest('Système de chat', () => this.testChat());
    await this.runTest('Gestion des déconnexions', () => this.testDisconnection());
    await this.runTest('Transfert d\'hôte', () => this.testHostTransfer());

    this.printResults();
  }

  private printResults(): void {
    console.log('\n📊 Résultats des tests:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test} (${result.duration}ms)`);
      if (result.status === 'FAIL') {
        console.log(`   └─ ${result.message}`);
      }
    });

    console.log('='.repeat(50));
    console.log(`Total: ${passed + failed} tests`);
    console.log(`✅ Réussis: ${passed}`);
    console.log(`❌ Échoués: ${failed}`);
    console.log(`⏱️  Durée totale: ${totalDuration}ms`);
    
    if (failed === 0) {
      console.log('\n🎉 Tous les tests sont passés ! Le système Watch Party fonctionne correctement.');
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    }
  }
}

// Exécuter les tests si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WatchPartyTester();
  tester.runAllTests().catch(console.error);
}

export default WatchPartyTester;
