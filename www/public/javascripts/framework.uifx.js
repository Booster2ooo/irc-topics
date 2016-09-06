(function() {
	if(!window.framework) {
		window.framework = {};
	}
	framework.uifx = {
		updateContent: function updateContent(packet) {
			var $container = µC['$' + packet.type + 'Container']
			  , $stack = $container.find('ul')
			  ;
			if(packet.test) {
				packet.test();
			}
			$stack.append(packet.view);
			µC['$' + packet.type + 'Stack'] = $stack;
			µC.loadingMore = false;
		}
	  , appendContent: function pushContent(packet) {
			var $stack = µC['$' + packet.type + 'Stack']
			  , currentTopic = µC.$currentTopic.val()
			  , isMessage = new RegExp(µS.btnItemMessage.slice(1),'g')
			  ;
			if((currentTopic || !µC.loadScroll) && isMessage.test(packet.view)) {
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
	  , searchMessages: function searchMessages($el) {
			var $modal = $el.closest('.modal')
			  , $modalForm = $modal.find('.modal-body form')
			  , $day = $modalForm.find('select[name="day"]')
			  , $month = $modalForm.find('select[name="month"]')
			  , $year = $modalForm.find('select[name="year"]')
			  , $author = $modalForm.find('input[name="author"]')
			  , $text = $modalForm.find('input[name="text"]')
			  , day = $day.val()
			  , month = $month.val()
			  , year = $year.val()
			  , author = $author.val()
			  , text = $text.val()
			  , startDate
			  , endDate
			  , timestamp
			  , query = { }
			  ;
			if(day && month && year) {
				startDate = new Date(year + '-' + month + '-' + day + 'T00:00:00.000+01:00');
				endDate = new Date(year + '-' + month + '-' + day + 'T00:00:00.000+01:00');
				endDate.setDate(startDate.getDate() + 1);
				timestamp = {
					$gt: startDate.getTime()
				  , $lt: endDate.getTime()
				};
				query.timestamp = timestamp;
			}
			if(author) {
				query.author = {
					$regex: author
				  , $options: 'i'
				};
			}
			if(text) {
				query.text = {
					$regex: text
				  , $options: 'i'
				};
			}
			framework.socket.searchMessages(query);
			$day.val('');
			$month.val('');
			$year.val('');
			$author.val('');
			$text.val('');
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
			if(µC.loadScroll) {
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
	  , setUseLightTheme: function setUseLightTheme(state) {
			var siteStylePath = '/stylesheets/'
			  , bootstrapPath =  '/stylesheets/bootstrap3/'
			  , siteLightCss = 'style.css'
			  , boostrapLightCss = 'bootstrap.css'
			  , siteDarkCss = 'style_dark.css'
			  , boostrapDarkCss = 'bootstrap_dark.css'
			  ;
			if(state) {
				µC.$siteStyleCss.attr('href', siteStylePath + siteLightCss);
				µC.$bootstrapCss.attr('href', bootstrapPath + boostrapLightCss);
			}
			else {
				µC.$siteStyleCss.attr('href', siteStylePath + siteDarkCss);
				µC.$bootstrapCss.attr('href', bootstrapPath + boostrapDarkCss);
			}
			Cookies.set('useLightTheme', state, { expires: 3600 });
			µC.useLightTheme = state;
		}
      , displaySiteInfos: function displaySiteInfos() {

        }
	  , activateTooltips: function activateTootips() {
            µC.$tooltips.each(function() {
                var $toolTip = $(this);
                if($toolTip.is(µC.$siteInfos)) {
                    $toolTip.tooltip({
                        template: `
                    <div class="tooltip" role="tooltip">\
                        <div class="tooltip-arrow">
                        </div>
                        <div class="tooltip-inner">
                        </div>
                        <div class="tooltip-body">
                            * Change the theme using the slide input on the right of this icon<br/>
                            * Select the desired channel in the "Channel selection" dropdown<br/>
                            -- Logs and topics:<br/>
                            * Read logs, change or add topics<br/>
                            * Click to select some messages then drag&drop them into the desired topic<br/>
                            * Seach using the search window
                            -- Stats:<br/>
                        </div>
                    </div>`
                    });
                }
                else {
                    $toolTip.tooltip();
                }
            });
        }
    }
}());