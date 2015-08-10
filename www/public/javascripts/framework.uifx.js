(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.uifx = {
		updateContent: function updateContent(packet) {
			var $container = µC['$' + packet.type + 'Container'];
			$container.html(packet.view);
			µC['$' + packet.type + 'Stack'] = $container.find('ul');
		}
	  , appendContent: function pushContent(packet) {
			var $stack = µC['$' + packet.type + 'Stack'];
			$stack.append(packet.view);
		}
	}
}());