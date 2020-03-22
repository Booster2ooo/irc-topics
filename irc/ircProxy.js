var /* MODULES */
	// load irc module
	irc = require('irc')
	// load promise module
//  , Promise = require('es6-promise').Promise
	// load extend module
  , extend = require('extend')
    // utils module
  , utils = require('../utils/utils.js')
    // statsHelper module
  , statsModule = require('../utils/statsHelper.js')
  
  , ircProxy = function ircProxy(config, db) {
		// check whenever a configuration has been passed
		if(!config) throw 'IRC proxy: configuration not found';
		if(!db) throw 'IRC proxy: instance of dbProxy not found';
		var /* INSTANCES */
            // irc bot instance
            ircClient = new irc.Client(config.irc.server, config.irc.nick, config.irc.options)
          , statsHelper = statsModule(db)
		    /* VARIABLES */
			// text displayed when !help command is typed
		  , helpText = [
				"Hello, I'am "+config.irc.nick+" ("+config.project.name+" v"+config.project.version+"). I'm here to log messages in order to keep track of interesting things being said."
			  , "Every message can be assigned to a topic, allowing people to easily follow conversations even if they were off-line."
			  , "You can either use the web interface to assign a topic to a message or end your sentence with @topic_name."
			  , "Available commands (arguments marked with ? are optional, |channel| is the target channel if the command is used in private message):"
			  , "!help |channel| - displays the help you're reading right now"
			  , "!addRegExp |channel| [/regular expression/flags] [@topic name] - creates a new regular expression that will automatically assign matching messages to @topic_name"
			  , "!listRegExp |channel| - list existing regular expressions in the current channel"
			  , "!delRegExp |channel| [id] - removes a regular expression using its id"
			  , "!applyRegExp |channel| [id] - apply the regular expression to all messages /!\\ use with care"
			  , "!listTopics |channel| - list existing topics"
			  , "!descTopic |channel| [id] [description] - add a description to a topic (with no description)"
			  , "!last |channel| [count?] [@topic_name?] - get last messages (5 by default). You can get more than 5 messages by specifying a count. You can also specify a topic by giving its name (starting with @, case sensitive)"
			  , "!stats |channel| [period?: "+ utils.dateExpressions.join("|") +"?] [count?] - get [count] lines of stats for the specified period (default today)"
              , "!top |channel| [field: "+ statsHelper.topFields.join("|") + "?] [period?: "+ utils.dateExpressions.join("|") +"?] [count?] - get the top [count] of [field] in [period]"
			//  , "!log [on|off] - turns on or off the tracking of your messages in the channel the command has been send to"
			//  , "!logAll [on|off] - turns on or off the tracking of your messages in every channels the bot is present at the moment of the command"
			]
			// text displayed when the bot enters a channel
		  , greetings = "Hey! I'm here to log everything you say. Type !help for more info."
			// cooldowns are used to avoid flood if a users request the same command again an again
		  , cooldown = {
				help: []
			}
            // emojis list (used for stats)
          , emojis = [
                "(>_<)", "(>_<)>", "(';')", "(^^ゞ", "(^_^;)", "(-_-;)", "(~_~;)", "(・。・;)", "(・_・;)", "(・・;)", "^^;", "^_^;", "(#^.^#)", "(^^;)", ".。o○ ○o。.", "<コ:彡", "(^。^)y-.。o○", "(-。-)y-゜゜゜", "(-_-)zzz", "(^_-)", "(^_-)-☆", "((+_+))", "(+o+)", "(゜゜)", "(゜-゜)", "(゜.゜)", "(゜_゜)", "(゜_゜>)", "(゜レ゜)", "o)", "<(｀^´)>", "^_^", "(゜o゜)", "(^_^)/", "(^O^)／", "(^^)/", "(≧∇≦)/", "(/◕ヮ◕)/", "(^o^)丿", "∩(・ω・)∩", "(・ω・)", "^ω^", "(__)", "_(._.)_", "_(_^_)_", "<(_ _)>", "<m(__)m>", "m(__)m", "m(_ _)m", "(゜゜)～", "( ^^)", "_U~~", "_旦~~", "☆彡", "☆ミ", "＼(゜ロ＼)ココハドコ?", "(／ロ゜)／アタシハダアレ?", ">゜)))彡", "(Q))", "><ヨヨ", "(゜))<<", ">゜))))彡", "<゜)))彡", ">゜))彡", "<+))><<<", "*))>=<", "('_')", "(/_;)", "(T_T)", "(;_;)", "(;_:)", "(;O;)", "(:_;)", "(ToT)", "(Ｔ▽Ｔ)", ";_;", ";-;", ";n;", ";;", "Q.Q", "T.T", "QQ", "Q_Q", "(ー_ー)!!", "(-.-)", "(-_-)", "(一一)", "(；一_一)", "Ｃ:。ミ", "(=_=)", "~>゜)～～～　", "～゜・_・゜～　", "(=^・^=)", "(=^・・^=)", "=_^=", "(..)", "(._.)", "^m^", "(・・?", "(?_?)", "(－‸ლ)", ">^_^<", "<^!^>", "^/^", "（*^_^*）", "§^。^§", "(^<^)", "(^.^)", "(^ム^)", "(^・^)", "(^。^)", "(^_^.)", "(^_^)", "(^^)", "(^J^)", "(*^。^*)", "（＾－＾）", "(^^)/~~~", "(^_^)/~", "(;_;)/~~~", "(^.^)/~~~", "($・・)/~~~", "(@^^)/~~~", "(T_T)/~~~", "(ToT)/~~~", "●～*", "(V)o￥o(V)", "＼(~o~)／", "＼(^o^)／", "＼(-o-)／", "ヽ(^。^)ノ", "ヽ(^o^)丿", "(*^0^*)", "(*_*)", "(*_*;", "(+_+)", "(@_@)", "(@_@。", "(＠_＠;)", "＼(◎o◎)／！", "(-_-)/~~~ピシー!ピシー!", " !(^^)!", "(*^^)v", "(^^)v", "(^_^)v", "(＾▽＾)", "（・∀・）", "（　´∀｀）", "（⌒▽⌒）", "（＾ｖ＾）", "（’-’*)", "(~o~)", "(~_~)", "(p_-)", "((d[-_-]b))", "(-\"-)", "(ーー゛)", "(^_^メ)", "(-_-メ)", "(｀´）", "(~_~メ)", "(－－〆)", "(・へ・)", "<`～´>", "<`ヘ´>", "(ーー;)", "(^0_0^)", "( ..)φメモメモ", "φ(..)メモメモ", ":3ミ", ":->", "8-<", ":-)", ":-<", ":(", ":-(", ":)", ":|", ":-|", "（●＾o＾●）", "（＾ｕ＾）", "（＾◇＾）", "( ^)o(^ )", "(^O^)", "(^○^)", ")^o^(", "(*^▽^*)", "(✿◠‿◠)", "（￣ー￣）", "（￣□￣；）", "°o°", ":O", "o_O", "o_0", "o.O", "(o.o)", "（*´▽｀*）", "(*°∀°)=3", "（ ﾟ Дﾟ）", "（゜◇゜）", "(*￣m￣)", "ヽ（´ー｀）┌", "¯\\_(ツ)_/¯", "(´･ω･`)", "(‘A`)", "(*^3^)/~☆", ".....φ(・∀・＊)", "キタ━━━(゜∀゜)━━━!!!!! ", "(╯°□°）╯︵ ┻━┻", "┬──┬ ¯\\_(ツ)", "┻━┻︵ヽ(`Д´)ﾉ︵ ┻━┻", "┬─┬ノ( º _ ºノ)", "(ノಠ益ಠ)ノ彡┻━┻", ":D", ":o)", ":]", ":3", ":c)", ":>", "=]", "8)", "=)", ":}", ":^)", ":っ)", ":-D", "8-D", "8D", "x-D", "xD", "=-D", "=-3", "=3", "B^D", ":-))", ">:[", ":-c", ":c", ":っC", ":<", ":-[", ":[", ":{", ";(", ":-||", ":@", ">:(", ":'-(", ":'(", ":'-)", ":')", "D:<", "D:", "D8", "D;", "D=", "DX", "v.v", "D-':", ">:O", ":-O", "8-0", "o-o", ":*", ":-*", ":^*", ";-)", ";)", "*-)", "*)", ";-]", ";]", ";D", ";^)", ":-,", ">:P", ":-P", ":P", "X-P", "xp", ":-Þ", ":Þ", ":-b", ":b", ">:\\", ">:/", ":-/", ":-.", ":/", ":\\", "=/", ":L", ":S", ">.<", ":$", ":-X", ":X", ":-#", ":#", "O:-)", "0:-3", "03", "0:-)", "0:)", "0;^)", ">:)", ">;)", ">:-)", "}:-)", "}:)", "3:-)", "3:)", "o/\\o", "^5", ">_>^", "^<_<", "|;-)", "|-O", ":-J", ":-&", ":&", "#-)", "%-)", "%)", ":-###..", ":###..", "<:-|", "ಠ_ಠ", "(", "͡°", "͜ʖ", "͡°)(", "͡°͜", "͡°)", "<*)))-{", "><(((*>", "><>", "\\o/", "*\\0/*", "@}-;-'---", "@>-->--", "~(_8^(I)", "5:-)", "~:-\\", "//0-0\\\\", "*<|:-)", "=:o]", "7:^]", ",:-)", "</3", "<3"
            ]
          , emojisSet = new Set(emojis)
			// game terms (used for stats)
		  , gameRegExp = /@|jeu|game|perte|perdu|perdue|perdre|perdant|perdante|perd|perds|perda|perdais|perdait|perdaient|perdrais|perdrait|perdrai|perdra|perdras|lose|lost|perdu|g@me|gayme|賽|遊|spel|jeux|spiel|juego/g

			/* FUNCTIONS */
			// try to find and execute a bot command
		  , tryCommand = function tryCommand(channel, nick, textParts) {
				return new Promise(function(resolve, reject) {
					// if the first letter of the first word isn't !, then assume it's not a command
					if(textParts[0][0] != "!") {
						return reject('No command found');
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
					if(!commandsRoutes[command.trigger] || !commandsRoutes.hasOwnProperty(command.trigger) || typeof(commandsRoutes[command.trigger]) !== typeof(function(){})) {
						// unknown command
						reject('Unknown command');
					}
                    // check if is cooling down
                    if(isCoolingdown(command)) {
                        // resolve ( don't log )
                        return resolve();
                    }
					// try to execute command
					commandsRoutes[command.trigger](command)
						.then(resolve)
					//	.catch(reject)
					// resolve anyway ? we don't want the bot to log the command even if the command failed
						.catch(resolve)
						;
				});
			}
		  , isCoolingdown = function isCoolingdown(cmd) {
                cooldown[cmd.trigger] = cooldown[cmd.trigger] || [];
                // check if there is a cooldown for that user
                return cooldown[cmd.trigger].indexOf(cmd.nick) > -1;
            }
          , initCooldown = function initCooldown(cmd, timeout) {
                timeout = timeout || 10000;
                cooldown[cmd.trigger] = cooldown[cmd.trigger] || [];
                // add a cooldown for this command
                cooldown[cmd.trigger].push(cmd.nick);
                // and remove it 10 seconds later
                setTimeout(function() {
                    var idx = cooldown[cmd.trigger].indexOf(cmd.nick);
                    if(idx > -1) {
                        cooldown[cmd.trigger].splice(idx,1);
                    }
                }, timeout);
            }
		  , announceTop = function announceTop() {
                config.irc.options.channels.forEach(function(channel) {
                    var date = new Date()
                      , statsContext = {
                            field: 'words'
                          , period: 'yesterday'
                          , limit: 5
                          , channel: channel
                        }
                      ;
                    statsHelper
                        .getStats(statsContext)
                        .then(function(stats) {
                            var msg = "Top " + statsContext.limit + " " + statsContext.field + " count (" +  statsContext.period + ") --- ";
                            stats.forEach(function(line, idx) {
                                msg += (idx+1).toString() + '. ' + line.author + ': ' + line[statsContext.field] + ' | ';
                            });
                            ircClient.say(channel, msg.substr(0, msg.length - 2));
                            date.setDate(date.getDate() - 1);
                            if(date.getDay() != 0) {
                                throw "Not Sunday";
                            }
                            statsContext.period = 'lastweek';
                            return statsHelper.getStats(statsContext);
                        })
                        .then(function(stats) {
                            var msg = "Top " + statsContext.limit + " " + statsContext.field + " count (" +  statsContext.period + ") --- ";
                            stats.forEach(function(line, idx) {
                                msg += (idx+1).toString() + '. ' + line.author + ': ' + line[statsContext.field] + ' | ';
                            });
                            ircClient.say(channel, msg.substr(0, msg.length - 2));
                            resolve();
                        })
                        .catch(function(err) {
                            config.debug && console.error(err);
                            config.debug && err.stack && console.error(err.stack);
                        });
                });
            }
          , announceTimer = function accounceTimer() {
                var now = new Date()
                  , when = new Date()
                  , intervalMs
                  ;
                when.setHours(0,10,0,0);
                when.setDate(when.getDate() + 1);
                intervalMs = when.getTime() - now.getTime();
                setTimeout(function() {
                    announceTop();
                    announceTimer();
                }, intervalMs);
            }

			/* BOT COMMANDS */
			// reroute commands to function
		  , commandsRoutes = {
			/*	// !log command router
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
			  ,*/help: function help(cmd) {
					return new Promise(function(resolve, reject){
						// reroute to commands.help
						commands.help(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , addRegExp: function addRegExp(cmd) {
					return new Promise(function(resolve, reject){
						commands.addRegExp(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , listRegExp: function listRegExp(cmd) {
					return new Promise(function(resolve, reject){
						commands.listRegExp(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , delRegExp: function delRegExp(cmd) {
					return new Promise(function(resolve, reject){
						commands.delRegExp(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , applyRegExp: function applyRegExp(cmd) {
					return new Promise(function(resolve, reject){
						commands.applyRegExp(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , listTopics: function listTopics(cmd) {
					return new Promise(function(resolve, reject){
						commands.listTopics(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , descTopic: function descTopic(cmd) {
					return new Promise(function(resolve, reject){
						commands.descTopic(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
			  , last: function last(cmd) {
					return new Promise(function(resolve, reject){
						commands.last(cmd)
							.then(resolve)
							.catch(reject)
							;
					});
				}
              , stats: function stats(cmd) {
                    return new Promise(function(resolve, reject){
                        commands.stats(cmd)
                            .then(resolve)
                            .catch(reject)
                            ;
                    });
                }
              , top: function rop(cmd) {
                    return new Promise(function(resolve, reject){
                        commands.top(cmd)
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
                        initCooldown(cmd);
						// display each line of the help text
						helpText.forEach(function(line, idx) {
                            setTimeout(function() {
							    ircClient.say(cmd.nick, line);
                            }, 500 * (idx+1));
						});
						// always resolve the promise
						resolve();
					});
				}
			  , addRegExp: function addRegExp(cmd) {
					return new Promise(function(resolve, reject) {
						var cmdLine = cmd.args.join(' ')
						  , cmdExtract = /\/(.*)\/([g|m|i]{0,3})\s(.*)/g
						  , matches = cmdExtract.exec(cmdLine)
						  , regexp = {
								expression: matches && matches[1] ? matches[1] : ''
							  , flags: matches && matches[2] ? matches[2] : ''
							  , topic: matches && matches[3] ? matches[3].replace(/\s/g,'_') : ''
							}
						  ;
                        initCooldown(cmd);
						if(!matches || !regexp.expression || !regexp.topic) {
							var err = "!addRegExp invalid arguments";
							ircClient.say(cmd.nick, err);
							reject(err);
							return;
						}
						if(regexp.topic[0] != '@') {
							regexp.topic = '@' + regexp.topic;
						}
						db.get({
							channel: cmd.channel
						  , type: 'regexp'
						  , query: regexp
						})
						.then(function(entity) {
							if(entity) {
								ircClient.say(cmd.nick, 'regexp already exists');
								resolve();
								throw 'regexp already exists';
							}
							return db.append({
								channel: cmd.channel
							  , type: 'regexp'
							  , entity: regexp
							});
						})
						.then(function(entity) {
							return db.get({
								channel: cmd.channel
							  , type: 'topics'
							  , query: { name: regexp.topic }
							});
						})
						.then(function(topic) {
							ircClient.say(cmd.nick, 'regexp added');
							if(topic) {
								resolve();
								throw 'topic already exists';
							}
							topic = {
								name: regexp.topic
							  , description: ''
							  , messages: []
							};
							return db.append({
								channel: cmd.channel
							  , type: 'topics'
							  , entity: topic
							});
						})
						.then(function(topic) {
							resolve();
						})
						.catch(function(err) {
							config.debug && console.error(err);
							reject(err);
						});
					});
				}
			  , listRegExp: function listRegExp(cmd) {
					return new Promise(function(resolve, reject) {
                        initCooldown(cmd);
						db.getAll({
							channel: cmd.channel
						  , type: 'regexp'
						})
						.then(function(regexps) {
							if(!regexps || !regexps.length) {
								ircClient.say(cmd.nick, 'No regular expressions found for ' + cmd.channel);
								resolve();
							}
							else {
								ircClient.say(cmd.nick, 'List of regular expressions found for ' + cmd.channel);
								regexps.forEach(function(line) {
									ircClient.say(cmd.nick, 'id: ' + line._id + ' | expression:' + line.expression + ' | flags: '+ line.flags + ' | topic: ' + line.topic);
								});
								resolve();
							}
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , delRegExp: function delRegExp(cmd) {
					return new Promise(function(resolve, reject) {
						var id = cmd.args[0];
                        initCooldown(cmd);
						if(!id) {
							var err = "!delRegExp invalid arguments, you must provide an id";
							ircClient.say(cmd.nick, err);
							reject(err);
							throw err;
						}
						db.remove({
							channel: cmd.channel
						  , type: 'regexp'
						  , query: { _id: id }
						})
						.then(function(count) {
							ircClient.say(cmd.nick,'regexp removed');
							resolve();
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , applyRegExp: function applyRegExp(cmd) {
					return new Promise(function(resolve, reject) {
						var id = cmd.args[0]
						  , regexp = {}
						  , topic = {}
						  , messages = []
						  ;
						if(!id) {
							var err = "!applyRegExp invalid arguments, you must provide an id";
							ircClient.say(cmd.nick, err);
							reject(err);
							throw err;
						}
                        initCooldown(cmd, 3600000);
						db.get({
							channel: cmd.channel
						  , type: 'regexp'
						  , query: { _id: id }
						})
						.then(function(reg) {
							if(!reg) {
								var err = 'Regular expression not found for ' + cmd.channel;
								ircClient.say(cmd.nick, err);
								resolve();
								throw err;
							}
							regexp = reg;
							return db.get({
								channel: cmd.channel
							  , type: 'topics'
							  , query: { name: regexp.topic}
							});
						})
						.then(function(top) {
							if(!top) {
								var err = 'No topic associated with the regular expression';
								ircClient.say(cmd.nick, err);
								resolve();
								throw err;
							}
							topic = top;
							return db.getAll({
								channel: cmd.channel
							  , type: 'messages'
							  , query: {
									text: {
										$regex: regexp.expression
									  , $options: regexp.flags.replace('g','s')
									}
								}
							  , projection: { _id: 1 }
							});
						})
						.then(function(mess) {
							if(!mess) {
								var err = 'No message seems to match the regular expression';
								ircClient.say(cmd.nick, err);
								resolve();
								throw err;
							}
							messages = mess;
							mess = [];
							topic.messages = topic.messages || [];
							messages.forEach(function(message) {
								if(topic.messages.indexOf(message._id.toString()) == -1) {
									topic.messages.push(message._id.toString());
								}
							});
							return db.append({ channel: cmd.channel, type: 'topics', entity: topic});
						})
						.then(function() {
							ircClient.say(cmd.nick, messages.length + ' messages added to the ' + topic.name + ' topic');
							resolve(messages);
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , listTopics: function listTopics(cmd) {
					return new Promise(function(resolve, reject) {
                        initCooldown(cmd);
						db.getAll({
							channel: cmd.channel
						  , type: 'topics'
						})
						.then(function(topics) {
							if(!topics || !topics.length) {
								ircClient.say(cmd.nick, 'No topics found for ' + cmd.channel);
								resolve();
							}
							else {
								ircClient.say(cmd.nick, 'List of topics found for ' + cmd.channel);
								topics.forEach(function(line) {
									ircClient.say(cmd.nick, 'id: ' + line._id + ' | name:' + line.name + ' | description: '+ line.description);
								});
								resolve();
							}
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , descTopic: function descTopic(cmd) {
					return new Promise(function(resolve, reject) {
						var id = cmd.args[0]
						  , desc = cmd.args.slice(1).join(' ')
						  ;
                        initCooldown(cmd);
						if(!id || id.length != 24) {
							var err = "!descTopic invalid arguments, you must provide an id";
							ircClient.say(cmd.nick, err);
							reject(err);
							throw err;
						}
						if(!desc) {
							var err = "!descTopic invalid arguments, you must provide a description";
							ircClient.say(cmd.nick, err);
							reject(err);
							throw err;
						}
						db.get({
							channel: cmd.channel
						  , type: 'topics'
						  , query: { _id: id }
						})
						.then(function(topic) {
							if(!topic) {
								ircClient.say(cmd.nick, 'Topic not found');
								resolve();
							}
							if(topic.description) {
								ircClient.say(cmd.nick, 'The topic already have a description');
								resolve();
							}
							else {
								topic.description = desc;
								db.append({
									channel: cmd.channel
								  , type: 'topics'
								  , entity: topic
								}).then(function(topic) {
									ircClient.say(cmd.nick, 'The topic have been described successfully');
									resolve();
								});
							}
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , last: function last(cmd) {
					return new Promise(function(resolve, reject) {
						var count = parseInt(cmd.args[0], 10) || 5
						  , topicName = cmd.args[1]
						  , getTopicPromise = new Promise(function(resolve, reject) { resolve(); })
						  ;
                        initCooldown(cmd);
						if(isNaN(count)) {
							if(!topicName) {
								topicName = count;
							}
							count = 5;
						}
						else if(count > 100) { count = 100; }
						if(topicName) {
							if(topicName[0] != '@') {
								topicName = '@' + topicName;
							}
							getTopicPromise = db.get({
								channel: cmd.channel
							  , type: 'topics'
							  , query: { name: topicName }
							});
						}
						getTopicPromise
						.then(function(topic) {
							var query = topic ? { _id: { $in: topic.messages } } : {};
							return db.getAll({
								channel: cmd.channel
							  , type: 'messages'
							  , query: query
							  , limit: count
							  , sort: { timestamp: -1 }
							});
						})
						.then(function(messages) {
							messages.forEach(function(line, idx) {
                                setTimeout(function() {
                                    ircClient.say(cmd.nick, utils.formatStamp(line.timestamp).datetime + ' | ' + line.author + ' > ' + line.text);
                                }, 500 * (idx+1));
							});
							resolve();
						})
						.catch(function(err) {
							reject(err);
						});
					});
				}
			  , stats: function stats(cmd) {
					return new Promise(function(resolve, reject) {
						var period = cmd.args[0]
                          , limit = cmd.args[1]
                          , statsContext = {}
                          ;
                        initCooldown(cmd, 15000);
                        if(!period) {
                            period = utils.dateExpressions[0];
                            limit = 5;
                        }
                        else if(!isNaN(period) && (!limit || isNaN(limit))) {
                          limit = period;
                        }
                        else if(!limit) {
                            limit = 5;
                        }
                        if(limit > 50) { limit = 50; }
						statsContext.period = utils.dateExpressions.indexOf(period) > -1 ? period : utils.dateExpressions[0];
                        statsContext.channel = cmd.channel;
                        statsContext.limit = limit;
						statsHelper
                            .getStats(statsContext)
                            .then(function(stats) {
                                ircClient.say(cmd.nick, "Stats ("+ statsContext.period +")");
                                stats.forEach(function(line, idx) {
                                    setTimeout(function() {
                                        ircClient.say(
                                            cmd.nick
                                          , '#' + (idx+1) + '. '+ line.author +
                                            ' - words: ' + line.words +
                                            ' - lines: ' + line.lines +
                                            ' - links: ' + line.links +
                                            ' - emojis: ' + line.emojis +
                                            ' - game losses: ' + line.gameLost +
                                            ' - game terms: ' + line.gameTerms +
                                            ' - words per line: ' + line.wordsPerLine +
                                            ' - links per line: ' + line.linksPerLine +
                                            ' - emojis per line: ' + line.emojisPerLine +
                                            ' - game losses per line: ' + line.gameLostPerLine +
                                            ' - game terms per line: ' + line.gameTermsPerLine
                                        );
                                    }, 500 * (idx+1));
                                });
                                resolve();
                            })
                            .catch(function(err) {
                                reject(err);
                            });
					});
				}
              , top: function top(cmd) {
					return new Promise(function(resolve, reject) {
						var field = cmd.args[0]
                          , period = cmd.args[1]
                          , limit = cmd.args[2]
                          , statsContext = {}
                          ;
                        initCooldown(cmd, 15000);
                        if(!limit) {
                            limit = 5;
                        }
                        if(!period) {
                            period = utils.dateExpressions[0];
                        }
                        if(!field) {
                            field = statsHelper.topFields[0];
                        }
                        if(isNaN(period)) {
                            if(utils.dateExpressions.indexOf(period) == -1) {
                                period = utils.dateExpressions[0];
                            }
                        }
                        else {
                            limit = parseInt(period,10);
                            period = utils.dateExpressions[0];
                        }

                        if(isNaN(field)) {
                            if(statsHelper.topFields.indexOf(field) == -1) {
                                if (period && !isNaN(period)) {
                                    limit = parseInt(period,10);
                                }
                                if(utils.dateExpressions.indexOf(field) > -1) {
                                    period = field;
                                }
                                else {
                                    if (period && !isNaN(period)) {
                                        if(!limit || isNaN(limit)) {
                                            limit = parseInt(period,10);
                                        }
                                    }
                                    period = utils.dateExpressions[0];
                                }
                                field = statsHelper.topFields[0];
                            }
                        }
                        else {
                            limit = parseInt(field, 10);
                            field = statsHelper.topFields[0];
                            period = utils.dateExpressions[0];
                        }
                        if(limit > 100) { limit = 100; }
                        statsContext.channel = cmd.channel;
                        statsContext.period = period;
                        statsContext.limit = limit;
                        statsContext.field = field;
						statsHelper
                            .getStats(statsContext)
                            .then(function(stats) {
                                var msg = '';
                                ircClient.say(cmd.nick, "Top " + statsContext.limit + " " + statsContext.field + " count (" +  statsContext.period + ")");
                                stats.forEach(function(line, idx) {
                                    msg += (idx+1).toString() + '. ' + line.author + ': ' + line[statsContext.field] + ' | ';
                                    if((idx+1) % 10 == 0) {
                                        ircClient.say(cmd.nick, msg.substr(0, msg.length - 2));
                                        msg='';
                                    }
                                });
                                ircClient.say(cmd.nick, msg.substr(0, msg.length - 2));
                                resolve();
                            })
                            .catch(function(err) {
                                reject(err);
                            });
					});
				}
			}
			
			/* HANDLERS */
		  , handlers = {
				messageHandler: function messageHandler(nick, text, packet) {
					var textParts = text.split(' ')
					  , channel = packet.args[0].toLowerCase()
					  , topic
					  , message
                      , stat = {
                            author: nick
                          , date: (new Date()).setHours(0,0,0,0)
                          , lines: 1
                          , words: textParts.length
                          , links: 0
						  , emojis: 0
						  , gameLost: 0
						  , gameTerms: 0
                        }
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
                            /** Not used, gets messy -> removed
							/*if(textParts[textParts.length-1][0] == '@') {
								// pop out the last word from the textPart array as the topic name [review] (use some kind of constructor?)
								topic = {
									name: textParts.pop()
								  , description: ''
								  , messages: []
								};
							}*/
							
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
											  //, text: textParts.join(' ') // ~ used to remove the trailing @topic at the end of the sentence, but it's probably better to keep it there
                                              , text: text
											};
											// insert the message in the db
											return db.append({channel: channel, type: 'messages', entity: message});
										}
										throw "user doesn't allow log";
									})
									.then(function(msg) {
										// replace in memory message by the one in db
										message = msg;										
										// detect regexp defined topic
										db.getAll({
											channel: channel
										  , type: 'regexp'
										})
										.then(function(regexps) {
											var topicQueue = [];
											// for each regexp
											regexps.forEach(function(regexp) {
												var regexpInstance = new RegExp(regexp.expression, regexp.flags);
												// check if it match
												if(regexpInstance.test(message.text)) {
													// then get its topic
													topicQueue.push(db.get({ channel: channel, type: 'topics', query: { name: regexp.topic}}));
                                                    if(regexp.topic === "@URL_Bookmark") {
                                                        stat.links++;
                                                    }
												}
											});
											Promise.all(topicQueue)
												.then(function(topics) {
													// for all topics
													topics.forEach(function(top) {
														// add the message
														top.messages.push(message._id);
														// and add it to the db
														db.append({ channel: channel, type: 'topics', entity: top}).then();
													});
												})
												.catch(function(err) {
													config.debug && console.error(err);
												});
										})
										.catch(function (err) {
											config.debug && console.error(err);
										});
                                        // looking for emojis & game terms
                                        for(var i = 0, c = textParts.length; i<c; i++) {
                                            if(emojisSet.has(textParts[i])) {
                                                stat.emojis++;
											}
										}
										var gameMatches = message.text.match(gameRegExp);
										if (gameMatches) {
											stat.gameLost = 1;
											stat.gameTerms += gameMatches.length;
										}
                                        //creating or updating stats
                                        db.get({
                                            channel: channel
                                          , type: 'stats'
                                          , query: { $and: [ { author: stat.author }, { date: stat.date } ] }
                                        })
                                        .then(function(dbstat) {
                                            if(!dbstat) {
                                                return db.append({ channel: channel, type: 'stats', entity: stat});
                                            }
                                            dbstat.lines += stat.lines;
                                            dbstat.words += stat.words;
                                            dbstat.links += stat.links;
											dbstat.emojis += stat.emojis;
											if (dbstat.gameLost) 
												dbstat.gameLost += stat.gameLost;
											else
												dbstat.gameLost = stat.gameLost;
											if (dbstat.gameTerms)
												dbstat.gameTerms += stat.gameTerms;
											else
												dbstat.gameTerms = stat.gameTerms;
                                            return db.append({ channel: channel, type: 'stats', entity: dbstat});
                                        })
                                        .catch(function (err) {
                                            config.debug && console.error(err);
                                        });

										// check if a topic is associated with @topic
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
			  , pmHandler: function pmHandler(nick, text, packet) {
                    var textParts = text.split(' ')
                      , cmd = textParts[0]
                      , channel = textParts.splice(1,1)[0]
                      , trigger = cmd.substr(1,cmd.length-1)
                      ;
                    if(cmd[0] !== '!') {
                        return;
                    }

                    if(!commandsRoutes[trigger] || !commandsRoutes.hasOwnProperty(trigger) || typeof(commandsRoutes[trigger]) !== typeof(function(){})) {
                        return;
                    }

                    if(!channel) {
                        return;
                    }
                    channel = channel.toLowerCase();
                    if(channel[0] !== '#') {
                        ircClient.say(nick, 'You must specify a target channel right after the command is order to use it in private.');
                        return;
                    }
                    else if(config.irc.options.channels.indexOf(channel) == -1) {
                        ircClient.say(nick, 'Invalid channel.');
                        return;
                    }
                    packet.args.reverse();
                    packet.args.push(channel);
                    packet.args.reverse();
                    text = textParts.join(' ');
                    handlers.messageHandler(nick, text, packet);
                }
            }
		  ;
		ircClient
			.addListener('error', handlers.errorHandler)
			.addListener('ping', handlers.pingHandler)
			.addListener('close', handlers.closeHandler)
		//	.addListener('join', handlers.joinHandler)
		//	.addListener('raw', handlers.rawHandler)
            .addListener('pm', handlers.pmHandler)
			;
		config.irc.options.channels.forEach(function(channel) {
			ircClient.addListener('message'+channel, handlers.messageHandler);
		});
        announceTimer();
		return ircClient;
	}
  ;
  
module.exports = ircProxy;