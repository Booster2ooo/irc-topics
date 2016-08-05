/* TODO NOTES: 
	- review events emit and promises reject/resolve parameters !
*/


var /* MODULES */
	// load mongoDB module (client) 
	mongodb = require('mongodb')
	// load events module
  , events = require('events')
	// load promise module
//  , Promise = require('es6-promise').Promise
	
	/* INSTANCES */
	// initiate the eventEmitter
  , eventEmitter = new events.EventEmitter()
	// mongoClient instance
  , dbClient = mongodb.MongoClient
  , ObjectId = mongodb.ObjectID
	
	/* THIS MODULE */
	// Database proxy declaration
  , dbProxy = function dbProxy(config) {
		// check whenever a configuration has been passed
		if(!config) throw 'DB proxy: no configuration found';
		
		var /* VARIABLES */
			// where the dbs instances will be stored
			db = {
				// main connection
				conn: null
			}
			// used to stack promises
		  , promisesQueue = []
			// initialized status
		  , initialized = false
			// loaded status
		  , loaded = false
		  
			/* FUNCTIONS (PRIVATE METHODS) */
			// create a promise for loading a channel databases
		  , initConnection = function initConnection() {
				return new Promise(function(resolve, reject) {
					try {
						dbClient.connect(
							config.db.mongoURL
						  , config.db.mongoOptions
						  , function(err, conn) {
								if (err) {
									reject(err);
									return;
								}
								db.conn = conn;
								initialized = true;
								resolve(conn);
							}
						);
					}
					catch(ex) {
						reject(ex);
					}
				});
			}
		  , loadChannel = function loadChannel(channel) {
				return new Promise(function(resolve, reject) {
					try {
						var thisQueue = [];
						config.debug && console.log('Try loading '+channel+' databases');
						eventEmitter.emit(config.db.events.channelLoading, db[channel]);
						if(!db.hasOwnProperty(channel)) {
							db[channel] = {};
						}
						// get all db files name from config
						for(var dbname in config.db.channels) {
							if(config.db.channels.hasOwnProperty(dbname) && !db[channel].hasOwnProperty(dbname)) {
								// load database
								thisQueue.push(loadChannelCollection(channel,dbname));
							}
						}
						Promise.all(thisQueue)
							.then(function() {
								config.debug && console.log('Success loading databases for '+channel);
								loaded = true;
								// event notifying the channel db has been loaded
								eventEmitter.emit(config.db.events.channelLoaded, channel);
								resolve();
							})
							.catch(function(err) {
								config.debug && console.log('Error loading '+channel+' databases');
								// event notifying an error occurred while loading the channel db
								eventEmitter.emit(config.db.events.channelLoadError,err);
								reject(err);
							})
							;
					}
					catch(ex) {
						reject(ex);
					}
				});
			}
		  , loadChannelCollection = function loadChannelCollection(channel, dbname) {
				return new Promise(function(resolve, reject) {
					try {
						if(!db.conn) {
							reject('no database connection found');
							return;
						}
						db[channel][dbname] = db.conn.collection(dbname+channel);
						if(dbname == 'messages') {
							db[channel][dbname].createIndex( { timestamp: 1 } );
						}
						else if(dbname != 'stats') {
							db[channel][dbname].createIndex(
								{ name: 1 }
							  , { unique: true }
							);
						}
						resolve(db[channel][dbname]);
					}
					catch(ex) {
						reject(ex);
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
					try {
						// Load channels databases
						eventEmitter.emit(config.db.events.dataContextInitializing);
						config.debug && console.log('Initialize connexion');
						initConnection()
							.then(function(conn) {
								config.debug && console.log('Connexion initialized');
								// emit dataContext initialized event
								eventEmitter.emit(config.db.events.dataContextInitialized, conn);
								var thisQueue = [];
								config.debug && console.log('Creating "load collection" promises queue');
								eventEmitter.emit(config.db.events.dataContextLoading, conn);
								// loop on each channel to load its collection
								config.irc.options.channels.forEach(function(channel) {
									thisQueue.push(loadChannel(channel));
								});
								config.debug && console.log('Checking "load collection" promises queue fullfilment');
								return Promise.all(thisQueue);
							})
							.catch(function(err) {
								// an error occurred during db connexion initialization
								config.debug && console.log('Error in connexion initialization');
								// emit error event
								eventEmitter.emit(config.db.events.dataContextInitializeError, err);
								// reject init promise
								reject(err);
								throw err;
							})
							.then(function(collections) {
								// all db loaded
								config.debug && console.log('All databases loaded');
								eventEmitter.emit(config.db.events.dataContexLoaded, collections);
								resolve(collections);
								return collections;
							})
							.catch(function(err) {
								// failed loading at least one db
								config.debug && console.log('Error in database initialization queue');
								config.debug && console.log(err);
								promisesQueue = [];
								eventEmitter.emit(config.db.events.dataContexLoadError, err);
								reject(err);
								if(db.conn) {
									db.conn.close();
								}
							})
							;
					}
					catch(ex) {
						reject(ex);
					}
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
					options.projection = options.projection || {};
					// rebuild ids
					for(var q in options.query) {
						if(options.query.hasOwnProperty(q) && options.query[q] && q == '_id')
						{
							if(typeof(options.query[q]) === typeof('abc')) {
								options.query[q] = new ObjectId(options.query[q]);
							}
							else if(typeof(options.query[q]) === typeof({})) {
								for(var subq in options.query[q]) {
									if(options.query[q].hasOwnProperty(subq) && options.query[q][subq]) {
										if(subq == '$in') {
											var newArray = [];
											options.query[q][subq].forEach(function(id) {
												newArray.push(new ObjectId(id));
											});
											options.query[q][subq] = newArray;
										}
									}
								}
							}
						}
					}
					var cursor = db[options.channel][options.type].find(options.query, options.projection);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					if(options.limit) {
						cursor = cursor.limit(options.limit);
					}
					cursor.toArray(function (err, docs) {
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
					options.projection = options.projection || {};
					// rebuild ids
					for(var q in options.query) {
						if(options.query.hasOwnProperty(q) && options.query[q] && q == '_id')
						{
							if(typeof(options.query[q]) === typeof('abc')) {
								options.query[q] = new ObjectId(options.query[q]);
							}
							else if(typeof(options.query[q]) === typeof({})) {
								for(var subq in options.query[q]) {
									if(options.query[q].hasOwnProperty(subq) && options.query[q][subq]) {
										if(subq == '$in') {
											var newArray = [];
											options.query[q][subq].forEach(function(id) {
												newArray.push(new ObjectId(id));
											});
											options.query[q][subq] = newArray;
										}
									}
								}
							}
						}
					}				
					var cursor = db[options.channel][options.type].find(options.query,options.projection);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					//if(options.limit) {
						cursor = cursor.limit(1);
					//}
					cursor.toArray(function (err, doc) {
						if(err) {
							eventEmitter.emit(config.db.events.getError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.getSuccess, doc, options);
						resolve(doc[0]);
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
					// rebuild ids
					for(var q in options.query) {
						if(options.query.hasOwnProperty(q) && options.query[q] && q == '_id')
						{
							if(typeof(options.query[q]) === typeof('abc')) {
								options.query[q] = new ObjectId(options.query[q]);
							}
							else if(typeof(options.query[q]) === typeof({})) {
								for(var subq in options.query[q]) {
									if(options.query[q].hasOwnProperty(subq) && options.query[q][subq]) {
										if(subq == '$in') {
											var newArray = [];
											options.query[q][subq].forEach(function(id) {
												newArray.push(new ObjectId(id));
											});
											options.query[q][subq] = newArray;
										}
									}
								}
							}
						}
					}
                    /*var cursor = db[options.channel][options.type].count(options.query);
					if(options.sort) {
						cursor = cursor.sort(options.sort);
					}
					if(options.skip) {
						cursor = cursor.skip(options.skip);
					}
					if(options.limit) {
						cursor = cursor.limit(options.limit);
					}
					cursor.toArray(function (err, cnt) {
						if(err) {
							eventEmitter.emit(config.db.events.countError, err, options);
							reject(err);
							return;
						}
						eventEmitter.emit(config.db.events.countError, cnt, options);
						resolve(cnt);
					});
                     */
                    db[options.channel][options.type].count(
                        options.query
                      , {
                            limit: options.limit
                          , skip: options.skip
                          , hint: options.hint
                          , readPreference: options.readPreference
                        }
                      , function (err, cnt) {
                            if(err) {
                                eventEmitter.emit(config.db.events.countError, err, options);
                                reject(err);
                                return;
                            }
                            eventEmitter.emit(config.db.events.countError, cnt, options);
                            resolve(cnt);
                        }
                    );
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
					// rebuild ids
					for(var q in options.query) {
						if(options.query.hasOwnProperty(q) && options.query[q] && q == '_id')
						{
							if(typeof(options.query[q]) === typeof('abc')) {
								options.query[q] = new ObjectId(options.query[q]);
							}
							else if(typeof(options.query[q]) === typeof({})) {
								for(var subq in options.query[q]) {
									if(options.query[q].hasOwnProperty(subq) && options.query[q][subq]) {
										if(subq == '$in') {
											var newArray = [];
											options.query[q][subq].forEach(function(id) {
												newArray.push(new ObjectId(id));
											});
											options.query[q][subq] = newArray;
										}
									}
								}
							}
						}
					}
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