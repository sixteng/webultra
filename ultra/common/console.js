/*global: document:false*/
define(['ultra/ultra', 'underscore', 'jquery'], function(Ultra, _, $) {
	'use strict';

	Ultra.Console = function(el, engine) {
		this.engine = engine;
		if(!(el instanceof $))
			el = $(el);

		if(el.size() === 0)
			throw 'Unknown Element';

		this.attach(el);
	};


	_.extend(Ultra.Console.prototype, {
		create: function() {
			var el = $('<div id="console">');
			el.append('<div class="window"></div>');
			el.append('<div class="input">&gt;<input type="text" size="60"/></div>');

			return el;
		},
		processCommand: function(cmd) {

		},
		attach: function(el) {
			var self = this;
			var con = this.create();

			$('body').append(con);

			con.width($('#glcanvas').width()).height(($('#glcanvas').height() * 0.25));
			con.offset({ top : $('#glcanvas').offset().top, left : $('#glcanvas').offset().left });

			con.find('.window').height(con.height() - 40);

			$(document).keypress(function(e) {
				if(e.which == 167) {
					con.slideToggle();
					return false;
				}
			});

			this.engine.on('console', function(e, msg) {
				var win = con.find('.window');
				var scroll = false;

				if(win[0].scrollHeight == win.scrollTop() + win.innerHeight()) {
					scroll = true;
				}
				con.find('.window').append('<p>' + msg + '</p>');
				if(scroll)
					win.scrollTop(win[0].scrollHeight);
			});

			con.find('.input input').keypress(function(e) {
				if(e.which == 13) {
					var cmd = $(this).val();
					self.processCommand(cmd);
					$(this).val('');
				}
			});
		}
	});
});