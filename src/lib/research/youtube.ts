// YouTube Data API research — find interviews/podcasts + transcripts
// Uses YouTube Data API v3 (YOUTUBE_API_KEY required) + timedtext captions

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
  duration?: string;
}

export interface VideoTranscript {
  videoId: string;
  title: string;
  transcript: string;
  url: string;
}

// Search YouTube for interviews/podcasts featuring the persona
export async function searchYouTubeInterviews(
  name: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.log("YOUTUBE_API_KEY not set — skipping YouTube research");
    return [];
  }

  const query = encodeURIComponent(`${name} interview podcast`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=${maxResults}&order=relevance&type=video&videoDuration=long&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error("YouTube search failed:", res.status);
      return [];
    }
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (e) {
    console.error("YouTube search error:", e);
    return [];
  }
}

// Fetch transcript for a video using the public timedtext endpoint
// Note: this uses an unofficial approach (public caption tracks)
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  try {
    // Try the timedtext API (works for public auto-captions)
    const url = `https://video.google.com/timedtext?v=${videoId}&lang=en&fmt=srv3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.length < 100) return null;

    // Extract text content from XML/JSON3 format
    // Simple regex-based extraction (no need for full XML parser)
    const matches = text.match(/<text[^>]*>([^<]+)<\/text>/g) || [];
    const transcript = matches
      .map((m) => m.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return transcript.slice(0, 10000); // Cap at 10k chars per video
  } catch (e) {
    console.error("Transcript fetch failed:", e);
    return null;
  }
}

// Fetch transcripts for top N videos
export async function researchYouTube(
  name: string,
  maxVideos: number = 3
): Promise<VideoTranscript[]> {
  const videos = await searchYouTubeInterviews(name, maxVideos);
  const transcripts: VideoTranscript[] = [];

  for (const video of videos) {
    const transcript = await getVideoTranscript(video.id);
    if (transcript && transcript.length > 500) {
      transcripts.push({
        videoId: video.id,
        title: video.title,
        transcript,
        url: video.url,
      });
    }
  }

  return transcripts;
}
