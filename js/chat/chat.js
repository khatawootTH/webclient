/**
 * How to make this work in your browser? copy/paste this in your browser console:
 * localStorage.staticpath = "http://localhost:5280/"; localStorage.dd=1; localStorage.contextmenu=1; localStorage.megachat=1; localStorage.jj=true;
 * and optionally:
 * localStorage.dxmpp = 1; localStorage.stopOnAssertFail = true; localStorage.d = 1;
 * @type {boolean}
 */
var MegaChatEnabled = false;
if (localStorage.megachat) {
    MegaChatEnabled=true;
}


var chatui;
(function() {
    chatui = function() {
        hideEmptyMsg();
        $('.fm-files-view-icon').addClass('hidden');
        $('.fm-blocks-view').addClass('hidden');
        $('.files-grid-view').addClass('hidden');
        $('.contacts-grid-view').addClass('hidden');
        $('.fm-contacts-blocks-view').addClass('hidden');

        var chatJids = M.currentdirid.replace('chat/','').split(",");
        $.each(chatJids, function(k, v) {
            chatJids[k] = megaChat.getJidFromNodeId(v);
        });

        var $promise;

        if(localStorage.megaChatPresence != "unavailable") {
            if(megaChat.karere.getConnectionState() != Karere.CONNECTION_STATE.CONNECTED) {
                megaChat.connect()
                    .done(function() {
                        chatJids.push(megaChat.karere.getBareJid());

                        $promise = megaChat.openChat(chatJids, chatJids.length == 2 ? "private" : "group");
                    });
            } else {
                chatJids.push(megaChat.karere.getBareJid());

                $promise = megaChat.openChat(chatJids, chatJids.length == 2 ? "private" : "group");
            }
        } else {
            alert("You are currently offline. To chat, you need to change your state back to online, away or busy.");
            // TODO: Better error message?
        }

        if($promise) {
            $promise.done(function(roomJid, room) {
                room.show();
            });
        }



        $('.fm-chat-block').removeClass('hidden');

        $('.message-textarea').unbind('keyup.autoresize');
        $('.message-textarea').bind('keyup.autoresize',function() {
            $(this).height('auto');
            var text = $(this).val();
            var lines = text.split("\n");
            var count = lines.length;

            if ($(this).val().length !== 0 && count>1) {
                $(this).height($(this).prop("scrollHeight"));
                var scrollBlockHeight = $('.fm-chat-block').outerHeight() - $('.fm-chat-line-block').outerHeight() - 80;
                if (scrollBlockHeight != $('.fm-chat-message-scroll').outerHeight())
                {
                   
                    megaChat.resized();
                }

                // If any popup is opened - moving with buttons
                if ($('.fm-chat-emotions-icon').attr('class').indexOf('active') > -1)
                {
                    var positionY = $('.fm-chat-line-block').outerHeight() - $('.fm-chat-emotion-arrow').position().top;
                    $('.fm-chat-emotion-popup').css('bottom', positionY - 17 + 'px');
                }
                if ($('.fm-chat-attach-file').attr('class').indexOf('active') > -1)
                {
                    var positionY = $('.fm-chat-line-block').outerHeight() - $('.fm-chat-attach-arrow').position().top;
                    $('.fm-chat-attach-popup').css('bottom', positionY - 17 + 'px');
                }
            }
            else $(this).height('27px');
        });

        $('.fm-chat-emotions-icon').unbind('click');
        $('.fm-chat-emotions-icon').bind('click', function()
        {
            if ($(this).attr('class').indexOf('active') > -1)
            {
                $('.fm-chat-emotion-popup').addClass('hidden');
                $(this).removeClass('active');
            }
            else
            {
                $('.fm-chat-emotion-popup').removeClass('hidden');
                $(this).addClass('active');
                var positionY = $('.fm-chat-line-block').outerHeight() - $('.fm-chat-emotion-arrow').position().top;
                $('.fm-chat-emotion-popup').css('bottom', positionY - 17 + 'px');
            }
        });

        $('.fm-chat-attach-file').unbind('click');
        $('.fm-chat-attach-file').bind('click', function()
        {
            if ($(this).attr('class').indexOf('active') > -1)
            {
                $('.fm-chat-attach-popup').addClass('hidden');
                $(this).removeClass('active');
            }
            else
            {
                $('.fm-chat-attach-popup').removeClass('hidden');
                $(this).addClass('active');
                var positionY = $('.fm-chat-line-block').outerHeight() - $('.fm-chat-attach-arrow').position().top;
                $('.fm-chat-attach-popup').css('bottom', positionY - 17 + 'px');
            }
        });

        $('.fm-chat-block').off('mouseover.megachat click.megachat', '.fm-chat-file-button.save-button');
        $('.fm-chat-block').on('mouseover.megachat click.megachat', '.fm-chat-file-button.save-button', function() {
            var currentRoom = megaChat.getCurrentRoom();

            var $chatDownloadPopup = $('.fm-chat-download-popup',currentRoom.$messages);
            var p = $(this);
            var positionY = $(this).closest('.jspPane').outerHeight() - $(this).position().top;
            var positionX = $(this).position().left;
            if (positionY - 174 > 0)
            {
                $($chatDownloadPopup).css('bottom', positionY - 174 + 'px');
                $($chatDownloadPopup).removeClass('top');
            }
            else
            {
                $($chatDownloadPopup).css('bottom', positionY + 'px');
                $($chatDownloadPopup).addClass('top');
            }
            $($chatDownloadPopup).css('left', positionX + $(this).outerWidth()/2 + 10 + 'px');
            $(this).addClass('active');
            $($chatDownloadPopup).removeClass('hidden');

            var $button = $(this);
            var $attachmentContainer = $button.parents('.attachments-container');
            var message = currentRoom.getMessageById($attachmentContainer.attr('data-message-id'));

            var attachments = message.meta.attachments; //alias
            var nodeIds = Object.keys(attachments);
            $('.to-cloud', $chatDownloadPopup).unbind('click.megachat');
            $('.to-cloud', $chatDownloadPopup).bind('click.megachat', function() {
                $.selected = clone(nodeIds);
                $.mctype = 'copy-cloud';
                mcDialog();
            });

            $('.as-zip', $chatDownloadPopup).unbind('click.megachat');
            $('.as-zip', $chatDownloadPopup).bind('click.megachat', function() {
                $.each(nodeIds, function(k, v) {
                    M.addDownload(v, true);
                });

            });

            $('.to-computer', $chatDownloadPopup).unbind('click.megachat');
            $('.to-computer', $chatDownloadPopup).bind('click.megachat', function() {
                $.each(nodeIds, function(k, v) {
                    M.addDownload(v);
                });
            });
        });


        $('.fm-chat-message-scroll').unbind('click');
        $('.fm-chat-message-scroll').bind('click', function()
        {
            $('.fm-chat-download-popup').addClass('hidden');
        });



        $('.fm-add-user').unbind('click.megaChat');
        $('.fm-add-user').bind('click.megaChat', function()
        {
            // This was causing a bug for the "Add contact" popup (in the #fm/contacts) because that button have the
            // same .fm-add-user class names

            var positionX = $(this).position().left;
            var addUserPopup = $('.fm-add-contact-popup');
            if ($(this).attr('class').indexOf('active') == -1) {                $(addUserPopup).removeClass('hidden');
                $(this).addClass('active');
                $(addUserPopup).css('left', positionX -8 + 'px');
            }
        });



        var typingTimeout = null;
        var stoppedTyping = function() {
            if(typingTimeout) {
                clearTimeout(typingTimeout);

                var room = megaChat.getCurrentRoom();
                if(room && room.state == MegaChatRoom.STATE.READY) {
                    megaChat.karere.sendComposingPaused(megaChat.getCurrentRoomJid());
                }
                typingTimeout = null;
            }
        };

        $('.message-textarea').unbind('keyup.send');
        $('.message-textarea').bind('keyup.send', function(e) {
            if($(this).val().length > 0) {
                if(!typingTimeout) {
                    var room = megaChat.getCurrentRoom();
                    if(room && room.state == MegaChatRoom.STATE.READY) {
                        megaChat.karere.sendIsComposing(megaChat.getCurrentRoomJid());
                    }
                } else if(typingTimeout) {
                    clearTimeout(typingTimeout);
                }

                typingTimeout = setTimeout(function() {
                    stoppedTyping();
                }, 2000);
            } else if($(this).val().length === 0) {
                stoppedTyping();
            }
        });
        $('.message-textarea').unbind('keydown.send');
        $('.message-textarea').bind('keydown.send',function(e) {
            var key = e.keyCode || e.which;


            if(key == 13 && e.shiftKey !== true) {
                var msg = $(this).val();
                if(msg.trim().length > 0) {
                    megaChat.sendMessage(
                        megaChat.getCurrentRoomJid(),
                        msg
                    );
                    $(this).val('');
                    stoppedTyping();
                    return false;
                }
            }
        });
        $('.message-textarea').unbind('blur.stoppedcomposing');
        $('.message-textarea').bind('blur.stoppedcomposing',function(e) {
            stoppedTyping();
        });
    }
})();



var megaChatInstanceId = 0;

/**
 * MegaChat - UI component that links XMPP/Strophejs (via Karere) w/ the Mega's UI
 *
 * @returns {MegaChat}
 * @constructor
 */
