--garage database
DROP TABLE IF EXISTS link_to_link;
DROP TABLE IF EXISTS links;

CREATE TABLE links (
   id SERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    host TEXT,
    lastSeen TIMESTAMPTZ
);

CREATE TABLE link_to_link (
    id serial PRIMARY KEY,
    link_id INTEGER,
    referred_by INTEGER,
    time_collected TIMESTAMPTZ,
    FOREIGN KEY (link_id) REFERENCES links (id) ON DELETE CASCADE,
    FOREIGN KEY (referred_by) REFERENCES links (id) ON DELETE CASCADE
);


INSERT INTO link_to_link (link_id, referred_by, time_collected)
SELECT (SELECT id FROM links WHERE url = 'https://miami.craigslist.org#'), 
(SELECT id FROM links WHERE url = 'https://miami.craigslist.org'),
(SELECT lastSeen FROM links WHERE url = 'https://miami.craigslist.org#');

SELECT url, time_collected 
FROM link_to_link 
INNER JOIN links ON links.id = link_to_link.link_id
WHERE link_id = 
(SELECT id FROM links WHERE url = 'http://miami.craigslist.org#');