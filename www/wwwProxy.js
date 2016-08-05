var /* MODULES */
	// http module
	http = require('http')
	// express module
  , express = require('express')
	// path module
  , path = require('path')
	// favicon serve module
  , favicon = require('serve-favicon')
	// morgan (logger) module
  , logger = require('morgan')
	// cookie parser module
  , cookieParser = require('cookie-parser')
	// body parser module
  , bodyParser = require('body-parser')
	// custom routes modules
  , routes = require('./routes/index.js')
	// socketIO proxy
  , socketIOProxy = require('./socketIOProxy.js')
    // utils module
  , utils = require('../utils/utils.js')
  
  , wwwProxy = function wwwProxy(config, db) {
		// check whenever a configuration has been passed
		if(!config) throw 'WWW proxy: configuration not found';
		if(!db) throw 'WWW proxy: instance of dbProxy not found';
		var /* HANDLERS */
			handlers = {
				notFoundHandler: function notFoundHandler(req, res, next) {
					var err = new Error('Not Found');
					err.status = 404;
					next(err);
				}
			  , errorHandler: function errorHandler(err, req, res, next) {
					res.status(err.status || 500);
					res.render('error', {
						message: err.message,
						error: config.debug ? err : {}
					});
				}
			  , httpErrorHandler: function httpErrorHandler(err) {
					if (error.syscall !== 'listen') {
						throw error;
					}
					var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
					// handle specific listen errors with friendly messages
					switch (error.code) {
						case 'EACCES':
							console.error(bind + ' requires elevated privileges');
							process.exit(1);
							break;
						case 'EADDRINUSE':
							console.error(bind + ' is already in use');
							process.exit(1);
							break;
						default:
							throw error;
					}
				}
			  , httpListeningHandler: function httpListeningHandler() {
					var addr = server.address()
					  , bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
					  ;
					config.debug && console.log('HTTP Listening on ' + bind);
				}
			}
			/* RENDERER */
		  , renderer = function renderer(viewName, viewData) {
				var urlRegExp = /((?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$]))/gi;
				viewData.formatStamp = utils.formatStamp;
				return new Promise(function(resolve, reject){
					app.render(
						viewName
					  , viewData
					  , function(err, html) {
							if (err) {
								reject(err);
								return;
							}
							html = html.replace(urlRegExp, '<a href="$1" target="_blank">$1</a>');
							resolve(html);
					  }
					);
				});
			}
  
			/* INSTANCES */
		  , router = routes(config, db)
			/* VARIABLES */
			// express application
		  , app = express()
				/* CONFIG */
				// define listening port
				.set('port', config.www.port)
				// define view engine			
				.set('view engine', 'jade')	
				// define views path
				.set('views', path.join(__dirname, 'views'))	
				/* MIDDLEWARES */
				// console log using morgan
				.use(logger('dev'))
				// parse request with body parser
				.use(bodyParser.json())
				.use(bodyParser.urlencoded({ extended: false }))
				// parse cookies
				.use(cookieParser())			
				// load less
				.use(require('less-middleware')(path.join(__dirname, 'public')))			
				// load statics resources
				.use(express.static(path.join(__dirname, 'public')))
				// load routes
				.use('/', router)
				// not found
				.use(handlers.notFoundHandler)
				// errors
				.use(handlers.errorHandler)
			// HTTP server
		  , server = http.createServer(app)
				.listen(config.www.port)
				.on('error', handlers.httpErrorHandler)
				.on('listening', handlers.httpListeningHandler)
		  , www = {
				app: app
			  , server: server
			  , renderer: renderer
			}
			// SocketIO
		  , io = socketIOProxy(config, db, www)
		  ;
		return www;
	}
  ;
  
module.exports = wwwProxy;