var MegaChat = function() {
    var self = this;


    this.is_initialized = false;

    this.chats = {};
    this.currentlyOpenedChat = null;
    this._myPresence = localStorage.megaChatPresence;

    this.options = {
        'delaySendMessageIfRoomNotAvailableTimeout': 3000,
        'rtcSession': {
            iceServers:[
//                 {url: 'stun:stun.l.google.com:19302'},
                {url: 'turn:j100.server.lu:3478?transport=udp'},
                {url: 'turn:j100.server.lu:3478?transport=tcp'}
            ]
        },
        /**
         * Really simple plugin architecture
         */
        'plugins': {
            'urlFilter': UrlFilter,
            'emoticonsFilter': EmoticonsFilter,
            'capslockFilterDemo': CapslockFilterDemo,
            'attachmentsFilter': AttachmentsFilter
        }
    };

    this.instanceId = megaChatInstanceId++;

    this.plugins = {};


    this.karere = new Karere({
        'clientName': 'mc'
    });

    // Karere Events
    this.karere.bind("onPresence", function(e, eventData) {
        if(eventData.error) {
            return;
        }

        if(eventData.show != "unavailable") {
            if(eventData.myOwn === false) {

                // update M.u
                var contact = self.getContactFromJid(eventData.from);
                if(contact) {
                    if(!contact.presenceMtime || parseFloat(contact.presenceMtime) < eventData.delay) {
                        contact.presence = eventData.show;
                        contact.presenceMtime = eventData.delay;
                    }
                }

                var bareJid = eventData.from.split("/")[0];

                $.each(self.chats, function(roomJid, room) {
                    if(room.participantExistsInRoom(bareJid) && !self.karere.userExistsInChat(roomJid, eventData.from)) {
                        if(localStorage.d) {
                            console.debug(self.karere.getNickname(), "Auto inviting: ", eventData.from, "to: ", roomJid);
                        }

                        self.karere.addUserToChat(roomJid, eventData.from, undefined, room.type, {
                            'ctime': room.ctime,
                            'invitationType': 'resume',
                            'participants': room.users,
                            'users': self.karere.getUsersInChat(roomJid)
                        });

                        return false; // break;
                    }
                });
                // Sync presence across devices (will check the delayed val!)
                if(eventData.from.split("/")[0] == self.karere.getBareJid()) {
                    if(eventData.delay && eventData.delay >= parseFloat(localStorage.megaChatPresenceMtime) && self._myPresence != eventData.show) {
                        self._myPresence = eventData.show;
                        localStorage.megaChatPresence = eventData.show;
                        localStorage.megaChatPresenceMtime = eventData.delay;

                        self.karere.setPresence(
                          eventData.show,
                          undefined,
                          eventData.delay
                        );
                    }
                }

            }
        }

        // should we trigger refreshUI ?
        if(eventData.myOwn === false) {
            var bareJid = eventData.from.split("/")[0];

            $.each(self.chats, function(roomJid, room) {

                if(room.participantExistsInRoom(bareJid)) {
                    // if this user is part of the currently visible room, then refresh the UI
                    if(self.getCurrentRoomJid() == room.roomJid) {
                        room.refreshUI();
                    }
                }
            });
        }
        self.renderMyStatus();
        self.renderChatStatus();
    });

    // Disco capabilities updated
    this.karere.bind("onDiscoCapabilities", function(e, eventData) {
        var $treeElement = $('#treesub_contacts li a[data-jid="' + eventData.userBareJid + '"]');

        $.each(eventData.capabilities, function(capability, capable) {
            if(capable) {
                $treeElement.addClass('chat-capability-' + capability);
            } else {
                $treeElement.removeClass('chat-capability-' + capability);
            }
        })
    });

    // Invite messages
    this.karere.bind("onInviteMessage", function(e, eventData) {
        if(eventData.myOwn === true) {
            e.stopPropagation();
            return false;
        }
        if(localStorage.d) {
            console.debug(self.karere.getNickname(), "Got invitation to join", eventData.room, "with eventData:", eventData);
        }


        if(eventData.meta && eventData.meta.type == "private") {

            var bareFromJid = eventData.from.split("/")[0];
            $.each(self.chats, function(roomJid, room) {
                if(roomJid == eventData.room) {
                    return; // continue
                }

                if(room.type == "private" && room.participantExistsInRoom(bareFromJid)) {
                    if(localStorage.d) {
                        console.debug(self.karere.getNickname(), "Possible invitation duplicate: ", eventData.room, roomJid, "with eventData:", eventData);
                    }

                    if(self.currentlyOpenedChat == room.roomJid) {
                        room.ctime = eventData.meta.ctime;
                        room.syncUsers(eventData.meta.participants);
                    }

                    // if not already in
                    if(room.state < MegaChatRoom.STATE.JOINING) {
                        room.setState(MegaChatRoom.STATE.JOINING);
                        self.karere.joinChat(eventData.room, eventData.password);
                    }

                    e.stopPropagation();
                    return false;
                }
            });

            if(e.isPropagationStopped()) {
                return false;
            }
        }
        if(self.chats[eventData.room]) { //already joined
            if(localStorage.d) {
                console.warn("I'm already in", eventData.room, "(ignoring invitation from: ", eventData.from, ")");
            }

            e.stopPropagation();
            return false; // stop doing anything
        }

        // if we are here..then join the room
        if(localStorage.d) {
            console.debug("Initializing UI for new room: ", eventData.room, "");
        }
        self.chats[eventData.room] = new MegaChatRoom(self, eventData.room);
        self.chats[eventData.room].setType(eventData.meta.type);
        self.chats[eventData.room].ctime = eventData.meta.ctime;
        self.chats[eventData.room].setUsers(eventData.meta.participants);

        self.chats[eventData.room].setState(MegaChatRoom.STATE.JOINING);
        self.karere.joinChat(eventData.room, eventData.password);


        self.chats[eventData.room].refreshUI();


        e.stopPropagation();

        return false; // stop propagation, we are manually handling the join on invite case
    });

    var updateMyConnectionStatus = function() {
        self.renderMyStatus();
    };

    this.karere.bind("onConnected", function() {
        if(localStorage.megaChatPresence) {
            self.karere.setPresence(localStorage.megaChatPresence, undefined, localStorage.megaChatPresenceMtime);
        }
        updateMyConnectionStatus();
    });
    this.karere.bind("onConnecting", updateMyConnectionStatus);
    this.karere.bind("onConnfail", updateMyConnectionStatus);
    this.karere.bind("onAuthfail", updateMyConnectionStatus);
    this.karere.bind("onDisconnecting", updateMyConnectionStatus);
    this.karere.bind("onDisconnected", updateMyConnectionStatus);

    this.karere.bind("onUsersJoined", function(e, eventData) {
        return self._onUsersUpdate("joined", e, eventData);
    });

    this.karere.bind("onUsersLeft", function(e, eventData) {
        return self._onUsersUpdate("left", e, eventData);
    });
    this.karere.bind("onUsersUpdatedDone", function(e, eventData) {
        if(self.chats[eventData.roomJid] && self.chats[eventData.roomJid].state == MegaChatRoom.STATE.JOINING) {
            self.chats[eventData.roomJid].setState(
                MegaChatRoom.STATE.JOINED
            );
        }
    });


    this.karere.bind("onChatMessage", function() {
        self._onChatMessage.apply(self, toArray(arguments));
    });

    this.karere.bind("onDelayedChatMessage", function() {
        self._onChatMessage.apply(self, toArray(arguments));
    });

    this.karere.bind("onActionMessage", function(e, eventData) {
        if(eventData.myOwn === true) {
            return;
        }

        var room;
        if(eventData.meta.action == "sync") {
            room = self.chats[eventData.meta.roomJid];
            room.sendMessagesSyncResponse(eventData);
        } else if(eventData.meta.action == "syncResponse") {
            room = self.chats[eventData.meta.roomJid];
            room.handleSyncResponse(eventData);
        }
    });


    this.karere.bind("onComposingMessage", function(e, eventData) {
        if(eventData.myOwn && eventData.isForwarded) {
            return;
        }

        var room = self.chats[eventData.roomJid];
        if(room) {
            var $element = $('.fm-chat-typing-txt', room.$messages);
            $('span', $element).text(
                self.getContactNameFromJid(eventData.from)
            );

            $element.removeClass("hidden").addClass("typing");
        }
    });

    this.karere.bind("onPausedMessage", function(e, eventData) {
        if(eventData.myOwn && eventData.isForwarded) {
            return;
        }

        var room = self.chats[eventData.roomJid];
        if(room) {
            var $element = $('.fm-chat-typing-txt', room.$messages);
            $('span', $element).text("");
            $element.addClass("hidden").removeClass("typing");
        }
    });

    // UI events
    $(document.body).undelegate('.top-user-status-item', 'mousedown.megachat');

    $(document.body).delegate('.top-user-status-item', 'mousedown.megachat', function() {
        var presence = $(this).data("presence");
        self._myPresence = presence;

        localStorage.megaChatPresence = presence;
        localStorage.megaChatPresenceMtime = unixtime();

        if(self.karere.getConnectionState() != Karere.CONNECTION_STATE.CONNECTED && presence != Karere.PRESENCE.OFFLINE) {
            self.connect().done(function() {
                self.karere.setPresence(presence, undefined, localStorage.megaChatPresenceMtime);
            });
            return true;
        } else {
            if(presence == Karere.PRESENCE.OFFLINE) {
                self.karere.disconnect();
            } else {
                self.karere.setPresence(presence, undefined, localStorage.megaChatPresenceMtime);
            }
        }
    });

    $(window).unbind('hashchange.megaChat');
    var lastOpenedRoom = null;
    $(window).bind('hashchange.megaChat' + this.instanceId, function() {
        var room = self.getCurrentRoom();

        if(room && !room.$messages.is(":visible") && room.roomJid != lastOpenedRoom) { // opened window, different then one from the chat ones
            room.hide();
            self.currentlyOpenedChat = null;
        }
        if(lastOpenedRoom && (!room || room.roomJid != lastOpenedRoom)) { // have opened a chat window before, but now
                                                                           // navigated away from it
            if(self.chats[lastOpenedRoom]) {
                self.chats[lastOpenedRoom].hide();
            }
        }
        if(lastOpenedRoom && $('.fm-chat-block').is(".hidden")) { // have opened a chat window before, but now
                                                                           // navigated away from it
            if(self.chats[lastOpenedRoom]) {
                self.chats[lastOpenedRoom].hide();
                lastOpenedRoom = null;
            }
        }

        if(room) {
            lastOpenedRoom = room.roomJid;
        } else {
            lastOpenedRoom = null;
        }
    });

    return this;
};

