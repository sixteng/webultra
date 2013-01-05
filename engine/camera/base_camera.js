/*global: mat4:false,vec3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/mainengine'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

	Ultra.Web3DEngine.BaseCamera = function(input_handler) {
		var self = this;
		this.input_handler = input_handler;
		this.view_matrix = mat4.create();
		this.camera_matrix = mat4.create();
		this.pos = vec3.create();
		this.rot = vec3.create();

		//this.per_matrix = mat4.create();
		//mat4.perspective(45, device.gl.viewportWidth / device.gl.viewportHeight, 0.1, 1000.0, pMatrix);
		

		this.moving = false;
		this.lastX = 0;
		this.lastY = 0;
		this.speed = 100;
		this.dirty = true;

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

				self.rot[1] += xDelta*0.005;
				while (self.rot[1] < 0)
					self.rot[1] += Math.PI*2;
				while (self.rot[1] >= Math.PI*2)
					self.rot[1] -= Math.PI*2;

				self.rot[0] += yDelta*0.005;
				while (self.rot[0] < -Math.PI*0.5)
					self.rot[0] += Math.PI*0.5;
				while (self.rot[0] > Math.PI*0.5)
					self.rot[0] -= Math.PI*0.5;

				self.dirty = true;
			}
		});
	};

	_.extend(Ultra.Web3DEngine.BaseCamera.prototype, Jvent.prototype, {
		STATES : {
			MOVE_X : 1,
			MOVE_Y : 2,
			MOVE_Z : 3,
			YAW : 4,
			PITCH : 5,
			ROLL : 6
		},
		tick: function(e, engine, device, elapsed) {
			var dir = [0, 0, 0];
            var speed = (this.speed / 10000) * elapsed;

            if(this.input_handler.checkKey('W'.charCodeAt(0))) {
                dir[1] += speed;
            }
            if(this.input_handler.checkKey('S'.charCodeAt(0))) {
                dir[1] -= speed;
            }
            if(this.input_handler.checkKey('A'.charCodeAt(0))) {
                dir[0] -= speed;
            }
            if(this.input_handler.checkKey('D'.charCodeAt(0))) {
                dir[0] += speed;
            }
            if(this.input_handler.checkKey(32)) { // Space, moves up
                dir[2] += speed;
            }
            if(this.input_handler.checkKey(17)) { // Ctrl, moves down
                dir[2] -= speed;
            }

			if(dir[0] != 0 || dir[1] != 0 || dir[2] != 0) {
				mat4.identity(this.camera_matrix);
				mat4.rotateX(this.camera_matrix, this.rot[0]);
				mat4.rotateZ(this.camera_matrix, this.rot[1]);
				mat4.inverse(this.camera_matrix);

				mat4.multiplyVec3(this.camera_matrix, dir);

				// Move the camera in the direction we are facing
				vec3.add(this.pos, dir);
				this.dirty = true;
			}
            
		},
		getMatrix: function() {
			if(this.dirty) {
				mat4.identity(this.view_matrix);
				mat4.rotateX(this.view_matrix, this.rot[0] - Math.PI/2.0);
				mat4.rotateZ(this.view_matrix, this.rot[1]);
				mat4.rotateY(this.view_matrix, this.rot[2]);
				mat4.translate(this.view_matrix, [-this.pos[0], -this.pos[1], -this.pos[2]]);

				this.dirty = false;
			}

            return this.view_matrix;
		},
		getPos: function() {
			return this.pos;
		},
		setPos: function(pos) {
			this.pos[0] = pos[0];
			this.pos[1] = pos[1];
			this.pos[2] = pos[2];

			this.dirty = true;
		},
		getRot: function() {
			return _.clone(this.rot);
		},
		setRot: function(rot) {
			this.rot.yaw = rot.yaw;
			this.rot.pitch = rot.pitch;
			this.rot.roll = rot.roll;
		}
	});

	
});