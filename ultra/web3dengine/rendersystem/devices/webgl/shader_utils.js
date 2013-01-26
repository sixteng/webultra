define([
],
function() {
	'use strict';
	return {
		shaderGlobals : {
			'global.pos' : {
				type : 'vec3',
				name : 'aVertexPosition'
			},
			'global.uv.0' : {
				type : 'vec2',
				name : 'aTextureCoord'
			}
		},
		setfloat: function(device, param) {
			device.gl.uniform1f(param.webgl.loc, param.data);
		},
		setfloatarray: function(device, param) {
			device.gl.uniform1fv(param.webgl.loc, param.data);
		},
		setfloat2: function(device, param) {
			device.gl.uniform2fv(param.webgl.loc, param.data);
		},
		setfloat3: function(device, param) {
			device.gl.uniform3fv(param.webgl.loc, param.data);
		},
		setfloat4: function(device, param) {
			device.gl.uniform4fv(param.webgl.loc, param.data);
		},
		setint: function(device, param) {
			device.gl.uniform1i(param.webgl.loc, param.data);
		},
		setint2: function(device, param) {
			device.gl.uniform2iv(param.webgl.loc, param.data);
		},
		setint3: function(device, param) {
			device.gl.uniform3iv(param.webgl.loc, param.data);
		},
		setint4: function(device, param) {
			device.gl.uniform4iv(param.webgl.loc, param.data);
		},
		setmat2: function(device, param) {
			device.gl.uniformMatrix2fv(param.webgl.loc, false, param.data);
		},
		setmat3: function(device, param) {
			device.gl.uniformMatrix3fv(param.webgl.loc, false, param.data);
		},
		setmat4: function(device, param) {
			device.gl.uniformMatrix4fv(param.webgl.loc, false, param.data);
		},
		settex2d: function(device, param) {
			if(!device.gl['TEXTURE' + param.tex_index])
				return;

			if(!param.data.data[device.getName()]) {
				if(param.data.data.raw) {
					param.data.data[device.getName()] = device.createTexture(param.data.data.raw, param.data.config);
				} else {
					param.dirty = true;
				}
			}
			
			device.gl.activeTexture(device.gl['TEXTURE' + param.tex_index]);
			device.gl.bindTexture(device.gl.TEXTURE_2D, param.data.data[device.getName()]);
			device.gl.uniform1i(param.webgl.loc, param.tex_index);
		},
		settexcube: function(device, param) {
			if(!device.gl['TEXTURE' + param.tex_index])
				return;

			if(!param.data.data[device.getName()]) {
				if(param.data.data.raw) {
					param.data.data[device.getName()] = device.createTexture(param.data.data.raw, param.data.config);
				} else {
					param.dirty = true;
				}
			}
			
			device.gl.activeTexture(device.gl['TEXTURE' + param.tex_index]);
			device.gl.bindTexture(device.gl.TEXTURE_CUBE_MAP, param.data.data[device.getName()]);
			device.gl.uniform1i(param.webgl.loc, param.tex_index);
		}
	};
});