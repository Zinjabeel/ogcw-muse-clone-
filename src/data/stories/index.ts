import type { Block } from "../content";
import { MUSIC_STORIES } from "./music";
import { GAMES_STORIES } from "./games";
import { STREAMING_STORIES } from "./streaming";
import { CULTURE_STORIES } from "./culture";

// The full text of every story, by slug, one file per section. A story is
// reported and written out in full: context, the details, what happens next,
// practical points where they help, and the questions readers ask, answered.
// `ask` is the yes/no question at the end ("Are you going?"); without it
// readers are asked whether the story helped.

export type StoryText = { body: Block[]; ask?: string };

export const STORY_BODIES: Record<string, StoryText> = { ...MUSIC_STORIES, ...GAMES_STORIES, ...STREAMING_STORIES, ...CULTURE_STORIES };
