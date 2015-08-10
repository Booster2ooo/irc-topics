var /* MODULES */
	// socket.IO module
	socketIO = require('socket.io')
	// load promise module
  , Promise = require('es6-promise').Promise
  
  , socketIOProxy = function socketIOProxy(config, db, www) {
		// check whenever a configuration has been passed
		if(!config) throw 'SOCKETIO proxy: no configuration found';
		if(!db) throw 'SOCKETIO proxy: instance of dbProxy not found';
		if(!www) throw 'SOCKETIO proxy: instance of www not found';
		
		var /* HANDLERS */
			handlers = {
				// socket connected handler
				onConnectionHanlder: function onConnectionHanlder(socket) {
					config.debug && console.log('socket IO client connected');
					connectionStatus = true;
					clienthandlers.bindSelectChannel(socket);
				}
				// when an entity has been inserted in the db
			  , onEntityInserted: function (entity, options) {
					www.renderer(options.type+'_entity', { entity: entity })
						.then(function(view) {
							io.in(options.channel).emit(
								'new_data'
							  , {
									channel: options.channel
								  , type: options.type
								  , view: view
								}
							);
						})
						.catch(function(err) {
							config.debug && console.error(err);
						});
				}

			}
		  , clienthandlers = {
				bindSelectChannel: function bindSelectChannel(socket) {
					socket.on('selectChannel', function(packet) {
						if(packet.channel) {
							var topicRenderPromise =  new Promise(function(resolve, reject) {
									db.getAll({ 
										channel: packet.channel
									  , type: 'topics'
									  , sort: { name: 1 }
									})
									.then(function(docs) {
										return www.renderer('topics' , { channel: packet.channel, topics: docs});
									})
									.then(function(html) {
										resolve(html);
									})
									.catch(function (err) {
										reject(err);
									});
								})
							  , messagesRenderPromise =  new Promise(function(resolve, reject) {
									db.getAll({ 
										channel: packet.channel
									  , type: 'messages'
									  , sort: { timestamp: 1 }
									})
									.then(function(docs) {
										return www.renderer('messages' , { channel: packet.channel, messages: docs});
									})
									.then(function(html) {
										resolve(html);
									})
									.catch(function (err) {
										reject(err);
									});
								})
							  , joined = false
							  , topicsView
							  , messagesView
							  ;
							
							socket.rooms.forEach(function(room) {
								if(room === packet.channel) {
									joined = true;
								}
								else if(room.length && room[0] == '#') {
									socket.leave(room);
								}
							});
							if(!joined) {
								socket.join(packet.channel);							
								socket.emit('joined', {
									channel: packet.channel
								});
								Promise.all([topicRenderPromise, messagesRenderPromise])
									.then(function(views) {
										topicsView = views[0] || [];
										messagesView = views[1] || [];
										// seems to be trigger to times on the client side ? oO [review]
										socket.emit('load_data', {
											channel: packet.channel
										  , type: 'topics'
										  , view: topicsView
										});
										socket.emit('load_data', {
											channel: packet.channel
										  , type: 'messages'
										  , view: messagesView
										});
									})
									.catch(function(err) {
										config.debug && console.error(err);
									});
							}
						}
					});
				}
			  , bindSelectTopic: function bindSelectChannel(socket) {
				  
				}
			}
			/* FUNCTIONS */
			// create a socketIO channel for each IRC channel
		  , joinChannels = function joinChannels(socket) {
				config.irc.options.channels.forEach(function(channel) {
					config.debug && console.log('socket IO client joined ' + channel);
					socket.join(channel);
				});
			}
			// emit data received from IRC to the HTTP client
		  , dataEmitter = function dataEmitter() {
				db.onInsert(handlers.onEntityInserted);
			}
			/* VARIABLES */
			// track whenever the socket is connected
		  , connectionStatus = false
			/* INSTANCES */
		  , io = socketIO(www.server)
		  ;
		io.on('connection', handlers.onConnectionHanlder);		
		dataEmitter();
		return io;
	}
  ;
  
module.exports = socketIOProxy;