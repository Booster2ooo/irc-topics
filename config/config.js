#!/usr/bin/env node

var 
	/* MODULES */
	// load os module
	os = require('os')
	// load package.json for project informations
  , packageInfos = require('./../package.json')

	/* VARIABLES */
	// define app configuration
  , config = {
		// define if the application should output debug informations
		debug: true
		// irc module configuration
	  , irc: {
			// define the path where the logs will be stored at
//			logsDirectory: 'logs/'
			// define the name of the file where the error logs will be stored at
//		  , errorLogs: 'irc_errors'
			// define the name of the file where the raw messages logs will be stored at
//		  , rawLogs: 'irc_raw'
			// define the name of the file where the channel messages logs will be stored at
//		  , messageLogs: 'irc_messages'
			// define the irc server used by the bot
			server: 'irc.server.net'
			// define the nickname of the bot
		  , nick: 'LogTopicTEST'
			// define the options for the bot constructor (see https://node-irc.readthedocs.org/en/latest/API.html)
		  , options: {
				userName: 'LogTopicTEST'
			  , realName: 'nodeJS LogBot'
			  , port: 6697
			  , autoRejoin: true
			  , autoConnect: true
			  , channels: ['#chan1', '#chan2']
			  , secure: true
			  , selfSigned: true
			  , certExpired: true
			  , stripColors: true
			  , encoding: 'UTF-8'
			}
		}
		// www module configuration
	  , www: {
			port: 8081
		}
		// database module configuration
	  , db: {
			// irc/channel related databases
			channels: {
				// users databases file prefix (#chan will be appended at the end to identify each channel)
				users: './data/db/users'
				// messages databases file prefix (#chan will be appended at the end to identify each channel)
			  , messages: './data/db/messages'
				// topics databases file prefix (#chan will be appended at the end to identify each channel)
			  , topics: './data/db/topics'
				// regexp databases file prefix
			  , regexp: './data/db/regexp'
				// stats databases file prefix
			  , stats: './data/db/stats'
			}
			// mongoDB connection URL
		  , mongoURL: 'mongodb://localhost:27017/irc-topics'
			// mongo client options
		  , mongoOptions: {
				db: {
					w: 1
				  , wtimeout: 0
				  , forceServerObjectId: true
				}
			  , server: {
					poolSize: 10
				}
			}
			// events signature
		  , events: {
				/* INIT */
				// data context initialization
				dataContextInitializing: 'dbProxy.dataContextInitializing'
				// data context initialized
			  , dataContextInitialized: 'dbProxy.dataContextInitialized'
				// error initializing data context
			  , dataContextInitializeError: 'dbProxy.dataContextInitializeError'
				// #chan DB initialization
			  , channelInitializing: 'dbProxy.channelInitializing'
				// #chan DB initialized
			  , channelInitialized: 'dbProxy.channelInitialized'
				// #chan DB initialize error
			  , channelInitializeError: 'dbProxy.channelInitializeError'
			  
				/* LOAD */
				// data context loading
			  , dataContextLoading: 'dbProxy.dataContextLoading'
				// data context loaded
			  , dataContexLoaded: 'dbProxy.dataContexLoaded'
				// error loading data context
			  , dataContexLoadError: 'dbProxy.dataContexLoadError'
				// #chan DB loading
			  , channelLoading: 'dbProxy.channelLoading'
				// #chan DB loadded
			  , channelLoaded: 'dbProxy.channelLoaded'
				// #chan DB load error
			  , channelLoadError: 'dbProxy.channelLoadError'
			  
				/* QUERIES */
				// getAll method success
			  , getAllSuccess: 'dbProxy.getAllSuccess'
				// getAll method failed
			  , getAllError: 'dbProxy.getAllError'
				// get method success
			  , getSuccess: 'dbProxy.getSuccess'
				// get method failed
			  , getError: 'dbProxy.getError'
				// count method success
			  , countSuccess: 'dbProxy.countSuccess'
				// count method failed
			  , countError: 'dbProxy.countError'
				// append method success
			  , appendSuccess: 'dbProxy.appendSuccess'
				// append method failed
			  , appendError: 'dbProxy.appendError'
				// insert from append success
			  , insertSuccess: 'dbProxy.insertSuccess'
				// insert from append method failed
			  , insertError: 'dbProxy.insertError'
				// update from append success
			  , updateSuccess: 'dbProxy.updateSuccess'
				// update from append method failed
			  , updateError: 'dbProxy.updateError'
				// remove method success
			  , removeSuccess: 'dbProxy.removeSuccess'
				// remove method failed
			  , removeError: 'dbProxy.removeError'
			}
		}
		// Get some project infos
	  , project: {
			name: packageInfos.name
		  , version: packageInfos.version
		  , author: packageInfos.author
		  , license: packageInfos.license
		}
		// define the constant EOL for the current OS
	  , osEOL: os.EOL
	}
  ;
config.irc.options.debug = config.debug;
module.exports = config;