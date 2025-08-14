import querystring from 'querystring';
import { config } from 'dotenv';
import cookie from 'cookie';

config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'https://hitster-4bci.vercel.app/api/callback';
const stateKey = 'spotify_auth_state';

function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export default function handler(req, res) {
    const state = generateRandomString(16);

    res.setHeader('Set-Cookie', cookie.serialize(stateKey, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600,
        path: '/'
    }));

    const scope = 'streaming user-read-email user-read-private user-modify-playback-state';
    const authQueryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
        state
    });

    res.writeHead(302, {
        Location: `https://accounts.spotify.com/authorize?${authQueryParams}`
    });
    res.end();
}
