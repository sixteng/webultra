/*global: mat4:false, mat3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/mainengine'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

	Ultra.Web3DEngine.Mesh = function(engine, name) {
		this.engine = engine;
		this.data = {
		};

		this.matrix = mat4.create();
		mat4.identity(this.matrix);
		//mat4.rotate(this.matrix, degToRad(90), [0, 1, 0]);
		this.submeshes = [];
		this.ready = false;
		this.collection = {};
		this.shaders = false;
		this.root = this;
		this.textures = {};

		this.pos = [0, 0, 0];
		this.rot = [0, 0, 0];
		this.scale = [1, 1, 1];
	};

	_.extend(Ultra.Web3DEngine.Mesh.prototype, Jvent.prototype, {
		createFromFile: function(path, device) {
			var self = this;

			if(this.ready)
				this.destroy(device);

			var file = this.engine.fileManager.loadFileAsJson(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				for(var i = 0; i < data.Mesh.length; i += 1) {
					var submesh = new Ultra.Web3DEngine.Mesh(self.engine, 'SubMesh_' + i);
					submesh.createFromData(device, data.Mesh[i]);
					submesh.index = i;
					submesh.root = self;
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
		createFromData: function(device, mesh) {
			var vertices = _.flatten(mesh.Vertices);

			this.data[device.getName()] = {};

			this.data[device.getName()].vBuffer = device.createVertexBuffer(vertices, 3);

			var indices = _.flatten(_.reduce(mesh.Faces, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].iBuffer = device.createIndexBuffer(indices);

			var normals = _.flatten(_.reduce(mesh.Normals, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].nBuffer = device.createVertexBuffer(normals, 3);

			var uvs = _.flatten(_.reduce(mesh.UVCoords, function(list, item) { return list.concat(_.values(item));}, []));
			this.data[device.getName()].uvBuffer = device.createVertexBuffer(uvs, 2);

			this.ready = true;
		},
		render: function(device, camera, shader, matrix) {
			if(!this.ready) return;

			if(matrix)
				this.matrix = matrix;

			if(!shader) {
				shader = this.engine.shaderManager.getShaderProgram(this.shaders);
				if(!shader)
					return;
			}

			shader.setParam('uPMatrix', camera.pMatrix);
			shader.setParam('uMVMatrix', camera.getMatrix());

			for(var i = 0; i < this.submeshes.length; i += 1) {
				this.submeshes[i].render(device, camera, shader, this.matrix);
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
			} else {
				shader.setParam('uSampler', null);
			}

			var normalMatrix = mat3.create();
			mat4.toInverseMat3(this.matrix, normalMatrix);
			mat3.transpose(normalMatrix);

			shader.setParam('uMMatrix', this.matrix);
			shader.setParam('uNMatrix', normalMatrix);

			shader.setParam('aVertexPosition', this.data[device.getName()].vBuffer);
			shader.setParam('aVertexNormal', this.data[device.getName()].nBuffer);
			shader.setParam('aTextureCoord', this.data[device.getName()].uvBuffer);
			//this.engine.getRenderDevice().gl.uniformMatrix4fv(shader.params.uMMatrix.loc, false, this.matrix);

			device.drawIndex(this.data[device.getName()].iBuffer, shader, Ultra.Web3DEngine.TRIANGLES);
		},
		setShaders: function(shaders) {
			this.shaders = shaders;
		},
		setPos: function(x, y, z) {
			this.pos = [x, y, z];
			this.calcMatrix();
		},
		setRot: function(x, y, z) {
			this.rot = [x, y, z];
			this.calcMatrix();
		},
		setScale: function(x, y, z) {
			this.scale = [x, y, z];
			this.calcMatrix();
		},
		calcMatrix: function() {
			mat4.identity(this.matrix);
			mat4.rotate(this.matrix, degToRad(this.rot[0]), [1, 0, 0]);
			mat4.rotate(this.matrix, degToRad(this.rot[1]), [0, 1, 0]);
			mat4.rotate(this.matrix, degToRad(this.rot[2]), [0, 0, 1]);
			mat4.translate(this.matrix, this.pos);
			mat4.scale(this.matrix, this.scale);
		}
	});

	
});