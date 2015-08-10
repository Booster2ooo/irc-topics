(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.socket = {
		init: function init() {
			var socket = io();
			µC.socket = socket;
		}
	  , selectChannel: function selectChannel(channelId) {
			if(channelId) {
				µC.socket.emit('selectChannel', { channel: channelId});
			}
		}
	  , selectTopic: function selectTopic(topicId) {
			if(topicId) {
				µC.socket.emit('selectTopic', { 
					channel: µC.currentChannel
				  , topic: topicId
				});
			}
		}
	}
}());