import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { createPost } from '../core/post';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
        showToast: '🛡️ Red-Guard moderation post created successfully!',
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create Red-Guard post. Ensure you have mod permissions.',
      },
      400
    );
  }
});

menu.post('/sentinel-status', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    return c.json<UiResponse>(
      {
        showToast: `🛡️ Sentinel v2.4 Active | Mod: ${username ?? 'u/Moderator'} | Community Protected`,
      },
      200
    );
  } catch {
    return c.json<UiResponse>(
      {
        showToast: '🛡️ Red Guardian AI Sentinel Active (Sensitivity: 85%)',
      },
      200
    );
  }
});
