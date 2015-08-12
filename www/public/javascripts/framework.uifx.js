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
			$stack.prepend(packet.view);
		}
	  , addTopic: function addTopic($el) {
			var $modal = $el.closest('.modal')
			  , $modalForm = $modal.find('.modal-body form')
			  , $name = $modalForm.find('input[name="name"]')
			  , $description = $modalForm.find('textarea[name="description"]')
			  , topic = {
					name: $name.val().replace(/\s/g,'_')
				  , description: $description.val()
				}
			  ;
			if(topic.name) {
				if(topic.name[0] != '@') {
					topic.name = '@' + topic.name;
				}
			} 
			framework.socket.addTopic(topic);
			$name.val('');
			$description.val('');
			$modal.modal('hide');
		}
	  , dragStartHandler: function dragStartHandler(e) {
			framework.cache.dragSrc = this;
			$(framework.cache.dragSrc).addClass('drag-start');
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', this.getAttribute('id'));
		}
	  , dragEndHandler: function dragEndHandler(e) {
			$(this).removeClass('drag-start');
		}
	  , dragOverHandler: function dragOverHandler(e) {
			e.preventDefault && e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			$(this).addClass('drag-enter');
			return false;
		}
	  , dragEnterHandler: function dragEnterHandler(e) {
			//e.preventDefault && e.preventDefault();
			$(this).addClass('drag-enter');
			//return false;
		}
	  , dragLeaveHandler: function dragLeaveHandler(e) {
			$(this).removeClass('drag-enter');
		}
	  , dropHandler: function dropHandler(e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			var topicId = this.getAttribute('id')
			  , messageId = e.dataTransfer.getData('text/plain')
			  , options = {
					topic: topicId
				  , message: messageId
				}
			  ;
			$(this).removeClass('drag-enter');
			$(framework.cache.dragSrc).removeClass('drag-start');
			framework.socket.addMessageToTopic(options);
			e.dataTransfer.clearData();
			return false;
		}
	}
}());