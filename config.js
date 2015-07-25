#!/usr/bin/env node

var 
	/* MODULES */
	// load os module
	os = require('os')

	/* VARIABLES */
	// define app configuration
  , config = {
		// define if the application should output debug informations
		debug: true
		// irc module configuration
	  , irc: {
			// define the path where the logs will be stored at
			logsDirectory: 'logs/'
			// define the name of the file where the error logs will be stored at
		  , errorLogs: 'irc_errors'
			// define the name of the file where the raw messages logs will be stored at
		  , rawLogs: 'irc_raw'
			// define the name of the file where the channel messages logs will be stored at
		  , messageLogs: 'irc_messages'
			// define the irc server used by the bot
		  , server: 'irc.big-daddy.fr'
			// define the nickname of the bot
		  , nick: 'logBotTest'
			// define the options for the bot constructor (see https://node-irc.readthedocs.org/en/latest/API.html)
		  , options: {
				userName: 'logBotTest'
			  , realName: 'nodeJS LogBot'
			  , port: 6697
			  , autoRejoin: true
			  , autoConnect: true
			  , channels: ['#testbot']
			  , secure: true
			  , selfSigned: true
			  , certExpired: true
			  , stripColors: true
			  , encoding: 'UTF-8'
			}
		}
		// database module configuration
	  , db: {
			// irc/channel related databases
			channels {
				// users databases file prefix (#chan will be appended at the end to identify each channel)
				users: './db/users'
				// messages databases file prefix (#chan will be appended at the end to identify each channel)
			  , messages: './db/messages'
				// topics databases file prefix (#chan will be appended at the end to identify each channel)
			  , topics: './db/topics'
			}
			// events signature
		  , events: {
				/* INIT */
				// all DBs initializing
				dbInitializing: 'dbProxy.dbInitializing'
				// all DBs initialized
			  , dbInitialized: 'dbProxy.dbInitialized'
				// error initialize all DBs
			  , dbInitializeError: 'dbProxy.dbInitializeError'
				// #chan DB initializing
			  , channelInitializing: 'dbProxy.channelInitializing'
				// #chan DB initialized
			  , channelInitialized: 'dbProxy.channelInitialized'
				// #chan DB initialize error
			  , channelInitializeError: 'dbProxy.channelInitializeError'
			  
				/* LOAD */
				// all DBs loading
			  , dbLoading: 'dbProxy.dbLoading'
				// all DBs loaded
			  , dbLoaded: 'dbProxy.dbLoaded'
				// error loading all DBs
			  , dbLoadError: 'dbProxy.dbLoadError'
				// #chan DB loading
			  , channelLoading: 'dbProxy.channelLoading'
				// #chan DB loadded
			  , channelLoaded: 'dbProxy.channelLoaded'
				// #chan DB load error
			  , channelLoadError: 'dbProxy.channelLoadError'
			}
		}
		// define the constant EOL for the current OS
	  , osEOL: os.EOL
	}
  ;
  
module.exports = config;