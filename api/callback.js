import querystring from 'querystring';
import cookie from 'cookie';
import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://hitster-4bci.vercel.app/api/callback';
const stateKey = 'spotify_auth_state';

export default async function handler(req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const cookies = cookie.parse(req.headers.cookie || '');
    const storedState = cookies[stateKey];

    if (!state || state !== storedState) {
        res.writeHead(302, { Location: '/#' + querystring.stringify({ error: 'state_mismatch' }) });
        res.end();
        return;
    }

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

    res.writeHead(302, {
        Location: '/#' + querystring.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token
        })
    });
    res.end();
}
