define([
],
function() {
	'use strict';
	return {
		setfloat: function(gl, param) {
			gl.uniform1f(param.webgl.loc, param.data);
		},
		setfloat2: function(gl, param) {
			gl.uniform2fv(param.webgl.loc, param.data);
		},
		setfloat3: function(gl, param) {
			gl.uniform3fv(param.webgl.loc, param.data);
		},
		setfloat4: function(gl, param) {
			gl.uniform4fv(param.webgl.loc, param.data);
		},
		setint: function(gl, param) {
			gl.uniform1i(param.webgl.loc, param.data);
		},
		setint2: function(gl, param) {
			gl.uniform2iv(param.webgl.loc, param.data);
		},
		setint3: function(gl, param) {
			gl.uniform3iv(param.webgl.loc, param.data);
		},
		setint4: function(gl, param) {
			gl.uniform4iv(param.webgl.loc, param.data);
		},
		setmat2: function(gl, param) {
			gl.uniformMatrix2fv(param.webgl.loc, false, param.data);
		},
		setmat3: function(gl, param) {
			gl.uniformMatrix3fv(param.webgl.loc, false, param.data);
		},
		setmat4: function(gl, param) {
			gl.uniformMatrix4fv(param.webgl.loc, false, param.data);
		},
		settex2d: function(gl, param) {
			if(!gl['TEXTURE' + param.tex_index])
				return;

			gl.activeTexture(gl['TEXTURE' + param.tex_index]);
			gl.bindTexture(gl.TEXTURE_2D, param.data);
			gl.uniform1i(param.webgl.loc, param.tex_index);
		}
	};
});