const pg = require("pg");
const express = require("express");
const dotenv = require("dotenv"); //Probramatically get env variables from .env file
const htmlparser2 = require("htmlparser2");
const fetch = require("node-fetch");
const urlParser = require('urlParser');


//GET ENVIRONMENT VARIABLES
dotenv.config();
const { DATABASE_URL, PORT, NODE_ENV } = process.env;


//SPIN UP EXPRESS
const app = express();

//PSQL CONNECTION SETTINGS
const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false, //Heroku-specific setting
});

//MIDDLEWARE
app.use(express.static('static')); //static routes
app.use(express.json()); //json parser


//---GET REQUEST----
app.get("/query/:qString", (req, res, next) => {
    const queryString = req.params.qString;
    const parsedUrl = urlParser(queryString);
    const host = parsedUrl[3];

    pool
        .query(`SELECT * FROM links WHERE url LIKE '${host}%'`)
        .then(data => {
            //CONFIRM TARGET IS IN DB AND RETURN
            if (data.rowCount > 0) {
                res.send(data.rows);
                return;
            } else if (data.rowCount === 0) {
                console.log("No Results in SERVER...")

                siteScraper(queryString).then((data) => {
                    //COLLECT LINKS, THEN ADD TO DB
                    let count = 0;
                    const links = [];
                    let linkTableInput = "";
                    let l2TableInput = "";
                    for (var i = 0; i < data.length; ++i) {
                        const { url, host, lastSeen } = data[i];

                        //DB TABLE
                        linkTableInput = linkTableInput +
                            `INSERT INTO links (url, host, lastSeen) VALUES ('${url}',
                            '${host}',
                            '${lastSeen}')
                            ON CONFLICT (url)
                            DO UPDATE SET lastSeen = '${lastSeen}';\n`;

                        //DB TABLE
                        l2TableInput = l2TableInput +
                            `INSERT INTO link_to_link (link_id, referred_by, time_collected)
                            SELECT (SELECT id FROM links WHERE url = '${url}'), 
                            (SELECT id FROM links WHERE url = '${queryString}'),
                            (SELECT lastSeen FROM links WHERE url = '${url}');\n`;

                    };


                    for (var i = 0; i < data.length; ++i) {
                        const { url, host, lastSeen } = data[i];


                    };

                    //INSERT TO links table
                    pool
                        .query(linkTableInput).then(data => {
                            pool.query(l2TableInput);

                        }).catch(err => {
                            console.error(err);
                        });
                    //INSERT TO link-to-link table
                    res.send(data);

                });
            }

        })
        .catch(e => console.error(e))




});

app.listen(PORT, () => {
    console.log("listening on PORT " + PORT);
})


async function siteScraper(queryString) {
    result = await scrapeWebsite(queryString);
    return result;
};
async function scrapeWebsite(queryURL) {
    const webSite = queryURL;

    const urlInfo = urlParser(queryURL);
    const seenLinks = {};
    const sites = [];
    let queryCompleted = false;

    console.log(`Scraping ${queryURL} `);
    const result = await fetch(queryURL)
        .then(res => {
            //console.log(res.headers.raw()); 
            //queryURL = res.headers.get('server');
            return (res.text());
        })
        .then(body => {
            // const html = body;
            let link = '';
            const date = new Date(Date.now());

            const parser = new htmlparser2.Parser({
                onattribute(name, value) {
                    if (name === "href") {
                        link = normalizeLink(queryURL, value);
                        const host = urlParser(link);
                        if (!seenLinks[link]) {
                            seenLinks[link] = link;
                            sites.push({ url: link, host: host[3], referred_by: queryURL, lastSeen: date.toUTCString() });
                        }

                    }
                },
            });

            return parser.write(body);
        }).then(data => {
            queryCompleted = true;
            console.log("Processing!");
            return sites;
        })
        .catch(err => {
            console.log('No articles available at this time. Try again later');
            console.log(err);
        });

    return sites;
}


function normalizeLink(domain, url) {
    if (url.startsWith('http')) {
        return url;
    } else if (url.startsWith('https')) {
        return url;
    } else if (url.startsWith('www')) {
        return url;
    } else if (url.startsWith('//')) {
        //return url.slice(2);
        return "https:" + url;
    } else if (url.startsWith('/')) {
        return domain + url;
    } else {
        // console.log(count + "-->" + queryURL + url);
        return domain;
    }


    //console.log(count, "-->", url);

    // seenLinks[url] = true;
};

// const parser = new htmlparser2.Parser({
//     onattribute(name /*: string */, value /*: string */) {
//         if (name === "href") {
//             collectLink(value);
//         }
//     },
// });


/// - - - DATABASE SEARCH
function dbSearch() {
    const userInput = "tesla";
    const url = urlParser(queryURL);
    let seenLinks = {};

    //HTTP GET REQUEST
    fetch(queryURL)
        .then(res => {
            //console.log(res.headers.raw());
            //queryURL = res.headers.get('server');
            return (res.text());
        })
        .then(body => {
            // const html = body;
            parser.write(body);
        })
        .then(() => console.log(parser.seenLinks))
        .catch(err => {
            console.log('No articles available at this time. Try again later');
            console.log(err);
        });
};

//console.log(scrapeWebsite);



// fetch('https://github.com/')
//     .then(res => res.text())
//     .then(body => console.log(body))