var /* MODULES */
	// socket.IO module
  , socketIO = require('socket.io')
	// load promise module
  , Promise = require('es6-promise').Promise
  
  , socketIOProxy = function socketIOProxy(config, db, app, server) {
		// check whenever a configuration has been passed
		if(!config) throw 'SOCKETIO proxy: no configuration found';
		if(!db) throw 'SOCKETIO proxy: instance of dbProxy not found';
		if(!app) throw 'SOCKETIO proxy: instance of express not found';
		if(!server) throw 'SOCKETIO proxy: instance of http server not found';
		
		var /* HANDLERS */
			handlers = {
				
			}
			/* VARIABLES */
			// track whenever the socket is connected
		  , connectionStatus = false
			/* INSTANCES */
		  , io = io = socketIO(server)
		  ;
		
		return io;
	}
  ;