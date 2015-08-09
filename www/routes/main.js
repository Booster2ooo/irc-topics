var  /* MODULES */
	// express module
	express = require('express')
	// promise module
  , Promise = require('es6-promise').Promise
	
  , mainRouter = function mainRouter(config, db) {
		var /* INSTANCES */
			// Express router
			router = express.Router()
			;
			
		
		/* GET home page. */
		router.get('/', function(req, res, next) {
			var title = 'IRC Topics'
			  , channels = config.irc.options.channels
			  , defaultChan = channels[0]
			  , messages_promise = db.getAll(defaultChan, 'messages')
			  , topics_promise = db.getAll(defaultChan, 'topics')
			  , messages = []
			  , topics = []
			  ;
			Promise.all([messages_promise,topics_promise])
				.then(function(docs) {
					messages = docs[0];
					topics = docs[1];
					res.render(
						'index'
					  , {
							title: title
						  , channels: config.irc.options.channels
						  , channel: defaultChan
						  , messages: messages
						  , topics: topics
						}
					);
				})
				.catch(function(err) {
					config.debug && console.log(err);
					res.render(
						'index'
					  , {
							title: title
						}
					);
				})
				;
		});
		
		return router;
	}
  ;


module.exports = mainRouter;