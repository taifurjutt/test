const {
    default: sockConnect,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    jidNormalizedUser
} = require('@adiwajshing/baileys')
const {
    upload
} = require('./maga')
var fs = require('fs')
const pino = require('pino')
var auth_path = './auth_info_baileys/'
async function start() {
    var {
        version
    } = await fetchLatestBaileysVersion()
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(auth_path)

    try {
        const sock = sockConnect({
            logger: pino({
                level: 'silent'
            }),
            printQRInTerminal: true,
            browser: ['Bot-MD', 'safari', '3.3'],
            auth: state,
            version
        })
        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update) => {
            const {
                connection
            } = update
            if (connection === 'close') {
                start()
            }
            if (update.qr) {
                qr_code = update.qr
            }

            if (connection === 'open') {
                qr_code = ''
                const user_jid = jidNormalizedUser(sock.user.id);
                const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${user_jid}.json`);
                const string_session = mega_url.replace('https://mega.nz/file/', '')
                await sock.sendMessage(user_jid, {
                    text: string_session
                });
                fs.rmSync(auth_path, {
                    recursive: true,
                    force: true
                })
                start()
            }
            process.exit(0)
        })
    } catch {
        start()
    }
}

start()
