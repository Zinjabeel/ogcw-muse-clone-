import { getSupabase } from "./supabase";

// Readers rate stories from 1 to 5 stars (the end of every story). Ratings are
// kept in Supabase (rate_story / story_rating_totals); one per logged-in
// account, or else one per browser, under a random id kept in this browser.
// The site shows a story's average once enough readers have rated it
// (src/lib/stories.tsx). Nothing here is ever made up.

const VOTER_KEY = "ogcw-voter";
const RATED_KEY = "ogcw-rated";

function voterId() {
  try {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  } catch {
    // storage blocked: a one-off id, so the rating still counts once
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
}

/** The rating this browser gave a story, if any */
export function myRating(slug: string): number | null {
  try {
    const all = JSON.parse(localStorage.getItem(RATED_KEY) ?? "{}") as Record<string, number>;
    return typeof all[slug] === "number" ? all[slug] : null;
  } catch {
    return null;
  }
}

/** Rate a story (again, to change it) */
export async function rateStory(slug: string, stars: number) {
  const { error } = await getSupabase().rpc("rate_story", { p_slug: slug, p_stars: stars, p_voter: voterId() });
  if (error) throw new Error("Your rating didn’t go through. Try again.");
  try {
    const all = JSON.parse(localStorage.getItem(RATED_KEY) ?? "{}") as Record<string, number>;
    localStorage.setItem(RATED_KEY, JSON.stringify({ ...all, [slug]: stars }));
  } catch {
    // storage blocked: the rating still counts, this browser just won't remember it
  }
}
