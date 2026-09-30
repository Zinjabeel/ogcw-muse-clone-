// Links and image URLs for outside media, shared by the content library and
// the story files (src/data/stories).

export const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const spotifyTrack = (id: string) => `https://open.spotify.com/track/${id}`;
