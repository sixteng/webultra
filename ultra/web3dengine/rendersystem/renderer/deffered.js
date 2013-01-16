/*global: document:false*/
define(['ultra/ultra', 'underscore', 'ultra_engine/resources/texture'], function(Ultra, _, $) {
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
			mipmap: false
		});

		this.rtColor = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.NearestFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.FloatType,
			mipmap: false,
			srcDepthBuffer : this.rtNormalDepth
		});

		this.rtLight = engine.createRenderTarget(1024, 800, {
			magFilter : Ultra.Consts.LinearFilter,
			minFilter : Ultra.Consts.NearestFilter,
			format : Ultra.Consts.RGBAFormat,
			type : Ultra.Consts.FloatType,
			mipmap: false,
			srcDepthBuffer : this.rtNormalDepth
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

		this.tVert = this.buildPlanePositions(2, 1, 0.0);
		this.iVert = this.buildPlaneIndices(2);

		this.camera = new Ultra.Web3DEngine.Cameras.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		console.log(this.tVert);

	};

	_.extend(Ultra.Web3DEngine.RenderSystem.Renderer.Deffered.prototype, {
		buildPlanePositions: function( cells, scale, height ) {
			var halfGridSize = cells * scale / 2;

			var positions = [];
			for (var y = 0; y < cells + 1; ++y) {
				for (var x = 0; x < cells + 1; ++x) {
					positions.push(x * scale - halfGridSize);
					positions.push(y * scale - halfGridSize);
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
		render: function(device, objects, camera) {
			if(!this.buffertVert) {
				this.buffertVert = device.createVertexBuffer(this.tVert, 3);
				this.bufferiVert = device.createIndexBuffer(this.iVert);
			}

			//device.gl.enable( device.gl.DEPTH_TEST );
			//device.gl.enable( device.gl.STENCIL_TEST );
			device.gl.stencilOp( device.gl.REPLACE, device.gl.REPLACE, device.gl.REPLACE );
			device.gl.stencilFunc( device.gl.ALWAYS, 1, 0xffffffff );
			device.gl.clearStencil( 0 );

			device.setRenderTarget(this.rtNormalDepth);

			//RENDER Normel Pass
			var shader = this.engine.shaderManager.getShaderProgram(['deffered_normal_terrain_vs', 'deffered_normal_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			shader.setParam('planePos', [objects.patches[0].pos[0], objects.patches[0].pos[1]]);
			shader.setParam('planeSize', [128, 128]);

			shader.setParam('uSampler', objects.patches[0].heightMap);
			shader.setParam('aVertexPosition', objects.planes[0].vBuffer);

			device.drawIndex(objects.planes[0].iBuffer, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);

			//End Normal Pass
			device.gl.stencilFunc( device.gl.EQUAL, 1, 0xffffffff );
			device.gl.stencilOp( device.gl.KEEP, device.gl.KEEP, device.gl.KEEP );

			device.setRenderTarget(this.rtColor, true, true, false);

			//Render Color Pass
			shader = this.engine.shaderManager.getShaderProgram(['deffered_color_terrain_vs', 'deffered_color_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			shader.setParam('uPMatrix', camera.getProjectionMatrix());
			shader.setParam('uMVMatrix', camera.getMatrix());

			shader.setParam('planePos', [objects.patches[0].pos[0], objects.patches[0].pos[1]]);
			shader.setParam('planeSize', [128, 128]);

			shader.setParam('uSampler', objects.patches[0].heightMap);
			shader.setParam('mask', objects.patches[0].mask);
			shader.setParam('combined', objects.patches[0].combined);
			shader.setParam('aVertexPosition', objects.planes[0].vBuffer);

			device.drawIndex(objects.planes[0].iBuffer, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);

			//End Color Pass
			//TODO: Should be GEQUAL.. something wrong!!!
			device.gl.depthFunc( device.gl.LEQUAL );
			device.setRenderTarget(this.rtLight, true, false, false);
			
			//device.setRenderTarget(null);
			//Render Light Pass

			//_gl.framebufferRenderbuffer( _gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, renderTarget.__webglRenderbuffer );
			shader = this.engine.shaderManager.getShaderProgram(['deffered_directional_terrain_vs', 'deffered_directional_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}

			shader.setParam('aVertexPosition', this.buffertVert);
			shader.setParam('viewHeight', 800);
			shader.setParam('viewWidth', 1024);

			var invProj = Ultra.Math.Matrix4.create();

			Ultra.Math.Matrix4.invert(invProj, camera.getProjectionMatrix());

			mat4.identity(this.lightRot);
			mat4.rotate(this.lightRot, this.lightRot, Ultra.Math.degToRad(0.5), [0, 128, 0]);

			Ultra.Math.Vector3.transformMat4(this.lightDir, this.lightDir, this.lightRot);

			shader.setParam('lightVector', this.lightDir);
			shader.setParam('matProjInverse', invProj);
			shader.setParam('normalSampler', this.rtNormalDepth);
			shader.setParam('colorSampler', this.rtColor);

			device.drawIndex(this.bufferiVert, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);

			device.gl.depthFunc( device.gl.LEQUAL );
			device.gl.disable( device.gl.STENCIL_TEST );

			device.setRenderTarget(null);

			//Combine Pass
			shader = this.engine.shaderManager.getShaderProgram(['deffered_combine_terrain_vs', 'deffered_combine_terrain_ps']);
			if(!shader) {
				device.setRenderTarget(null);
				return;
			}
			shader.setParam('aVertexPosition', this.buffertVert);
			shader.setParam('sampler', this.rtLight);

			device.drawIndex(this.bufferiVert, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);
			//End Combine Pass
			//device.gl.depthFunc( device.gl.GEQUAL );
			//device.setRenderTarget(null, false, false, true);
		},
		finish: function() {

		}
	});
});