makeObservable(MegaChat);

/**
 * Initialize the MegaChat (also will connect to the XMPP)
 */
MegaChat.prototype.init = function() {
    var self = this;

    self.$container = $('.fm-chat-block');
    self.$header_tpl = $('.fm-chat-header', self.$container).clone().removeClass("template");
    assert(self.$header_tpl.length > 0, "Header template not found.");

    self.$messages_tpl = $('.fm-chat-message-scroll', self.$container).clone().removeClass("template");
    assert(self.$messages_tpl.length > 0, "Messages template not found.");

    self.$message_tpl = $('.fm-chat-messages-block.message.template', self.$container).clone();
    assert(self.$message_tpl.length > 0, "Message template not found.");

    self.$message_tpl
        .removeClass("template")
        .removeClass("message")
        .removeClass("hidden");

    self.$inline_dialog_tpl = $('.fm-chat-messages-block.inline-dialog.template', self.$container).clone();
    assert(self.$inline_dialog_tpl.length > 0, "Inline dialog template not found.");

    self.$inline_dialog_tpl
        .removeClass("template")
        .removeClass("message")
        .removeClass("hidden");


    // cleanup dom nodes that were used as templates
    $('.fm-chat-header', self.$container).remove();
    $('.fm-chat-message-scroll', self.$container).remove();
    $('.fm-chat-messages-block.message.template', self.$container).remove();
    $('.fm-chat-messages-block.inline-dialog.template', self.$container).remove();

    if(self.is_initialized) {
        self.destroy()
            .always(function() {
                self.init();
            });

        return;
    }
    self.is_initialized = true;

    $('.activity-status-block, .activity-status').show();

    if(!localStorage.megaChatPresence || localStorage.megaChatPresence != "unavailable") {
        self.connect()
            .always(function() {
                self.renderMyStatus();
            });
    } else {
        self.renderMyStatus();
    }

    try {
        self.rtc = self.karere.connection.rtc = new RtcSession(self.karere.connection, self.options.rtcSession);

        // bind rtc events
        var rtcEventProxyToRoom = function(e, eventData) {
            console.debug("RTC: ", e, eventData);

            var peer = eventData.peer;

            if(peer) {
                var fromBareJid = Karere.getNormalizedBareJid(peer);
                if(fromBareJid == self.karere.getBareJid()) {
                    console.warn("Ignoring my own incoming request.");

                    return;
                }
                var $promise = self.openChat([fromBareJid], "private");

                $promise.done(function(roomJid, room) {
                    room.trigger(e, eventData);
                });
            } else {
                // local-stream-obtained = most likely this is the currently active window/room
                var room = self.getCurrentRoom();
                if(room) {
                    room.trigger(e, eventData);
                }
            }


            // TODO: Multi group calls?
        };

        $(self.rtc).on('call-incoming-request', rtcEventProxyToRoom);
        $(self.rtc).on('call-answered', rtcEventProxyToRoom);
        $(self.rtc).on('call-declined', rtcEventProxyToRoom);
        $(self.rtc).on('call-answer-timeout', rtcEventProxyToRoom);
        $(self.rtc).on('call-canceled', rtcEventProxyToRoom);
        $(self.rtc).on('media-recv', rtcEventProxyToRoom);
        $(self.rtc).on('local-stream-obtained', rtcEventProxyToRoom);
        $(self.rtc).on('remote-player-remove', rtcEventProxyToRoom);
        $(self.rtc).on('local-player-remove', rtcEventProxyToRoom);
        $(self.rtc).on('local-media-fail', rtcEventProxyToRoom);
        $(self.rtc).on('call-init', rtcEventProxyToRoom);
        $(self.rtc).on('call-ended', rtcEventProxyToRoom);
        $(self.rtc).on('muted', rtcEventProxyToRoom);
        $(self.rtc).on('unmuted', rtcEventProxyToRoom);

    } catch(e) {
        // no RTC support.
    }

    // really simple plugin architecture that will initialize all plugins into self.options.plugins[name] = instance
    self.plugins = {};
    $.each(self.options.plugins, function(k, v) {
        self.plugins[k] = new v(self);
    });
};

/**
 * Connect to the XMPP
 *
 * @returns {Deferred}
 */
MegaChat.prototype.connect = function() {
    var self = this;

    return self.karere.connect(
                self.getJidFromNodeId(u_handle),
                self.getMyXMPPPassword()
            )
            .done(function() {
                $('.activity-status-block .activity-status')
                    .removeClass('online')
                    .removeClass('offline')
                    .addClass('online')
            })
            .fail(function() {
                $('.activity-status-block .activity-status')
                    .removeClass('online')
                    .removeClass('offline')
                    .addClass('online')
            });
};


/**
 * Incoming chat message handler
 *
 * @param e
 * @param eventData
 * @private
 */
MegaChat.prototype._onChatMessage = function(e, eventData) {
    var self = this;

    // ignore my own forwarded messages
    if(eventData.myOwn === true && eventData.isForwarded === true) {
        return;
    }
    if(!eventData.message && !eventData.meta) {
        return;
    }

    // try first with delay -> timestamp -> currentime (if no time info is attached to the message)
    var timestamp = eventData.delay;
    if(!timestamp) {
        timestamp = eventData.timestamp;
    }
    if(!timestamp) {
        timestamp = unixtime();
    }
    var room = self.chats[eventData.roomJid];
    if(room) {
        room.appendMessage({
            from: eventData.from,
            message: eventData.message,
            timestamp: timestamp,
            meta: eventData.meta,
            id: eventData.id
        });
    } else {
        if(localStorage.d) {
            console.debug("Room not found: ", eventData.roomJid);
        }
    }
};


/**
 * Incoming Users Update handler
 *
 * @param type
 * @param e
 * @param eventData
 * @private
 */
MegaChat.prototype._onUsersUpdate = function(type, e, eventData) {
    var self = this;
    var updatedJids = Object.keys(eventData.currentUsers);

    var diffUsers = Object.keys(eventData[type == "joined" ? "newUsers" : "leftUsers"]);

    if(type == "joined") {
        $.each(diffUsers, function(k, v) {
            updatedJids.push(v);
        })
    } else {
        $.each(diffUsers, function(k, v) {
            var idx = $.inArray(v, updatedJids);
            delete updatedJids[idx];
        });
    }


    // i had joined OR left
    if($.inArray(self.karere.getJid(), diffUsers) != -1) {
        if(type != "joined") { // i'd left
            // i'd left, remove the room and the UI stuff
            if(self.chats[eventData.roomJid]) {
                self.chats[eventData.roomJid].destroy();
            }
        } else { // i'd joined

        }
    } else { //some one else had joined/left the room
        if(type != "joined") { // they left the room
            //XX: If this is a private room and the only user left count == 1, then destroy the room (an UI elements)

            // this code should trigger timeout immediately if there is a request pending for a user who had left the
            // room
            if(self._syncRequests) {
                $.each(self._syncRequests, function(k, v) {
                    if(v.userJid == diffUsers[0]) {
                        console.log("Canceling sync request from ", v.userJid, ", because he had just left the room.");
                        v.timeoutHandler();
                        clearTimeout(v.timer);
                        return false; // break;
                    }
                })
            }
        } else { // they had joined

        }
        var room = self.chats[eventData.roomJid];
        assert(room, "Room not found!");

        room.syncUsers(clone(updatedJids));
        room.refreshUI();
    }
    //TODO: group chats?
};


/**
 * Destroy this MegaChat instance (leave all rooms then disconnect)
 *
 * @returns {*}
 */
MegaChat.prototype.destroy = function() {
    var self = this;
    localStorage.megaChatPresence = Karere.PRESENCE.OFFLINE;
    localStorage.megaChatPresenceMtime = unixtime();

    $.each(self.chats, function(roomJid, room) {
        room.destroy();
        delete self.chats[roomJid];
    });

    return self.karere.disconnect()
        .done(function() {
            self.is_initialized = false;
        });
};

/**
 * Get ALL contacts from the Mega Contacts list
 *
 * @returns {Array}
 */
MegaChat.prototype.getContacts = function() {
    var results = [];
    $.each(M.u, function(k, v) {
        if(v.c == 1 || v.c == 2) {
            results.push(v);
        }
    });
    return results;
};

/**
 * Get Contact object from the Mega's Contacts that corresponds to the given jid
 *
 * @param jid {String} full or bare jid...does not mather
 * @returns {Object|null}
 */
MegaChat.prototype.getContactFromJid = function(jid) {
    var self = this;


    assert(jid, "Missing jid");

    jid = Karere.getNormalizedBareJid(jid); // always convert to bare jid

    var contact = null;
    $.each(M.u, function(k, v) {
        if((v.c == 1 || v.c == 2) && self.getJidFromNodeId(k) == jid) {
            contact = v;
            return false; // break;
        }
    });
    if(!contact) {
        // this can happen if:
        // user A added user B
        // user B's contacts list is still not updated
        // user B receives a XMPP presence info that user A is online and tries to render a DOM element which requires
        // the user's name..so this method gets called.
        if(localStorage.d) {
            //debugger;
        }
    }
    return contact;
};

/**
 * Get formatted contact name from Jid
 *
 * @param jid {String} full/bare jid, does not matter
 * @returns {String|undefined}
 * @throws {AssertionError}
 */
