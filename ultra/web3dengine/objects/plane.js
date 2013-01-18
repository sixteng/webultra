/*global: mat4:false, mat3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/objects/base', 'ultra/common/math'], function(Ultra, _, Jvent) {
	'use strict';

	Ultra.Web3DEngine.Objects.Plane = function(width, height, cells) {
		Ultra.Web3DEngine.Objects.Base.call(this);

		this.width = width;
		this.height = height;

		this.data = {};

		this.cells = cells ? cells : 1;
	};

	_.extend(Ultra.Web3DEngine.Objects.Plane.prototype, Ultra.Web3DEngine.Objects.Base.prototype, Jvent.prototype, {
		create: function() {
			var verts = [];
			var indices = [];
			var normals = [];
			var uvs = [];

			var x, y, odd = true;

			var halfWidth = this.width / 2;
			var halfHeight = this.height / 2;

			var cells1 = this.cells + 1;

			//Vertices
			for(y = 0; y < this.cells + 1; y++) {
				for (x = 0; x < this.cells + 1; x++) {
					verts.push(x * this.width / this.cells - halfWidth);
					verts.push(-(y * this.height / this.cells - halfHeight));
					verts.push(0);

					normals.push(0);
					normals.push(0);
					normals.push(1);

					uvs.push((verts[verts.length - 3] + halfWidth) / this.width);
					uvs.push((verts[verts.length - 2] + halfHeight) / this.height);
				}
			}

			//indices
			for (y = 0; y < this.cells; ++y) {
				if(odd) {
					for (x = 0; x < cells1; ++x) {
						indices.push((y * cells1) + x);
						indices.push(((y + 1) * cells1) + x);
					}
				} else {
					for (x = 0; x < cells1; ++x) {
						indices.push(((y + 1) * cells1) - (x + 1));
						indices.push(((y + 1) * cells1) + (cells1 - x - 1));
					}
				}

				odd = !odd;
			}

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

			shader.setParam('uMMatrix', this.getMatrix());
			shader.setParam('uNMatrix', normalMatrix);

			device.drawIndex(this.data[device.getName()].iBuffer, shader, Ultra.Web3DEngine.TRIANGLE_STRIP, opts);
		}
	});
});