(function () {
    if (!window.framework) {
        window.framework = {};
    }
    framework.eventing = {
		init: function init() {
			µC.$document
				.ready(function() {
					µC.currentChannel = µC.$currentChannel.val();
					µC.$tooltips.tooltip();
				})				
				.bind('scroll', framework.uifx.scrollHandler)
				;
			
			µC.$body
				.bind('dragover', framework.uifx.dragHandler)
				
				.on('click', µS.btnItemChannel, function(e) {
					e.preventDefault && e.preventDefault();
					var channelId = $(this).attr('id');
					framework.socket.selectChannel(channelId);
					return false;
				})			
				.on('click', µS.btnItemTopic, function(e) {
					e.preventDefault && e.preventDefault();
					var topicId = $(this).attr('id');
					framework.socket.selectTopic(topicId);
					return false;
				})
				.on('click', µS.btnAddTopic, function(e) {
					e.preventDefault && e.preventDefault();
					framework.uifx.addTopic($(this));
					return false;
				})
				.on('click', µS.btnItemMessage, function(e) {
					e.preventDefault && e.preventDefault();
					framework.uifx.toggleMessageSelection($(this));
					return false;
				})
				.on('click', µS.btnToTop, function(e) {
					e.preventDefault && e.preventDefault();
					µC.$document.scrollTop(0);
					return false;
				})
				.on('dragover', µS.btnToTop, function(e) {
					e.preventDefault && e.preventDefault();
					µC.$document.scrollTop(0);
					return false;
				})
				.on('dragstart', µS.btnItemMessage+'.selected', framework.uifx.dragStartHandler)
				.on('dragend', µS.btnItemMessage+'.selected', framework.uifx.dragEndHandler)
				.on('dragover', µS.btnItemTopic + ':not(#topic-none)', framework.uifx.dragOverHandler)
				.on('dragenter', µS.btnItemTopic + ':not(#topic-none)', framework.uifx.dragEnterHandler)
				.on('dragleave', µS.btnItemTopic + ':not(#topic-none)', framework.uifx.dragLeaveHandler)
				.on('drop', µS.btnItemTopic + ':not(#topic-none)', framework.uifx.dropHandler)
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