MegaChat.prototype.getContactNameFromJid = function(jid) {
    var self = this;
    var contact = self.getContactFromJid(jid);

    /* XXX: THIS WONT work in group chats, where all users are not contacts w/ each other, so we will show the jid@ part */

    var name = jid.split("@")[0];


    if(contact && contact.name) {
        name = contact.name;
    } else if(contact && contact.m) {
        name = contact.m;
    }

    assert(name, "Name not found for jid: " + jid);

    return name;
};


/**
 * Helper to convert XMPP presence from string (e.g. 'chat'), to a CSS class (e.g. will return 'online')
 *
 * @param presence {String}
 * @returns {String}
 */
MegaChat.prototype.xmppPresenceToCssClass = function(presence) {
    if(presence == Karere.PRESENCE.ONLINE || presence == Karere.PRESENCE.AVAILABLE || presence === true) {
        return 'online';
    } else if(presence == Karere.PRESENCE.AWAY || presence == "xa") {
        return 'away';
    } else if(presence == Karere.PRESENCE.BUSY) {
        return 'busy';
    } else if(!presence || presence == Karere.PRESENCE.OFFLINE) {
        return 'offline';
    } else {
        return 'black';
    }
};

/**
 * Used to re-render my own presence/status
 */
MegaChat.prototype.renderMyStatus = function() {
    var self = this;

    // reset
    var $status = $('.activity-status-block .activity-status');

    $status
        .removeClass('online')
        .removeClass('away')
        .removeClass('busy')
        .removeClass('offline')
        .removeClass('black');

    var presence = self.karere.getConnectionState() == Karere.CONNECTION_STATE.CONNECTED ?
                self.karere.getPresence(self.karere.getJid()) :
                localStorage.megaChatPresence;
    if(!presence && self.karere.getConnectionState() == Karere.CONNECTION_STATE.CONNECTED) {
        if(!localStorage.megaChatPresence) {
            presence = localStorage.megaChatPresence = "chat"; // default
        } else { // cached
            presence = localStorage.megaChatPresence;
        }

    }

    $('.top-user-status-popup .top-user-status-item').removeClass("active");

    var cssClass = self.xmppPresenceToCssClass(
        presence
    );

    $status.addClass(
        cssClass
    );

    if(cssClass == 'online') {
        $('.top-user-status-popup .top-user-status-item[data-presence="chat"]').addClass("active");
    } else if(cssClass == 'away') {
        $('.top-user-status-popup .top-user-status-item[data-presence="away"]').addClass("active");
    } else if(cssClass == 'busy') {
        $('.top-user-status-popup .top-user-status-item[data-presence="dnd"]').addClass("active");
    } else if(cssClass == 'offline') {
        $('.top-user-status-popup .top-user-status-item[data-presence="unavailable"]').addClass("active");
    } else {
        $('.top-user-status-popup .top-user-status-item[data-presence="unavailable"]').addClass("active");
    }
};


/**
 * Used to pre/render my contacts statuses
 */
MegaChat.prototype.renderChatStatus = function() {
    var self = this;
    $.each(self.getContacts(), function(k, contact) {
        var $element = $('#treesub_contacts #treea_' + contact.u);

        $element.removeClass("online-status");
        $element.removeClass("offline-status");
        $element.removeClass("busy-status");
        $element.removeClass("away-status");
        $element.removeClass("no-status");

        var presence = self.karere.getPresence(self.getJidFromNodeId(contact.u));

        if(!presence || presence == Karere.PRESENCE.OFFLINE) {
            $element.addClass("offline-status");
        } else if(presence == Karere.PRESENCE.AWAY) {
            $element.addClass("away-status");
        } else if(presence == Karere.PRESENCE.BUSY) {
            $element.addClass("busy-status");
        } else if(presence === true || presence == Karere.PRESENCE.ONLINE || presence == Karere.PRESENCE.AVAILABLE) {
            $element.addClass("online-status");
        } else {
            $element.addClass("offline-status");
        }

        $element.attr("data-jid", self.getJidFromNodeId(contact.u));
    });
};


/**
 * This function is an abstract placeholder that should return JID from a nodeID (e.g. Mega User IDs)
 *
 * @param nodeId {String}
 * @returns {string}
 */
MegaChat.prototype.getJidFromNodeId = function(nodeId) {
    assert(nodeId, "Missing nodeId for getJidFromNodeId");

    // TODO: fake function that should be replaced with a real node ID -> jabber id conversion
    var hash = simpleStringHashCode(nodeId) + "";
    return "test-" + hash[hash.length - 1] + "@sandbox.developers.mega.co.nz";
};

/**
 * Placeholder function that should return my password for authenticating w/ the XMPP server
 *
 * @returns {String}
 */
MegaChat.prototype.getMyXMPPPassword = function() {
    // TODO: Replace me w/ a real function that will give us the password for logging in the jabber server
    var self = this;
    return self.getJidFromNodeId(u_handle).split("@")[0];
};


/**
 * Open (and show) a new chat
 *
 * @param jids {Array} list of bare jids
 * @param type {String} "private" or "group"
 * @returns {Deferred}
 */
MegaChat.prototype.openChat = function(jids, type) {
    var self = this;
    type = type || "private";

    var $promise = new $.Deferred();

    if(type == "private") {
        var $element = $('#treesub_contacts li a[data-jid="' + jids[0] + '"]');
        var roomJid = $element.attr('data-room-jid') + "@" + self.karere.options.mucDomain;
        if(self.chats[roomJid]) {
//            self.chats[roomJid].show();
            $promise.resolve(roomJid, self.chats[roomJid]);
            return $promise;
        } else {
            // open new chat
        }
    }


    var roomJid;
    if(type == "private") {
        roomJid = self.generatePrivateRoomName(jids);
    } else {
        roomJid = self._generateNewRoomIdx();
    }

    if(self.currentlyOpenedChat && self.currentlyOpenedChat != roomJid) {
        self.hideChat(self.currentlyOpenedChat);
    }


    var room = new MegaChatRoom(self, roomJid + "@" + self.karere.options.mucDomain);
    room.setType(type);
    room.setUsers(jids);
    room.ctime = unixtime();
    if(!self.currentlyOpenedChat) {
        room.show();
    }

    self.chats[room.roomJid] = room;

    var tmpJid = room.roomJid;

    $promise.done(function(roomJid, room) {
        assert(roomJid, "missing room jid");

        if(self.currentlyOpenedChat === tmpJid) {
            self.currentlyOpenedChat = roomJid;
            if(room) {
                room.show();
            }
        } else {
            if(room) {
                room.refreshUI();
            }
        }
    });



    var jidsWithoutMyself = room.getParticipantsExceptMe(jids);

    room.setState(MegaChatRoom.STATE.JOINING);

    var $startChatPromise = self.karere.startChat([], type, roomJid, (type == "private" ? false : undefined));

    $startChatPromise
        .done(function(roomJid) {
            $.each(jidsWithoutMyself, function(k, userJid) {

                if(self.chats[roomJid]) {
                    self.karere.addUserToChat(roomJid, userJid, undefined, type, {
                        'ctime': self.chats[roomJid].ctime,
                        'invitationType': "created",
                        'participants': jids,
                        'users': self.karere.getUsersInChat(roomJid)
                    });
                }
            });

            $promise.resolve(roomJid, self.chats[roomJid]);
        })
        .fail(function() {
            $promise.reject.apply($promise, toArray(arguments))
            if(self.chats[$startChatPromise.roomJid]) {
                self.chats[$startChatPromise.roomJid].destroy();
            }
        });




    return $promise;
};


/**
 * Used to generate unique room JID for private (1on1) chats.
 *
 * @param jids {Array} of BARE jids
 * @returns {string}
 */
MegaChat.prototype.generatePrivateRoomName = function(jids) {
    var self = this;
    var newJids = clone(jids);
    newJids.sort();
    var roomName = "prv";
    $.each(newJids, function(k, jid) {
        roomName = roomName + "_" + fastHashFunction(jid.split("@")[0]);
    });

    return roomName;
};

/**
 * Returns the currently opened room/chat
 *
 * @returns {null|undefined|Object}
 */
MegaChat.prototype.getCurrentRoom = function() {
    return this.chats[this.currentlyOpenedChat];
};

/**
 * Returns the currently opened room/chat JID
 *
 * @returns {null|String}
 */
MegaChat.prototype.getCurrentRoomJid = function() {
    return this.currentlyOpenedChat;
};


/**
 * Hide a room/chat's UI components.
 *
 * @param roomJid
 */
MegaChat.prototype.hideChat = function(roomJid) {
    var self = this;

    var room = self.chats[roomJid];
    if(room) {
        room.hide();
    } else {
        if(localStorage.d) {
            console.warn("Room not found: ", roomJid);
        }
    }
};


/**
 * Send message to a specific room
 *
 * @param roomJid
 * @param val
 */
MegaChat.prototype.sendMessage = function(roomJid, val) {
    var self = this;

    // queue if room is not ready.
    if(!self.chats[roomJid]) {
        if(localStorage.d) {
            console.warn("Queueing message for room: ", roomJid, val);
        }

        createTimeoutPromise(function() {
            return !!self.chats[roomJid]
        }, 100, self.options.delaySendMessageIfRoomNotAvailableTimeout)
            .done(function() {
                self.chats[roomJid].sendMessage(val);
            });
    } else {
        self.chats[roomJid].sendMessage(val);
    }
};

//TODO: Docs
MegaChat.prototype.resized = function() {
    var $jsp = $('.fm-chat-message-scroll').data("jsp");
    if($jsp) {
        $jsp.reinitialise();
    }
};



//TODO: Docs
MegaChat.prototype.getPrivateRoomJidFor = function(jid) {
    jid = Karere.getNormalizedBareJid(jid);
    var roomJid = $('#treesub_contacts a[data-jid="' + jid + '"]').attr("data-room-jid");

    assert(roomJid, "Missing private room jid for user jid: " + jid);
    return roomJid;
};


