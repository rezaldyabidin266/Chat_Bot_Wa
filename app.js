const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
//var qrcode = require('qrcode-terminal');
const { body, validationResult } = require('express-validator');
const socketIO = require("socket.io");
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid'); //random unique namefile
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    debug: true
}));

const SESSION_FILE_PATH = "./session.json";
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
})
const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ]
    },
    session: sessionCfg
});

//Ketika admin menerima pesan
client.on('message', async msg => {

    console.log(msg);
    //Catat pesan yang diterima ke file txt
    let messageValue = " ";
    let useFrom = " ";
    let formatMessage = " ";
    let typeMessage = " ";
    let deviceType = " ";
    let author = " ";

    messageValue = msg.body;
    useFrom = msg.from;
    typeMessage = msg.type;
    deviceType = msg.deviceType;
    author = msg.author;

    //Jika itu file(media)
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        let filename = "";
        let base64 = "";
        let mimeType = "";
        console.log(media);
        filename = media.filename;
        base64 = media.data;
        mimeType = media.mimetype;
        formatMessage = `User: ${useFrom} ,\nAuthor(): ${author} ,\nFileName: ${filename} ,\nMimeType: ${mimeType} ,\nType: ${typeMessage} ,\nDevice: ${deviceType} ,\n================\n`;

        //Log Activit txt
        fs.appendFile(`${ msg["id"].remote}_chat.txt`, formatMessage, function(err) {
            if (err) {
                return console.log(err);
            }
        });
        //media FileName diketahui
        if (media.filename == undefined) {
            fileNameUnique = uuidv4();;
            var mime = mimeType.split('/')[1];
            fs.writeFile(`folderMedia/${fileNameUnique}.${mime}`, base64, "base64", function(err) {
                console.log(err);
            });
        } else {
            fs.writeFile(`folderMedia/${media.filename}`, base64, "base64", function(err) {
                console.log(err);
            });
        }

    } else {
        formatMessage = `User: ${useFrom} ,\nAuthor: ${author} ,\nMessage: ${messageValue} ,\nType: ${typeMessage} ,\nDevice: ${deviceType} ,\n================\n`;
        fs.appendFile(`${ msg["id"].remote}_chat.txt`, formatMessage, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    if (msg.body == 'ping') {
        msg.reply('pong');
    }
});

//Ketika Admin mengerim pesan
client.on('message_create', async msg => {
    // Fired on all message creations, including your own
    console.log(msg);
    if (msg.fromMe) {
        //Catat pesan yang dikirm ke file txt
        let messageValue = " ";
        let useFrom = " ";
        let formatMessage = " ";
        let typeMessage = " ";
        let deviceType = " ";
        let author = " ";
        messageValue = msg.body;
        useFrom = msg.from;
        typeMessage = msg.type;
        deviceType = msg.deviceType;
        author = msg.author;

        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            let filename = "";
            let base64 = "";
            let mimeType = "";
            console.log(media)
            filename = media.filename;
            base64 = media.data;
            mimeType = media.mimetype;
            formatMessage = `User: ${useFrom} ,\nAuthor(): ${author} ,\nFileName: ${filename} ,\nMimeType: ${mimeType} ,\nType: ${typeMessage} ,\nDevice: ${deviceType} ,\n================\n`;

            //Log Activit txt
            fs.appendFile(`${ msg["id"].remote}_chat.txt`, formatMessage, function(err) {
                if (err) {
                    return console.log(err);
                }
            });


        } else {
            formatMessage = `User: ${useFrom} ,\nAuthor: ${author} ,\nMessage: ${messageValue} ,\nType: ${typeMessage} ,\nDevice: ${deviceType} ,\n================\n`;
            fs.appendFile(`${ msg["id"].remote}_chat.txt`, formatMessage, function(err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    }
});

//Ketika Wa di buka/ baru login
client.on('ready', async(rd) => {
    var get_chat = await client.getChats();
    // for (var i = 0; i < get_chat.length; i++) {
    //     // console.log(get_chat[i]["id"]);
    //     var id = get_chat[i]["id"]._serialized;

    //     let message = await get_chat[i].fetchMessages();
    //     let messageValue = " ";
    //     let useFrom = " ";
    //     let formatMessage = " ";
    //     Object.keys(message).forEach(function eachKey(key) {

    //         //Get Message per Key
    //         // console.log(message[key]);
    //         //Get Message per pesan
    //         // console.log(message[key]["_data"]["body"]);
    //         //Get from Message
    //         // console.log(message[key]["_data"]["from"].user);
    //         //Get to Message
    //         // console.log(message[key]["_data"]["to"].user);

    //         messageValue = message[key]["_data"]["body"];
    //         useFrom = message[key]["_data"]["from"].user;

    //         formatMessage = `${useFrom} = ${messageValue}\n`;
    //         var arrayMessage = [];
    //         arrayMessage.push(formatMessage);
    //         var arrayJoin = arrayMessage.join("");

    //         fs.appendFile(`${message[key]["id"].remote}_chat.txt`, arrayJoin, function(err) {
    //             if (err) {
    //                 return console.log(err);
    //             }
    //         });
    //     });
    // }
});

client.initialize();


//Socket Io
io.on('connection', (socket) => {
    socket.emit("message", "Hello from server");
    console.log("connected...");
    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit("qr", url);
            socket.emit("message", "Scan this code with your phone!");
        })
    });

    client.on('message', async msg => {
        if (msg.body == "data") {
            let chat = await msg.getChat();
            let ty = "";
            chat.fetchMessages().then(messages => {
                console.log(messages);
                messages.forEach(message => {
                    // chat.sendMessage(message.body);
                    socket.emit("messageBody", message.body);
                })
            }).catch(err => {
                console.log(err);
            });
        }
    });

    client.on('ready', () => {
        socket.emit("ready", "whatsapp ready");
        socket.emit("message", "Whatsapp is ready!");
    });

    client.on("authenticated", (session) => {
        socket.emit("authenticated", "authenticated");
        socket.emit("message", "Authenticated!");
        console.log("AUTHENTICATED", session);
        fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
            if (err) {
                console.log(err);
            }
        });
    })
});

const checkRegisteredNumber = async function(number) {
        const isRegistered = client.isRegisteredUser(number);
        return isRegistered;
    }
    // Send message
app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
], async(req, res) => {
    const errors = validationResult(req).formatWith(({
        msg
    }) => {
        return msg;
    });

    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
        return res.status(422).json({
            status: false,
            message: 'Number not registered'
        });
    }

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

// Send media
app.post('/send-media', async(req, res) => {
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;

    //dengan formUpload
    const file = req.files.file;
    const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);

    client.sendMessage(number, media, {
        caption: caption
    }).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

server.listen(8000, () => {
    console.log('App running on:' + 8000);
});