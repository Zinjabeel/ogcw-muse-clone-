import type { Block } from "../content";
import { MUSIC_STORIES } from "./music";
import { GAMES_STORIES } from "./games";
import { STREAMING_STORIES } from "./streaming";
import { CULTURE_STORIES } from "./culture";
import { MUSIC_STORIES_2 } from "./music-2";
import { GAMES_STORIES_2 } from "./games-2";
import { STREAMING_STORIES_2 } from "./streaming-2";
import { CULTURE_STORIES_2 } from "./culture-2";

// The full text of every story, by slug, one file per section (the "-2"
// files hold the stories from the last week of September 2026). A story is
// reported and written out in full: context, the details, what happens next,
// practical points where they help, and the questions readers ask, answered.
// `ask` is the yes/no question at the end ("Are you going?"); without it
// readers are asked whether the story helped.

export type StoryText = { body: Block[]; ask?: string };

export const STORY_BODIES: Record<string, StoryText> = {
  ...MUSIC_STORIES, ...GAMES_STORIES, ...STREAMING_STORIES, ...CULTURE_STORIES,
  ...MUSIC_STORIES_2, ...GAMES_STORIES_2, ...STREAMING_STORIES_2, ...CULTURE_STORIES_2,
};
