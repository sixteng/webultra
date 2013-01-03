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
	'ultra_engine/devices/webgl/webgl_utils'
],
function(Ultra, _, WebGLUtils) {
	'use strict';
	if(_.isUndefined(Ultra.Web3DEngine.Devices)) {
		Ultra.Web3DEngine.Devices = {};
	}

	if(_.isUndefined(Ultra.Web3DEngine.Devices.WebGL)) {
		Ultra.Web3DEngine.Devices.WebGL = {};
	}

	Ultra.Web3DEngine.Devices.WebGL.Device = function(engine, config) {
		this.engine = engine;
		this.config = config;
		this.gl = WebGLUtils.setupWebGL(config.target, [], function() {
			console.log('Error2');
		});

		this.gl.viewportWidth = config.target.width;
		this.gl.viewportHeight = config.target.height;

		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.uid = _.uniqueId('webgl');
	};

	_.extend(Ultra.Web3DEngine.Devices.WebGL.Device.prototype, {
		clear: function() {
			if(this.gl) {
				this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			}
		},
		getName: function() {
			return this.uid;
		},
		getType: function() {
			return 'webgl';
		},
		createVertexBuffer: function(data, size) {
			return this.createBuffer(data, size, data.length / size, this.gl.ARRAY_BUFFER, Float32Array);
		},
		createIndexBuffer: function(data) {
			return this.createBuffer(data, 1, data.length, this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
		},
		createBuffer: function(data, size, count, type, Data_type) {
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
			this.gl.deleteBuffer(buffer);
		},
		compilePixelShader: function(shader) {
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
			var src = shader.src[this.getType()];
			if(!src)
				return null;

			var compiledshader = this.gl.createShader(this.gl.VERTEX_SHADER);

			this.gl.shaderSource(compiledshader, src);
			this.gl.compileShader(compiledshader);

			if(!this.gl.getShaderParameter(compiledshader, this.gl.COMPILE_STATUS)) {
				//TODO: Add logging
				//alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
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
			var cShader = shader.compile(this);
			if(!cShader)
				return false;

			this.gl.useProgram(cShader);

			return true;
		},
		createTexture: function(src, config) {
			var texture = this.gl.createTexture();
			this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, src);

			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
			this.gl.generateMipmap(this.gl.TEXTURE_2D);

			this.gl.bindTexture(this.gl.TEXTURE_2D, null);

			return texture;
		},
		drawIndex: function(iBuffer, shader, type) {
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
					if(shader.params[key].type == 'mat4') {
						this.gl.uniformMatrix4fv(shader.params[key].webgl.loc, false, shader.params[key].data);
					} else if(shader.params[key].type == 'mat3') {
						this.gl.uniformMatrix3fv(shader.params[key].webgl.loc, false, shader.params[key].data);
					} else if(shader.params[key].type == 'tex2d') {
						this.gl.activeTexture(this.gl.TEXTURE0);
						this.gl.bindTexture(this.gl.TEXTURE_2D, shader.params[key].data);
						this.gl.uniform1i(shader.params[key].webgl.loc, 0);
					} else if(shader.params[key].type == 'float2') {
						this.gl.uniform2fv(shader.params[key].webgl.loc, new Float32Array(shader.params[key].data));
					} else if(shader.params[key].type == 'float3') {
						this.gl.uniform3fv(shader.params[key].webgl.loc, new Float32Array(shader.params[key].data));
					}
				}
			}

			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, iBuffer);

			if(this.wireframe === true) {
				this.gl.drawElements(this.gl.LINES, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
			} else {
				if(type == Ultra.Web3DEngine.TRIANGLE_STRIP)
					this.gl.drawElements(this.gl.TRIANGLE_STRIP, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
				else if(type == Ultra.Web3DEngine.TRIANGLES)
					this.gl.drawElements(this.gl.TRIANGLES, iBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
			}
		},
		getContext: function() {
			return this.gl;
		}
	});
});