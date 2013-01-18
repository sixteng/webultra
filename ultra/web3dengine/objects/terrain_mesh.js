/*global: mat4:false, mat3:false, vec3:false*/
define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra/common/math', 'ultra_engine/objects/plane'], function(Ultra, _, Jvent) {
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

			//var tVert = this.buildPlanePositions(this.cells, this.size / (this.cells + 1), 0.0);
			//var iVert = this.buildPlaneIndices(this.cells);
			this.planes.push(new Ultra.Web3DEngine.Objects.Plane(128, 128, 127));
			//this.planes.push({ vBuffer : device.createVertexBuffer(tVert, 3), iBuffer : device.createIndexBuffer(iVert)});
		},
		render: function(device, camera, shader) {
			for(var i = 0; i < this.patches.length; i += 1) {
				this.patches[i].render(device, camera, shader, this.planes[0], 128);
			}
		},
		renderDebug: function(device, camera, shader) {
			for(var i = 0; i < this.patches.length; i += 1) {
				this.patches[i].renderDebug(device, camera, shader, this.planes[0], 128);
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

			self.heightMap = this.engine.textureManager.getTexture('/assets/images/heightmap.png', {});
			self.combined = this.engine.textureManager.getTexture('/assets/images/combined.png', {});
			self.mask = this.engine.textureManager.getTexture('/assets/images/mask.png', {});
		},
		destroy: function(device) {

		},
		render: function(device, camera, shader, plane, size) {
			//var shader = this.engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
			if(!shader) {
				shader = this.engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
				if(!shader)
					return;
			}

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			shader.setParam('planePos', [this.pos[0], this.pos[1]]);
			shader.setParam('planeSize', [size, size]);

			shader.setParam('uSampler', this.heightMap);
			shader.setParam('mask', this.mask);
			shader.setParam('combined', this.combined);

			plane.render(device, camera, shader);
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