define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/cameras/base'], function(Ultra, _, Jvent) {
	'use strict';

    Ultra.Web3DEngine.Cameras.FirstPersonCamera = function(input_handler, fov, aspect, near, far) {
		var self = this;

		Ultra.Web3DEngine.Cameras.PerspectiveCamera.call(this, fov, aspect, near, far);

		this.input_handler = input_handler;
		this.movementSpeed = 10.0;
		this.rotationSpeed = 0.005;

		if(input_handler === null) return;

		this.input_handler.on('mousedown', 0, function(e) {
			self.moving = true;
			self.lastX = e.pageX;
			self.lastY = e.pageY;
		});

		this.input_handler.on('mouseup', 0, function(e) {
			self.moving = false;
		});

		this.input_handler.on('mousemove', function(e) {
			if (self.moving) {
				var xDelta = e.pageX - self.lastX;
				var yDelta = e.pageY - self.lastY;

				self.lastX = e.pageX;
				self.lastY = e.pageY;

				self.rotateX(yDelta * 0.005);
				self.rotateY(xDelta * 0.005);
			}
		});
	};

	_.extend(Ultra.Web3DEngine.Cameras.FirstPersonCamera.prototype, Ultra.Web3DEngine.Cameras.PerspectiveCamera.prototype, Jvent.prototype, {
		tick: function(e, engine, device, elapsed) {
			var dir = [0, 0, 0];
            var speed = this.movementSpeed * elapsed;

            if(this.input_handler.checkKey('W'.charCodeAt(0))) {
                dir[1] += speed;
            }
            if(this.input_handler.checkKey('S'.charCodeAt(0))) {
                dir[1] -= speed;
            }
            if(this.input_handler.checkKey('A'.charCodeAt(0))) {
                dir[0] += speed;
            }
            if(this.input_handler.checkKey('D'.charCodeAt(0))) {
                dir[0] -= speed;
            }
            if(this.input_handler.checkKey(32)) { // Space, moves up
                dir[2] -= speed;
            }
            if(this.input_handler.checkKey(17)) { // Ctrl, moves down
                dir[2] += speed;
            }

			if(dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0) {
				this.translateX(dir[0]);
				this.translateY(dir[2]);
				this.translateZ(dir[1]);
			}
		}
	});
});