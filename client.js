const dgram = require("dgram");
const Speaker = require("speaker");
const vban = require("./vban");

const server = dgram.createSocket("udp4");

let currentConfig = {};

let speaker = null;

server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    const data = vban.proccessPacket(msg);
    let configMatch = true;
    Object.keys(currentConfig).forEach((element) => {
        if (element === "frameCounter") return;
        configMatch = configMatch &&
            currentConfig[element] === data.header[element];
    });
    if (!speaker || !configMatch) {
        speaker = new Speaker(headerToSpeakerConfig(data.header));
        currentConfig = data.header;
    }

    // Check for audio frame
    if (data.header.sp == 0) {
        // Output audio
        speaker.write(data.audio);
    }
});

server.on("listening", () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(6980);
// Prints: server listening 0.0.0.0:41234

/**
 * Convert VBAN Header to node-speaker config
 * @param {Object} header
 * @return {Object}
 */
function headerToSpeakerConfig(header) {
    const opts = {};
    opts.channels = header.nbChannel;
    opts.bitDepth = header.bitDepth;
    opts.sampleRate = header.sr;
    opts.signed = header.signed;
    opts.float = header.float;
    opts.samplesPerFrame = header.nbSample;

    return opts;
}
