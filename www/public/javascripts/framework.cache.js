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
	  , $tooltips: null
	  , $btnToTop: null
	  , $bootstrapCss: null
	  , $siteStyleCss: null
      , $siteInfos: null
	  , $themeSwitch: null
	  , loadScroll: true
	  , useLightTheme: true
	  
	  , init: function init() {
			this.$body = $('body');
			this.$window = $(window);
			this.$document = $(document);
			this.$currentChannel = $(µS.currentChannel);
			this.$currentTopic = $(µS.currentTopic);
			this.$header = $(µS.header);
			this.$channelsContainer = $(µS.channelsContainer);
			this.$channelsStack = this.$channelsContainer.find('ul');
			this.$topicsContainer = $(µS.topicsContainer);
			this.$topicsStack = this.$topicsContainer.find('ul');
			this.$messagesContainer = $(µS.messagesContainer);
			this.$messagesStack = this.$messagesContainer.find('ul');
			this.$tooltips = $(µS.tooltips);
			this.$btnToTop = $(µS.btnToTop);
			this.$bootstrapCss = $(µS.bootstrapCss);
			this.$siteStyleCss = $(µS.siteStyleCss);
			this.$themeSwitch = $(µS.themeSwitch);
            this.$siteInfos = $(µS.siteInfos);
			this.loadScroll = true;
			this.currentChannel = this.$currentChannel.val();
			this.useLightTheme = Cookies.get('useLightTheme')=='false' ? false : true;
		}
	}
}());