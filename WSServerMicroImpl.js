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
	IS_FIN: (ui16) => (ui16 &(0x1 << 15)),
	IS_CLOSE: (ui16) => (ui16 &(0x4 << 8)),
	IS_MASKED: (ui16) => (ui16 &(0x1 << 7)),
	IS_CONTINUATION: (ui16) => ((ui16 ^ (0xF << 8)) == 0),
	IS_TEXT: (ui16) => ((ui16 & (0x1 << 8)) == (0x1 << 8)),
	IS_BINARY: (ui16) => ((ui16 & (0x2 << 8)) == (0x2 << 8)),
 	IS_PING: (ui16) => ((ui16 & (0x9 << 8)) == (0x9 << 8)),
	IS_PONG: (ui16) => ((ui16  & (0xA << 8)) == (0xA << 8)),
	PAYLOAD_SIZE: (ui16) => (ui16 & MSG_BIG),
	PAYLOAD_MEDIUM:  0x7E,
	PAYLOAD_BIG: 0x7F
}

const pongResponse: () => 0x8

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
* @param  {} server
* @param
*/
export function WSServer(server=null, opts={port: 80, keyPath: '', certPath: '' }){
	const ServerEmitter = new EventEmitter();


	if(!server) {

	}

	const Clients = new Map();

	server.on('upgrade', (req, socket, head) => {
		if(!upgradeSocket(socket)) return;
		client.add(socket, )

	})



	return {
		getClients: () => Clients;
		onConnection: (fn) => 
	}
}


function WSClient(socket){
	const emitter =  new 


	return {
		onMessage: () => {}
		onClose: () => {}

	}


}
