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
  , irc_client = new irc.Client(config.irc_server, config.irc_nick, config.irc_options)
  
	/* FUNCTIONS */
	// converts an object to a string
  , object_to_custom_string = function object_to_custom_string(object) {
		var output_string = '';
		// if object argument is not passed, we assume the function has been called from the prototype
		object = object || this;
		// if the object exists
		if(object) {
			// loop on each property of the object
			for (var property in object) {
				if(object.hasOwnProperty(property)) {
					// append the property to the formated string (needs sanitization?) [review]
					// what about arrays & nested objects (circular refs?) ? [review]
					output_string += property + ': ' + object[property] + ' | ';
				}
			}
		}
		return output_string;
	}
	// format an irc message
  , format_irc_message = function irc_log_message(message) {
		// get the current timestamp
		var timestamp = process.hrtime()
		// create a formated string message starting with the timestamp
		  , formated_message = timestamp.toString() + ' | '
		  ;
		// transform the message object to a string
		formated_message += message.toCustomString();
		// add the EOL chars at the end of the line
		formated_message += config.osEOL;
		return formated_message;
	}
	// console log function
  , log_console = function(title, object) {
	    // if object is not empty
		if(object) {
			// log to the console
			console.log(title + ': ');
			console.log(object);
		}
	}
	// IRC messages logging function
  , log_irc_message = function log_irc_message(source_handler, message) {
			// compute output file name
		var outputFile = config['irc_logs_directory'] + config['irc_' + source_handler + '_logs']
			// format incoming message
		  , formated_message = format_irc_message(message)
		  , chan = ''
		  ;
		// if the source handler is a message & it comes from a channel
		if(source_handler === 'message' && message.args[0][0] == '#') {
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
		config.debug && log_console('IRC ' + source_handler.toUpperCase() + chan, message);
		// write a line to the log file 
		fs.appendFile(outputFile, formated_message, fs_handlers.error_handler);
		// debug test
		config.debug && console.log(chanlogs);
    }
	
	/* HANDLERS */
	// irc event handlers
  , irc_handlers = {
		// error event handler, mandatory
		error_handler: function errorHandler(message) {
			log_irc_message('error', message);
		}
		// raw event handler
	  , raw_handler: function rawHandler(message) {
			log_irc_message('raw', message);
		}
		// channel message event handler
	  , channel_message_handler: function messageHandler(nick, text, message) {
			log_irc_message('message', message);
		}
	}
	// file system handlers
  , fs_handlers = {
		// error event handler
		error_handler: function errorHandler(error) {
			// if debug is enabled, log a line to the console
			config.debug && log_console('fs.appendFile ERROR', error);
		}
	}
  ;

// attach handlers
irc_client
	.addListener('error', irc_handlers.error_handler)
	.addListener('raw', irc_handlers.raw_handler)
	;
config.irc_options.channels.forEach(function(channel) {
	irc_client.addListener('message'+channel, irc_handlers.channel_message_handler);
});

// prototype modding (? beurk ?) [review]
Object.prototype.toCustomString = object_to_custom_string;