/**
 * Class used to represent a MUC Room in which the current user is present
 *
 * @param megaChat
 * @param roomJid
 * @returns {MegaChatRoom}
 * @constructor
 */
var MegaChatRoom = function(megaChat, roomJid) {
    this.megaChat = megaChat;
    this.users = [];
    this.hash = null;
    this.roomJid = roomJid;
    this.type = null;
    this.messages = [];
    this.messagesIndex = {};

    this.callRequest = null;
    this.callIsActive = false;

    this.options = {
        /**
         * Maximum time for waiting a message sync, before trying to send a request to someone else in the room or
         * failing the SYNC operation at all (if there are no other users to query for the sync op).
         */
        'requestMessagesSyncTimeout': 2500,

        /**
         * Send any queued messages if the room is not READY
         */
        'sendMessageQueueIfNotReadyTimeout': 6500, // XX: why is this so slow? optimise please.

        /**
         * Change the state of the room to READY in case there was no response in timely manner. (e.g. there were no
         * users who responded for a sync call).
         */
        'messageSyncFailAfterTimeout': 10000, // XX: why is this so slow? optimise please.

        /**
         * Used to cleanup the memory from sent sync requests.
         * This should be high enough, so that it will be enough for a response to be generated (message log to be
         * encrypted), send and received.
         */
        'syncRequestCleanupTimeout': 15000,


        /**
         * Default media options
         */
        'mediaOptions': {
            audio: true,
            video: true
        },

        /**
         * Should we add scrolling animation when a new message is received ?
         */
        'animateScrollOnNewMessage': true
    };
    this._syncRequests = {};
    this._messagesQueue = [];

    this.setState(MegaChatRoom.STATE.INITIALIZED);

    this.$messages = megaChat.$messages_tpl.clone();
    this.$header = megaChat.$header_tpl.clone();

    var droppableConfig = {
        tolerance: 'pointer',
        drop: function(e, ui)
        {
            $.doDD(e,ui,'drop',1);
        },
        over: function (e, ui)
        {
            $.doDD(e,ui,'over',1);
        },
        out: function (e, ui)
        {
            var c1 = $(e.srcElement).attr('class'),c2 = $(e.target).attr('class');
            if (c2 && c2.indexOf('fm-menu-item') > -1 && c1 && (c1.indexOf('cloud') > -1 || c1.indexOf('cloud') > -1)) return false;
            $.doDD(e,ui,'out',1);
        }
    };

    this.$messages.droppable(droppableConfig);
    this.$header.droppable(droppableConfig);

    // Events
    var self = this;
    this.bind('onStateChange', function(e, oldState, newState) {
        if(localStorage.d) {
            console.debug("Will change state from: ", MegaChatRoom.stateToText(oldState), " to ", MegaChatRoom.stateToText(newState));
        }
        var resetStateToReady = function() {
            if(self.state != MegaChatRoom.STATE.LEFT && self.state != MegaChatRoom.STATE.READY && self.state != MegaChatRoom.STATE.SYNCED) {
                if(localStorage.d) {
                    console.warn("Sync failed, setting state to READY.");
                }
                self.setState(MegaChatRoom.STATE.READY); // its ok, if the sync failed...change the state to DONE
            }
        };

        if(newState == MegaChatRoom.STATE.JOINED) {
            if(self.requestMessageSync()) {
                createTimeoutPromise(
                    function() {
                        return self.state == MegaChatRoom.STATE.READY || self.state == MegaChatRoom.STATE.SYNCED
                    },
                    200,
                    self.options.messageSyncFailAfterTimeout
                )
                    .fail(function() {
                        resetStateToReady();
                    })
            } else {
                resetStateToReady();
            }


        } else if(newState == MegaChatRoom.STATE.SYNCED) {
            // XX: we should add the encryption stuff just after state == SYNCED and before state == READY
            self.setState(MegaChatRoom.STATE.READY);
        } else if(newState == MegaChatRoom.STATE.READY) {
            if(localStorage.dd) {
                console.log("Chat room state set to ready, will flush queue: ", self._messagesQueue);
            }
            if(self._messagesQueue.length > 0) {
                $.each(self._messagesQueue, function(k, v) {
                    if(!v) {
                        return; //continue;
                    }


                    var event = new $.Event("onSendMessage");
                    var eventData = $.extend(
                        {
                            from: self.megaChat.karere.getJid(),
                            roomJid: self.roomJid
                        },
                        v
                    );

                    self.megaChat.trigger(event, eventData);

                    if(event.isPropagationStopped()) {
                        return false;
                    }

                    self.megaChat.karere.sendRawMessage(self.roomJid, "groupchat", eventData.message, eventData.meta, eventData.id, eventData.timestamp);
                });
                self._messagesQueue = [];
            }
        }
    });

    this.$header.hide();
    this.$messages.hide();

    this.megaChat.$container.append(
        this.$header
    );
    this.megaChat.$container.append(
        this.$messages
    );

    this.$messages.jScrollPane({enableKeyboardNavigation:false,showArrows:true, arrowSize:5, animateDuration: 70});


    /**
     * Audio/Video button handlers
     */
    $('.call-actions', self.$header).unbind('click.megaChat');

    $('.btn-chat-call', self.$header).bind('click.megaChat', function() {
        var participants = self.getParticipantsExceptMe();
        assert(participants.length > 0, "No participants.");

        self.callRequest = self.megaChat.rtc.startMediaCall(participants[0], self.getMediaOptions());

        var doCancel = function() {
            if(self.callRequest && self.callRequest.cancel) {
                self.callRequest.cancel();

                resetCallStateNoCall();
            }
            self.megaChat.karere.connection.rtc.hangup();
        };

        $('.btn-chat-cancel-active-call', self.$header).bind('click.megaChat', function() {
            doCancel();
        });


        resetCallStateInCall();

        self.appendDomMessage(
            self.generateInlineDialog(
                "outgoing-call",
                "Calling " + self.megaChat.getContactNameFromJid(participants[0]) + "...",
                undefined,
                ['fm-chat-call-started'], {
                    'reject': {
                        'type': 'secondary',
                        'text': "Cancel",
                        'callback': doCancel
                    }
                }
            )
        );
    });


    $('.btn-chat-mute', self.$header).bind('click.megaChat', function() {
        self.options.mediaOptions.audio = false;
        self.megaChat.karere.connection.rtc.muteUnmute(true, {audio:true});

        resetCallStateInCall();
    });
    $('.btn-chat-unmute', self.$header).bind('click.megaChat', function() {
        self.options.mediaOptions.audio = true;
        self.megaChat.karere.connection.rtc.muteUnmute(false, {audio:true});

        resetCallStateInCall();
    });

    $('.btn-chat-video-mute', self.$header).bind('click.megaChat', function() {
        self.options.mediaOptions.video = false;
        self.megaChat.karere.connection.rtc.muteUnmute(true, {video:true});

        resetCallStateInCall();
    });
    $('.btn-chat-video-unmute', self.$header).bind('click.megaChat', function() {
        self.options.mediaOptions.video = true;
        self.megaChat.karere.connection.rtc.muteUnmute(false, {video:true});

        resetCallStateInCall();
    });

    self.bind('call-incoming-request', function(e, eventData) {
        $('.call-actions', self.$header).hide();

        var doAnswer = function() {
            eventData.answer(true, {
                mediaOptions: self.getMediaOptions()
            });
        };

        var doCancel = function() {
            eventData.answer(false, {reason:'busy'});

            self.trigger('call-declined', eventData);
        };

        var $answer = $('.btn-chat-answer-incoming-call', self.$header);
        $answer.unbind('click.megaChat');
        $answer.bind('click.megaChat', doAnswer);
        $answer.show();

        var $cancel = $('.btn-chat-reject-incoming-call', self.$header);
        $cancel.unbind('click.megaChat');
        $cancel.bind('click.megaChat', doCancel);
        $cancel.show();

        self.appendDomMessage(
            self.generateInlineDialog(
                "incoming-call",
                "Incoming Call from " + self.megaChat.getContactNameFromJid(eventData.peer),
                undefined,
                ['fm-chat-call-started'],
                {
                    'answer': {
                        'type': 'primary',
                        'text': "Answer",
                        'callback': doAnswer
                    },
                    'reject': {
                        'type': 'secondary',
                        'text': "Cancel",
                        'callback': doCancel
                    }
                }
            )
        );
    });

    var callStartedState = function(e, eventData) {
        $('.call-actions', self.$header).hide();

        var $cancel = $('.btn-chat-cancel-active-call', self.$header);
        $cancel.unbind('click.megaChat');
        $cancel.bind('click.megaChat', function() {
            self.megaChat.karere.connection.rtc.hangup(); /** pass eventData.peer? **/
        });
        $cancel.show();

        resetCallStateInCall();
    };

    var resetCallStateNoCall = function() {
        self.callIsActive = false;
        $('.call-actions', self.$header).hide();
        $('.btn-chat-call', self.$header).show();

        self.getInlineDialogInstance("incoming-call").remove();
        self.getInlineDialogInstance("outgoing-call").remove();

        self.refreshScrollUI();

        self.refreshUI();
    };
    var resetCallStateInCall = function() {
        self.callIsActive = true;

        $('.call-actions', self.$header).hide();
        if(!self.options.mediaOptions.audio) {
            $('.btn-chat-unmute', self.$header).show();
        } else {
            $('.btn-chat-mute', self.$header).show();
        }

        if(!self.options.mediaOptions.video) {
            $('.btn-chat-video-unmute', self.$header).show();
        } else {
            $('.btn-chat-video-mute', self.$header).show();
        }

        $('.btn-chat-cancel-active-call', self.$header).show();

        self.getInlineDialogInstance("incoming-call").remove();
        self.getInlineDialogInstance("outgoing-call").remove();

        self.refreshScrollUI();

        self.refreshUI();
    };

    self.bind('call-init', function(e, eventData) {
        self.appendDomMessage(
            self.generateInlineDialog(
                "started-call-" + unixtime(),
                "Call with " + self.megaChat.getContactNameFromJid(eventData.peer) + " started.",
                undefined,
                ['fm-chat-call-started']
            )
        );
        callStartedState(e, eventData);
    });
    self.bind('call-answered', function(e, eventData) {
        self.appendDomMessage(
            self.generateInlineDialog(
                "started-call-" + unixtime(),
                "Call with " + self.megaChat.getContactNameFromJid(eventData.peer) + " started.",
                undefined,
                ['fm-chat-call-started'])
        );

        callStartedState(e, eventData);
    });

    self.bind('call-answer-timeout', function(e, eventData) {
        self.appendDomMessage(
            self.generateInlineDialog(
                "rejected-call-" + unixtime(),
                "Incoming Call from " + self.megaChat.getContactNameFromJid(eventData.peer) + " was not answered in a timely manner.",
                undefined,
                ['fm-chat-missed-call']
            )
        );
        resetCallStateNoCall();
    });
    self.bind('call-declined', function(e, eventData) {
        var msg;
        var peer = eventData.peer;
        if(Strophe.getBareJidFromJid(peer) == self.megaChat.karere.getBareJid()) {
            msg = "Incoming Call with " + self.megaChat.getContactNameFromJid(self.getParticipantsExceptMe()[0]) + " was rejected.";
        }  else {
            msg = "Incoming Call with " + self.megaChat.getContactNameFromJid(peer) + " was rejected.";
        }


        self.appendDomMessage(
            self.generateInlineDialog(
                "rejected-call-" + unixtime(),
                msg,
                undefined,
                ['fm-chat-rejected-call']
            )
        );

        resetCallStateNoCall();
    });

    self.bind('call-canceled', function(e, eventData) {
        if(eventData.info && eventData.info.event == "handled-elsewhere") {
            self.appendDomMessage(
                self.generateInlineDialog(
                    "canceled-call-" + unixtime(),
                    "Incoming Call from " + self.megaChat.getContactNameFromJid(eventData.from) + " was handled on some other device.",
                    undefined,
                    ['fm-chat-different-device-call']
                )
            );
        } else {
            self.appendDomMessage(
                self.generateInlineDialog(
                    "canceled-call-" + unixtime(),
                    "Incoming Call from " + self.megaChat.getContactNameFromJid(eventData.from) + " was canceled.",
                    undefined,
                    ['fm-chat-rejected-call']
                )
            );
        }
        resetCallStateNoCall();
    });

    self.bind('call-ended', function(e, eventData) {
        self.appendDomMessage(
            self.generateInlineDialog(
                "ended-call-" + unixtime(),
                "Call with " + self.megaChat.getContactNameFromJid(eventData.peer) + " ended.",
                undefined,
                ['fm-chat-call-ended']
            )
        );

        resetCallStateNoCall();
    });

    self.bind('media-recv', function(event, obj) {
        $('.remote-video-container', self.$header).append(obj.player);
        resetCallStateInCall();
    });
    self.bind('local-stream-obtained', function(event, obj) {
        $('.local-video-container', self.$header).append(obj.player);
    });

    self.bind('local-player-remove', function(event, obj) {
        $(obj.player).remove();
    });

    self.bind('remote-player-remove', function(event, obj) {
        $(obj.id).remove();
    });

    self.bind('muted', function(e, eventData) {
        //TODO: Impl.
    });
    self.bind('unmuted', function(e, eventData) {
        //TODO: Impl.
    });


    return this;
};

