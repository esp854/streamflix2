import { config } from "dotenv";
import { frembedService } from "./services/frembed-service";

// Load environment variables
config();

async function testFrembedService() {
  console.log("Testing Frembed Service...");
  
  // Check if service is configured
  if (!frembedService.isConfigured()) {
    console.log("Frembed service is not configured. Please set FREMbed_API_KEY in your .env file.");
    return;
  }
  
  console.log("Frembed service is configured.");
  
  try {
    // Test movie sources
    console.log("\nTesting movie sources for TMDB ID 680 (Pulp Fiction)...");
    const movieSources = await frembedService.getMovieSources(680);
    console.log("Movie sources:", movieSources);
    
    // Test TV show episode sources
    console.log("\nTesting TV episode sources for TMDB ID 1396 (Breaking Bad), Season 1, Episode 1...");
    const episodeSources = await frembedService.getEpisodeSources(1396, 1, 1);
    console.log("Episode sources:", episodeSources);
    
  } catch (error) {
    console.error("Error testing Frembed service:", error);
  }
}

// Run the test
testFrembedService();