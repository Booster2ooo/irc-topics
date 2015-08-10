(function () {
    if (!window.framework) {
        window.framework = {};
    }
    framework.eventing = {
		init: function init() {
			µC.$document
				.ready(function() {
					µC.currentChannel = µC.$currentChannel.val();
				});
			
			µC.$body
				.on('click', µS.btnSelectChannel, function(e) {
					e.preventDefault();
					var channelId = $(this).attr('id');
					framework.socket.selectChannel(channelId);
					return false;
				})			
				.on('click', µS.btnSelectTopic, function(e) {
					e.preventDefault();
					var topicId = $(this).attr('id');
					framework.socket.selectTopic(topicId);
					return false;
				})
				;
				
			µC.socket
				.on('connect', function () {
					µC.currentChannel = µC.$currentChannel.val();						
					framework.socket.selectChannel(µC.currentChannel);
				})
				.on('joined', function(packet) {
					if(packet && packet.channel) {
						µC.$currentChannel.val(packet.channel);
						µC.currentChannel = packet.channel;
					}
				})
				.on('load_data', function (packet) {
					if(packet && packet.channel && packet.type && packet.view) {
						framework.uifx.updateContent(packet);
					}
				})
				.on('new_data', function (packet) {
					if(packet && packet.channel && packet.type && packet.view) {						
						framework.uifx.appendContent(packet);
					}
				})
				;
		}
	}
}());