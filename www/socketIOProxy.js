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
					clienthandlers
						.bindOnError(socket)
						.bindSelectChannel(socket)
						.bindSelectTopic(socket)
						.bindAddMessageToTopic(socket)
						.bindAddTopic(socket)
						;
				}
				// when an entity has been inserted in the db
			  , onEntityInserted: function (entity, options) {
					if(options.type !== 'users' && options.type !== 'regexp' ) {
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

			}
		  , clienthandlers = {
				bindOnError: function bindOnError(socket) {
					socket.on('error', function(err) {
						config.debug && console.error(err);
					});
					return clienthandlers;
				}
			  , bindSelectChannel: function bindSelectChannel(socket) {
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
									  , sort: { timestamp: -1 }
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
							if(!joined || packet.force) {
								socket.join(packet.channel);							
								socket.emit('joined', {
									channel: packet.channel
								});
								Promise.all([topicRenderPromise, messagesRenderPromise])
									.then(function(views) {
										topicsView = views[0] || '';
										messagesView = views[1] || '';
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
					return clienthandlers;
				}
			  , bindSelectTopic: function bindSelectTopic(socket) {
					socket.on('selectTopic', function(packet) {
						if(packet.channel && packet.topic) {
							var messagesRenderPromise =  new Promise(function(resolve, reject) {
									db.get({
										channel: packet.channel
									  , type: 'topics'
									  , query: { _id: packet.topic }
									})
									.then(function(topic) {
										if(!topic) throw 'topic not found';
										return db.getAll({ 
											channel: packet.channel
										  , type: 'messages'
										  , query: { _id: { $in: topic.messages } }
										  , sort: { timestamp: -1 }
										});
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
							  , messagesView
							  ;
							
							messagesRenderPromise
								.then(function(view) {
									messagesView = view || '';
									socket.emit('load_data', {
										channel: packet.channel
									  , type: 'messages'
									  , view: view
									});
								})
								.catch(function(err) {
									config.debug && console.error(err);
								});
						}
					});
					return clienthandlers;
				}
			  , bindAddMessageToTopic: function bindSelectTopic(socket) {
					socket.on('addMessageToTopic', function(packet) {
						if(packet.channel && packet.topic && packet.messages && packet.messages.length) {							
							db.get({
								channel: packet.channel
							  , type: 'topics'
							  , query: { _id: packet.topic }
							})
							.then(function(topic) {
								if(!topic) throw 'topic not found';
								if(!topic.messages) {
									topic.messages = [];
								}
								packet.messages.forEach(function(message){
									if(!topic.messages.length || topic.messages.indexOf(message) == -1) {
										topic.messages.push(message);
									}
								});
								return db.append({ 
									channel: packet.channel
								  , type: 'topics'
								  , entity: topic
								});
							})	
							.then(function(html) {
								config.debug && console.log('new message added to topic');
							})
							.catch(function (err) {
								config.debug && console.error(err);
							});
						}
					});
					return clienthandlers;
				}
			  , bindAddTopic: function bindAddTopic(socket) {
					socket.on('addTopic', function(packet) {
						if(packet.channel && packet.topic && packet.topic.name) {
							packet.topic.messages = [];
							db.get({
								channel: packet.channel
							  , type: 'topics'
							  , query: { name: packet.topic.name }
							})
							.then(function(topic) {
								if(topic) throw 'topic already exists';
								return db.append({ 
									channel: packet.channel
								  , type: 'topics'
								  , entity: packet.topic
								});
							})	
							.then(function(html) {
								config.debug && console.log('new topic added');
							})
							.catch(function (err) {
								config.debug && console.error(err);
							});
						}
					});
					return clienthandlers;
				}
			}
			/* FUNCTIONS */
			// create a socketIO channel for each IRC channel
		/*  , joinChannels = function joinChannels(socket) {
				config.irc.options.channels.forEach(function(channel) {
					config.debug && console.log('socket IO client joined ' + channel);
					socket.join(channel);
				});
			}
		*/
			// emit data received from IRC to the HTTP client
		  , dataEmitter = function dataEmitter() {
				db.onInsert(handlers.onEntityInserted);
			}
			/* INSTANCES */
		  , io = socketIO(www.server)
		  ;
		io.on('connection', handlers.onConnectionHanlder);		
		dataEmitter();
		return io;
	}
  ;
  
module.exports = socketIOProxy;