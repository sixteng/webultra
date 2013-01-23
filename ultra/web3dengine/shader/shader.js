/*global: lua_load:false, lua_call:false, lua_newtable:false, lua_tableset:false, lua_tableget:false, lua_call:false*/
define([
	'ultra/ultra',
	'underscore',
	'Jvent',
	'jquery',
	'ultra_engine/engine'
],
function(Ultra, _, Jvent, $) {
	'use strict';
	
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Shader2))
		Ultra.Web3DEngine.Shader2 = {};

	Ultra.Web3DEngine.Shader2.Builder = function(fileManager, functions) {
		Jvent.call(this);
		this.functions = functions;
		this.materials = {};

		this.fileManager = fileManager;

		if(!this.functions)
			this.functions = {};
	};

	_.extend(Ultra.Web3DEngine.Shader2.Builder.prototype, Jvent.prototype, {
		preTokens : {
			'#if#[\\s]*?\\((.*?)\\)#([\\s\\S]*?)(?:#else#([\\s\\S]*?))?#endif#' : 'preProcessIfStatement'
		},
		loadMaterialsFromFile: function(path) {
			var self = this;
			if(!this.fileManager) return;

			var file = this.fileManager.loadFileAsXml(path);
			file.on('load', function(e, data) {
				if(data === false) {
					return;
				}

				data.find('material').each(function(f, mat_data) {
					var material = {
						name : $(mat_data).attr('name'),
						nodes : {}
					};

					$(mat_data).find('node').each(function(f, node_data) {
						var node = {
							name : $(node_data).attr('name'),
							title : $(node_data).attr('title'),
							type : $(node_data).attr('type'),
							inputs : {},
							params : {},
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
								value : $(params[i]).attr('value')
							};
						}

						material.nodes[$(node_data).attr('name')] = node;
					});

					self.materials[$(mat_data).attr('name')] = material;
				});

				self.emit('load');
			});
		},
		loadFunctionsFromFile: function(path) {
			var self = this;
			if(!this.fileManager) return;

			var file = this.fileManager.loadFileAsXml(path);
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
		/*
		preProcessIfStatement: function(src, cond, if_statement, else_statment) {
			var self = this;
			var regExp = /#(.*?)#/g;

			regExp.compile('(?:#)?else if#[\\s]*?\\((.*?)\\)#([\\s\\S]*?)(#|$)', 'g');
			if_statement = if_statement.replace(regExp, this.preProcessIfElseStatement.bind(this));

			regExp.compile('([\\s\\S]*?)(?=\n} else if|$)');
			if_statement = if_statement.replace(regExp, function(src, statement) {
				return '{\nsrc += ' + self.compileString(statement).trim().replace('\n', '\\n');
			});

			if(else_statment) {
				else_statment = '\n} else {\nsrc += ' + self.compileString(else_statment).trim().replace('\n');
			}

			return '#JS_EXP#if (' + cond + ')' + if_statement + else_statment + '\n}#/JS_EXP#';
		},
		preProcessIfElseStatement: function(src, cond, if_else_statement) {
			return '\n} else if (' + cond + ') {\nsrc += ' + this.compileString(if_else_statement).trim().replace('\n', '\\n');
		},
		compileString: function(src) {
			//Convert the source to an js function that outputs the code
			//Convert preprocess tokens to js
			var match;
			var regExp = new RegExp();
			for(var pattern in this.preTokens) {
				if(!_.isFunction(this[this.preTokens[pattern]]))
					continue;

				regExp.compile(pattern, 'g');

				src = src.replace(regExp, this[this.preTokens[pattern]].bind(this));
			}

			regExp.compile('(?=#/JS_EXP|^)([\\s\\S]*?(?=#JS_EXP|$))');
			src = src.replace(regExp, function(src, match) {
				if(match.substring(0, '#/JS_EXP'.length) == '#/JS_EXP') {
					return '\nsrc += ' + match.substring('#/JS_EXP'.length).trim().replace('\n', '\\n') + '\';\n';
				} else {
					return 'src = \'' + match.trim().replace('\n', '\\n') + '\';\n';
				}
			});

			regExp.compile('#[/]?JS_EXP#|\t', 'g');
			src = src.replace(regExp, '');

			return src;
		},
		*/
		testLua: function(shader, data) {

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
		compile: function(material) {
			/*
			if(shader.lua) {
				//First compile and run as lua script, this is to add support for more advanced stuff
				var luaData = this.shaderToLuaTable(data);
				var luaFunc = lua_load('function compile(data) \n ' + shader.text + ' \n end');
				var g = luaFunc();
				var result = lua_call(lua_tableget(g, "compile"), [luaData]);
			}
			*/

			var input_type = {
				'position' : 'vec4',
				'normal' : 'vec3'
			};

			var root = material.nodes.output;
			var data = {
				shared : {}
			};

			var code = '';
			var result = false;
			var tmp;
			for(var key in root.inputs) {
				result = this.compileNode(material.nodes[root.inputs[key].node], material.nodes, {}, {});

				if(result === false) {
					//Add logging
					return false;
				}

				if(material.nodes[root.inputs[key].node].value) {
					tmp = material.nodes[root.inputs[key].node].value;
				} else {
					//If the previous node has a onliner output, use that, otherwise grab the output variable name
					if(material.nodes[root.inputs[key].node].outputs[root.inputs[key].output]) {
						tmp = material.nodes[root.inputs[key].node].outputs[root.inputs[key].output];
					} else {
						tmp = root.inputs[key].node + '_' + root.inputs[key].output;
					}
					
				}

				//Get output type from device ??!?!?!

				code += '\n\n';
				code += input_type[key] + ' get' + key + ' () {\n';
				code += result;
				code += 'return ' + tmp + ';\n';
				code += '}';

			}

			//var code = this.compileNode(root, material.nodes, {}, {});

			console.log(code);
		},
		compileNode: function(current, nodes, visited, lookup) {
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
					result = this.compileNode(nodes[current.inputs[key].node], nodes, visited, lookup);

					//If we failed.. hmm nooo good
					if(result !== false)
						code += result;
				}
			}

			//Special handling for the output node..
			if(current.type != 'output' && !this.functions[current.type]) {
				console.log('Missing Function Type: ' + current.type);
				return false;
			}

			//TODO: Change to get device type from active device
			if(current.type != 'output')
				code += this.compileFunction(current, nodes, 'webgl', lookup);

			return code;
		},
		compileFunction: function(node, nodes, device, lookup) {
			var func = this.functions[node.type];
			var src = func.sources[device].src;

			//Compile any lua scripts first, for advanced functions
			if(func.sources[device].lua) {
				//First compile and run as lua script, this is to add support for more advanced stuff
				var luaData = this.shaderToLuaTable(node, lookup);
				var luaFunc = lua_load('function compile(data) \n ' + src + ' \n end');
				var g = luaFunc();

				src = lua_call(lua_tableget(g, "compile"), [luaData]);
				src = src[0];
			}

			//create output params
			var key;
			var regex = new RegExp();
			var tmp;

			node.outputs = {};

			//Create all the output parameters
			for(key in func.outputs) {
				//Add the name -> type lookup table
				lookup[node.name + '_' + key] = func.outputs[key].type;
				src = src.replace('#' + key + '#', node.name + '_' + key);

				//If the output has a "one liner" that can be carried used as a parameter then use that
				if(func.outputs[key].src[device]) {
					node.outputs[key] = func.outputs[key].src[device];
				}
			}

			//We need to inject output params in to the oneliner output code
			for(key in func.outputs) {
				for(var output in node.outputs) {
					node.outputs[output] = node.outputs[output].replace('#' + key + '#', node.name + '_' + key);
				}
			}

			//Replace all input vars with the correct value / input paramater name
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

				regex.compile('#' + key + '#', 'g');
				
				//Find the parameter, value or an output from an previouse node
				if(node.inputs[key].value) {
					tmp = node.inputs[key].value;
				} else {
					//If the previous node has a onliner output, use that, otherwise grab the output variable name
					if(nodes[node.inputs[key].node].outputs[node.inputs[key].output]) {
						tmp = nodes[node.inputs[key].node].outputs[node.inputs[key].output];
					} else {
						tmp = node.inputs[key].node + '_' + node.inputs[key].output;
					}
					
				}

				//Compile this nodes one liner outputs, replace inputs with correct variable names
				src = src.replace(regex, tmp);
				for(var output in node.outputs) {
					node.outputs[output] = node.outputs[output].replace(regex, tmp);
				}
			}

			//Add all the parameters to the code
			for(key in func.params) {
				if(!node.params[key]) {
					console.log('Param ' + key + 'not bound' );
					return '';
				}
				src = src.replace('#' + key + '#', node.params[key].value);
			}

			//TODO: Get globals from device!!!
			regex.compile('#global.pos#', 'g');
			src = src.replace(regex, 'vPositon');

			regex.compile('#global.uv.0#', 'g');
			src = src.replace(regex, 'vUV');

			return src.trim() + '\n';
		}
	});
});