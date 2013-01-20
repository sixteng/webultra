/*global: mat4:false, mat3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/objects/base', 'ultra/common/math'], function(Ultra, _, Jvent) {
	'use strict';

	Ultra.Web3DEngine.Objects.Box = function() {
		Ultra.Web3DEngine.Objects.Base.call(this);

		this.data = {};
	};

	_.extend(Ultra.Web3DEngine.Objects.Box.prototype, Ultra.Web3DEngine.Objects.Base.prototype, Jvent.prototype, {
		create: function() {
			var verts = [];
			var indices = [];
			var normals = [];
			var uvs = [];

			verts = [
				// Front face
				-1.0, -1.0, 1.0,
				1.0, -1.0, 1.0,
				1.0, 1.0, 1.0,
				-1.0, 1.0, 1.0,

				// Back face
				-1.0, -1.0, -1.0,
				-1.0, 1.0, -1.0,
				1.0, 1.0, -1.0,
				1.0, -1.0, -1.0,

				// Top face
				-1.0, 1.0, -1.0,
				-1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, -1.0,

				// Bottom face
				-1.0, -1.0, -1.0,
				1.0, -1.0, -1.0,
				1.0, -1.0, 1.0,
				-1.0, -1.0, 1.0,

				// Right face
				1.0, -1.0, -1.0,
				1.0, 1.0, -1.0,
				1.0, 1.0, 1.0,
				1.0, -1.0, 1.0,

				// Left face
				-1.0, -1.0, -1.0,
				-1.0, -1.0, 1.0,
				-1.0, 1.0, 1.0,
				-1.0, 1.0, -1.0
			];

			indices = [
				0, 1, 2, 0, 2, 3, // Front face
				4, 5, 6, 4, 6, 7, // Back face
				8, 9, 10, 8, 10, 11, // Top face
				12, 13, 14, 12, 14, 15, // Bottom face
				16, 17, 18, 16, 18, 19, // Right face
				20, 21, 22, 20, 22, 23 // Left face
			];

			uvs = [
				// Front face
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,

				// Back face
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,

				// Top face
				0.0, 1.0,
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,

				// Bottom face
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,
				1.0, 0.0,

				// Right face
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,

				// Left face
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0
			];

			normals = [
				// Front face
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,

				// Back face
				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,

				// Top face
				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,

				// Bottom face
				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,

				// Right face
				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,

				// Left face
				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0
			];

			return {
				vertices : verts,
				indices : indices,
				normals : normals,
				uvs : uvs
			};
		},
		createBuffers: function(device) {
			var data = this.create();
			this.data[device.getName()] = {
				vBuffer : device.createVertexBuffer(data.vertices, 3),
				uvBuffer : device.createVertexBuffer(data.uvs, 2),
				nBuffer : device.createVertexBuffer(data.normals, 3),
				iBuffer : device.createIndexBuffer(data.indices)
			};
		},
		render: function(device, camera, shader, opts) {
			if(!this.data[device.getName()]) {
				this.createBuffers(device);
			}

			if(!shader) {
				return;
			}

			shader.setParam('aVertexPosition', this.data[device.getName()].vBuffer);
			shader.setParam('aTextureCoord', this.data[device.getName()].uvBuffer);
			shader.setParam('aVertexNormal', this.data[device.getName()].nBuffer);

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			var normalMatrix = mat3.create();
			Ultra.Math.Matrix3.toInverseMat3(this.getMatrix(), normalMatrix);
			Ultra.Math.Matrix3.transpose(normalMatrix, normalMatrix);

			shader.setParam('uSampler', this.tex);

			shader.setParam('uMMatrix', this.getMatrix());
			shader.setParam('uNMatrix', normalMatrix);

			device.drawIndex(this.data[device.getName()].iBuffer, shader, Ultra.Consts.TRIANGLES, opts);
		}
	});
});