/**
 * Add support for .on, .bind, .unbind, etc
 */
makeObservable(MegaChatRoom);

/**
 * Room states
 * @type {{INITIALIZED: number, JOINING: number, JOINED: number, SYNCING: number, SYNCED: number, READY: number, LEAVING: number, LEFT: number}}
 */
MegaChatRoom.STATE = {
    'INITIALIZED': 5,
    'JOINING': 10,
    'JOINED': 20,

    'SYNCING': 30,
    'SYNCED': 40,

    'READY': 150,

    'LEAVING': 200,

    'LEFT': 250
};

/**
 * Convert state to text (helper function)
 *
 * @param state {Number}
 * @returns {String}
 */
MegaChatRoom.stateToText = function(state) {
    var txt = null;
    $.each(MegaChatRoom.STATE, function(k, v) {
        if(state == v) {
            txt = k;

            return false; // break
        }
    });

    return txt;
};

/**
 * Change the state of this room
 *
 * @param newState {MegaChatRoom.STATE.*}
 */
MegaChatRoom.prototype.setState = function(newState) {
    var self = this;

    assert(newState, 'Missing state');

    if(self.state) { // if not == null, e.g. setting to INITIALIZED
        assert(
            newState > self.state,
            'Invalid state change. Current:' + MegaChatRoom.stateToText(self.state) +  "to" + MegaChatRoom.stateToText(newState)
        );
    }

    var oldState = self.state;
    self.state = newState;

    self.trigger('onStateChange', [oldState, newState]);
};

/**
 * Returns current state as text
 *
 * @returns {String}
 */
MegaChatRoom.prototype.getStateAsText = function() {
    var self = this;
    return MegaChatRoom.stateToText(self.state);
};

/**
 * Change/set the type of the room
 *
 * @param type
 */
MegaChatRoom.prototype.setType = function(type) {
    var self = this;

    if(!type) {
        if(localStorage.d) {
            debugger;
        }
    }

    self.type = type;
};

/**
 * Set the users (participants) of the room.
 * This is different then the actual current room occupants, based on the XMPP info, because it should contain a list
 * of BARE jids which SHOULD be in the room.
 *
 * Note: All of those JIDs would get auto-invitations to join this room when they connect to the XMPP automatically.
 *
 * @param jids {Array} List of bare jids
 */
MegaChatRoom.prototype.setUsers = function(jids) {
    this.users = clone(jids);

    this.refreshUI();
};


/**
 * the same as .setUsers, w/ the difference that it will only add any of the user jids in `jids` to the `.users`,
 * instead of just overwriting the `.users` property
 *
 * @param jids {Array} List of bare jids
 */
MegaChatRoom.prototype.syncUsers = function(jids) {
    var self = this;

    assert(jids, "Missing jids");

    var users = clone(self.users);

    $.each(jids, function(k, v) {
        if(v) {
            v = v.split("/")[0];
            if(self.users.indexOf(v) == -1) {
                users.push(
                    v
                )
            }
        }
    });

    if(users.length > self.users.length) {
        self.setUsers(users);
    }
};

/**
 * Check if participant exists in room
 *
 * @param jid {String} Full OR Bare jid
 * @param strict {boolean} If true, will only check for FULL jids.
 * @returns {boolean}
 */
MegaChatRoom.prototype.participantExistsInRoom = function(jid, strict) {
    var self = this;

    strict = strict || false;

    var result = false;
    $.each(self.users, function(k, v) {
        if(!v) {
            if(localStorage.d) {
                debugger;
            }
            return;
        }
        if(strict && v == jid) {
            result = true;
            return false; // break;
        } else if(!strict && v.split("/")[0] == jid) {
            result = true;
            return false; // break;
        }
    });

    return result;
};


/**
 * Get all participants in a chat room.
 *
 * @returns {Array}
 */
MegaChatRoom.prototype.getParticipants = function() {
    var self = this;

    var participants = {};


    $.each(self.users, function(k, v) {
        if(!v) {
            if(localStorage.d) {
                debugger;
            }
            return;
        }
        participants[v.split("/")[0]] = true;
    });

    return Object.keys(participants);
};

MegaChatRoom.prototype.getParticipantsExceptMe = function(jids) {
    var self = this;
    if(!jids) {
        jids = self.getParticipants();
    }
    var jidsWithoutMyself = clone(jids);
    jidsWithoutMyself.splice($.inArray(self.megaChat.karere.getBareJid(), jidsWithoutMyself), 1);

    return jidsWithoutMyself;
};

/**
 * Refreshes the UI of the chat room.
 *
 * @param [scrollToBottom] boolean set to true if you want to automatically scroll the messages pane to the bottom
 */
MegaChatRoom.prototype.refreshUI = function(scrollToBottom) {
    var self = this;

    this.$header.attr("data-room-jid", this.roomJid.split("@")[0]);

    var $jsp = self.$messages.data("jsp");
    assert($jsp, "JSP not available?!");

    $jsp.reinitialise();

    if(scrollToBottom) {
        self.$messages.one('jsp-initialised', function() {
            $jsp.scrollToBottom();
        });
    }

    $('.fm-chat-user', this.$header).text(this.roomJid.split("@")[0]);

    var participants = self.getParticipantsExceptMe();

    if(self.type == "private") {
        $.each(self.users, function(k, v) {
            var $element = $('#treesub_contacts li a[data-jid="' + v + '"]');
            $element.attr("data-room-jid", self.roomJid.split("@")[0]);
        });
    }

    if(self.type == "private") {

        assert(participants[0], "No participants found.");

        $('.fm-chat-user', self.$header).text(
            self.megaChat.getContactNameFromJid(participants[0])
        );
        var contact = self.megaChat.getContactFromJid(participants[0]);
        var presenceCssClass = self.megaChat.xmppPresenceToCssClass(
            self.megaChat.karere.getPresence(
                self.megaChat.getJidFromNodeId(contact.u)
            )
        );

        $('.fm-chat-user-status', self.$header)
            .removeClass('online')
            .removeClass('away')
            .removeClass('busy')
            .removeClass('offline')
            .removeClass('black')
            .addClass(presenceCssClass)
            .text(
                $.trim($('.top-user-status-item .activity-status.' + presenceCssClass).parent().text())
            );

        if(avatars[contact.u]) {
            $('.fm-chat-avatar > img', self.$header).attr(
                'src',
                avatars[contact.u].url
            );
        }
    } else {
        throw new Error("Not implemented"); //TODO: Groups, TBD
    }


    /**
     * Audio/Video buttons
     */

    if(self.callIsActive === false) {
        $('.call-actions', self.$header).hide();

        if(presenceCssClass == "offline") {
            $('.btn-chat-call', self.$header).hide();
        } else {
            var haveCallCapability = false;
            $.each(participants, function(k, p) {
               var capabilities = self.megaChat.karere.getCapabilities(p);

               if(!capabilities) {
                   return; // continue;
               }
               if(capabilities['audio'] || capabilities['video']) {
                   haveCallCapability = true;
               }
            });

            if(haveCallCapability) {
                $('.btn-chat-call', self.$header).show();
            }
        }
    }
};


