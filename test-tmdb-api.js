// Test de l'API TMDB avec recherche film et série
require('dotenv').config();

async function testTMDBAPI() {
  try {
    console.log('Test de la recherche TMDB...');
    
    // Test de recherche de films
    console.log('\n--- Test recherche films ---');
    const movieQuery = 'inception';
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${movieQuery}&language=fr-FR&page=1`
    );
    
    console.log('Status recherche films:', movieResponse.status);
    
    if (movieResponse.ok) {
      const movieData = await movieResponse.json();
      console.log('Nombre de résultats films:', movieData.results ? movieData.results.length : 0);
      if (movieData.results && movieData.results.length > 0) {
        console.log('Premier film trouvé:', movieData.results[0].title);
      }
    } else {
      console.error('Erreur recherche films:', movieResponse.status, movieResponse.statusText);
      const text = await movieResponse.text();
      console.error('Corps de la réponse:', text);
    }
    
    // Test de recherche de séries
    console.log('\n--- Test recherche séries ---');
    const tvQuery = 'flash';
    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${tvQuery}&language=fr-FR&page=1`
    );
    
    console.log('Status recherche séries:', tvResponse.status);
    
    if (tvResponse.ok) {
      const tvData = await tvResponse.json();
      console.log('Nombre de résultats séries:', tvData.results ? tvData.results.length : 0);
      if (tvData.results && tvData.results.length > 0) {
        console.log('Première série trouvée:', tvData.results[0].name);
      }
    } else {
      console.error('Erreur recherche séries:', tvResponse.status, tvResponse.statusText);
      const text = await tvResponse.text();
      console.error('Corps de la réponse:', text);
    }
  } catch (error) {
    console.error('Erreur réseau:', error.message);
  }
}

testTMDBAPI();