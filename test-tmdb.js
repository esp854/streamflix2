// Test de l'API TMDB avec recherche TV
async function testTMDB() {
  try {
    console.log('Test de la recherche TV pour "flash"...');
    
    const response = await fetch(
      'https://api.themoviedb.org/3/search/tv?api_key=c31b2d7b3216f1ec80e300b70733d8dc&language=fr-FR&query=flash&page=1'
    );
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Nombre de résultats:', data.results ? data.results.length : 0);
      if (data.results && data.results.length > 0) {
        console.log('Premier résultat:', data.results[0].name);
      }
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