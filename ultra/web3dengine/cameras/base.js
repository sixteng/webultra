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

		this.fustrum = Ultra.Math.Fustrum.create();
		this.fustrum_dirty = true;

		this.tMat = Ultra.Math.Matrix4.create();
		this.tPlane = Ultra.Math.Plane.create();
		this.tPlane2 = Ultra.Math.Plane.create();
    };

    _.extend(Ultra.Web3DEngine.Cameras.Base.prototype, Ultra.Web3DEngine.Objects.Base.prototype, {
		lookAt: function(point) {
			Ultra.Math.Matrix4.lookAt(this.position, point, this.up);
			Ultra.Math.Matrix4.getRotation(this.matrix, this.rotation);
		},
		getProjectionMatrix: function() {
			return this.projMatrix;
		},
		getFustrum: function() {
			return this.fustrum;
		},
		setNearPlane: function(plane) {
			Ultra.Math.Matrix4.invert(this.tMat, this.matrix);
			Ultra.Math.Matrix4.transpose(this.tMat, this.tMat);
			Ultra.Math.Plane.transformMat4(this.tPlane, plane, this.tMat);

			//Reset projectionMatrix
			this.updateProjectionMatrix();

			this.tPlane2[0] = (Ultra.Math.sgn(this.tPlane[0]) + this.projMatrix[8]) / this.projMatrix[0];
			this.tPlane2[1] = (Ultra.Math.sgn(this.tPlane[1]) + this.projMatrix[9]) / this.projMatrix[5];
			this.tPlane2[2] = 1.0;
			this.tPlane2[3] = (1.0 - this.projMatrix[10]) / this.projMatrix[14];

			var d1 = 1.0 / Ultra.Math.Plane.dot(this.tPlane, this.tPlane2);

			Ultra.Math.Vector4.scale(this.tPlane2, this.tPlane, d1);

			this.projMatrix[2] = this.tPlane2[0];
			this.projMatrix[6] = this.tPlane2[1];
			this.projMatrix[10] = this.tPlane2[2] + 1.0;
			this.projMatrix[14] = this.tPlane2[3];
		},
		updateFustrum: function() {
			Ultra.Math.Matrix4.multiply(this.tMat, this.getProjectionMatrix(), this.getMatrix());
			Ultra.Math.Fustrum.setFromMatrix4(this.fustrum, this.tMat);
		},
		updateProjectionMatrix: function() {
		},
		updateMatrix: function() {
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
			this.updateFustrum();
		},
		updateMatrix: function() {
			Ultra.Math.Matrix4.identity(this.matrix);
			Ultra.Math.Matrix4.rotateX(this.matrix, this.matrix, this.rotation[0]);
			Ultra.Math.Matrix4.rotateY(this.matrix, this.matrix, this.rotation[1]);
			Ultra.Math.Matrix4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
			Ultra.Math.Matrix4.translate(this.matrix, this.matrix, this.position);

			this.matrixDirty = false;
			this.updateFustrum();
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
			this.updateFustrum();
		}
    });

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