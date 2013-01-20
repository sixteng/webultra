define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/objects/base', 'ultra_engine/objects/box', 'ultra/common/math'], function(Ultra, _, Jvent) {
	'use strict';

	Ultra.Web3DEngine.Objects.SkyBox = function(engine) {
		Ultra.Web3DEngine.Objects.Base.call(this);
		this.engine = engine;
		this.skybox = null;
	};

	_.extend(Ultra.Web3DEngine.Objects.SkyBox.prototype, Ultra.Web3DEngine.Objects.Base.prototype, Jvent.prototype, {
		create: function(images) {
			this.box = new Ultra.Web3DEngine.Objects.Box(1.0, 1.0);
			this.skybox = this.engine.textureManager.getTextureCube(images, {});
		},
		createBuffers: function(device) {

		},
		render: function(device, camera, shader, opts) {
			if(!this.box.data[device.getName()]) {
				this.box.createBuffers(device);
			}

			if(!shader) {
				return;
			}

			shader.setParam('aVertexPosition', this.box.data[device.getName()].vBuffer);

			//Center camera, this is to allways get the skybox in correct position
			var tmp = Ultra.Math.Matrix4.clone(camera.getMatrix());
			var pos = Ultra.Math.Vector3.clone(camera.getPosition());
			Ultra.Math.Vector3.negate(pos, pos);
			Ultra.Math.Matrix4.translate(tmp, tmp, pos);

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', tmp);
			shader.setParam('uSampler', this.skybox);
			shader.setParam('uMMatrix', this.getMatrix());

			device.drawIndex(this.box.data[device.getName()].iBuffer, shader, Ultra.Consts.TRIANGLES, opts);
		}
	});
});