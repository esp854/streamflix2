import 'dotenv/config';
import { db } from './db';
import { content, episodes } from '@shared/schema';
import { isNull, or, eq } from 'drizzle-orm';

async function updateVideoUrls() {
  console.log('Starting update of video URLs for existing content...');

  const placeholderOdyseeUrl = 'https://zupload.co/d/NjY3MzI';
  const placeholderMuxPlaybackId = 'placeholder-mux-id';
  const placeholderMuxUrl = 'https://stream.mux.com/placeholder-mux-id.m3u8';

  try {
    // Update content table
    const updatedContent = await db.update(content)
      .set({
        odyseeUrl: placeholderOdyseeUrl,
        muxPlaybackId: placeholderMuxPlaybackId,
        muxUrl: placeholderMuxUrl,
        updatedAt: new Date(),
      })
      .returning({ id: content.id, title: content.title });

    console.log(`Updated ${updatedContent.length} content items in 'content' table.`);
    updatedContent.forEach(item => console.log(`  - Content ID: ${item.id}, Title: ${item.title}`));

    // Update episodes table
    const updatedEpisodes = await db.update(episodes)
      .set({
        odyseeUrl: placeholderOdyseeUrl,
        muxPlaybackId: placeholderMuxPlaybackId,
        muxUrl: placeholderMuxUrl,
        updatedAt: new Date(),
      })
      .returning({ id: episodes.id, title: episodes.title });

    console.log(`Updated ${updatedEpisodes.length} episode items in 'episodes' table.`);
    updatedEpisodes.forEach(item => console.log(`  - Episode ID: ${item.id}, Title: ${item.title}`));

    console.log('Video URL update completed successfully!');
  } catch (error) {
    console.error('Error updating video URLs:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateVideoUrls();