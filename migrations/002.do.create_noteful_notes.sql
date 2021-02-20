CREATE TABLE noteful_notes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT,
    name TEXT NOT NULL,
    modified TIMESTAMPTZ DEFAULT now() NOT NULL,
    folderId REFERENCES noteful_folders(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL
);