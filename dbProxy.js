#!/usr/bin/env node

// Database proxy
var dbProxy = modules.exports = (function dbProxy(config) {
	// check whenever a configuration has been passed
	if(!config) throw "DB proxy: no configuration found";
	var
		/* MODULES */
		// load neDB module
		neDB = require('neDB')
		// load events module
	  , events = require('events')
		// load promise module
	  , Promise = require('es6-promise').Promise
		// load extend function from util module
	  , extend = require('util')._extend;
	  
		/* VARIABLES */
		// where the dbs will be stored
	  , db = {}
		// used to queue promises
	  , promisesQueue = []
		
		/* INSTANCES */
		// initiate the eventEmitter
	  , eventEmitter = new events.EventEmitter()
	  
		/* FUNCTIONS */
		// create a promise for loading a channel databases
	  , initChannelDb = function initChannelDb(channel) {
			return new Promise(function (resolve, reject) {
				try {
					eventEmitter.emit(config.db.events.channelInitializing, channel);
					// if the db doesn't already exist
					if(!db.hasOwnProperty(channel)) {
						// get all db files name from config
						for(var dbname in config.db.channels) {
							if(config.db.channels.hasOwnProperty(dbname)) {
								// define neDB instance options
								var options = { filename: config.db.channels[dbname]+channel };
								// create a new instance of neDB datastore
								db[channel][dbname] = new neDB(options);
							}
						}
					}
					// emit initialized event
					eventEmitter.emit(config.db.events.channelInitialized, channel);
					// resolve promise
					resolve(channel);
				}
				catch (err) {
					// event notifying an error occurred while loading the channel db
					eventEmitter.emit(config.db.events.channelInitializeError, channel, err);
					// reject promise;
					reject(err);
				}
			};
		}
	  , loadChannelDB = function loadChannelDB(channel) {
			return new Promise(function (resolve, reject) {
				try {
					eventEmitter.emit(config.db.events.channelLoading, channel);
					// if the db already exists
					if(db.hasOwnProperty(channel)) {
						// get all db files name from config
						for(var dbname in config.db.channels) {
							if(config.db.channels.hasOwnProperty(dbname)) {
								// load database
								db[channel][dbname].loadDatabase(function (err) {
									if(err) {
										// event notifying an error occurred while loading the channel db
										eventEmitter.emit(config.db.events.channelLoadError, channel, err);
										// reject promise;
										reject(err);
										return;
									}
									// event notifying the channel db has been loaded
									eventEmitter.emit(config.db.events.channelLoaded, channel);
									// resolve promise
									resolve(channel);
								});
							}
						}
					}
					else {
						// event notifying an error occurred while loading the channel db
						eventEmitter.emit(config.db.events.channelLoadError, channel, "channel datastore not found");
						// reject promise;
						reject(err);
					}
				}
				catch (err) {
					// event notifying an error occurred while loading the channel db
					eventEmitter.emit(config.db.events.channelLoadError, channel, err);
					// reject promise;
					reject(err);
				}
			};
		}
	  ;
	  
	// Load channels databases
	eventEmitter.emit(config.db.events.dbInitializing);
	// loop on each channel to load its databases
	config.irc.options.channels.forEach(function(channel) {
		promisesQueue.push(initChannelDb(channel));
	});
	// check all the channel db promises
	Promise.all(promisesQueue)
		.then(function(channels) {
			promisesQueue = [];
			eventEmitter.emit(config.db.events.dbInitialized, channels);
			return channels;
		})
		.then(function(channels) {			
			eventEmitter.emit(config.db.events.dbLoading, channels);
			channels.forEach(function(channel) {
				promisesQueue.push(loadChannelDB(channel));
			});
		})
		.catch(function(channel) {
			promisesQueue = [];
			eventEmitter.emit(config.db.events.dbInitializeError, channel);
		})
		;
	
	// return public methods to read/update/delete data
	return {
		// Get all data from a given db for the specified chan (? add optional query ?) [review]
		getAll: function getMessages(channel, dbType) {
			return db[channel][dbType];
		}
		// Get a data by id from a given db for the specified chan
	  , getById: function getUsers(channel, dbType, id) {
			
		}
	};
}(config));