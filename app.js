#!/usr/bin/env node

var 
	/* MODULES */
	// load promise module
	Promise = require('es6-promise').Promise
	// load config module
  , config = require('./config/config.js')
	// load database proxy module
  , dbProxy = require('./data/dbProxy.js')
	// load events module
  , events = require('events')
	// load irc proxy module
  , ircProxy = require('./irc/ircProxy.js')
	// load www proxy module
  , wwwProxy = require('./www/wwwProxy.js')
  
	/* INSTANCES */
  , db = new dbProxy(config)
  ;

// start by initializing databases
db.init()
	.then(function(chans) {
		// then launch the irc bot
		ircProxy(config, db);
		// and the http server		
		wwwProxy(config, db);
	})
	.catch(function(err) {
		config.debug && console.error(err);
	})
	;
	
