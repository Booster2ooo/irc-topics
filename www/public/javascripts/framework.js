(function() {
	if(!window.framework) {
		window.framework = {};
	}
	/*
	/* Framework options
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	framework.options = {
		selectors: {
			currentChannel:		'#current_channel'
		  , header:				'#header'
		  , channelsContainer:	'#channels-container'
		  , topicsContainer:	'#topics-container'
		  , messagesContainer:	'#messages-container'
		  , btnSelectChannel:	'.js-channel-select'
		  , btnSelectTopic:		'.js-topic-select'
		}
	}
}());
$(document).ready(function () {
    framework.init = function init() {
        window.µS = framework.options.selectors;
        window.µC = framework.cache;
        this.cache.init();
        this.socket.init();
        this.eventing.init();
    };
    framework.init();

});