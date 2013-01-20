define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/engine', 'ultra/common/math', 'ultra_engine/objects/base', 'ultra_engine/objects/plane'], function(Ultra, _, Jvent) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

    Ultra.Web3DEngine.Terrain = function(engine) {
		this.engine = engine;
		this.patches = [];
		this.planes = [];
    };

    _.extend(Ultra.Web3DEngine.Terrain.prototype, Jvent.prototype, {
		addPatch: function(path, pos) {
			var patch = new Ultra.Web3DEngine.TerrainPatch(this.engine, this);
			patch.createFromFile(path);
			this.patches.push(patch);

			if(pos)
				patch.setPosition([pos[0], 0, pos[1]]);
		},
		buildPlanes: function() {
			this.cells = 127;
			this.size = 128;

			this.planes.push(new Ultra.Web3DEngine.Objects.Plane(128, 128, 127));
			this.planes.push(new Ultra.Web3DEngine.Objects.Plane(128, 128, 63));
			this.planes.push(new Ultra.Web3DEngine.Objects.Plane(128, 128, 31));
		},
		render: function(device, camera, shader) {
			for(var i = 0; i < this.patches.length; i += 1) {
				this.patches[i].render(device, camera, shader, 128);
			}
		},
		renderDebug: function(device, camera, shader) {
			for(var i = 0; i < this.patches.length; i += 1) {
				this.patches[i].renderDebug(device, camera, shader, 128);
			}
		}
    });

	Ultra.Web3DEngine.TerrainPatch = function(engine, parent) {
		Ultra.Web3DEngine.Objects.Base.call(this);
		this.engine = engine;

		this.parent = parent;
		this.collection = {};
		this.shaders = false;

		this.heightMap = null;
		this.combined = null;
		this.mask = null;
	};

	_.extend(Ultra.Web3DEngine.TerrainPatch.prototype, Ultra.Web3DEngine.Objects.Base.prototype, Jvent.prototype, {
		createFromFile: function(path) {
			var self = this;

			self.heightMap = this.engine.textureManager.getTexture('/assets/images/heightmap.png', {});
			self.combined = this.engine.textureManager.getTexture('/assets/images/combined.png', {});
			self.mask = this.engine.textureManager.getTexture('/assets/images/mask.png', {});
		},
		destroy: function(device) {

		},
		render: function(device, camera, shader, size) {
			if(!shader) {
				return;
			}

			//Select what plane to use based on distance from viewer
			var plane = this.parent.planes[0];

			var cPos = camera.getPosition();
			var pos = this.getPosition();

			var dist = Ultra.Math.Vector3.distance(cPos, pos);

			if(!plane.data[device.getName()]) {
				plane.createBuffers(device);
			}

			shader.setParam('aVertexPosition', plane.data[device.getName()].vBuffer);
			shader.setParam('aTextureCoord', plane.data[device.getName()].uvBuffer);
			shader.setParam('aVertexNormal', plane.data[device.getName()].nBuffer);

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			shader.setParam('planeSize', [plane.width, plane.height]);

			shader.setParam('uSampler', this.heightMap);
			shader.setParam('mask', this.mask);
			shader.setParam('combined', this.combined);

			shader.setParam('uMMatrix', this.getMatrix());

			device.drawIndex(plane.data[device.getName()].iBuffer, shader, Ultra.Consts.TRIANGLE_STRIP);
		},
		renderDebug: function(device, camera, shader, size) {
			if(!shader) {
				return;
			}

			//Select what plane to use based on distance from viewer
			var plane = this.parent.planes[0];

			var cPos = camera.getPosition();
			var pos = this.getPosition();

			var dist = Ultra.Math.Vector3.distance(cPos, pos);

			if(!plane.data[device.getName()]) {
				plane.createBuffers(device);
			}

			shader.setParam('aVertexPosition', plane.data[device.getName()].vBuffer);
			shader.setParam('aTextureCoord', plane.data[device.getName()].uvBuffer);
			shader.setParam('aVertexNormal', plane.data[device.getName()].nBuffer);

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			if(!this.nScale)
				this.nScale = 0;

			this.nScale += 0.01;

			if(this.nScale > 1.0)
				this.nScale = 0;

			shader.setParam('nScale', this.nScale);

			shader.setParam('planeSize', [plane.width, plane.height]);

			shader.setParam('uSampler', this.heightMap);
			shader.setParam('mask', this.mask);
			shader.setParam('combined', this.combined);

			shader.setParam('uMMatrix', this.getMatrix());

			device.drawIndex(plane.data[device.getName()].iBuffer, shader, Ultra.Consts.POINTS);
		},
		setShaders: function(shaders) {

		}
	});

	
});