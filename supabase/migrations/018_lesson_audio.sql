-- Some Kajabi lessons are audio-only (an mp3 recording, no video). Rather than
-- overload drive_file_id with two meanings, audio gets its own column so a
-- lesson's media kind is unambiguous from its row.
alter table lessons add column if not exists audio_file_id text;
