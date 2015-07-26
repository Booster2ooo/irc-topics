#!/usr/bin/env node
var /* MODULES */
	// load neDB module
	neDB = require('neDB')
	// load events module
  , events = require('events')
	// load promise module
  , Promise = require('es6-promise').Promise
	// load extend function from util module
  , extend = require('util')._extend
	
	/* INSTANCES */
	// initiate the eventEmitter
  , eventEmitter = new events.EventEmitter()
	
	// Database proxy declaration
  , dbProxy = function dbProxy(config) {
		// check whenever a configuration has been passed
		if(!config) throw 'DB proxy: no configuration found';
		
		var /* VARIABLES */
			// where the dbs instances will be stored
			db = {}
			// used to queue promises
		  , promisesQueue = []
		  
			/* FUNCTIONS */
			// create a promise for loading a channel databases
		  , initChannelDb = function initChannelDb(channel) {
				return new Promise(function (resolve, reject) {
					try {
						config.debug && console.log('Try initializing '+channel+' databases');
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
									config.debug && console.log('New DB instance initialized: '+dbname+channel);
								}
							}
						}
						config.debug && console.log('Success initializing '+channel+' databases');
						// emit initialized event
						eventEmitter.emit(config.db.events.channelInitialized, channel);
						// resolve promise
						resolve(channel);
					}
					catch (err) {
						config.debug && console.log('Exception initializing '+channel+' databases');
						// event notifying an error occurred while loading the channel db
						eventEmitter.emit(config.db.events.channelInitializeError, channel, err);
						// reject promise;
						reject(err);
					}
				});
			}
		  , loadChannelDb = function loadChannelDbs(channel,dbname) {
				return new Promise(function (resolve, reject) {
					try {						
						config.debug && console.log('Try loading '+dbname+channel+' database');
						db[channel][dbname].loadDatabase(function (err) {
							if(err) {
								config.debug && console.log('Error loading '+dbname+channel+' database');
								// event notifying an error occurred while loading the channel db
								eventEmitter.emit(config.db.events.channelLoadError, channel, err);
								// reject promise;
								reject(err);
								return;
							}
							config.debug && console.log('Success loading '+dbname+channel+' database');
							config.debug && console.log('Specifying indexes for '+dbname+channel+' database');
							db[channel][dbname].ensureIndex({ fieldName: 'name', unique: true, sparse: true }, function (err) {
								if(err) {
									config.debug && console.log('Error specifying indexes for '+dbname+channel+' database');
									// event notifying an error occurred while loading the channel db
									eventEmitter.emit(config.db.events.channelLoadError, channel, err);
									// reject promise;
									reject(err);
									return;
								}
								config.debug && console.log('Success specifying indexes for '+dbname+channel+' database');
								config.debug && console.log(dbname+channel+' loaded and ready');								
								// event notifying the channel db has been loaded
								eventEmitter.emit(config.db.events.channelLoaded, channel);
								// resolve promise
								resolve(channel,dbname);
							});
						});
					}
					catch(err) {
						config.debug && console.log('Exception loading '+dbname+channel+' database');
						reject(err);
					}
				});
			}
		  , loadChannelDbs = function loadChannelDbs(channel) {
				return new Promise(function (resolve, reject) {
					try {
						config.debug && console.log('Try loading '+channel+' databases');
						eventEmitter.emit(config.db.events.channelLoading, channel);
						var thisQueue = [];
						// if the db doesn't exist
						if(!db.hasOwnProperty(channel)) {
							config.debug && console.log('Error loading '+channel+' databases: DB instance not found');
							// event notifying an error occurred while loading the channel db
							eventEmitter.emit(config.db.events.channelLoadError, channel, 'channel datastore not found');
							// reject promise;
							reject(err);
							return;
						}
						// get all db files name from config
						for(var dbname in config.db.channels) {
							if(config.db.channels.hasOwnProperty(dbname)) {
								// load database
								thisQueue.push(loadChannelDb(channel,dbname));
							}
						}
						Promise.all(thisQueue)
							.then(function(channel,dbname) {
								config.debug && console.log('Success loading '+dbname+' databases for '+channel[0]);
								resolve(channel);
							})
							.catch(function(err) {
								config.debug && console.log('Error loading '+channel+' databases');
								reject(err);
							});
					}
					catch (err) {
						config.debug && console.log('Exception loading '+channel+' databases');
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
		config.debug && console.log('Creating "initialize" promises queue');
		// loop on each channel to load its databases
		config.irc.options.channels.forEach(function(channel) {
			promisesQueue.push(initChannelDb(channel));
		});
		
		config.debug && console.log('Checking "initialize" promises queue fullfilment');
		// check all the channel db promises
		Promise.all(promisesQueue)
			.then(function(channels) {
				config.debug && console.log('All databases initialized');
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbInitialized, channels);
				return channels;
			})
			.catch(function(err) {
				config.debug && console.log('Error in "initialize" queue');
				config.debug && console.log(err);
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbInitializeError, err);
			})
			.then(function(channels) {
				config.debug && console.log('Creating "load" promises queue');
				eventEmitter.emit(config.db.events.dbLoading, channels);
				channels.forEach(function(channel) {
					promisesQueue.push(loadChannelDbs(channel));
				});
				config.debug && console.log('Checking "load" promises queue fullfilment');
				return Promise.all(promisesQueue);
			})
			.then(function(channels) {
				config.debug && console.log('All databases loaded');
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbLoaded, channels);
				return channels;
			})
			.catch(function(err) {
				config.debug && console.log('Error in "load" queue');
				config.debug && console.log(err);
				promisesQueue = [];
				eventEmitter.emit(config.db.events.dbLoadError, err);
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