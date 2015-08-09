var /* MODULES */
	// load irc module
	irc = require('irc')
	// load promise module
  , Promise = require('es6-promise').Promise
	// load extend module
  , extend = require('extend')
  
  , ircProxy = function ircProxy(config, db) {
		// check whenever a configuration has been passed
		if(!config) throw 'IRC proxy: configuration not found';
		if(!db) throw 'IRC proxy: instance of dbProxy not found';
		var /* VARIABLES */
			// text displayed when !help command is typed
			helpText = [
				"Hello, I'am "+config.irc.nick+" ("+config.project.name+" v"+config.project.version+"). I'm here to log messages form IRC channels in order to keep track of interesting things being said."
			  , "Every message can be assigned to a topic, allowing people to easily follow conversations even if they were off-line."
			  , "You can either use the web interface to assign a topic to a message or end your sentence with @topicName."
			  , "Available commands:"
			  , "!help - displays the help you're reading right now"
			  , "!log [on|off] - turns on or off the tracking of your messages in the channel the command has been send to"
			  , "!logAll [on|off] - turns on or off the tracking of your messages in every channels the bot is present at the moment of the command"
			]
			// text displayed when the bot enters a channel
		  , greetings = "Hey! I'm here to log everything you say. Type !help for more info."
			// cooldowns are used to avoid flood if a users request the same command again an again
		  , cooldown = {
				help: []
			}
			/* INSTANCES */
			// irc bot instance
		  , ircClient = new irc.Client(config.irc.server, config.irc.nick, config.irc.options)
			
			/* FUNCTIONS */
			// try to find and execute a bot command
		  , tryCommand = function executeCommande(channel, nick, textParts) {
				return new Promise(function(resolve, reject) {
					// if the first letter of the first word isn't !, then assume it's not a command
					if(textParts[0][0] != "!") {
						reject('No command found');
					}
					// copy provided array
					var parts = textParts.slice(0)
						// craft command
					  , command = {
							// save incoming channel
							channel: channel
							// save incoming nick
						  , nick: nick
							// build args ignoring 1st element of the parts array
						  , args: parts.splice(1)
							// get the remaining parts element and remove the ! at the beginning
						  , trigger: parts[0].slice(1)
						}
					;
					// if the command route doesn't exist (as a function)
					if(!commandsRoutes[command.trigger] || typeof(commandsRoutes[command.trigger]) !== typeof(function(){})) {
						// unknown command
						reject('Unknown command');
					}
					// try to execute command
					commandsRoutes[command.trigger](command)
						.then(resolve)
					//	.catch(reject)
					// resolve anyway ? we don't want the bot to log the command even if the commande failed
						.catch(resolve)
						;
				});
			}
			/* BOT COMMANDS */		
			// reroute commands to function
		  , commandsRoutes = {
				// !log command router
				log: function log(cmd) {
					return new Promise(function(resolve, reject){
						// reroute to commands.allowLogMessages
						commands.allowLogMessages(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
				// !logAll command router
			  , logAll: function logAll(cmd) {
					return new Promise(function(resolve, reject){
						var promisesQueue = [];
						// loop on every chan the bot is connected to
						config.irc.options.channels.forEach(function(channel) {
							// replace the incoming channel of the command by the current one in the loop
							var thisCmd = extend('true', cmd, { channel: channel});
							// push the command promise in the queue
							promisesQueue.push(commands.allowLogMessages(thisCmd));
						});
						Promise.all(promisesQueue)
							.then(resolve)
							.catch(reject)
							;
					});
				}
				// !help command router
			  , help: function help(cmd) {
					return new Promise(function(resolve, reject){
						cooldown.help = cooldown.help || [];
						// check if there is a cooldown for that user
						if(cooldown.help.indexOf(cmd.nick) > -1) {
							reject();
							return;
						}
						// reroute to commands.help
						commands.help(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			}
		  , commands = {
				// !log command function
				allowLogMessages: function allowLogMessages(cmd) {
					return new Promise(function(resolve, reject){
						var boolState
						  , state = cmd.args[0].toLowerCase()
						  ;
						// convert the argument to boolean
						switch (state) {
							case 'on':
								boolState = true;
								break;
							case 'off':
								boolState = false;
								break;
							default:
								var err = "Unrecognised state for !log command, please use !log [on|off]";
								ircClient.say(cmd.nick, err);
								reject(err);
								return;
								break;
						}
						//try to retrieve user from db
						db.get({ channel: cmd.channel, type: 'users', query: { name: cmd.nick}})
							.then(function(user) {
								// user not found, lets create one [review] (use some kind of constructor?)
								if(!user) {
									user = {
										name: cmd.nick
									  , allowLog: !boolState
									};
								}
								// if the log state changed
								if(user.allowLog != boolState) {
									// apply new state
									user.allowLog = boolState;
									// prepare to append to the db
									return db.append({ channel: cmd.channel, type: 'users', entity: user });
								}
								throw "user allow log state unchanged";
							})
							// append the user to the db
							.then(function(user) {
								// if the insert/update is successful, notify the user
								boolState ? 
									ircClient.say(cmd.nick, "Your messages on "+cmd.channel+" will now be logged.")
								  : ircClient.say(cmd.nick, "Your messages on "+cmd.channel+" won't be logged any more.")
								  ;
								resolve();
							})
							.catch(function(err){
								config.debug && console.error(err);
								reject(err);
							})
							;
					});
				}
			  , help: function help(cmd) {
					return new Promise(function(resolve, reject) {						
						cooldown.help = cooldown.help || [];
						// display each line of the help text
						helpText.forEach(function(line) {
							ircClient.say(cmd.nick, line);
						});
						// add a cooldown for this command
						cooldown.help.push(cmd.nick);
						// and remove it 10 seconds later
						setTimeout(function() {
							var idx = cooldown.help.indexOf(cmd.nick);
							if(idx > -1) {
								cooldown.help.splice(idx,1);
							}
						}, 10000);
						// always resolve the promise
						resolve();
					});
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
					// check if the message really comes from a channel (should not be triggered as the message event specifies a channel)
					if(channel[0] != '#') {
						ircClient.say(nick, "Hello, I don't handle private messages.");
						return;
					}
					// check if the bot is not the author of the message, we don't want to log that
					if(nick == config.irc.nick) {
						return;
					}
					// try to find and execute command. if the command failed, continue and log, if it succeeded, stop here
					tryCommand(channel, nick, textParts)
						.then(function() {
							// a command has been found and executed, stop execution here
							return;
						})
						.catch(function() {
							// no command, continue logging
							// detect topic
							if(textParts[textParts.length-1][0] == '@') {
								// pop out the last word from the textPart array as the topic name [review] (use some kind of constructor?)
								topic = {
									name: textParts.pop()
								  , description: ''
								  , messages: []
								};
							}
							
							// check if there still is something to log (eg, the @topic was the only word of the message)
							if(textParts.length) {
								// check if user exists in the db
								db.get({channel: channel, type: 'users', query:{ name: nick}})
									.then(function(user) {
										// if it doesn't, create one with a default allow log as true [review] (use some kind of constructor?)
										if(!user) {
											user = {
												name: nick
											  , allowLog: true
											};
											db.append({channel: channel, type: 'users', entity: user}).then();
										}
										// if the user allows to be logged
										if(user.allowLog) {
											// create a new message
											message = {
												timestamp: (new Date()).getTime()
											  , author: nick
											  , text: textParts.join(' ')
											};
											// insert the message in the db
											return db.append({channel: channel, type: 'messages', entity: message});
										}
										throw "user doesn't allow log";
									})
									.then(function(msg) {
										// replace in memory message by the one in db
										message = msg;
										// message inserted, check if a topic is associated
										if(topic) {
											// if so, check if the topic already exists in the db
											return db.get({ channel: channel, type: 'topics', query: { name: topic.name}});
										}
										throw "no topic associated with the message";
									})
									.then(function(top) {
										topic = top || topic;
										// then add the message to the topic
										topic.messages.push(message._id);
										// and add it to the db
										db.append({ channel: channel, type: 'topics', entity: topic}).then();
									})
									.catch(function(err) {
										config.debug && console.error(err);
									})
									;							
							}
						})
						;
				}
			  , errorHandler: function onErrorHanlder(err) {
					config.debug && console.error(err);
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
			  , joinHandler: function joinHandler(channel, nick, message) {
					if(nick == config.irc.nick) {
						ircClient.say(channel,greetings);
					}
				}
			}
		  ;
		ircClient
			.addListener('error', handlers.errorHandler)
			.addListener('ping', handlers.pingHandler)
			.addListener('close', handlers.closeHandler)
			.addListener('join', handlers.joinHandler)
		//	.addListener('raw', handlers.rawHandler)
			;
		config.irc.options.channels.forEach(function(channel) {
			ircClient.addListener('message'+channel, handlers.messageHandler);
		});
		return ircClient;
	}
  ;
  
module.exports = ircProxy;