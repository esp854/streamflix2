const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration des génériques
const trailers = {
  netflix: 'RXJo86FGYAM',
  disney: 'r43_WLqNcZo',
  prime: 'dtUJvOj3GLc',
  paramount: 'bUHK7DoQ340',
  apple: '3517fJ4bbMI',
  marvel: 'LBZJLJqQFwM',
  dc: 'OQfj58Pbzwk'
};

// Vérifier si yt-dlp est installé
function checkYtDlp() {
  return new Promise((resolve) => {
    exec('yt-dlp --version', (error) => {
      if (error) {
        console.log('yt-dlp non trouvé. Installation en cours...');
        exec('pip install yt-dlp', (installError) => {
          if (installError) {
            console.error('Erreur lors de l\'installation de yt-dlp:', installError);
            resolve(false);
          } else {
            console.log('yt-dlp installé avec succès!');
            resolve(true);
          }
        });
      } else {
        console.log('yt-dlp trouvé!');
        resolve(true);
      }
    });
  });
}

// Télécharger un générique
function downloadTrailer(name, youtubeId) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '..', 'client', 'public', 'trailers', `${name}.mp4`);
    
    // Créer le répertoire s'il n'existe pas
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`Téléchargement du générique ${name}...`);
    
    const command = `yt-dlp -o "${outputPath}" "https://www.youtube.com/watch?v=${youtubeId}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors du téléchargement de ${name}:`, error);
        reject(error);
      } else {
        console.log(`✓ ${name} téléchargé avec succès!`);
        resolve();
      }
    });
  });
}

// Télécharger tous les génériques
async function downloadAllTrailers() {
  console.log('Démarrage du téléchargement des génériques d\'univers...\n');
  
  const ytDlpAvailable = await checkYtDlp();
  if (!ytDlpAvailable) {
    console.error('Impossible d\'installer ou de trouver yt-dlp. Veuillez l\'installer manuellement.');
    return;
  }
  
  try {
    for (const [name, youtubeId] of Object.entries(trailers)) {
      await downloadTrailer(name, youtubeId);
    }
    
    console.log('\n🎉 Tous les génériques ont été téléchargés avec succès!');
    console.log('Les vidéos sont maintenant disponibles dans client/public/trailers/');
  } catch (error) {
    console.error('Erreur lors du téléchargement des génériques:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  downloadAllTrailers();
}

module.exports = { downloadAllTrailers, trailers };