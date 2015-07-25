#!/usr/bin/env node

var 
	/* MODULES */
	// load promise module
	Promise = require('es6-promise').Promise
	// load config module
  , config = require('./config.js')
	// load database proxy module
  , dbProxy = require('./dbProxy.js')
	// load events module
  , events = require('events')
  
	/* INSTANCES */
  , db = new dbProxy(config)
  ;

db.onLoaded(function(chans) {
	console.log('event fired');
	var p = db.append('#testbot', 'users',{ name: 'Booster', tracked: true});
	p.then(function(res) {
		console.log(res);
	}).catch(function(err) {
		console.log(err);
	});
});