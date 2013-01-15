/*global: mat4:false, mat3:false, vec3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra/common/math'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

    Ultra.Web3DEngine.Terrain = function(engine) {
		this.engine = engine;
		this.patches = [];
		this.planes = [];
    };

    _.extend(Ultra.Web3DEngine.Terrain.prototype, Jvent.prototype, {
		addPatch: function(path, device, pos) {
			var patch = new Ultra.Web3DEngine.TerrainPatch(this.engine);
			patch.createFromFile(path, device);
			this.patches.push(patch);


			if(pos)
				patch.setPos(pos[0], pos[1], 0);
		},
		buildPlanes: function(device) {
			this.cells = 127;
			this.size = 128;

			var tVert = this.buildPlanePositions(this.cells, this.size / (this.cells + 1), 0.0);
			var iVert = this.buildPlaneIndices(this.cells);

			this.planes.push({ vBuffer : device.createVertexBuffer(tVert, 3), iBuffer : device.createIndexBuffer(iVert)});
		},
		buildPlanePositions: function( cells, scale, height ) {
			//var halfGridSize = (gridSize - 1) * cellSize * 0.5;

			var positions = [];
			for (var y = 0; y < cells + 1; ++y) {
				for (var x = 0; x < cells + 1; ++x) {
					positions.push(x * scale);
					positions.push(y * scale);
					positions.push(height);
				}
			}
			return positions;
		},
		buildPlaneIndices: function( cells ) {
			var indices = [];
			var count = cells + 1;
			var odd = true;
			var x;
			for (var y = 0; y < cells; ++y) {
				//if(y != 0)
				//indices.push(indices[indices.length - 1]);

				if(odd) {
					for (x = 0; x < cells + 1; ++x) {
						indices.push((y * count) + x);
						indices.push(((y + 1) * count) + x);
					}
				} else {
					for (x = 0; x < cells + 1; ++x) {
						indices.push(((y + 1) * count) - (x + 1));
						indices.push(((y + 1) * count) + (count - x - 1));
					}
				}


				//if(y != (cells - 2))
				//indices.push((y + 1) * cells + (cells - 1));

				odd = !odd;
			}
			return indices;
		},
		render: function(device, camera) {
			for(var i = 0; i < this.patches.length; i += 1) {
				this.patches[i].render(device, camera, this.planes[0], 128);
			}
		}
    });

	Ultra.Web3DEngine.TerrainPatch = function(engine) {
		this.engine = engine;

		this.matrix = mat4.create();
		mat4.identity(this.matrix);

		this.ready = false;
		this.collection = {};
		this.shaders = false;

		this.heightMap = null;
		this.combined = null;
		this.mask = null;

		//TODO: remove!
		this.pos = [0, 0];
		//this.lightDir = vec3.fromValues(0, 0, 100);
	};

	_.extend(Ultra.Web3DEngine.TerrainPatch.prototype, Jvent.prototype, {
		createFromFile: function(path, device) {
			var self = this;

			self.heightMap = this.engine.textureManager.getTexture('/assets/images/heightmap.png', device, {});
			self.combined = this.engine.textureManager.getTexture('/assets/images/combined.png', device, {});
			self.mask = this.engine.textureManager.getTexture('/assets/images/mask.png', device, {});
		},
		destroy: function(device) {

		},
		render: function(device, camera, plane, size) {
			var shader = this.engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
			if(!shader)
				return;

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			shader.setParam('planePos', [this.pos[0], this.pos[1]]);
			shader.setParam('planeSize', [size, size]);

			shader.setParam('uSampler', this.heightMap);
			shader.setParam('mask', this.mask);
			shader.setParam('combined', this.combined);

			shader.setParam('aVertexPosition', plane.vBuffer);

			device.drawIndex(plane.iBuffer, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);
		},
		setShaders: function(shaders) {

		},
		setRot: function(x, y, z) {
			mat4.identity(this.matrix);
			mat4.rotate(this.matrix, Ultra.Math.degToRad(x), [1, 0, 0]);
			mat4.rotate(this.matrix, Ultra.Math.degToRad(y), [0, 1, 0]);
			mat4.rotate(this.matrix, Ultra.Math.degToRad(z), [0, 0, 1]);
		},
		setPos: function(x, y, z) {
			this.pos = [x, y, z];
			//mat4.rotate(this.matrix, degToRad(x), [1, 0, 0]);
		}
	});

	
});