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
	IS_CLOSE: (ui16) => (ui16 & 0x0800),
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

/*
* @description Maximun PING payload is 125 bytes according to WebSocket RFC 5.5.3
* @returns {Buffer}
*/
const pongResponse =  (flags, buffer) => {
	let base_response = Buffer.from([0x8, 0xA]);
	const len = FLAGS.PAYLOAD_SIZE(flags)

	if((len > 0)){
		let data;
		if(FLAGS.IS_MAKED(flags)){
			const _mask = buffer.subarray(2,6)
			data = buffer.subarray(6, 6 + len);

			mask_data(_mask, data);
		}else data = buffer.subarray(2, 2 + len)

		base_response = buffer.concat(base_response,  data) 
	}

	return base_response;
}

const getPayloadLenght = (flags, buffer) => {
	const i_size = FLAGS.PAYLOAD_SIZE(flags);
	const payload_padding = (FLAGS.IS_MASKED(flags)) ? 4:0;

	if(i_size <= 125) return i_size;
	else if(i_size === 126) return buffer.readUint16LE(2 + payload_padding);

	return buffer.readUint32LE(2 + payload_padding)
}

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

const mask_data = (mask, buffer) => {
	const len = buffer.byteLength;

	for(let i = 0; i < len; i++) 
		buffer[i] = (buffer[i] ^ mask[i % 4]);

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
		else server = https.createServer(opts)

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

	/**
	* @description
	* @pre RFC states Client payload has to always be masked
	*/
	const readData = (buffer) => {
		if(!Buffer.isBuffer(x) )  return console.error('unsupported read data type, is not Buffer');

		const flags = buffer.readUint16LE(0);
		if(FLAGS.IS_CLOSE(flags)) return (ClientEmitter.emit('close', socket));
		if(FLAGS.IS_PING(flags)) return socket.write(getPongData(flags, buffer));

		const payload_size = BigInt(getPayloadLength(flags, buffer));
		const payload_offset = (payload_size < 126) ? 6: (payload_size === 126) ? 8:10;
		const mask = buffer.subarray(payload_offset -4, payload_offset);
		const cur_data = mask_data(mask, buffer.subarray(payload_offset, payload_offet + payload_size));

		if(FLAGS.IS_CONTINUATION(flags))  prevData = (prevData) ? Buffer.concat(prevData, cur_data) : cur_data; 
		if(FLAGS.IS_FIN(flags)){

			ClientEmitter.emit('message', prevData || cur_data, getPayloadType(flags))
			prevData = null;
		}

		return;
	}
	const endConnection = () => {
		socket.write(buffer.from([0x88, 0x00]))
		socket.destroy()
	}


	const getPayloadType = (flags) => (FLAGS.IS_TEXT(flags)) ? 'text' : 'binary'



	return {
		onMessage: (fn) => ClientEmitter.on('message', fn),
		onClose: (fn) => ClientEmitter.on('close', fn),
		closeClient: () =>  endConnection(),
		getSocket: () => socket
	}


}
