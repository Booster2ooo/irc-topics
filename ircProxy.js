#!/usr/bin/env node

var /* MODULES */
	// load irc module
	irc = require('irc')
	// load promise module
  , Promise = require('es6-promise').Promise
  
  , ircProxy = function ircProxy(config, db) {
		// check whenever a configuration has been passed
		if(!config) throw 'IRC proxy: configuration not found';
		if(!db) throw 'IRC proxy: instance of dbProxy not found';
		var /* INSTANCES */
			// irc bot instance
			ircClient = new irc.Client(config.irc.server, config.irc.nick, config.irc.options)
			
			/* FUNCTIONS */
		  , executeCommand = function executeCommande(channel, nick, textParts) {
				switch (textParts[0]) {
					case '!log': 
						return commands.allowLogMessages(channel, nick, textParts[1]);
						break;
					default:
						// command unknown -> failed
						return false;
						break;
				};
			}
			/* BOT COMMANDS */
		  , commands = {
				allowLogMessages: function allowLogMessages(channel, nick, state) {
					var boolState = null;
					switch (state) {
						case 'on':
							boolState = true;
							break;
						case 'off':
							boolState = false;
							break;
						default:
							ircClient.say(nick, "Unrecognised state for !log command, please use !log [on|off]");
							break;
					}
					if(boolState === null) {
						// command failed
						return false;
					}
					//try to retrieve user from db
					db.get(channel, 'users', { name: nick})
						.then(function(user) {
							// user not found, lets create one [review]
							if(!user) {
								user = {
									name: nick
								  , allowLog: !boolState
								};
							}
							if(user.allowLog != boolState) {
								user.allowLog = boolState;
								return db.append(channel, 'users', user);
							}
							throw "user allow log state unchanged";
						})
						.then(function(user) {
							// if the update is successful, notify the user
							boolState ? 
								ircClient.say(nick, "Your messages on "+channel+" will now be logged.")
							  : ircClient.say(nick, "Your messages on "+channel+" won't be logged any more.")
							  ;
						})
						.catch(function(err){
							config.debug && console.log(err);
						})
						;
					// command executed
					return true;
				}
			}
			
			/* HANDLERS */
		  , handlers = {
				messageHandler: function messageHandler(nick, text, packet) {
					var textParts = text.split(' ')
					  , channel = packet.args[0]
					  , topic
					  , message
					  ;
					// check if the message really comes from a channel
					if(channel[0] != '#') {
						ircClient.say(nick, "Hello, I don't handle private messages.");
						return;
					}
					// detect bot command & execute it. if the command failed, continue and log, if it succeeded, stop here
					if(textParts[0][0] == '!' && executeCommand(channel, nick, textParts)) {
						return;
					}
					// detect topic
					if(textParts[textParts.length-1][0] == '@') {
						// pop out the last word from the textPart array as the topic name
						topic = {
							name: textParts.pop()
						  , description: ''
						  , messages: []
						};
					}
					// check if there still is something to log (eg, the @topic was the only word of the message)
					if(textParts.length) {
						// check if user exists in the db
						db.get(channel, 'users', { name: nick})
							.then(function(user) {
								// if it doesn't, create one with a default allow log as true
								if(!user) {
									user = {
										name: nick
									  , allowLog: true
									};
									db.append(channel, 'users', user).then();
								}
								// if the user allows to be logged
								if(user.allowLog) {
									// create a new message
									message = {
										timestamp: process.hrtime()
									  , author: nick
									  , text: textParts.join(' ')
									};
									// insert the message in the db
									return db.append(channel, 'messages', message);
								}
								throw "user doesn't allow log";
							})
							.then(function(msg) {
								// replace in memory message by the one in db
								message = msg;
								// message inserted, check if a topic is already associated
								if(topic) {
									// if so, check if the topic already exists in the db
									return db.get(channel, 'topics', { name: topic.name});
								}
								throw "no topic associated with the message";
							})
							.then(function(top) {
								topic = top || topic;
								// then add the message to the topic
								topic.messages.push(message._id);
								// and add it to the db
								db.append(channel, 'topics', topic).then();
							})
							.catch(function(err) {
								config.debug && console.log(err);
							});
					}
				}
			  , errorHandler: function onErrorHanlder(err) {
					config.debug && console.log(err);
				}
			  , pingHandler: function pingHandler(server) {
					config.debug && console.log(server);
				}
			  , rawHandler: function pingHandler(message) {
					config.debug && console.log(message);
				}
			  , closeHandler: function closeHanlder() {
					config.debug && console.log("IRC connection closed");
				}
			}
		  ;
		ircClient
			.addListener('error', handlers.errorHandler)
			.addListener('ping', handlers.pingHandler)
			.addListener('close', handlers.closeHandler)
		//	.addListener('raw', handlers.rawHandler)
			;
		config.irc.options.channels.forEach(function(channel) {
			ircClient.addListener('message'+channel, handlers.messageHandler);
		});
		return;
	}
  ;
  
module.exports = ircProxy;