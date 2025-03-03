import http from 'node:http'
import https from 'node:https'
import crypto from 'node:crypto'
import EventEmitter from 'node:events'








/*
* @description FLAG Values are takes as first 16 bits are read as Uint16BE
* We assume data is encoded in UTF-8, since that. we do not care about the byte order of Mask and payload.
* https://datatracker.ietf.org/doc/html/rfc6455#section-5
*/
const FLAGS = {
	IS_FIN: (ui16) => (ui16 & 0x8000),
	IS_CLOSE: (ui16) => (ui16 & 0x4000),
	IS_MASKED: (ui16) => (ui16 & 0x0080),
	IS_CONTINUATION: (ui16) => ((ui16 ^ 0x0F00) == 0),
	IS_TEXT: (ui16) => ((ui16 & (0x0100)) == 0x0100),
	IS_BINARY: (ui16) => ((ui16 & (0x0200)) == 0x0200),
 	IS_PING: (ui16) => ((ui16 & (0x0900)) == 0x0900),
	IS_PONG: (ui16) => ((ui16  & (0x0A00)) == 0x0A00),
	PAYLOAD_SIZE: (ui16) => (ui16 & MSG_BIG),
	PAYLOAD_MEDIUM:  0x7E,
	PAYLOAD_BIG: 0x7F
}

const pongResponse =  () => null;

/**
*	@returns {boolean}
*/
const upgradeSocket = (request) => {
	const ws_hash = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	const ws_key = req.header['sec-websocket-key'];

	if(!ws_key){
		socket.destroy();
		return false;
	}

	const ws_accept_header = crypto.createHash("sha1").update(ws_key + ws_hash).digest("base64");
	socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
		'Upgrade: websocket\r\n' +
		'Connection: Upgrade\r\n' +
		'Sec-WebSocket-Accept: ' + ws_accept_header + '\r\n',
		'Sec-Protocol-Version: 13 \r\n' +
		'\r\n'
	);
}

/**
* @description Mutates the original Buffer, unmasking the data
* @param {Uint8Array | Buffer} mask
* @param {Buffer} buffer
* @param {number} msglen
* @returns {void}
*/
const unmask_buffer = (mask, buffer, msglen) => {
	const offset = (msglen < 126) ? 6:(msglen == 126) ? 8:12

	for(let i = 0; i < msglen; i++){
		buffer[offset + i] = (buffer[offset + i] ^  mask[i % 4])
	}

}

/**
* @typedef {Object} WSSocket
* @property {tls.TlsSocket | net.Socket} socket
* @property {}
*/

/**
* @param  {http.Server | https.Server} server
* @param  {Object} opts
*/
export function WSServer(server=null, opts={port:80, keyPath:'', cert:'', ...othersOpts}){
	const ServerEmitter = new EventEmitter();


	if(!server) {
		if((!('keyPath' in opts) || !opts.keyPath) || (!('cert' in opts) || !opts.cert)) server = http.createServer(opts);
		server = https.createServer(opts)

		server.listen(opts.port);
	}

	const clients = new Map();

	server.on('upgrade', (req, socket, head) => {
		if(!upgradeSocket(req)) return;

		clients.set(socket, new WSClient(socket));

		ServerEmitter.emit('connection', socket, req);
	})



	return {
		getClients: () => clients,
		onConnection: (fn) => ServerEmitter.on('connection', fn),
		removeOnConnection: fn => ServerEmitter.removeListener('connection', fn)
	}
}


function WSClient(socket){
	const ClientEmitter = new EventEmitter();

	let prevData = []


	socket.on('data', buff => {


	})


	const readData = (buffer) => {
		if(!Buffer.isBuffer(x) )  return console.error('unsupported read data type, is not Buffer');

		const headers = buffer.readUint16BE(0)
		if(flags.IS_CLOSE(headers)) return (ClientEmitter.emit('close', socket))
	}



	return {
		onMessage: () => {},
		onClose: () => {}

	}


}
