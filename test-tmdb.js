const fetch = require('node-fetch');

async function testTMDB() {
  try {
    const response = await fetch(
      'https://api.themoviedb.org/3/tv/popular?api_key=c31b2d7b3216f1ec80e300b70733d8dc&language=fr-FR&page=1'
    );
    
    console.log('Status:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('Nombre de résultats:', data.results ? data.results.length : 0);
    } else {
      console.error('Erreur:', response.status, response.statusText);
      const text = await response.text();
      console.error('Corps de la réponse:', text);
    }
  } catch (error) {
    console.error('Erreur réseau:', error.message);
  }
}

testTMDB();