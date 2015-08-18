(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.uifx = {
		updateContent: function updateContent(packet) {
			var $container = µC['$' + packet.type + 'Container']
			  , $stack = $container.find('ul')
			  ;
			$stack.append(packet.view);
			µC['$' + packet.type + 'Stack'] = $stack;
			µC.loadingMore = false;
		}
	  , appendContent: function pushContent(packet) {
			var $stack = µC['$' + packet.type + 'Stack']
			  , currentTopic = µC.$currentTopic.val()
			  , isMessage = new RegExp(µS.btnItemMessage.slice(1),'g')
			  ;
			if(currentTopic && isMessage.test(packet.view)) {
				// if a topic is selected and the view is a message, do not append the message to the stack
				return;
			}
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
	  , cleanStacks: function cleanStacks(stackNames) {
			if(!stackNames || !stackNames.length) return;
			$.each(stackNames, function() {
				if(this == 'messages') {
					µC.loadingStep = 1;
				}
				µC['$' + this + 'Stack'].html('');
			});
		}
	  , toggleMessageSelection: function toggleMessageSelection($el) {
			var selectedClass = 'selected'
			  , wasSelected = $el.hasClass(selectedClass)
			  ;
			$el.toggleClass(selectedClass);
			wasSelected ? $el.attr('draggable', false) :  $el.attr('draggable', true);
		}
	  , scrollHandler: function scrollHandler() {
			var scroll = µC.$document.scrollTop()
			  , scrollBorder = 200
			  , docH = µC.$document.height()
			  , winH = µC.$window.height()
			  , triggerH = docH - winH - scrollBorder
			  ;
			µC.loadingStep = µC.loadingStep || 1;
			if(!µC.loadingMore && scroll > triggerH) {
				µC.loadingMore = true;
				µC.loadingStep++;
				framework.socket.loadMoreMessages();
			}
		}
	  , dragHandler: function dragHandler(e) {
		    µC.needScrolling = false;
			var mouseY = e.originalEvent.clientY
			  , scrollZoneTop = 50
			  , scrollZoneBottom = µC.$window.height() - scrollZoneTop
			  , currentScroll = $(window).scrollTop()
			  , scrollPage = function scrollPage(scrollValue) {
					currentScroll = $(window).scrollTop();
					µC.$window.scrollTop(currentScroll + scrollValue);
					if(µC.needScrolling) {
						setTimeout(function() { 
							scrollPage(scrollValue)
						} , 10);
					}
				}
			  ;
			if(mouseY < scrollZoneTop) {
				µC.needScrolling = true;
				scrollPage(-1);
			}
			else if(mouseY > scrollZoneBottom) {
				µC.needScrolling = true;
				scrollPage(1);
			}
			else {
				µC.needScrolling = false;
			}
		}
	  , dragStartHandler: function dragStartHandler(e) {
			var $selectedMessages = $(µS.btnItemMessage+'.selected');
			$selectedMessages.addClass('drag-start');
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', '');
		}
	  , dragEndHandler: function dragEndHandler(e) {
			var $selectedMessages = $(µS.btnItemMessage+'.selected');
			$selectedMessages.removeClass('drag-start');
			e.dataTransfer.clearData();
			µC.needScrolling = false;
		}
	  , dragOverHandler: function dragOverHandler(e) {
			e.preventDefault && e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			$(this).addClass('drag-enter');
			return false;
		}
	  , dragEnterHandler: function dragEnterHandler(e) {
			$(this).addClass('drag-enter');
		}
	  , dragLeaveHandler: function dragLeaveHandler(e) {
			$(this).removeClass('drag-enter');
		}
	  , dropHandler: function dropHandler(e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			var $selectedMessages = $(µS.btnItemMessage+'.selected')
			  , topicId = this.getAttribute('id')
			  , options = {
					topic: topicId
				  , messages: []
				}
			  ;
			$(this).removeClass('drag-enter');
			$selectedMessages
				.each(function() {
					var $message = $(this);
					options.messages.push($message.attr('id'));
				})
				.removeClass('drag-start')
				.removeClass('selected');
			framework.socket.addMessageToTopic(options);
			e.dataTransfer.clearData();
			return false;
		}
	}
}());