(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.socket = {
		init: function init() {
			var socket = io();
			µC.socket = socket;
		}
	  , selectChannel: function selectChannel(channelId, force) {
			force = force || false;
			var packet = {
				channel: channelId
			  , force: force
			};
			if(packet.channel) {
				µC.socket.emit('selectChannel', packet);
			}
		}
	  , selectTopic: function selectTopic(topicId) {
			var packet = { 
				channel: µC.currentChannel
			  , topic: topicId
			};
			
			if(packet.topic && packet.channel) {
				if(packet.topic == 'topic-none') {
					framework.socket.selectChannel(µC.currentChannel, true);
					return;
				}
				µC.socket.emit('selectTopic', packet);
			}
		}
	  , addTopic: function addTopic(topic) {
			var packet = {
				channel: µC.currentChannel
			  , topic: topic
			};
			if(packet.topic && packet.topic.name && packet.channel) {
				µC.socket.emit('addTopic', packet);
			}
		}
	  , addMessageToTopic: function addMessageToTopic(options) {
			var packet = $.extend(options, { channel: µC.currentChannel });
			if(packet.topic && packet.message && packet.channel) {
				µC.socket.emit('addMessageToTopic', packet);
			}
		}
	}
}());