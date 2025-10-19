const fetch = require('node-fetch');

async function testContentFetch() {
  try {
    console.log("Testing content fetch from admin API...");
    
    // Test admin content fetch
    const adminResponse = await fetch('http://localhost:5000/api/admin/content');
    console.log("Admin API status:", adminResponse.status);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log("Admin content count:", adminData.length);
      console.log("First few items:", JSON.stringify(adminData.slice(0, 3), null, 2));
    } else {
      console.error("Admin API error:", adminResponse.status, await adminResponse.text());
    }
    
    // Test TMDB TV popular fetch
    console.log("\nTesting TMDB TV popular fetch...");
    const tmdbResponse = await fetch('http://localhost:5000/api/tmdb/tv/popular');
    console.log("TMDB API status:", tmdbResponse.status);
    
    if (tmdbResponse.ok) {
      const tmdbData = await tmdbResponse.json();
      console.log("TMDB popular TV shows count:", tmdbData.results?.length || 0);
      console.log("First few items:", JSON.stringify(tmdbData.results?.slice(0, 3), null, 2));
    } else {
      console.error("TMDB API error:", tmdbResponse.status, await tmdbResponse.text());
    }
    
  } catch (error) {
    console.error("Network error:", error.message);
  }
}

testContentFetch();