/*global: vec2:false, vec3:false, vec4:false, mat3:false, mat4:false, quat:false*/
define(['ultra/ultra', 'underscore'], function(Ultra, _, $) {
	'use strict';

	Ultra.Math = {};

	Ultra.Math.Vector3 = vec3;
	Ultra.Math.Matrix3 = mat3;
	Ultra.Math.Matrix4 = mat4;
	Ultra.Math.Quat = quat;

	Ultra.Math.degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	};

	Ultra.Math.Matrix3.fromMatrix4 = function(dest, mat) {
		dest[0] = mat[0], dest[1] = mat[1], dest[2] = mat[2];
        dest[3] = mat[4], dest[4] = mat[5], dest[5] = mat[6];
        dest[6] = mat[8], dest[7] = mat[9], dest[8] = mat[10];
	};

	Ultra.Math.Matrix3.toInverseMat3 = function(mat, dest) {
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = mat[0], a01 = mat[1], a02 = mat[2];
		var a10 = mat[4], a11 = mat[5], a12 = mat[6];
		var a20 = mat[8], a21 = mat[9], a22 = mat[10];

		var b01 = a22*a11-a12*a21;
		var b11 = -a22*a10+a12*a20;
		var b21 = a21*a10-a11*a20;
		
		var d = a00*b01 + a01*b11 + a02*b21;
		if (!d) { return null; }
		var id = 1/d;

		if(!dest) { dest = mat3.create(); }

		dest[0] = b01*id;
		dest[1] = (-a22*a01 + a02*a21)*id;
		dest[2] = (a12*a01 - a02*a11)*id;
		dest[3] = b11*id;
		dest[4] = (a22*a00 - a02*a20)*id;
		dest[5] = (-a12*a00 + a02*a10)*id;
		dest[6] = b21*id;
		dest[7] = (-a21*a00 + a01*a20)*id;
		dest[8] = (a11*a00 - a01*a10)*id;

		return dest;
	};



	//Extend the lib with some usefull stuff

	Ultra.Math.Matrix4.getPosition = function(m, dest) {
		var pos = dest;
		if(!pos)
			pos = Ultra.Math.Vector3.create();

		Ultra.Math.Vector3.set([m[12], m[13], m[14]], pos);

		return pos;
	};

	Ultra.Math.Matrix4.getRotation = function(m, dest) {
		var rot = dest;
		if(!rot)
			rot = Ultra.Math.Vector3.create();

		Ultra.Math.Matrix4.getScale(m, rot);
		var rotMat = Ultra.Math.Matrix4.create(m);

		rot[0] = 1 / rot[0];
		rot[1] = 1 / rot[1];
		rot[2] = 1 / rot[2];

		rotMat[0] *= rot[0];
		rotMat[1] *= rot[0];
		rotMat[2] *= rot[0];

		rotMat[4] *= rot[1];
		rotMat[5] *= rot[1];
		rotMat[6] *= rot[1];

		rotMat[8] *= rot[2];
		rotMat[9] *= rot[2];
		rotMat[10] *= rot[2];

		if(rotMat[8] < 1) {
			if(rotMat[8] > -1) {
				Ultra.Math.Vector3.set([Math.atan2(-rotMat[9], rotMat[10]), Math.asin(rotMat[8]), Math.atan2(-rotMat[4], rotMat[0])], rot);
			} else {
				Ultra.Math.Vector3.set([-Math.atan2(rotMat[6], rotMat[5]), -Math.PI / 2, 0], rot);
			}
		} else {
			Ultra.Math.Vector3.set([Math.atan2(rotMat[6], rotMat[5]), Math.PI / 2, 0], rot);
		}

		//Ultra.Math.Vector3.set(rot, [m[12], m[13], m[14]]);

		return rot;
	};

	Ultra.Math.Matrix4.getScale = function(m, dest) {
		var scale = dest;
		if(!scale)
			scale = Ultra.Math.Vector3.create();

		Ultra.Math.Vector3.set([m[0], m[1], m[2]], scale);
		var x = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set([m[4], m[5], m[6]], scale);
		var y = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set([m[8], m[9], m[10]], scale);
		var z = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set([x, y, z], scale);

		return scale;
	};
});