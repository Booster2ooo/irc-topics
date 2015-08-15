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
				framework.uifx.cleanStacks(['topics', 'messages']);
				µC.socket.emit('selectChannel', packet);
			}
		}
	  , selectTopic: function selectTopic(topicId) {
			var packet = { 
				channel: µC.currentChannel
			  , topic: topicId
			};
			
			if(packet.topic && packet.channel) {				
				framework.uifx.cleanStacks(['messages']);
				if(packet.topic == 'topic-none') {
					framework.socket.selectChannel(µC.currentChannel, true);
					µC.$currentTopic.val('');
					µC.currentTopic = '';
					return;
				}
				µC.socket.emit('selectTopic', packet);
				µC.$currentTopic.val(topicId);
				µC.currentTopic = topicId;
			}
		}
	  , loadMoreMessages: function loadMoreMessages() {
			var packet = { 
				channel: µC.currentChannel
			  , topic: µC.currentTopic
			  , step: µC.loadingStep
			};
			if(packet.channel && packet.step) {
				µC.socket.emit('loadMoreMessages', packet);
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
			if(packet.topic && packet.messages &&  packet.messages.length && packet.channel) {
				µC.socket.emit('addMessageToTopic', packet);
			}
		}
	}
}());