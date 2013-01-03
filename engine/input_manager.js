define(['ultra/ultra', 'underscore'], function(Ultra, _) {
	'use strict';

	Ultra.InputManager = function(config) {
		_.defaults(config, {});
		this.config = config;
		this.pressedKeys = new Array(128);
		this.handlers = {
			keyup: {},
			keydown: {},
			mousedown: {},
			mouseup: {},
			mousemove: []
		};
	}

	_.extend(Ultra.InputManager.prototype, {
		enable: function () {
			this.config.target.onkeydown = this.handleKeyDown.bind(this);
			this.config.target.onkeyup = this.handleKeyUp.bind(this);
			this.config.target.onmousedown = this.handleMouseDown.bind(this);
			this.config.target.onmouseup = this.handleMouseUp.bind(this);
			this.config.target.onmousemove = this.handleMouseMove.bind(this);
		},
		disable: function () {
			this.config.target.onkeydown = null;
			this.config.target.onkeyup = null;
			this.config.target.onmousedown = null;
			this.config.target.onmouseup = null;
			this.config.target.onmousemove = null;
		},
		on: function (event, keycode, handler) {
			if (event == 'keyup' || event == 'keydown' || event == 'mousedown' || event == 'mouseup') {
				if (!this.handlers[event][keycode]) {
					this.handlers[event][keycode] = [];
				}

				this.handlers[event][keycode].push(handler);
			} else if (event == 'mousemove') {
				if (_.isFunction(keycode)) {
					handler = keycode;
				}

				this.handlers[event].push(handler);
			}
		},
		off: function (event, keycode, handler) {
			var i;
			if (event == 'keyup' || event == 'keydown' || event == 'mousedown' || event == 'mouseup') {
				if (!this.handlers[event][keycode]) {
					return;
				}

				for (i = 0; i < this.handlers[event][keycode].length; i += 1) {
					if (this.handlers[event][keycode][i] == handler) {
						this.handlers[event][keycode][i].splice(i, 1);
					}
				}
			} else if (event == 'mousemove') {
				for (i = 0; i < this.handlers[event].length; i += 1) {
					if (this.handlers[event][i] == handler) {
						this.handlers[event][i].splice(i, 1);
					}
				}
			}

		},
		checkKey: function(keyCode) {
			return this.pressedKeys[keyCode];
		},
		handleKeyDown: function (e) {
			this.pressedKeys[e.keyCode] = true;
			if (!this.handlers['keydown'][e.keyCode]) {
				return;
			}
			for (var i = 0; i < this.handlers['keydown'][e.keyCode].length; i += 1) {
				if (this.handlers['keydown'][e.keyCode][i](e)) {
					return;
				}
			}
		},
		handleKeyUp: function(e) {
			this.pressedKeys[e.keyCode] = false;
			if(!this.handlers['keyup'][e.keyCode]) return;

			for(var i = 0; i < this.handlers['keyup'][e.keyCode].length; i += 1) {
				if(this.handlers['keyup'][e.keyCode][i](e)) return;
			}
		},
		handleMouseDown: function(e) {
			if(!this.handlers['mousedown'][e.button]) return;

			for(var i = 0; i < this.handlers['mousedown'][e.button].length; i += 1) {
				if(this.handlers['mousedown'][e.button][i](e)) return;
			}
		},
		handleMouseUp: function(e) {
			if(!this.handlers['mouseup'][e.button]) return;

			for(var i = 0; i < this.handlers['mouseup'][e.button].length; i += 1) {
				if(this.handlers['mouseup'][e.button][i](e)) return;
			}
		},
		handleMouseMove: function(e) {
			for(var i = 0; i < this.handlers['mousemove'].length; i += 1) {
				if(this.handlers['mousemove'][i](e)) return;
			}
		}
	});
})