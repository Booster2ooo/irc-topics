#!/usr/bin/env node
var
	/* MODULES */
	// load neDB module
	neDB = require('neDB')
	// load events module
  , events = require('events')
	// load promise module
  , Promise = require('es6-promise').Promise
	// load extend function from util module
  , extend = require('util')._extend
  
	/* VARIABLES */
	// where the dbs will be stored
  , db = {}
	// used to queue promises
  , promisesQueue = []
	
	/* INSTANCES */
	// initiate the eventEmitter
  , eventEmitter = new events.EventEmitter()
	
		// Database proxy
  , dbProxy = function dbProxy(config) {
		// check whenever a configuration has been passed
		if(!config) throw "DB proxy: no configuration found";
		
		var
			/* FUNCTIONS */
			// create a promise for loading a channel databases
			initChannelDb = function initChannelDb(channel) {
				return new Promise(function (resolve, reject) {
					try {
						eventEmitter.emit(config.db.events.channelInitializing, channel);
						// if the db doesn't already exist
						if(!db.hasOwnProperty(channel)) {
							db[channel] = {};
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
				});
			}
		  , loadChannelDb = function loadChannelDbs(channel,dbname) {
				return new Promise(function (resolve, reject) {
					db[channel][dbname].loadDatabase(function (err) {
						console.log('DB: ' + dbname);
						if(err) {
							// event notifying an error occurred while loading the channel db
							eventEmitter.emit(config.db.events.channelLoadError, channel, err);
							// reject promise;
							reject(err);
							return;
						}
						db[channel][dbname].ensureIndex({ fieldName: 'name', unique: true }, function (err) {
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
					});
				});
			}
		  , loadChannelDbs = function loadChannelDbs(channel) {
				return new Promise(function (resolve, reject) {
					try {
						eventEmitter.emit(config.db.events.channelLoading, channel);
						var thisQueue = [];
						// if the db already exists
						if(db.hasOwnProperty(channel)) {
							// get all db files name from config
							for(var dbname in config.db.channels) {
								if(config.db.channels.hasOwnProperty(dbname)) {
									// load database
									thisQueue.push(loadChannelDb(channel,dbname));
								}
								else {
									// reject promise;
									reject(err);
								}
							}
							Promise.all(thisQueue)
								.then(function(channel) {
									resolve(channel);
								})
								.catch(function(err) {
									reject(err);
								});
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
				});
			}
		  ;
		  
		// Load channels databases
		eventEmitter.emit(config.db.events.dbInitializing);
		console.log('creating "initialization" promises queue');
		// loop on each channel to load its databases
		config.irc.options.channels.forEach(function(channel) {
			promisesQueue.push(initChannelDb(channel));
		});
		
		console.log('executing "initialization" promises queue');
		// check all the channel db promises
		Promise.all(promisesQueue)
			.then(function(channels) {
				console.log('initialized');
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbInitialized, channels);
				return channels;
			})
			.then(function(channels) {
				console.log('creating "loading" promises queue');
				eventEmitter.emit(config.db.events.dbLoading, channels);
				channels.forEach(function(channel) {
					promisesQueue.push(loadChannelDbs(channel));
				});
				console.log('executing "loading" promises queue');
				Promise.all(promisesQueue)
					.then(function(channels) {
						console.log('loaded');
						promisesQueue = [];
						eventEmitter.emit(config.db.events.dbLoaded, channels);
						return channels;
					})
					.catch(function(err) {
						console.log('load failed');
						console.log(err);
						promisesQueue = [];
						eventEmitter.emit(config.db.events.dbLoadError, err);
					})
					;
			})
			.catch(function(err) {
				console.log(err);
				console.log('error in promises queue 1');
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbInitializeError, err);
			})
			;
		
		
		// return public methods to read/update/delete data
		return {
			// Get multiple data from a given channel db for the specified query
			getAll: function getAll(channel, dbType, query) {
				query = query || {};
				return new Promise(function(resolve, reject) {
					db[channel][dbType].find(query, function (err, docs) {
						if(err) {
							reject(err);
							return;
						}
						resolve(docs);
					});
				});
			}
			// Get a sigle data from a given channel db for the specified query
		  , get: function get(channel, dbType, query) {
				query = query || {};
				return new Promise(function(resolve, reject) {
					db[channel][dbType].findOne(query, function (err, docs) {
						if(err) {
							reject(err);
							return;
						}
						resolve(docs);
					});
				});
			}
			// Count the number of data from a given channel db for the specified query
		  , count: function count(channel, dbType, query) {
				query = query || {};
				return new Promise(function(resolve, reject) {
					db[channel][dbType].count(query, function (err, docs) {
						if(err) {
							reject(err);
							return;
						}
						resolve(docs);
					});
				});
			}
			// insert the entity into a given channel db for the specified query
		  , append: function append(channel, dbType, entity) {
				return new Promise(function(resolve, reject) {
					if(!entity._id) {
						db[channel][dbType].insert(entity, function (err) {
							if(err) {
								reject(err);
								return;
							}
							resolve(entity);
						});
					}
					else {
						db[channel][dbType].update({ _id: entity._id }, entity, {}, function (err, numReplaced) {
							if(err) {
								reject(err);
								return;
							}
							resolve(numReplaced);
						});
					}
				});
			}
			// delete one or more data entries from a give channel db for specified query & options
		  , remove: function remove(channel, dbType, query, options) {
				query = query || {};
				options = options || {};
				return new Promise(function(resolve, reject) {
					db[channel][dbType].remove(query, options, function (err, numRemoved) {
						if(err) {
							reject(err);
							return;
						}
						resolve(numRemoved);
					});
				});
			}
		  , onLoaded: function onLoaded(callback) {
				eventEmitter.on(config.db.events.dbLoaded, callback);
			}
		};
	}
  ;
  
module.exports = dbProxy;