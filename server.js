import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
config(); // Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
console.log('CLIENT_ID:', CLIENT_ID);
console.log('CLIENT_SECRET:', CLIENT_SECRET);
const REDIRECT_URI = 'http://localhost:3000/callback';

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const songMap = {
    "A1": "spotify:track:7ouMYWpwJ422jRcDASZB7P",
    "A2": "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp"
};

const stateKey = 'spotify_auth_state';

function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Login endpoint
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    const scope = 'streaming user-read-email user-read-private user-modify-playback-state';
    const authQueryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
        state
    });

    res.redirect(`https://accounts.spotify.com/authorize?${authQueryParams}`);
});

// Callback endpoint
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    } else {
        res.clearCookie(stateKey);

        const authOptions = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        };

        const tokenRes = await fetch('https://accounts.spotify.com/api/token', authOptions);
        const tokenData = await tokenRes.json();

        res.redirect('/#' +
            querystring.stringify({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token
            })
        );
    }
});

// Song lookup API
app.get('/song/:id', (req, res) => {
    const songId = req.params.id;
    const uri = songMap[songId];
    if (!uri) return res.status(404).json({ error: 'Not found' });
    res.json({ uri });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
