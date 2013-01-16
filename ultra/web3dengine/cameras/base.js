/*global: mat4:false,vec3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/objects/base'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Cameras))
		Ultra.Web3DEngine.Cameras = {};

	Ultra.Web3DEngine.Cameras.Base = function() {
		Ultra.Web3DEngine.Objects.Base.call(this);
		this.projMatrix = Ultra.Math.Matrix4.create();
		this.up = Ultra.Math.Vector3.create([0, 1, 0]);
    };

    _.extend(Ultra.Web3DEngine.Cameras.Base.prototype, Ultra.Web3DEngine.Objects.Base.prototype, {
		lookAt: function(point) {
			Ultra.Math.Matrix4.lookAt(this.position, point, this.up);
			Ultra.Math.Matrix4.getRotation(this.matrix, this.rotation);
		},
		getProjectionMatrix: function() {
			return this.projMatrix;
		},
		updateProjectionMatrix: function() {
			//Dummy Function
		}
    });


    Ultra.Web3DEngine.Cameras.PerspectiveCamera = function( fov, aspect, near, far ) {
		Ultra.Web3DEngine.Cameras.Base.call(this);

		this.fov = fov;
		this.aspect = aspect;
		this.near = near;
		this.far = far;

		this.updateProjectionMatrix();
    };

    _.extend(Ultra.Web3DEngine.Cameras.PerspectiveCamera.prototype, Ultra.Web3DEngine.Cameras.Base.prototype, {
		updateProjectionMatrix: function() {
			Ultra.Math.Matrix4.perspective(this.projMatrix, this.fov, this.aspect, this.near, this.far);
		},
		updateMatrix: function() {
			Ultra.Math.Matrix4.identity(this.matrix);
			Ultra.Math.Matrix4.rotateX(this.matrix, this.matrix, this.rotation[0]);
			Ultra.Math.Matrix4.rotateY(this.matrix, this.matrix, this.rotation[1]);
			Ultra.Math.Matrix4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
			Ultra.Math.Matrix4.translate(this.matrix, this.matrix, this.position);
			//Ultra.Math.Matrix4.scale(this.matrix, this.scale);
			
			this.matrixDirty = false;
		}
    });

    Ultra.Web3DEngine.Cameras.OrthographicCamera = function( left, right, top, bottom, near, far ) {
		Ultra.Web3DEngine.Cameras.Base.call(this);

		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
		this.near = near;
		this.far = far;

		this.updateProjectionMatrix();
    };

    _.extend(Ultra.Web3DEngine.Cameras.OrthographicCamera.prototype, Ultra.Web3DEngine.Cameras.Base.prototype, {
		updateProjectionMatrix: function() {
			Ultra.Math.Matrix4.ortho(this.projMatrix, this.left, this.right, this.bottom, this.top, this.near, this.far);
		}
		/*,
		updateMatrix: function() {
			Ultra.Math.Matrix4.identity(this.matrix);
			Ultra.Math.Matrix4.rotateX(this.matrix, this.matrix, this.rotation[0]);
			Ultra.Math.Matrix4.rotateY(this.matrix, this.matrix, this.rotation[1]);
			Ultra.Math.Matrix4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
			Ultra.Math.Matrix4.translate(this.matrix, this.matrix, this.position);
			//Ultra.Math.Matrix4.scale(this.matrix, this.scale);
			
			this.matrixDirty = false;
		}
		*/
    });

    Ultra.Web3DEngine.Cameras.FirstPersonCamera = function(input_handler, fov, aspect, near, far) {
		var self = this;

		Ultra.Web3DEngine.Cameras.PerspectiveCamera.call(this, fov, aspect, near, far);

		this.input_handler = input_handler;
		this.movementSpeed = 10.0;
		this.rotationSpeed = 0.005;

		if(input_handler == null) return;

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

			if(dir[0] != 0 || dir[1] != 0 || dir[2] != 0) {
				this.translateX(dir[0]);
				this.translateY(dir[2]);
				this.translateZ(dir[1]);
			}
		}
	});

	/*
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
		this.speed = 50;
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
		getProjectionMatrix: function() {
			return this.projMatrix;
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

*/
});