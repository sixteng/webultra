/*global: lua_load:false, lua_call:false, lua_newtable:false, lua_tableset:false, lua_tableget:false, lua_call:false*/
define([
	'ultra/ultra',
	'underscore',
	'jquery',
	'ultra_engine/engine'
],
function(Ultra, _, $) {
	'use strict';
	
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Shader2))
		Ultra.Web3DEngine.Shader2 = {};

	Ultra.Web3DEngine.Shader2.Builder = function(fileManager, functions) {
		this.functions = functions;
		this.fileManager = fileManager;
		if(!this.functions)
			this.functions = {};
	};

	_.extend(Ultra.Web3DEngine.Shader2.Builder.prototype, {
		preTokens : {
			'#if#[\\s]*?\\((.*?)\\)#([\\s\\S]*?)(?:#else#([\\s\\S]*?))?#endif#' : 'preProcessIfStatement'
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
							type : $(outputs[i]).attr('type')
						};
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
							text : $(sources[i]).text().trim()
						};

						if(func.sources[$(sources[i]).attr('device')].lua) {
							self.compile(func.sources[$(sources[i]).attr('device')], {
								inputs : { value : { name : 'value', type : 'float3'} },
								outputs : {}
							});
						}
					}

					self.functions[$(shader_func).attr('name')] = func;
				});

				console.log(self.functions);
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
		shaderToLuaTable: function(data) {
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

				attrList.unshift(null);

				lua_tableset(inputs, data.inputs[key].name, lua_newtable.apply(null, attrList));
			}

			for(key in data.outputs) {
				attrList = [];
				for(attr in data.outputs[key])
					attrList = attrList.concat([attr, data.outputs[key][attr]]);

				attrList.unshift(null);
				lua_tableset(outputs, data.outputs[key].name, lua_newtable.apply(null, attrList));
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
		compile: function(shader, device, data) {
			
			if(shader.lua) {
				//First compile and run as lua script, this is to add support for more advanced stuff
				var luaData = this.shaderToLuaTable(data);
				var luaFunc = lua_load('function compile(data) \n ' + shader.text + ' \n end');
				var g = luaFunc();
				var result = lua_call(lua_tableget(g, "compile"), [luaData]);
			}
		}
	});
});