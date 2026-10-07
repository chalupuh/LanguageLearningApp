# YouTube Studio: paused

Studio is not a functioning video-transcription pipeline. Its endpoint scraped
`ytInitialPlayerResponse` from watch-page HTML, then fetched signed caption URLs.
Missing/blocked/player-format responses and caption fetch failures were collapsed
into one fallback; failed results were persisted and skipped on draft restoration.
No audio extraction or speech-to-text fallback exists for YouTube videos.

The official captions.download API requires permission to edit the video:
https://developers.google.com/youtube/v3/docs/captions/download
An OpenAI key alone does not provide a video's audio or captions.

Containment: navigation and promotions removed, old routes show a pause notice,
caption endpoint returns authenticated 503/STUDIO_PAUSED without upstream calls,
unfinished Studio drafts are hidden (not deleted). Saved phrases and XP remain.

Before re-enabling:
- Choose a supported, authorized source of timed captions/audio. Evaluate real
  hosted success rates before adopting a third-party provider or paid service.
- Distinguish unavailable videos, missing target-language tracks, upstream blocks,
  empty responses, timeouts, and authentication errors; provide explicit retry.
- Do not persist failed fetches as permanently restored transcripts.
- Verify French and Swedish captioned videos, no-caption videos, removed videos,
  clip-aligned transcripts, switching videos, reload, and cross-device recovery.
- Only claim video transcription after a real audio-input pipeline is implemented
  and verified. User-supplied authorized audio/subtitles are a separate scope.

Do not flip the availability flag until hosted end-to-end checks pass.
