/*global: mat4:false, mat3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra_engine/objects/base', 'ultra/common/math'], function(Ultra, _, Jvent) {
	'use strict';

	Ultra.Web3DEngine.Objects.Mesh = function(engine, name) {

		Ultra.Web3DEngine.Objects.Base.call(this);

		this.engine = engine;
		this.data = {
		};

		this.submeshes = [];
		this.ready = false;
		this.collection = {};
		this.shaders = false;
		this.root = this;
		this.textures = {};
	};

	_.extend(Ultra.Web3DEngine.Objects.Mesh.prototype, Ultra.Web3DEngine.Objects.Base.prototype, Jvent.prototype, {
		createFromFile: function(path) {
			var self = this;
			var file = this.engine.fileManager.loadFileAsJson(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				for(var i = 0; i < data.Mesh.length; i += 1) {
					var submesh = new Ultra.Web3DEngine.Objects.Mesh(self.engine, 'SubMesh_' + i);
					submesh.data.raw = data.Mesh[i];
					//submesh.createFromData(device, data.Mesh[i]);
					submesh.index = i;
					submesh.root = self;
					submesh.ready = true;
					self.submeshes.push(submesh);
				}

				self.ready = true;
			});
		},
		destroy: function(device) {
			this.ready = false;
			for(var i = 0; i < this.submeshes.length; i += 1) {
				this.submeshes[i].destroy(device);
				delete this.submeshes[i];
			}

			if(this.data[device.getName()].vBuffer) {
				this.engine.getRenderDevice().deleteVertexBuffer(this.data[device.getName()].vBuffer);
			}

			if(this.data[device.getName()].iBuffer) {
				this.engine.getRenderDevice().deleteIndexBuffer(this.data[device.getName()].iBuffer);
			}

			if(this.data[device.getName()].nBuffer) {
				this.engine.getRenderDevice().deleteVertexBuffer(this.data[device.getName()].nBuffer);
			}

			this.submeshes.length = 0;
		},
		createFromData: function(device) {
			var vertices = _.flatten(this.data.raw.Vertices);

			this.data[device.getName()] = {};
			this.data[device.getName()].vBuffer = device.createVertexBuffer(vertices, 3);

			var indices = _.flatten(_.reduce(this.data.raw.Faces, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].iBuffer = device.createIndexBuffer(indices);

			if(!this.data.raw.Normals)
				return;

			var normals = _.flatten(_.reduce(this.data.raw.Normals, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].nBuffer = device.createVertexBuffer(normals, 3);

			if(!this.data.raw.UVCoords)
				return;

			var uvs = _.flatten(_.reduce(this.data.raw.UVCoords, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].uvBuffer = device.createVertexBuffer(uvs, 2);
		},
		render: function(device, camera, shader, parent) {
			if(!this.ready) return;

			if(!this.data[device.getName()] && this.data.raw) {
				this.createFromData(device);
			}

			if(!shader) {
				shader = this.engine.shaderManager.getShaderProgram(this.shaders);
				if(!shader)
					return;
			}

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			for(var i = 0; i < this.submeshes.length; i += 1) {
				this.submeshes[i].render(device, camera, shader, this);
			}

			if(_.isUndefined(this.data[device.getName()]) || _.isUndefined(this.data[device.getName()].vBuffer) || this.data[device.getName()].vBuffer === null) return;
			
			//TODO: FIX so loaded from file or material or something!!!
			if(this.index == 7) {
				return;
			} else if(this.index === 0) {
				shader.setParam('uSampler', this.root.textures['door']);
			} else if(this.index == 1) {
				shader.setParam('uSampler', this.root.textures['window2']);
			} else if(this.index == 2) {
				shader.setParam('uSampler', this.root.textures['window']);
			} else if(this.index == 4) {
				shader.setParam('uSampler', this.root.textures['wood_floor']);
			} else if(this.index == 5) {
				shader.setParam('uSampler', this.root.textures['plaster']);
			} else if(this.index == 6) {
				shader.setParam('uSampler', this.root.textures['sign']);
			} else if(this.index == 8) {
				shader.setParam('uSampler', this.root.textures['stone_wall']);
			} else if(this.index == 9) {
				shader.setParam('uSampler', this.root.textures['metal_rusted']);
			} else if(this.index == 10) {
				shader.setParam('uSampler', this.root.textures['roof']);
			} else if(this.index == 11) {
				shader.setParam('uSampler', this.root.textures['sign2']);
			} else if(this.index == 12) {
				shader.setParam('uSampler', this.root.textures['stone']);
			} else if(this.tex){
				shader.setParam('uSampler', this.tex );
			} else {
				shader.setParam('uSampler', { data : {} });
			}


			var normalMatrix = mat3.create();
			Ultra.Math.Matrix3.toInverseMat3(!parent ? this.getMatrix() : parent.getMatrix(), normalMatrix);
			Ultra.Math.Matrix3.transpose(normalMatrix, normalMatrix);

			shader.setParam('uMMatrix', !parent ? this.getMatrix() : parent.getMatrix());
			shader.setParam('uNMatrix', normalMatrix);

			shader.setParam('aVertexPosition', this.data[device.getName()].vBuffer);
			shader.setParam('aVertexNormal', this.data[device.getName()].nBuffer);
			shader.setParam('aTextureCoord', this.data[device.getName()].uvBuffer);
			//this.engine.getRenderDevice().gl.uniformMatrix4fv(shader.params.uMMatrix.loc, false, this.matrix);

			device.drawIndex(this.data[device.getName()].iBuffer, shader, Ultra.Web3DEngine.TRIANGLES);
		},
		setShaders: function(shaders) {
			this.shaders = shaders;
		}
	});

	
});