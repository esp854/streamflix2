// Test script for episode import
const fetch = require('node-fetch');

async function testEpisodeImport() {
  try {
    console.log('Testing episode import...');

    // First, get all TV shows
    const contentResponse = await fetch('http://localhost:5000/api/debug/episodes');
    const contentData = await contentResponse.json();

    console.log(`Found ${contentData.totalTVShows} TV shows`);
    console.log(`Current total episodes: ${contentData.totalEpisodes}`);

    // Find a show without episodes
    const showWithoutEpisodes = contentData.episodesByShow.find(show => show.episodeCount === 0);
    if (!showWithoutEpisodes) {
      console.log('All shows already have episodes');
      return;
    }

    console.log(`Testing import for show: ${showWithoutEpisodes.showTitle} (ID: ${showWithoutEpisodes.showId})`);

    // Get content details to find TMDB ID
    const contentDetailResponse = await fetch(`http://localhost:5000/api/content/${showWithoutEpisodes.showId}`);
    if (!contentDetailResponse.ok) {
      console.log('Could not get content details');
      return;
    }

    const contentDetail = await contentDetailResponse.json();
    console.log(`TMDB ID: ${contentDetail.tmdbId}`);

    // Try to import episodes (this will fail due to auth, but shows the API structure)
    const importResponse = await fetch('http://localhost:5000/api/admin/import-episodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tmdbId: contentDetail.tmdbId,
        contentId: showWithoutEpisodes.showId
      })
    });

    console.log(`Import response status: ${importResponse.status}`);

    if (importResponse.status === 401) {
      console.log('Authentication required - this is expected for admin routes');
    } else {
      const importResult = await importResponse.json();
      console.log('Import result:', importResult);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEpisodeImport();