// Implementation of the VBAN protocol
// https://www.vb-audio.com/Voicemeeter/VBANProtocol_Specifications.pdf

const SR = [
    6000, 12000, 24000, 48000, 96000, 192000, 384000,
    8000, 16000, 32000, 64000, 128000, 256000, 512000,
    11025, 22050, 44100, 88200, 176400, 352800, 705600
];

/**
 * Extract audio data from 28 byte packet header
 * @param {Buffer} headerBuffer
 * @return {Object}
 */
function proccessHeader(headerBuffer) {
    const headers = {};
    if (headerBuffer.toString("ascii", 0, 4) != "VBAN") {
        throw new Error("Invalid Header");
    }

    // SR / Sub protocol (5 + 3 bits)
    const srsp = headerBuffer.readUInt8(4);
    const srIndex = srsp & 0x1F; // 5 Bits
    const sp = srsp >> 5; // 3 bits

    headers["sr"] = SR[srIndex];
    headers["sp"] = (sp * 2) << 4;
    if (headers["sp"] != 0) {
        //throw new Error("Non audio packet");
    }

    // Samples per frame (8 bits)
    headers["nbSample"] = headerBuffer.readUInt8(5) + 1;

    // Channels (8 bits)
    headers["nbChannel"] = headerBuffer.readUInt8(6) + 1;

    // Data Format / Codec (3 + 1 + 4 bits)
    const dfcodec = headerBuffer.readUInt8(7);
    headers["formatIndex"] = dfcodec & 3; // 3 bits
    // Ignore 1 bit
    headers["codec"] = (dfcodec >> 4) << 4; // 4 bits

    // Stream Name (16 bytes)
    headers["streamName"] = headerBuffer.toString("ascii", 8, 22);

    // Frame Counter (32 bits)
    headers["frameCounter"] = headerBuffer.readUInt32LE(21);

    return headers;
}

/**
 * Split a packet into header and audio data
 * @param {Buffer} packet VBAN packet
 * @return {Object} The header and audio from the packet
 */
function proccessPacket(packet) {
    const header = proccessHeader(packet.slice(0, 28));
    const audio = packet.slice(28);

    return {
        header,
        audio
    };
}

module.exports = {
    proccessPacket
};
