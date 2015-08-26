/* TODO NOTES: 
	- review events emit and promises reject/resolve parameters !
*/


var /* MODULES */
	// load neDB module
	neDB = require('nedb')
	// load events module
  , events = require('events')
	// load promise module
  , Promise = require('es6-promise').Promise
	
	/* INSTANCES */
	// initiate the eventEmitter
  , eventEmitter = new events.EventEmitter()
	
	/* THIS MODULE */
	// Database proxy declaration
  , dbProxy = function dbProxy(config) {
		// check whenever a configuration has been passed
		if(!config) throw 'DB proxy: no configuration found';
		
		var /* VARIABLES */
			// where the dbs instances will be stored
			db = {}
			// used to stack promises
		  , promisesQueue = []
			// initialized status
		  , initialized = false
			// loaded status
		  , loaded = false
		  
			/* FUNCTIONS (PRIVATE METHODS) */
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
						// update status
						initialized = true;
						// emit initialized event
						eventEmitter.emit(config.db.events.channelInitialized, channel);
						// resolve promise
						resolve(channel);
					}
					catch (err) {
						config.debug && console.error('Exception initializing '+channel+' databases');
						// event notifying an error occurred while loading the channel db
						eventEmitter.emit(config.db.events.channelInitializeError, err, channel);
						// reject promise;
						reject(err);
					}
				});
			}
			// load a specified dbtype for a given channel
		  , loadChannelDb = function loadChannelDb(channel,dbname) {
				return new Promise(function (resolve, reject) {
					try {						
						config.debug && console.log('Try loading '+dbname+channel+' database');
						// load the database
						db[channel][dbname].loadDatabase(function (err) {
							if(err) {
								config.debug && console.log('Error loading '+dbname+channel+' database');
								// reject promise;
								reject(err);
								return;
							}
							config.debug && console.log('Success loading '+dbname+channel+' database');
							config.debug && console.log('Specifying indexes for '+dbname+channel+' database');
							if(dbname === 'messages') {
								db[channel][dbname].ensureIndex({ fieldName: 'timestamp', unique: true, sparse: true }, function (err) {
									if(err) {
										config.debug && console.log('Error specifying indexes for '+dbname+channel+' database');
										// reject promise;
										reject(err);
										return;
									}
									config.debug && console.log('Success specifying indexes for '+dbname+channel+' database');
									config.debug && console.log(dbname+channel+' loaded and ready');
									// resolve promise
									resolve(channel,dbname);
								});
							}
							else {
								// when loaded, build the index for the key "name" used in both users & topics (and ignored in messages)
								db[channel][dbname].ensureIndex({ fieldName: 'name', unique: true, sparse: true }, function (err) {
									if(err) {
										config.debug && console.log('Error specifying indexes for '+dbname+channel+' database');
										// reject promise;
										reject(err);
										return;
									}
									config.debug && console.log('Success specifying indexes for '+dbname+channel+' database');
									config.debug && console.log(dbname+channel+' loaded and ready');
									// resolve promise
									resolve(channel,dbname);
								});
							}
						});
					}
					catch(err) {
						config.debug && console.error('Exception loading '+dbname+channel+' database');
						reject(err);
					}
				});
			}
			// load every db of a given channel
		  , loadChannelDbs = function loadChannelDbs(channel) {
				return new Promise(function (resolve, reject) {
					try {
						var thisQueue = [];
						config.debug && console.log('Try loading '+channel+' databases');
						eventEmitter.emit(config.db.events.channelLoading, channel);
						// if the db doesn't exist
						if(!db.hasOwnProperty(channel)) {
							config.debug && console.log('Error loading '+channel+' databases: DB instance not found');
							// event notifying an error occurred while loading the channel db
							eventEmitter.emit(config.db.events.channelLoadError, 'channel datastore not found', channel);
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
							.then(function(channel,dbnames) {
								config.debug && console.log('Success loading databases for '+channel[0]);
								// update status
								loaded = true;
								// event notifying the channel db has been loaded
								eventEmitter.emit(config.db.events.channelLoaded, channel);
								// resolve promise
								resolve(channel);
							})
							.catch(function(err) {
								config.debug && console.log('Error loading '+channel[0]+' databases');
								// event notifying an error occurred while loading the channel db
								eventEmitter.emit(config.db.events.channelLoadError,err);
								reject(err);
							});
					}
					catch (err) {
						config.debug && console.error('Exception loading '+channel+' databases');
						// event notifying an error occurred while loading the channel db
						eventEmitter.emit(config.db.events.channelLoadError, err, channel);
						// reject promise;
						reject(err);
					}
				});
			}
		  ;
			
		// return public methods to read/update/delete data
		return {
			/* PUBLIC METHODS */
			// initialize and load all the data context
			init: function init() {
				return new Promise(function(resolve, reject) {
					// Load channels databases
					eventEmitter.emit(config.db.events.dataContextInitializing);
					config.debug && console.log('Creating "initialize" promises queue');
					// loop on each channel to load its databases
					config.irc.options.channels.forEach(function(channel) {
						promisesQueue.push(initChannelDb(channel));
					});
					
					config.debug && console.log('Checking "initialize" promises queue fullfilment');
					// check all the channel db promises
					Promise.all(promisesQueue)
						.then(function(channels) {
							// all db are initialized
							config.debug && console.log('All databases initialized');
							// empty promises queue
							promisesQueue = [];
							// emit dataContext initialized event
							eventEmitter.emit(config.db.events.dataContextInitialized, channels);
							return channels;
						})
						.catch(function(err) {
							// an error occurred during the channel's db initialization
							config.debug && console.log('Error in "initialize" queue');
							config.debug && console.log(err);
							promisesQueue = [];
							// emit error event
							eventEmitter.emit(config.db.events.dataContextInitializeError, err);
							// reject init promise
							reject(err);
						})
						.then(function(channels) {
							// trying to load the dbs
							config.debug && console.log('Creating "load" promises queue');
							eventEmitter.emit(config.db.events.dataContextLoading, channels);
							channels.forEach(function(channel) {
								promisesQueue.push(loadChannelDbs(channel));
							});
							config.debug && console.log('Checking "load" promises queue fullfilment');
							return Promise.all(promisesQueue);
						})
						.then(function(channels) {
							// all db loaded
							config.debug && console.log('All databases loaded');
							promisesQueue = [];
							eventEmitter.emit(config.db.events.dataContexLoaded, channels);
							resolve(channels);
							return channels;
						})
						.catch(function(err) {
							// failed loading at least one db
							config.debug && console.log('Error in "load" queue');
							config.debug && console.log(err);
							promisesQueue = [];
							eventEmitter.emit(config.db.events.dataContexLoadError, err);
							reject(err);
						})
						;
				});
			}
			// Get multiple data for the specified options
			// options.channel 	&& 
			// options.type 	are mandatory
		  , getAll: function getAll(options) {
				return new Promise(function(resolve, reject) {
					if(!options) {
						throw 'No options provided';
					}
					else if(!options.channel) {
						throw 'No channel provided';
					}
					else if(!options.type) {
						throw 'No type provided';
					}
					options.query = options.query || {};
					var cursor = db[options.channel][options.type].find(options.query);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					if(options.limit) {
						cursor = cursor.limit(options.limit);
					}
					cursor.exec(function (err, docs) {
						if(err) {
							eventEmitter.emit(config.db.events.getAllError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.getAllSuccess, docs, options);
						resolve(docs);
					});
				});
			}
			// Get a single data for the specified options
			// options.channel && options.type are mandatory
		  , get: function get(options) {
				return new Promise(function(resolve, reject) {
					if(!options) {
						throw 'No options provided';
					}
					else if(!options.channel) {
						throw 'No channel provided';
					}
					else if(!options.type) {
						throw 'No type provided';
					}
					options.query = options.query || {};					
					var cursor = db[options.channel][options.type].findOne(options.query);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					if(options.limit) {
						cursor = cursor.limit(options.limit);
					}
					cursor.exec(function (err, doc) {
						if(err) {
							eventEmitter.emit(config.db.events.getError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.getSuccess, doc, options);
						resolve(doc);
					});
				});
			}
			// Count the number of data for the specified options
			// options.channel 	&&
			// options.type 	are mandatory
		  , count: function count(options) {
				return new Promise(function(resolve, reject) {
					if(!options) {
						throw 'No options provided';
					}
					else if(!options.channel) {
						throw 'No channel provided';
					}
					else if(!options.type) {
						throw 'No type provided';
					}
					options.query = options.query || {};					
					var cursor = db[options.channel][options.type].count(options.query);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					if(options.limit) {
						cursor = cursor.limit(options.limit);
					}
					cursor.exec(function (err, count) {
						if(err) {
							eventEmitter.emit(config.db.events.countError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.countError, count, options);
						resolve(count);
					});
				});
			}
			// insert/update for the specified options
			// options.channel	&& 
			// options.type 	&&
			// options.entity	are mandatory
		  , append: function append(options) {
				return new Promise(function(resolve, reject) {
					if(!options) {
						throw 'No options provided';
					}
					else if(!options.channel) {
						throw 'No channel provided';
					}
					else if(!options.type) {
						throw 'No type provided';
					}
					else if(!options.entity) {
						throw 'No entity provided';
					}
					if(!options.entity._id) {
						config.debug && console.log('Inserting in '+options.type+options.channel);
						config.debug && console.log(options.entity);
						db[options.channel][options.type].insert(options.entity, function (err) {
							if(err) {
								config.debug && console.log('Insert failed');
								eventEmitter.emit(config.db.events.appendError, err, options);
								eventEmitter.emit(config.db.events.insertError, err, options);
								reject(err);
								return;
							}
							config.debug && console.log('Insert success');
							eventEmitter.emit(config.db.events.appendSuccess, options.entity, options);
							eventEmitter.emit(config.db.events.insertSuccess, options.entity, options);
							resolve(options.entity);
						});
					}
					else {
						config.debug && console.log('Updating in '+options.type+options.channel)
						config.debug && console.log(options.entity);
						db[options.channel][options.type].update({ _id: options.entity._id }, options.entity, {}, function (err, numReplaced) {
							if(err) {
								config.debug && console.log('Update failed');
								eventEmitter.emit(config.db.events.appendError, err, options);
								eventEmitter.emit(config.db.events.updateError, err, options);
								reject(err);
								return;
							}
							config.debug && console.log('Update success');
							eventEmitter.emit(config.db.events.appendSuccess, options.entity, options);
							eventEmitter.emit(config.db.events.updateSuccess, options.entity, options);
							resolve(numReplaced);
						});
					}
				});
			}
			// delete one or more data entries from a give channel db for specified query & options
		  , remove: function remove(options) {
				return new Promise(function(resolve, reject) {
					if(!options) {
						throw 'No options provided';
					}
					else if(!options.channel) {
						throw 'No channel provided';
					}
					else if(!options.type) {
						throw 'No type provided';
					}
					else if(!options.query) {
						throw 'No query provided';
					}
					options.options = options.options || {};
					db[options.channel][options.type].remove(options.query, options.options, function (err, numRemoved) {
						if(err) {
							eventEmitter.emit(config.db.events.removeError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.removeSuccess, options);
						resolve(numRemoved);
					});
				});
			}
			// return current db instances
		  , getInstances: function getInstances() {
				return new Promise(function(resolve, reject) {
					if(!initialized) {
						throw "DB not initialized";
					}
					if(!loaded) {
						throw "DB not loaded";
					}
					resolve(db);
				});
			}
			
			/* EVENTS LISTENERS */
			// expose dataContexLoaded event listener
		  , onDataContextLoaded: function onDataContextLoaded(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.dataContexLoaded, succesCallback);				
				errorCallback && eventEmitter.on(config.db.events.dataContexLoadError, errorCallback);
			}
			// expose getAll event listener
		  , onGetAll: function onGetAll(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.getAllSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.getAllError, errorCallback);
			}
			// expose get event listener
		  , onGet: function onGet(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.getSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.getError, errorCallback);
			}
			// expose append event listener
		  , onAppend: function onAppend(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.appendSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.appendError, errorCallback);
			}
			// expose insert event listener
		  , onInsert: function onInsert(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.insertSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.insertError, errorCallback);
			}
			// expose update event listener
		  , onUpdate: function onUpdate(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.updateSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.updateError, errorCallback);
			}
			// expose remove event listener
		  , onRemove: function onRemove(succesCallback, errorCallback) {
				succesCallback && eventEmitter.on(config.db.events.removeSuccess, succesCallback);
				errorCallback && eventEmitter.on(config.db.events.removeError, errorCallback);
			}
		};
	}
  ;
  
module.exports = dbProxy;