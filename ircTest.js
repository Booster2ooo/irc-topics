#!/usr/bin/env node

var 
	/* MODULES */
	// load filesystem module
	fs = require('fs')
	// load os module
//  , os = require('os')
	// load irc module
  , irc = require('irc')
	// load promise module
  , Promise = require('es6-promise').Promise
	// load config module
  , config = require('./config.js')
  
	/* VARIABLES */
  , chanlogs = {}
	
	/* INSTANCES */
	// init irc bot connection
  , ircClient = new irc.Client(config.irc.server, config.irc.nick, config.irc.options)
  
	/* FUNCTIONS */
	// converts an object to a string
  , objectToCustomString = function objectToCustomString(object) {
		var outputString = '';
		// if object argument is not passed, we assume the function has been called from the prototype
		object = object || this;
		// if the object exists
		if(object) {
			// loop on each property of the object
			for (var property in object) {
				if(object.hasOwnProperty(property)) {
					// append the property to the formated string (needs sanitization?) [review]
					// what about arrays & nested objects (circular refs?) ? [review]
					outputString += property + ': ' + object[property] + ' | ';
				}
			}
		}
		return outputString;
	}
	// format an irc message
  , formatIrcMessage = function formatIrcMessage(message) {
		// get the current timestamp
		var timestamp = process.hrtime()
		// create a formated string message starting with the timestamp
		  , formatedMessage = timestamp.toString() + ' | '
		  ;
		// transform the message object to a string
		formatedMessage += message.toCustomString();
		// add the EOL chars at the end of the line
		formatedMessage += config.osEOL;
		return formatedMessage;
	}
	// console log function
  , logConsole = function(title, object) {
	    // if object is not empty
		if(object) {
			// log to the console
			console.log(title + ': ');
			console.log(object);
		}
	}
	// IRC messages logging function
  , logIrcMessage = function logIrcMessage(sourceHandler, message) {
			// compute output file name
		var outputFile = config.irc['logsDirectory'] + config.irc[sourceHandler + 'Logs']
			// format incoming message
		  , formatedMessage = formatIrcMessage(message)
		  , chan = ''
		  ;
		// if the source handler is a message & it comes from a channel
		if(sourceHandler === 'message' && message.args[0][0] == '#') {
			// define channel
			chan = message.args[0]
			// append the channel at the end of the file
			outputFile += chan;
			// if the chanlog doesn't exists, create one
			if(!chanlogs.hasOwnProperty(chan)) {
				chanlogs[chan] = [];
			}
			// append the message to the chanlog
			chanlogs[chan].push(message);
		}
		// if debug is enabled, log a line to the console
		config.debug && logConsole('IRC ' + sourceHandler.toUpperCase() + chan, message);
		// write a line to the log file 
		fs.appendFile(outputFile, formatedMessage, fsHandlers.errorHandler);
		// debug test
		config.debug && console.log(chanlogs);
    }
	
	/* HANDLERS */
	// irc event handlers
  , ircHandlers = {
		// error event handler, mandatory
		errorHandler: function errorHandler(message) {
			logIrcMessage('error', message);
		}
		// raw event handler
	  , rawHandler: function rawHandler(message) {
			logIrcMessage('raw', message);
		}
		// channel message event handler
	  , channelMessageHandler: function channelMessageHandler(nick, text, message) {
			logIrcMessage('message', message);
		}
	}
	// file system handlers
  , fsHandlers = {
		// error event handler
		errorHandler: function errorHandler(error) {
			// if debug is enabled, log a line to the console
			config.debug && logConsole('fs.appendFile ERROR', error);
		}
	}
  ;

// attach handlers
ircClient
	.addListener('error', ircHandlers.errorHandler)
	.addListener('raw', ircHandlers.rawHandler)
	;
config.irc.options.channels.forEach(function(channel) {
	irc_client.addListener('message'+channel, ircHandlers.channelMessageHandler);
});

// prototype modding (? beurk ?) [review]
Object.prototype.toCustomString = objectToCustomString;