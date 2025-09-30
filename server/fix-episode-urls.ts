import { config } from "dotenv";
import { storage } from "./storage";

// Load environment variables
config();

async function fixEpisodeUrls() {
  try {
    console.log("Fixing HTML-encoded episode URLs...");
    
    // Test database connection
    console.log("Testing database connection...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is not set in environment variables");
      process.exit(1);
    }
    console.log("DATABASE_URL is set");
    
    // Get all episodes from the database
    const allContent = await storage.getAllContent();
    let totalEpisodes = 0;
    let fixedEpisodes = 0;
    
    // Process each TV content
    for (const content of allContent.filter(c => c.mediaType === 'tv')) {
      const episodes = await storage.getEpisodesByContentId(content.id);
      totalEpisodes += episodes.length;
      
      // Fix each episode with HTML-encoded URLs
      for (const episode of episodes) {
        if (episode.odyseeUrl && (episode.odyseeUrl.includes('&amp;#x2F;') || episode.odyseeUrl.includes('&amp;'))) {
          let fixedUrl = episode.odyseeUrl;
          
          // Decode HTML entities
          fixedUrl = fixedUrl
            .replace(/&amp;#x2F;/g, '/')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          
          console.log(`Fixing episode: ${episode.title}`);
          console.log(`  Old: ${episode.odyseeUrl}`);
          console.log(`  New: ${fixedUrl}`);
          
          // Update the episode with the fixed URL
          await storage.updateEpisode(episode.id, { odyseeUrl: fixedUrl });
          console.log(`  ✓ Updated successfully\n`);
          fixedEpisodes++;
        }
      }
    }
    
    console.log(`Found ${totalEpisodes} episodes in database`);
    console.log(`Fixed ${fixedEpisodes} episodes with HTML-encoded URLs`);
    console.log("Episode URL fixing process completed!");
    
    // Verify the fixes
    console.log("\nVerifying fixes...");
    for (const content of allContent.filter(c => c.mediaType === 'tv').slice(0, 3)) {
      const episodes = await storage.getEpisodesByContentId(content.id);
      if (episodes.length > 0) {
        console.log(`\nContent: ${content.title}`);
        episodes.slice(0, 3).forEach(episode => {
          console.log(`  - Episode ${episode.seasonNumber}x${episode.episodeNumber}: ${episode.odyseeUrl}`);
        });
      }
    }
    
  } catch (error) {
    console.error("Error fixing episode URLs:", error);
    process.exit(1);
  }
}

// Run the fix
fixEpisodeUrls();