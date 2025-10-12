#!/usr/bin/env tsx

/**
 * Script de démarrage pour tester le système Watch Party
 * Ce script démarre le serveur et exécute les tests automatiquement
 */

import { spawn } from 'child_process';
import { join } from 'path';
import WatchPartyTester from './test-watch-party';

class WatchPartyTestRunner {
  private serverProcess: any = null;
  private serverUrl = 'http://localhost:5000';

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Démarrage du serveur...');
      
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: 'pipe',
        shell: true
      });

      let serverReady = false;

      this.serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`[SERVER] ${output.trim()}`);
        
        if (output.includes('Serveur démarré sur le port') && !serverReady) {
          serverReady = true;
          console.log('✅ Serveur démarré avec succès');
          resolve();
        }
      });

      this.serverProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`[SERVER ERROR] ${data.toString().trim()}`);
      });

      this.serverProcess.on('error', (error: Error) => {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        reject(error);
      });

      this.serverProcess.on('exit', (code: number) => {
        if (code !== 0 && !serverReady) {
          reject(new Error(`Serveur arrêté avec le code ${code}`));
        }
      });

      // Timeout de démarrage
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Timeout de démarrage du serveur'));
        }
      }, 30000);
    });
  }

  async waitForServer(): Promise<void> {
    console.log('⏳ Attente de la disponibilité du serveur...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(`${this.serverUrl}/api/watch-party/TEST`);
        if (response.ok || response.status === 404) {
          console.log('✅ Serveur disponible');
          return;
        }
      } catch (error) {
        // Serveur pas encore prêt
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Serveur non disponible après 30 secondes');
  }

  async runTests(): Promise<void> {
    console.log('🧪 Exécution des tests Watch Party...');
    
    const tester = new WatchPartyTester(this.serverUrl);
    await tester.runAllTests();
  }

  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      console.log('🛑 Arrêt du serveur...');
      this.serverProcess.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.serverProcess.on('exit', () => {
          console.log('✅ Serveur arrêté');
          resolve();
        });
        
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }

  async run(): Promise<void> {
    try {
      await this.startServer();
      await this.waitForServer();
      await this.runTests();
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des tests:', error);
      process.exit(1);
    } finally {
      await this.stopServer();
    }
  }
}

// Exécuter si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new WatchPartyTestRunner();
  runner.run().catch(console.error);
}

export default WatchPartyTestRunner;
