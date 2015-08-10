(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.cache = {
		$body: null
	  , $window: null
	  , $document: null
	  , $currentChannel: null
	  , $header: null
	  , $channelsContainer: null
	  , $channelsStack: null
	  , $topicsContainer: null
	  , $topicsStack: null
	  , $messagesContainer: null
	  , $messagesStack: null
	  
	  , init: function init() {
			this.$body = $('body');
			this.$window = $(window);
			this.$document = $(document);
			this.$currentChannel = $(µS.currentChannel);
			this.$header = $(µS.header);
			this.$channelsContainer = $(µS.channelsContainer);
			this.$channelsStack = this.$channelsContainer.find('ul');
			this.$topicsContainer = $(µS.topicsContainer);
			this.$topicsStack = this.$topicsContainer.find('ul');
			this.$messagesContainer = $(µS.messagesContainer);
			this.$messagesStack = this.$messagesContainer.find('ul');
		}
	}
}());