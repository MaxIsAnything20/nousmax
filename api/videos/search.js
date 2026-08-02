// GET /api/videos/search?q=...  -> recommended videos via YouTube Data API (free key).
export default async function handler(req, res) {
    const q = (req.query?.q || "").toString().trim();
    if (!q) return res.status(400).json({ error: "missing q" });
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return res.status(200).json([]);

  const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8" +
        "&q=" + encodeURIComponent(q) + "&key=" + key;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "youtube search failed" });
    const data = await r.json();
    const items = (data.items || []).map((it) => ({
          id: it.id.videoId,
          title: it.snippet.title,
          channel: it.snippet.channelTitle,
          thumb: it.snippet.thumbnails?.medium?.url,
          duration: "",
    }));
    return res.status(200).json(items);
}
