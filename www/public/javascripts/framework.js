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
		  , btnItemChannel:		'.js-channel-item'		  
		  
		  , topicsContainer:	'#topics-container'
		  , btnAddTopic:		'.js-topic-add'
		  , btnItemTopic:		'.js-topic-item'
		  
		  
		  , messagesContainer:	'#messages-container'		  
		  , btnItemMessage:		'.js-message-item'
		}
	}
}());
$(document).ready(function () {
    framework.init = function init() {
		$.event.props.push('dataTransfer');
        window.µS = framework.options.selectors;
        window.µC = framework.cache;
        this.cache.init();
        this.socket.init();
        this.eventing.init();
    };
    framework.init();

});