/**
 * Leave this chat room
 *
 * @returns {undefined|Deferred}
 */
MegaChatRoom.prototype.leave = function() {
    var self = this;

    if(self.roomJid.indexOf("@") != -1) {
        self.setState(MegaChatRoom.STATE.LEAVING);
        return self.megaChat.karere.leaveChat(self.roomJid).done(function() {
            self.setState(MegaChatRoom.STATE.LEFT);
        });
    } else {
        self.setState(MegaChatRoom.STATE.LEFT);
    }
};

/**
 * Destroy a room (leave + UI destroy + js cleanup)
 */
MegaChatRoom.prototype.destroy = function() {
    var self = this;

    // destroy any waiting sync requests
    if(self._syncRequests) {
        $.each(self._syncRequests, function(messageId, req) {

            clearTimeout(req.timer);
        });
        delete self._syncRequests;
    };

    self.leave();

    self.$header.remove();
    self.$messages.remove();

    var $element = $('#treesub_contacts li a[data-room-jid="' + self.roomJid.split("@")[0] + '"]');
    $element.removeAttr("data-room-jid");

    delete self.megaChat[self.roomJid];
};


/**
 * Show UI elements of this room
 */
MegaChatRoom.prototype.show = function() {
    var self = this;

    self.$header.show();
    self.$messages.show();

    if(self.megaChat.currentlyOpenedChat && self.megaChat.currentlyOpenedChat != self.roomJid) {
        var oldRoom = self.megaChat.getCurrentRoom();
        if(oldRoom) {
            oldRoom.hide();
        }
    }

    self.megaChat.currentlyOpenedChat = self.roomJid;

    // update unread messages count
    $('.fm-chat-messages-block.unread', self.$messages).removeClass('unread');

    // render ui for the new/empty messages count
    var $navElement = self.getNavElement();

    var $count = $('.messages-icon span', $navElement);
    $count.text('');
    $count.parent().hide();

    self.refreshUI(true /* scroll to bottom */);
};


/**
 * Hide the UI elements of this room
 */
MegaChatRoom.prototype.hide = function() {
    var self = this;


    self.$header.hide();
    self.$messages.hide();

    if(self.megaChat.currentlyOpenedChat == self.roomJid) {
        self.megaChat.currentlyOpenedChat = null;
    }
};

/**
 * Append message to the UI of this room.
 * Note: This method will also log the message, so that later when someone asks for message sync this log will be used.
 *
 * @param message
 * @returns {boolean}
 */
MegaChatRoom.prototype.appendMessage = function(message) {
    var self = this;

    if(message.from == self.roomJid) {
        return; // dont show any system messages (from the conf room)
    }
    if(self.messagesIndex[message.id] !== undefined) {
        if(localStorage.d) {
            console.debug(self.roomJid.split("@")[0], message.id, "This message is already added to the message list (and displayed).");
        }
        return false;
    }

    self.messagesIndex[message.id] = self.messages.push(
        message
    );


    var $message = self.megaChat.$message_tpl.clone().removeClass("template");

    var jid = Karere.getNormalizedBareJid(message.from);


    if(jid != self.megaChat.karere.getBareJid() && self.roomJid != self.megaChat.getCurrentRoomJid()) {
        $message.addClass('unread');
    }

    var name = self.megaChat.getContactNameFromJid(jid);

    $('.fm-chat-username', $message).text(
        name
    );

    // add .current-name if this is my own message
    if(jid == self.megaChat.karere.getBareJid()) {
        $('.fm-chat-username', $message).addClass("current-name");
    }

    $('.fm-chat-message-time', $message).text(
        unixtimeToTimeString(message.timestamp)
    );
    $message.attr('data-timestamp', message.timestamp);
    $message.attr('data-id', message.id);


    if(!message.messageHtml) {
        message.messageHtml = htmlentities(message.message).replace(/\n/gi, "<br/>");
    }
    var event = new $.Event("onReceiveMessage");
    self.megaChat.trigger(event, message);

    if(event.isPropagationStopped()) {
        if(localStorage.d) {
            console.warn("Event propagation stopped receiving (rendering) of message: ", message)
        }
        return false;
    }


    if(message.messageHtml) {
        $('.fm-chat-message', $message).html(
            message.messageHtml
        );
    } else {
        $('.fm-chat-message', $message).html(
            htmlentities(message.message).replace(/\n/gi, "<br/>")
        );
    }



    var event = new $.Event("onBeforeRenderMessage");
    self.megaChat.trigger(event, {
        message: message,
        $message: $message,
        room: self
    });

    if(event.isPropagationStopped()) {
        if(localStorage.d) {
            console.warn("Event propagation stopped receiving (rendering) of message: ", message)
        }
        return false;
    }
    return self.appendDomMessage($message, message);
};


//TODO: Docs
MegaChatRoom.prototype.refreshScrollUI = function() {
    var self = this;
    var $jsp = self.$messages.data('jsp');

    assert($jsp, "JSP not available.");
    $jsp.reinitialise();
};

//TODO: Docs
MegaChatRoom.prototype.appendDomMessage = function($message, messageData) {
    var self = this;

    var $jsp = self.$messages.data('jsp');

    assert($jsp, "JSP not available.");

    var $before = null;
    var $after = null;

    if(!messageData) {
        messageData = {};
    }
    if(!messageData.timestamp) {
        messageData.timestamp = unixtime();
    }

    $message.attr('data-timestamp', messageData.timestamp);

    $('.jspContainer > .jspPane .fm-chat-messages-block', self.$messages).each(function() {
        if(messageData.timestamp >= $(this).attr('data-timestamp')) {
            $after = $(this);
        } else if($before === null && messageData.timestamp < $(this).attr('data-timestamp')) {
            $before = $(this);
        }
    });

    if(!$after && !$before) {
//        console.log("append: ", message.message);
        $('.jspContainer > .jspPane', self.$messages)
            .append($message);
    } else if($before) {
//        console.log("before: ", message.message, $before.text());
        $message.insertBefore($before);
    }  else if($after) {
//        console.log("after: ", message.message, $after.text());
        $message.insertAfter($after);
    }

    // group messages by hidding the author's name
    var $authorElement = $('.fm-chat-username', $message);
    var $prevMessage = $message.prev();
    if($authorElement.size() > 0 && $prevMessage.is(".fm-chat-messages-block")) {
        if($('.fm-chat-username', $prevMessage).text() == $authorElement.text()) {
            $message.addClass('grouped-message');
        }
    }


    $jsp.reinitialise();
    $jsp.scrollToBottom(self.options.animateScrollOnNewMessage);

    // update unread messages count
    if(self.roomJid != self.megaChat.getCurrentRoomJid() && $message.is('.unread')) {
        var $navElement = self.getNavElement();
        var $count = $('.messages-icon span', $navElement);

        var count = $('.fm-chat-messages-block.unread', self.$messages).size();
        if(count > 0) {
            $count.text(count);
            $count.parent().show();
        } else if(count == 0) {
            $count.text('');
            $count.parent().hide();
        }
    }
};

//TODO: Docs
MegaChatRoom.prototype.generateInlineDialog = function(type, title, messageContents, headingCssClasses, buttons, read) {
    headingCssClasses = headingCssClasses || [];

    var self = this;

    var $inlineDialog = self.megaChat.$inline_dialog_tpl.clone();

    if(!read && self.roomJid != self.megaChat.getCurrentRoomJid()) {
        $inlineDialog.addClass('unread');
    }

    $inlineDialog.addClass('fm-chat-inline-dialog-' + type);

    var $heading = $('.fm-chat-inline-dialog-header', $inlineDialog);

    $.each(headingCssClasses, function(k, v) {
        $heading.addClass(v);
    });

    $heading.text(title);

    $('.fm-chat-message', $inlineDialog).text(messageContents ? messageContents : "");

    var $pad = $('.fm-chat-messages-pad', $inlineDialog);

    var $primaryButton = $('.verify-button', $inlineDialog).detach();
    var $secondaryButton = $('.skip-button', $inlineDialog).detach();

    if(buttons) {
        $.each(buttons, function(k, v) {
            var $button = v.type == "primary" ? $primaryButton.clone() : $secondaryButton.clone();
            $button.addClass('fm-chat-inline-dialog-button-' + k);
            $button.text(v.text);
            $button.bind('click', function(e) {
                v.callback(e);
            });
            $pad.append($button);
        });
    }

    return $inlineDialog;
};

//TODO: Docs
MegaChatRoom.prototype.getInlineDialogInstance = function(type) {
    var self = this;

    return $('.fm-chat-inline-dialog-' + type, self.$messages);
};


/**
 * Request a messages sync for this room
 *
 * Note: This is a recursion-like function, which uses the `exceptFromUsers` argument to mark which users had failed to
 * respond with a message sync response.
 *
 * @param exceptFromUsers {Array} Array of FULL JIDs which should be skipped when asking for messages sync (e.g. they
 * had timed out in the past)
 */
