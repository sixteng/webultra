/*global: document:false*/
define(['ultra/ultra', 'underscore', 'ultra_engine/resources/texture', 'ultra_engine/objects/plane'], function(Ultra, _, $) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine)) {
		Ultra.Web3DEngine = {};
	}

	if(_.isUndefined(Ultra.Web3DEngine.RenderSystem)) {
		Ultra.Web3DEngine.RenderSystem = {};
	}

	if(_.isUndefined(Ultra.Web3DEngine.RenderSystem.Renderer)) {
		Ultra.Web3DEngine.RenderSystem.Renderer = {};
	}

	Ultra.Web3DEngine.RenderSystem.Renderer.Deffered = function(engine) {
		this.engine = engine;

		this.rtNormalDepth = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.NearestFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.FloatType,
			mipmap: false,
			stencilBuffer: false
		});

		this.rtColor = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.NearestFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.FloatType,
			mipmap: false,
			srcDepthBuffer : this.rtNormalDepth,
			stencilBuffer: false
		});

		this.rtLight = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.FloatType,
			mipmap: false,
			srcDepthBuffer : this.rtNormalDepth,
			stencilBuffer: false
		});

		this.rtFinal = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBFormat,
			type : Ultra.Consts.UByteType,
			mipmap: false,
			stencilBuffer: false
		});

		this.lightDir = vec3.fromValues(0, 0.25, 0.75);
		this.lightRot = mat4.create();

		this.tMat = Ultra.Math.Matrix4.create();

		this.camera = new Ultra.Web3DEngine.Cameras.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this.fullScreenPlane = new Ultra.Web3DEngine.Objects.Plane(2, 2, 1);
	};

	_.extend(Ultra.Web3DEngine.RenderSystem.Renderer.Deffered.prototype, {
		render: function(device, target, objects, camera, elapsed) {
			//Ultra.Math.Matrix4.multiply(this.tMat, camera.getProjectionMatrix(), camera.getMatrix());
			//Ultra.Math.Fustrum.setFromMatrix4(this.fustrum, this.tMat);

			// *************** RENDER Normel Pass
			var fustrum = camera.getFustrum();
			device.setRenderTarget(this.rtNormalDepth);
			
			var shader = this.engine.shaderManager.getShaderProgram(['deffered_normal_terrain_vs', 'deffered_normal_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			//Terrain
			objects[0].render(device, camera, shader);

			//Mesh
			shader = this.engine.shaderManager.getShaderProgram(['deffered_normal_basic_vs', 'deffered_normal_basic_ps']);

			var pos = Ultra.Math.Matrix4.getPosition(objects[1].getMatrix());

			if(Ultra.Math.Fustrum.containsSphear(fustrum, pos, 3.0))
				objects[1].render(device, camera, shader);

			//End Normal Pass

			// ********************* Render Color Pass
			device.setRenderTarget(this.rtColor, true, true, false);
			shader = this.engine.shaderManager.getShaderProgram(['deffered_color_terrain_vs', 'deffered_color_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			objects[0].render(device, camera, shader);
			shader = this.engine.shaderManager.getShaderProgram(['deffered_color_basic_vs', 'deffered_color_basic_ps']);

			pos = Ultra.Math.Matrix4.getPosition(objects[1].getMatrix());
			if(Ultra.Math.Fustrum.containsSphear(fustrum, pos, 3.0))
				objects[1].render(device, camera, shader);

			// *********************** Render Light Pass
			device.setRenderTarget(this.rtLight, true, false, false);

			Ultra.Math.Matrix4.identity(this.lightRot);
			Ultra.Math.Matrix4.rotate(this.lightRot, this.lightRot, Ultra.Math.degToRad(0.5), [0, 128, 0]);

			Ultra.Math.Vector3.transformMat4(this.lightDir, this.lightDir, this.lightRot);

			shader = this.engine.shaderManager.getShaderProgram(['deffered_directional_vs', 'deffered_directional_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			shader.setParam('viewHeight', 800);
			shader.setParam('viewWidth', 1024);

			var invProj = Ultra.Math.Matrix4.create();
			Ultra.Math.Matrix4.invert(invProj, camera.getProjectionMatrix());

			shader.setParam('lightVector', this.lightDir);
			shader.setParam('matProjInverse', invProj);
			shader.setParam('normalSampler', this.rtNormalDepth);
			shader.setParam('colorSampler', this.rtColor);

			//Disable depth mask write to not fuck up depth buffer
			if(camera.reflect)
				device.gl.depthFunc( device.gl.GEQUAL );

			device.gl.depthMask(false);
			this.fullScreenPlane.render(device, camera, shader, { wireframe : false });
			device.gl.depthMask(true);

			if(objects.length == 3) {
				pos = Ultra.Math.Matrix4.getPosition(objects[2].getMatrix());
				if(Ultra.Math.Fustrum.containsSphear(fustrum, pos, 3.0)) {
					//Render Forward Objects
					shader = this.engine.shaderManager.getShaderProgram(['water_vs', 'water_ps']);
					if(!shader)
						return;

 
					var reflMat = Ultra.Math.Matrix4.create();
					Ultra.Math.Matrix4.multiply(reflMat, objects[2].envCamera.getMatrix(), objects[2].getMatrix());
					Ultra.Math.Matrix4.multiply(reflMat, objects[2].envCamera.getProjectionMatrix(), reflMat);

					shader.setParam('projRefl', reflMat);
					shader.setParam('uSampler', objects[1].textures['water']);
					shader.setParam('envSampler', objects[2].envMap);
					shader.setParam('bump', objects[1].textures['water_bump']);

					shader.setParam('amplitude', [0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
					shader.setParam('wavelength', [8.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
					shader.setParam('speed', [5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
					shader.setParam('direction', [-Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0.0, 0.0, 0.0, 0.0 ,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);

					shader.setParam('lightDir', this.lightDir);

					if(!this.time)
						this.time = 0;

					this.time += elapsed;

					shader.setParam('elapsed', this.time);
					shader.setParam('elapsed2', this.time);

					device.gl.enable(device.gl.BLEND);
					device.gl.blendFunc(device.gl.SRC_ALPHA, device.gl.ONE_MINUS_SRC_ALPHA);
					objects[2].render(device, camera, shader);
					device.gl.disable(device.gl.BLEND);
					objects[2].clipped = false;
				} else {
					objects[2].clipped = true;
				}
			}

			// ************************* Combine Pass
			device.gl.depthFunc( device.gl.LESS );
			device.setRenderTarget(target);

			shader = this.engine.shaderManager.getShaderProgram(['deffered_combine_vs', 'deffered_combine_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			shader.setParam('sampler', this.rtLight);
			this.fullScreenPlane.render(device, camera, shader, { wireframe : false });
		}
	});
});