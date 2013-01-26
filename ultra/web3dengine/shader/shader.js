/*global: lua_load:false, lua_call:false, lua_newtable:false, lua_tableset:false, lua_tableget:false, lua_call:false*/
define([
	'ultra/ultra',
	'underscore',
	'Jvent',
	'jquery',
	'ultra_engine/engine',
	'ultra_engine/material/base',
	'ultra_engine/shader/shader_graph'
],
function(Ultra, _, Jvent, $) {
	'use strict';
	
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Shader2))
		Ultra.Web3DEngine.Shader2 = {};

	Ultra.Web3DEngine.Shader2.BaseShader = function(name, sources, params, inputs, type) {
		this.name = name;
		this.type = type;
		this.sources = sources;
		this.params = params;
		this.inputs = inputs;
	};

	_.extend(Ultra.Web3DEngine.Shader2.BaseShader.prototype, {

	});

	Ultra.Web3DEngine.Shader2.ShaderProgram = function(base_shaders, graph) {
		this.shaders = base_shaders;
		this.graph = graph;
		this.compiled = {};

		var texIndex = 0;

		this.params = _.reduce(base_shaders, function(params, shader) {
			_.extend(params, shader.params);
			return params;
		}, {});

		var graph_params = graph.getParams();

		_.extend(this.params, graph_params);
		//_.extend(this.params, params);

		for(var key in this.params) {
			if(this.params[key].type.indexOf('tex') === 0) {
				this.params[key].tex_index = texIndex;
				texIndex++;
			}
		}
	};

	_.extend(Ultra.Web3DEngine.Shader2.ShaderProgram.prototype, {
		setParam: function(name, value) {
			if(_.isUndefined(this.params[name])) return;

			this.params[name].data = value;
			this.params[name].dirty = true;
		},
		getParam: function(name) {
			return this.params[name].val;
		},
		compile: function(device) {
			if(this.compiled[device.getName()])
				return this.compiled[device.getName()];

			var graph = this.graph.compile(device);
			if(!graph)
				return null;

			var sources = [];

			//TODO: REWRITE EVEYTHING!!! THIS SUCKS!!!!

			for(var i = 0; i < this.shaders.length; i++) {
				var graph_source = '';
				var params = {};

				for(var input in this.shaders[i].inputs) {

					//TODO: Make this language independent

					_.extend(params, graph[input].data.params);

					graph_source += device.convShaderParam(this.shaders[i].inputs[input].type) + ' get' + input + '() {\n';
					graph_source += graph[input].src;
					graph_source += 'return ' + graph[input].result + ';\n}\n';
				}

				for(var param in params) {
					graph_source = 'uniform sampler2D ' + param + ';\n' + graph_source;
				}

				//HOW TO SOLVE THIS?!?!?!?!
				if(this.shaders[i].type == 'pixel') {
					graph_source = graph_source.replace(/aTextureCoord/g, 'uvs');
				}

				sources.push({
					src : {
						webgl : this.shaders[i].sources[device.getType()].replace('#BODY', graph_source)
					},
					type : this.shaders[i].type
				});
			}

			//console.log(sources);
			this.compiled[device.getName()] = true;
			this.compiled[device.getName()] = device.compileShaderProgram2(this, sources);

			return this.compiled[device.getName()];
		}
	});

	Ultra.Web3DEngine.Shader2.Builder = function(engine) {
		Jvent.call(this);
		this.engine = engine;

		this.materials = {};
		this.baseShaders = {};
		this.functions = {};
	};

	_.extend(Ultra.Web3DEngine.Shader2.Builder.prototype, Jvent.prototype, {
		preTokens : {
			'#if#[\\s]*?\\((.*?)\\)#([\\s\\S]*?)(?:#else#([\\s\\S]*?))?#endif#' : 'preProcessIfStatement'
		},
		loadMaterialsFromFile: function(path) {
			var self = this;

			var file = this.engine.fileManager.loadFileAsXml(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				data.find('material').each(function(f, mat) {
					var graph = new Ultra.Web3DEngine.Shader2.Graph();
					var material = new Ultra.Web3DEngine.Material.Base();

					material.setGraph(graph);

					$(mat).find('node').each(function(f, node_data) {
						var node = {
							name : $(node_data).attr('name'),
							title : $(node_data).attr('title'),
							type : $(node_data).attr('type'),
							inputs : {},
							params : {},
							sources : {},
							version: $(node_data).attr('version')
						};

						var i;
						var inputs = $(node_data).find('input');
						for(i = 0; i < inputs.length; i++) {
							node.inputs[$(inputs[i]).attr('name')] = {
								name : $(inputs[i]).attr('name'),
								node : $(inputs[i]).attr('node'),
								output : $(inputs[i]).attr('output'),
								value : $(inputs[i]).attr('value')
							};
						}

						var params = $(node_data).find('param');
						for(i = 0; i < params.length; i++) {
							node.params[$(params[i]).attr('name')] = {
								name : $(params[i]).attr('name'),
								value : $(params[i]).attr('value'),
								type : $(params[i]).attr('type')
							};
						}

						var sources = $(node_data).find('src');
						for(i = 0; i < sources.length; i++) {
							node.sources[$(sources[i]).attr('device')] = $(sources[i]).text();
						}

						graph.addNode($(node_data).attr('name'), node);
					});
					self.materials[$(mat).attr('name')] = material;
				});

				self.emit('load');
			});
		},
		loadBaseShadersFromFile: function(path) {
			var self = this;
			var file = this.engine.fileManager.loadFileAsXml(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				data.find('shader').each(function(i, shader) {
					var data = {
						src : {},
						params : {},
						inputs : {}
					};
					$(shader).find('input').each(function(p, input) {
						data.inputs[$(input).attr('name')] = {
							name : $(input).attr('name'),
							type : $(input).attr('type')
						};
					});

					$(shader).find('param').each(function(p, param) {
						data.params[$(param).attr('name')] = { type : $(param).attr('type')};
					});

					$(shader).find('src').each(function(p, src) {
						var str = $(src).text();

						data.src[$(src).attr('target')] = $(src).text();
					});

					self.baseShaders[$(shader).attr('name')] = new Ultra.Web3DEngine.Shader2.BaseShader($(shader).attr('name'), data.src, data.params, data.inputs, $(shader).attr('type'));
				});

				self.emit('load');
			});
		},
		loadFunctionsFromFile: function(path) {
			var self = this;

			var file = this.engine.fileManager.loadFileAsXml(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				data.find('function').each(function(f, shader_func) {
					var i;

					var func = {
						name : $(shader_func).attr('name'),
						title : $(shader_func).attr('title')
					};

					var inputs = $(shader_func).find('input');

					func.inputs = {};
					for(i = 0; i < inputs.size(); i++) {
						func.inputs[$(inputs[i]).attr('name')] = {
							name: $(inputs[i]).attr('name'),
							title: $(inputs[i]).attr('title'),
							type : $(inputs[i]).attr('type'),
							default : $(inputs[i]).attr('default')
						};
					}

					var outputs = $(shader_func).find('output');
					func.outputs = {};
					for(i = 0; i < outputs.size(); i++) {
						func.outputs[$(outputs[i]).attr('name')] = {
							name: $(outputs[i]).attr('name'),
							title: $(outputs[i]).attr('title'),
							type : $(outputs[i]).attr('type'),
							src : {}
						};

						var src = $(outputs[i]).find('src');

						for(var j = 0; j < src.size(); j++) {
							func.outputs[$(outputs[i]).attr('name')].src[$(src[j]).attr('device')] = $(src[j]).text();
						}
					}

					var params = $(shader_func).find('param');
					func.params = {};
					for(i = 0; i < params.size(); i++) {
						func.params[$(params[i]).attr('name')] = {
							name: $(params[i]).attr('name'),
							title: $(params[i]).attr('title'),
							type : $(params[i]).attr('type'),
							default : $(params[i]).attr('default')
						};
					}

					var sources = $(shader_func).find('src');
					func.sources = {};
					for(i = 0; i < sources.size(); i++) {
						func.sources[$(sources[i]).attr('device')] = {
							device : $(sources[i]).attr('device'),
							version : $(sources[i]).attr('version'),
							inline: $(sources[i]).attr('inline') == 'true',
							lua : $(sources[i]).attr('lua') == 'true',
							src : $(sources[i]).text().trim()
						};
					}

					self.functions[$(shader_func).attr('name')] = func;
				});

				self.emit('load');
			});
		},
		addFunction: function(name, src) {
			this.functions[name] = src;
		},
		shaderToLuaTable: function(data, lookup) {
			var table = lua_newtable();

			var inputs = lua_newtable();
			var outputs = lua_newtable();
			var params = lua_newtable();

			var key;
			var attr;
			var attrList;

			for(key in data.inputs) {
				attrList = [];
				for(attr in data.inputs[key])
					attrList = attrList.concat([attr, data.inputs[key][attr]]);

				if(data.inputs[key].node) {
					attrList = attrList.concat(['type', lookup[data.inputs[key].node + '_' + data.inputs[key].output]]);
				}

				attrList.unshift(null);

				lua_tableset(inputs, data.inputs[key].name, lua_newtable.apply(null, attrList));
			}

			for(key in data.params) {
				attrList = [];
				for(attr in data.params[key])
					attrList = attrList.concat([attr, data.params[key][attr]]);

				attrList.unshift(null);
				lua_tableset(params, data.params[key].name, lua_newtable.apply(null, attrList));
			}

			lua_tableset(table, 'inputs', inputs);
			lua_tableset(table, 'outputs', outputs);
			lua_tableset(table, 'params', params);

			return table;
		},
		compileShader: function(graph, base, device) {
			console.log(arguments);
		},
		compileMaterialGraph: function(graph, device) {
			var input_type = {
				'position' : 'vec4',
				'normal' : 'vec3',
				'uvs' : 'vec2',
				'diffuse' : 'vec4'
			};

			var globals = device.getShaderGlobals();

			var root = graph.nodes.output;

			var result = false;
			var returnParam = '';
			var code = {};
			//Get the base shaders

			for(var key in input_type) {
				code[key] = {
					src : '',
					result : '',
					data : {
						params : {}
					}
				};

				if(root.inputs[key].node) {
					var lookup = {};
					for(var global in globals)
						lookup['#' + global + '#'] = globals[global].type;

					result = this.compileNode(device, graph.nodes[root.inputs[key].node], graph.nodes, {}, lookup, code[key].data);

					if(result === false) {
						//Add logging
						return false;
					}

					if(graph.nodes[root.inputs[key].node].value) {
						returnParam = graph.nodes[root.inputs[key].node].value;
					} else {
						//If the previous node has a onliner output, use that, otherwise grab the output variable name
						if(graph.nodes[root.inputs[key].node].outputs && graph.nodes[root.inputs[key].node].outputs[root.inputs[key].output]) {
							returnParam = graph.nodes[root.inputs[key].node].outputs[root.inputs[key].output];
						} else {
							returnParam = root.inputs[key].node + '_' + root.inputs[key].output;
						}
					}
				} else if(root.inputs[key].value) {
					//TODO: Get globals from device!!!
					returnParam = root.inputs[key].value;
					result = '';
					var regex = new RegExp();

					for(var global in globals) {
						regex.compile('#' + global + '#', 'g');
						returnParam = returnParam.replace(regex, globals[global].name);
					}
				}
				//Get output type from device ??!?!?!
				code[key].src = result;
				code[key].result = returnParam;
			}

			return code;
		},
		compileNode: function(device, current, nodes, visited, lookup, data) {
			if(visited[current.name] === true) return false;

			var code = '';
			var result = false;

			//Mark as visited
			visited[current.name] = true;

			//Compile all dependent nodes first
			for(var key in current.inputs) {
				if(current.inputs[key].value) {
					//No dpendency
				} else {
					//Make sure node exists
					if(!nodes[current.inputs[key].node]) {
						console.log('Missing node: ' + current.inputs[key].node);
						return false;
					}
					//Compile the dependent node
					result = this.compileNode(device, nodes[current.inputs[key].node], nodes, visited, lookup, data);

					//If we failed.. hmm nooo good
					if(result !== false)
						code += result;
				}
			}

			if(current.type == 'custom') {
				code += current.sources[device.getType()];
				return code;
			}

			//Special handling for the output node..
			if(current.type != 'output' && !this.functions[current.type]) {
				console.log('Missing Function Type: ' + current.type);
				return false;
			}

			//TODO: Change to get device type from active device
			if(current.type != 'output')
				code += this.compileFunction(current, nodes, device, lookup, data);

			return code;
		},
		compileString: function(src, node, func, device, lookup, input_map, float_type, globals) {
			var regex = new RegExp('#(.*?)#', 'g');
			src = src.replace(regex, function(org, param) {
				if(input_map[param]) {
					return input_map[param];
				} else if(node.params[param]) {
					return node.params[param].value;
				} else if(func.outputs[param]) {
					var type = device.convShaderParam(func.outputs[param].type);

					type = type.replace(regex, function(org, param) {
						if(node.params[param])
							return node.params[param].value;
					});

					if(type == 'float*')
						type = device.convShaderParam(float_type);

					lookup[node.name + '_' + param] = type;
					return node.name + '_' + param;
				} else if(globals[param]) {

					return globals[param].name;
				}

				return 'UNKNOWN';
			});

			regex.compile('float\\*');
			src = src.replace(regex, float_type);

			return src;
		},
		compileFunction: function(node, nodes, device, lookup, data) {
			var func = this.functions[node.type];
			var src = func.sources[device.getType()].src;

			//Compile any lua scripts first, for advanced functions
			if(func.sources[device.getType()].lua) {
				//First compile and run as lua script, this is to add support for more advanced stuff
				var luaData = this.shaderToLuaTable(node, lookup);
				var luaFunc = lua_load('function compile(data) \n ' + src + ' \n end');
				var g = luaFunc();

				src = lua_call(lua_tableget(g, "compile"), [luaData]);
				src = src[0];
			}

			//create output params
			var key;
			var tmp;
			var value = '';

			//Create input map
			var float_type = 'float';
			var input_map = {};
			var output_map = {};
			node.outputs = {};

			//TODO: Get from device!!!
			var globals = device.getShaderGlobals();

			for(key in func.params) {
				if(func.params[key].type && func.params[key].type.indexOf('tex') != -1) {
					data.params[node.params[key].value] = {
						name : node.params[key].value,
						type : func.params[key].type
					};
				}
			}

			for(key in func.inputs) {
				//Make sure all inputs are bound, and in some cases use default value
				if(!node.inputs[key] && !func.inputs[key]['default']) {
					console.log('Input ' + key + 'not bound' );
					return '';
				} else if(!node.inputs[key] && func.inputs[key]['default']) {
					node.inputs[key] = {
						value : func.inputs[key]['default']
					};
				}

				if(node.inputs[key].value) {
					value = node.inputs[key].value;
					tmp = lookup[node.inputs[key].value];
					if(!tmp)
						tmp = 'float';
				} else {
					//If the previous node has a onliner output, use that, otherwise grab the output variable name
					value = node.inputs[key].node + '_' + node.inputs[key].output;
					tmp = lookup[node.inputs[key].node + '_' + node.inputs[key].output];

					if(nodes[node.inputs[key].node].outputs && nodes[node.inputs[key].node].outputs[node.inputs[key].output]) {
						value = nodes[node.inputs[key].node].outputs[node.inputs[key].output];
					}
				}

				if(func.inputs[key].type == 'float*' && float_type < tmp) {
					float_type = tmp;
				}

				value = this.compileString(value, node, func, device, lookup, input_map, device.convShaderParam(float_type), globals);

				input_map[key] = value;
			}

			//Process one line outputs, add there types
			for(key in func.outputs) {
				if(func.outputs[key].src[device.getType()]) {
					node.outputs[key] = func.outputs[key].src[device.getType()];

					if(func.outputs[key].type == 'float*')
						lookup[node.name + '_' + key] = float_type;
					else
						lookup[node.name + '_' + key] = func.outputs[key].type;

					node.outputs[key] = this.compileString(node.outputs[key], node, func, device, lookup, input_map, device.convShaderParam(float_type), globals);
				}
			}

			src = this.compileString(src, node, func, device, lookup, input_map, device.convShaderParam(float_type), globals);

			return src.trim() + '\n';
		}
	});
});