MegaChatRoom.prototype.requestMessageSync = function(exceptFromUsers) {
    var self = this;
    var megaChat = self.megaChat;
    var karere = megaChat.karere;

    exceptFromUsers = exceptFromUsers || [];

    var users = karere.getUsersInChat(self.roomJid);

    // Pick from which user should i ask for sync.

    if(Object.keys(users).length == 1) {
        // empty room
        console.debug("Will not sync room: ", self.roomJid, ", because its empty (no participants).");
        return false;
    }

    var validUsers = [];
    var ownUsers = [];
    $.each(users, function(k, v) {
        if(k == karere.getJid()) {
            return; // continue;
        } else if(exceptFromUsers.indexOf(k) != -1) {
            return; //continue
        } else { // only from mine users: if(k.split("/")[0] == karere.getBareJid())
            if(k.split("/")[0] == karere.getBareJid()) {
                ownUsers.push(k);
            } else {
                validUsers.push(k);
            }
        }
    });


    if(ownUsers.length > 0) {
        validUsers = ownUsers; // prefer own users, e.g. my other resources
    }

    if(validUsers.length === 0) {
        if(localStorage.d) {
            console.error("No users to sync messages from for room: ", self.roomJid, "except list:", exceptFromUsers);
        }
        return false;
    }
    var userNum = Math.floor(Math.random() * validUsers.length) + 0;
    var userJid = validUsers[userNum];

    if(localStorage.dd) {
        console.debug("Potential message sync users: ", validUsers);
    }

    var messageId = karere.sendAction(
        userJid,
        'sync',
        {
            'roomJid': self.roomJid
        }
    );

    if(!self._syncRequests) {
        self._syncRequests = {};
    }

    if(self.state != MegaChatRoom.STATE.SYNCING && self.state != MegaChatRoom.STATE.READY) {
        self.setState(MegaChatRoom.STATE.SYNCING);
    }

    self._syncRequests[messageId] = {
        'messageId': messageId,
        'userJid': userJid,
        'timeoutHandler': function() {
            console.warn(new Date(), "Sync request timed out from user: ", userJid, " for room: ", self.roomJid);

            delete self._syncRequests[messageId];
            exceptFromUsers.push(userJid);
            self.requestMessageSync(exceptFromUsers);
        },
        'timer': setTimeout(function() {
            // timed out
            if(localStorage.d) {
                console.warn("Timeout waiting for", userJid, "to send sync message action. Will eventually, retry with some of the other users.");
            }

            self._syncRequests[messageId].timeoutHandler();
        }, self.options.requestMessagesSyncTimeout)
    };
    console.warn(new Date(), "Sent a sync request to user: ", userJid, " for room: ", self.roomJid);

    return true;
};

/**
 * Send messages sync response
 *
 * @param request {Object} with the `meta` from the actual request XMPP message
 * @returns {boolean}
 */
MegaChatRoom.prototype.sendMessagesSyncResponse = function(request) {
    var self = this;
    var megaChat = self.megaChat;
    var karere = megaChat.karere;

    if(!karere.getUsersInChat(self.roomJid)[request.from]) {
        if(localStorage.d) {
            console.error("Will not send message sync response to user who is not currently in the chat room for which he requested the sync.")
        }
        return false;
    }

    // Send messages as chunks (easier XML parsing?)

    var messagesCount = self.messages.length;
    var messagesChunkSize = 10;
    for(var i = 0; i < messagesCount; i+=messagesChunkSize) {
        var messages = self.messages.slice(i, i + messagesChunkSize);

        // cleanup some non-needed data from the messages
        $.each(messages, function(k, v) {
            if(messages[k].messageHtml) {
                delete messages[k].messageHtml;
            }
        });

        karere.sendAction(
            request.from,
            'syncResponse',
            {
                'inResponseTo': request.id,
                'roomJid': request.meta.roomJid,
                'messages': messages,
                'offset': i,
                'chunkSize': messagesChunkSize,
                'total': messagesCount
            }
        );
    }
};

/**
 * This is a handler of message sync responses
 *
 * @param response {Object} with the `meta` of the message sync response
 * @returns {boolean}
 */
MegaChatRoom.prototype.handleSyncResponse = function(response) {
    var self = this;
    var megaChat = self.megaChat;
    var karere = megaChat.karere;

    if(!karere.getUsersInChat(self.roomJid)[response.from]) {
        if(localStorage.d) {
            console.error("Will not accept message sync response from user who is currently not in the chat room for which I'd requested the sync.")
        }
        return false;
    }
    if(self._syncRequests) {
        if(!self._syncRequests[response.meta.inResponseTo]) {
            if(localStorage.d) {
                console.warn(
                    "Will not accept message sync response because inResponseTo, did not matched any cached messageIDs, " +
                    "got: ", response.meta.inResponseTo, ". Most likely they had sent the response too late. Requests " +
                    "currently active:", self._syncRequests
                );
            }
            return false;
        }
        clearTimeout(self._syncRequests[response.meta.inResponseTo].timer);
    } else {
        if(localStorage.d) {
            console.warn("Invalid sync response, room not found:", response);
        }
        return false;
    }

    // cleanup
    $.each(self._syncRequests, function(messageId, request) {
        clearTimeout(request.timer);
    });

    if(self._syncRequests.cleanupTimeout) {
        clearTimeout(self._syncRequests.cleanupTimeout);
    }
    self._syncRequests.cleanupTimeout = setTimeout(function() {
        delete self._syncRequests;
    }, self.options.syncRequestCleanupTimeout);

    $.each(response.meta.messages, function(k, msg) {
        self.appendMessage(msg);
    });

    if((response.meta.chunkSize + response.meta.offset) >= response.meta.total) {
        if(localStorage.d) {
            console.warn(new Date(), "finished sync from: ", response.from, self.roomJid, response.meta.total);
        }

        if(self.state < MegaChatRoom.STATE.SYNCED) {
            self.setState(MegaChatRoom.STATE.SYNCED);
        }
    } else {
        if(localStorage.d) {
            console.debug("waiting for more messages from sync: ", response.meta.total - (response.meta.chunkSize + response.meta.offset));
        }
    }

};

/**
 * Returns the actual DOM Element from the Mega's main navigation (tree) that is related to this chat room.
 *
 * @returns {*|jQuery|HTMLElement}
 */
MegaChatRoom.prototype.getNavElement = function() {
    var self = this;

    if(self.type == "private") {
        return $('#treesub_contacts li a[data-room-jid="' + self.roomJid.split("@")[0] + '"]');
    } else {
        throw new Error("Not implemented.");
    }
};


/**
 * Send message to this room
 *
 * @param message {String}
 * @param [meta] {Object}
 */
MegaChatRoom.prototype.sendMessage = function(message, meta) {
    var self = this;
    var megaChat = this.megaChat;
    meta = meta || {};

    if(self.state != MegaChatRoom.STATE.READY) {
        var messageId = megaChat.karere.generateMessageId(self.roomJid);
        var messageData = {
            from: megaChat.karere.getJid(),
            message: message,
            timestamp: unixtime(),
            meta: meta,
            id: messageId
        };

        var event = new $.Event("onQueueMessage");

        self.megaChat.trigger(event, messageData);

        if(event.isPropagationStopped()) {
            return false;
        }

        if(localStorage.dd) {
            console.debug("Queueing: ", messageData);
        }

        self._messagesQueue.push(messageData);

        self.appendMessage(messageData);
    } else {
        var event = new $.Event("onSendMessage");
        var eventData = {
            from: self.megaChat.karere.getJid(),
            roomJid: self.roomJid,
            message: message,
            meta: meta
        };

        self.megaChat.trigger(event, eventData);

        if(event.isPropagationStopped()) {
            return false;
        }

        megaChat.karere.sendRawMessage(self.roomJid, "groupchat", eventData.message, meta);
    }
};

/**
 * Helper for accessing options.mediaOptions;
 *
 * @returns {*}
 */
MegaChatRoom.prototype.getMediaOptions = function() {
    return this.options.mediaOptions;
};
/**
 * Attach/share (send as message) file/folder nodes to the chat
 * @param ids
 * @param [message]
 */
MegaChatRoom.prototype.attachNodes = function(ids, message) {
    var self = this;
    message = message || "";

    if(ids.length == 0) {
        return;
    }

    loadingDialog.show();

    var $promises = [];
    $.each(ids, function(i, id) {
        var $promise = new $.Deferred();
        $promises.push(
            $promise
        );

        api_req({a:'l',n: id},{
            node : id,
//            last : i == this.links.length-1,
            callback : function(res,ctx)
            {
                if (typeof res != 'number')  {
                    M.nodeAttr({h:id,ph:res});
                    $promise.resolve(M.d[id]);
                } else {
                    $promise.reject(res);
                }

            }
        });
    });


    var $promise = new $.Deferred();

    $.when.apply($, $promises)
        .done(function(responses) {
            var attachments = {};
            $.each(ids, function(k, nodeId) {
                var node = M.d[nodeId];
                attachments[nodeId] = {
                    'name': node.name,
                    'h': nodeId,
                    's': node.s,
                    't': node.t,
                    'ph': node.ph,
                    'sharekeys': a32_to_base64(u_sharekeys[nodeId])
                };
            });

            var messageId = self.sendMessage(message, {
                'attachments': attachments
            });
            $promise.resolve(
                messageId,
                attachments,
                message
            );
        })
        .fail(function(r) {
            $promise.reject(r);
        })
        .always(function() {
            loadingDialog.hide();
        });

    return $promise;
};

MegaChatRoom.prototype.getMessageById = function(messageId) {
    var self = this;
    var found = false;
    $.each(self.messages, function(k, v) {
        if(v.id == messageId) {
            found = v;
            return false; //break;
        }
    });

    return found;
};

window.megaChat = new MegaChat();