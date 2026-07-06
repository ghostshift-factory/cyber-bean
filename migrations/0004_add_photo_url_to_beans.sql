-- Optional bean photo: stores the upload's public URL path (e.g. /uploads/<filename>).
-- Nullable — beans without a photo render a placeholder in the UI.
alter table beans add column photo_url varchar(500);
