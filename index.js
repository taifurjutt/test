const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { generateQR, qrCodeToString } = require('qrcode-terminal');
const fs = require('fs');

// Path to store authentication state
const authFilePath = './auth_info.json';
const { state, saveState } = useSingleFileAuthState(authFilePath);

async function connectToWhatsApp() {
    const socket = makeWASocket({
        auth: state,
    });

    socket.ev.on('creds.update', saveState);

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            generateQR(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            // Reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Successfully connected to WhatsApp');
            sendCredentialsAsBase64();
        }
    });
}

function sendCredentialsAsBase64() {
    const credentials = fs.readFileSync(authFilePath);
    const base64Credentials = Buffer.from(credentials).toString('base64');
    console.log('Base64 Credentials:', base64Credentials);
}

connectToWhatsApp();
