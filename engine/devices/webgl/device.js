requirejs.config({
	shim: {
		'ultra_engine/devices/webgl/webgl_utils': {
			exports: 'WebGLUtils'
		}
	}
});

define([
	'ultra/ultra',
	'underscore',
	'Jvent',
	'ultra_engine/devices/webgl/shader_utils',
	'ultra_engine/devices/webgl/webgl_utils'
],
function(Ultra, _, Jvent, ShaderUtils, WebGLUtils) {
	'use strict';

	//Setup engine device structure
	if(_.isUndefined(Ultra.Web3DEngine.Devices)) {
		Ultra.Web3DEngine.Devices = {};
	}

	//Define the WebGL namespace
	if(_.isUndefined(Ultra.Web3DEngine.Devices.WebGL)) {
		Ultra.Web3DEngine.Devices.WebGL = {};
	}

	//WebGL Device
	Ultra.Web3DEngine.Devices.WebGL.Device = function(engine, config) {
		var self = this;
		this.engine = engine;
		this.config = config;

		var defaultCanvas = document.querySelectorAll('canvas');
		if(defaultCanvas.length === 0 && (_.isUndefined(this.config.target) || this.config.target.nodeName !== 'CANVAS') ) {
			throw 'Missing Canvas Element';
		} else if(defaultCanvas.length !== 0) {
			defaultCanvas = defaultCanvas[0];
		}

		//Setup engine default config
		_.defaults(this.config, {
			target : defaultCanvas,
			clearColor : [0.0, 0.0, 0.5, 0.5],
			wireframe : false
		});

		//Init the WebGL context
		this.gl = WebGLUtils.setupWebGL(this.config.target, [], function() {
			self.trigger('error', 'createError');
		});

		this.config.target.onresize = this.onResize.bind(this);

		if(!this.gl) return;

		//Set the viewport width / height
		this.gl.viewportWidth = this.config.target.width;
		this.gl.viewportHeight = this.config.target.height;

		//Set clearcolor and an unique id for this device

		if(this.config.clearColor.length < 4) {
			for(var i = this.config.clearColor.length; i < 4; i++)
				this.config.clearColor[i] = 0.0;
		}

		this.gl.clearColor(this.config.clearColor[0], this.config.clearColor[1], this.config.clearColor[2], this.config.clearColor[3]);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.uid = _.uniqueId('webgl');

		this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
	};

	_.extend(Ultra.Web3DEngine.Devices.WebGL.Device.prototype, Jvent.prototype, {
		clear: function() {
			if(!this.gl) return;

			
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		},
		onResize: function() {
			if(!this.gl) return;
			
			this.gl.viewportWidth = this.config.target.width;
			this.gl.viewportHeight = this.config.target.height;
			this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
		},
		setConfig: function(key, value) {
			this.config[key] = value;
		},
		getName: function() {
			return this.uid;
		},
		getType: function() {
			return 'webgl';
		},
		createVertexBuffer: function(data, size) {
			if(!this.gl) return null;

			return this.createBuffer(data, size, data.length / size, this.gl.ARRAY_BUFFER, Float32Array);
		},
		createIndexBuffer: function(data) {
			if(!this.gl) return null;

			return this.createBuffer(data, 1, data.length, this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
		},
		createBuffer: function(data, size, count, type, Data_type) {
			if(!this.gl) return null;

			var buffer = this.gl.createBuffer();
			this.gl.bindBuffer(type, buffer);

			this.gl.bufferData(type, new Data_type(data), this.gl.STATIC_DRAW);
			buffer.itemSize = size;
			buffer.numItems = count;

			return buffer;
		},
		deleteVertexBuffer: function(buffer) {
			this.deleteBuffer(buffer);
		},
		deleteIndexBuffer: function(buffer) {
			this.deleteBuffer(buffer);
		},
		deleteBuffer: function(buffer) {
			if(!this.gl) return;

			this.gl.deleteBuffer(buffer);
		},
		compilePixelShader: function(shader) {
			if(!this.gl) return null;

			var src = shader.src[this.getType()];
			if(!src)
				return null;

			var compiledshader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

			this.gl.shaderSource(compiledshader, src);
			this.gl.compileShader(compiledshader);

			if(!this.gl.getShaderParameter(compiledshader, this.gl.COMPILE_STATUS)) {
				//TODO: Add logging
				console.log(this.gl.getShaderInfoLog(compiledshader));
				//alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));

				//console.log(src);
				return null;
			}

			return compiledshader;
		},
		compileVertexShader: function(shader) {
			if(!this.gl) return null;

			var src = shader.src[this.getType()];
			if(!src)
				return null;

			var compiledshader = this.gl.createShader(this.gl.VERTEX_SHADER);

			this.gl.shaderSource(compiledshader, src);
			this.gl.compileShader(compiledshader);

			if(!this.gl.getShaderParameter(compiledshader, this.gl.COMPILE_STATUS)) {
				//TODO: Add logging
				//alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
				console.log(this.gl.getShaderInfoLog(compiledshader));
				return null;
			}

			return compiledshader;
		},
		compileShader: function(shader) {
			if(shader.type == 'vertex') {
				return this.compileVertexShader(shader);
			} else if(shader.type == 'pixel') {
				return this.compilePixelShader(shader);
			}

			return null;
		},
		compileShaderProgram: function(shader_program) {
			if(!this.gl) return null;

			var compiledShaders = [];
			var i;
			for(i = 0; i < shader_program.shaders.length; i += 1) {
				var compiledShader = shader_program.shaders[i].compile(this);
				if(compiledShader === null)
					return null;

				compiledShaders.push(compiledShader);
			}

			var shaderProgram = this.gl.createProgram();
			for(i = 0; i < compiledShaders.length; i += 1) {
				this.gl.attachShader(shaderProgram, compiledShaders[i]);
			}

			this.gl.linkProgram(shaderProgram);

			if(!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
				console.log(this.gl.getProgramInfoLog(shaderProgram));

				return null;
			}

			this.gl.useProgram(shaderProgram);

			for(var key in shader_program.params) {
				shader_program.params[key].webgl = { loc : this.gl.getUniformLocation(shaderProgram, key), type : 'uniform'};
				if(shader_program.params[key].webgl.loc === null) {
					shader_program.params[key].webgl = { loc : this.gl.getAttribLocation(shaderProgram, key), type : 'attr'};
				}
			}

			return shaderProgram;
		},
		setShader: function(shader) {
			if(!this.gl) return null;

			var cShader = shader.compile(this);
			if(!cShader)
				return false;

			this.gl.useProgram(cShader);

			return true;
		},
		createTexture: function(src, config) {
			if(!this.gl) return null;

			if (!this.isPowerOfTwo(src.width) || !this.isPowerOfTwo(src.height)) {
				var canvas = document.createElement("canvas");
				canvas.width = this.nextHighestPowerOfTwo(src.width);
				canvas.height = this.nextHighestPowerOfTwo(src.height);
				var ctx = canvas.getContext("2d");
				ctx.drawImage(src, 0, 0, src.width, src.height);
				src = canvas;
			}

			var texture = this.gl.createTexture();
			this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, src);

			//this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			//this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
			
			this.gl.generateMipmap(this.gl.TEXTURE_2D);

			this.gl.bindTexture(this.gl.TEXTURE_2D, null);

			return texture;
		},
		isPowerOfTwo : function(x) {
			return (x & (x - 1)) === 0;
		},
		nextHighestPowerOfTwo : function(x) {
			--x;
			for (var i = 1; i < 32; i <<= 1) {
				x = x | x >> i;
			}
			return x + 1;
		},
		drawIndex: function(iBuffer, shader, type) {
			if(!this.gl) return null;

			if(!this.setShader(shader))
				return;

			for(var key in shader.params) {
				if(_.isUndefined(shader.params[key].data) || !shader.params[key].dirty || !shader.params[key].webgl || shader.params[key].webgl.loc == -1) continue;

				shader.params[key].dirty = false;
				if(shader.params[key].webgl.type == 'attr') {
					this.gl.enableVertexAttribArray(shader.params[key].webgl.loc);
					this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shader.params[key].data);
					this.gl.vertexAttribPointer(shader.params[key].webgl.loc, shader.params[key].data.itemSize, this.gl.FLOAT, false, 0, 0);
				} else if(shader.params[key].webgl.type == 'uniform') {
					if(!ShaderUtils['set' + shader.params[key].type])
						continue;

					ShaderUtils['set' + shader.params[key].type](this.gl, shader.params[key]);
				}
			}

			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, iBuffer);

			if(this.config.wireframe === true) {
				this.gl.drawElements(this.gl.LINES, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
			} else {
				if(type == Ultra.Web3DEngine.TRIANGLE_STRIP)
					this.gl.drawElements(this.gl.TRIANGLE_STRIP, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
				else if(type == Ultra.Web3DEngine.TRIANGLES)
					this.gl.drawElements(this.gl.TRIANGLES, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
			}
		},
		getContext: function() {
			if(!this.gl) return null;

			return this.gl;
		}
	});
});