ALTER TABLE published_article_projections
ADD COLUMN video_availability TEXT NOT NULL DEFAULT 'ready'
CHECK (video_availability IN ('pending', 'ready'));

UPDATE published_article_projections
SET video_availability = 'pending'
WHERE article_id IN (
  SELECT a.id
  FROM articles a
  JOIN youtube_videos y ON y.id = a.source_video_id
  WHERE y.import_state <> 'imported'
);
