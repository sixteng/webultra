define(['ultra/ultra', 'underscore', 'Jvent', 'jquery', 'ultra_engine/mainengine'], function(Ultra, _, Jvent, $) {
	Ultra.Web3DEngine.ShaderManager = function(engine, config) {
		var self = this;
		this.config = config;
		this.engine = engine;
	};

	_.extend(Ultra.Web3DEngine.ShaderManager.prototype, {
		getShaderProgram: function(shaders) {
			var key = _.reduce(shaders, function(key, item) { return key += '_' + item; }, '');
			var program = this.engine.cache.get('shaderprograms', key);
			if(program !== null) return program;

			var arrShaders = [];
			for(var i = 0; i < shaders.length; i += 1) {
				var s = this.getShader(shaders[i]);
				if(s === null) return null;

				arrShaders.push(s);
			}

			program = this.createShaderProgram(key, arrShaders);
			
			return program;
		},
		createShaderProgram: function(name, shaders) {
			var program = new Ultra.Web3DEngine.ShaderProgram(shaders);

			this.engine.cache.set('shaderprograms', name, program);
			return program;
		},
		getShader: function(name) {
			return this.engine.cache.get('shaders', name);
		},
		createShader: function(name, shader_data, type) {
			var shader = new Ultra.Web3DEngine.Shader(shader_data.src, shader_data.params, type);

			this.engine.cache.set('shaders', name, shader);

			return shader;
		},
		loadFromFile: function(path) {
			var self = this;
			var file = this.engine.fileManager.loadFileAsXml(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				data.find('shader').each(function(i, shader) {
					var data = {
						src : {},
						params : {}
					};
					$(shader).find('param').each(function(p, param) {
						data.params[$(param).attr('name')] = { type : $(param).attr('type')};
					});

					$(shader).find('src').each(function(p, src) {
						data.src[$(src).attr('target')] = $(src).html();
					});

					self.createShader($(shader).attr('name'), data, $(shader).attr('type'));
				});
			});
		}
	});

	Ultra.Web3DEngine.ShaderProgram = function(shaders) {
		this.shaders = shaders;

		this.params = _.reduce(shaders, function(params, shader) {
			_.extend(params, shader.params);
			return params;
		}, {});

		this.compiled = {};
	};

	_.extend(Ultra.Web3DEngine.ShaderProgram.prototype, {
		setParam: function(name, value) {
			if(_.isUndefined(this.params[name])) return;

			this.params[name].data = value;
			this.params[name].dirty = true;
			//for(var type in this.programs) {
			//	this.programs[type].set(name, value);
			//}
		},
		getParam: function(name) {
			return this.params[name].val;
		},
		compile: function(device) {
			if(this.compiled[device.getName()])
				return this.compiled[device.getName()];

			this.compiled[device.getName()] = device.compileShaderProgram(this);

			return this.compiled[device.getName()];
		}
	});

	Ultra.Web3DEngine.Shader = function(src, params, type) {
		this.src = src;
		this.type = type;
		this.params = params;
		this.compiled = {};
	};

	_.extend(Ultra.Web3DEngine.Shader.prototype, {
		compile: function(device) {
			if(this.compiled[device.getName()])
				return this.compiled[device.getName()];

			this.compiled[device.getName()] = device.compileShader(this);

			return this.compiled[device.getName()];
		}
	});
});