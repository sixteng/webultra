/*global: vec2:false, vec3:false, vec4:false, mat3:false, mat4:false, quat:false*/
define(['ultra/ultra', 'underscore'], function(Ultra, _, $) {
	'use strict';

	Ultra.Math = {};

	Ultra.Math.Vector3 = vec3;
	Ultra.Math.Vector4 = vec4;
	Ultra.Math.Matrix3 = mat3;
	Ultra.Math.Matrix4 = mat4;
	Ultra.Math.Quat = quat;

	Ultra.Math.Plane = vec4;

	Ultra.Math.Plane.normalize = function(out, plane) {
		var len = 1.0 / Ultra.Math.Vector3.length([plane[0], plane[1], plane[2]]);

		Ultra.Math.Plane.scale(out, plane, len);
	};

	Ultra.Math.Plane.distanceToPoint = function(plane, point) {
		return Ultra.Math.Plane.dot(plane, [point[0], point[1], point[2], 1.0]);
	};

	Ultra.Math.Fustrum = {};
	Ultra.Math.Fustrum.create = function() {
		return [
			Ultra.Math.Plane.create(),
			Ultra.Math.Plane.create(),
			Ultra.Math.Plane.create(),
			Ultra.Math.Plane.create(),
			Ultra.Math.Plane.create(),
			Ultra.Math.Plane.create()
		];
	};

	Ultra.Math.Fustrum.setFromMatrix4 = function(out, mat) {
		var me0 = mat[0], me1 = mat[1], me2 = mat[2], me3 = mat[3];
		var me4 = mat[4], me5 = mat[5], me6 = mat[6], me7 = mat[7];
		var me8 = mat[8], me9 = mat[9], me10 = mat[10], me11 = mat[11];
		var me12 = mat[12], me13 = mat[13], me14 = mat[14], me15 = mat[15];

		Ultra.Math.Plane.set(out[0], me3 - me0, me7 - me4, me11 - me8, me15 - me12);
		Ultra.Math.Plane.set(out[1], me3 + me0, me7 + me4, me11 + me8, me15 + me12);
		Ultra.Math.Plane.set(out[2], me3 + me1, me7 + me5, me11 + me9, me15 + me13);
		Ultra.Math.Plane.set(out[3], me3 - me1, me7 - me5, me11 - me9, me15 - me13);
		Ultra.Math.Plane.set(out[4], me3 - me2, me7 - me6, me11 - me10, me15 - me14);
		Ultra.Math.Plane.set(out[5], me3 + me2, me7 + me6, me11 + me10, me15 + me14);

		Ultra.Math.Plane.normalize(out[0], out[0]);
		Ultra.Math.Plane.normalize(out[1], out[1]);
		Ultra.Math.Plane.normalize(out[2], out[2]);
		Ultra.Math.Plane.normalize(out[3], out[3]);
		Ultra.Math.Plane.normalize(out[4], out[4]);
		Ultra.Math.Plane.normalize(out[5], out[5]);
	};

	Ultra.Math.Fustrum.containsSphear = function(fustrum, point, rad) {
		var dist = 0.0;
		for(var i = 0; i < 6; i++) {
			dist = Ultra.Math.Plane.distanceToPoint(fustrum[i], point);
			if(dist <= -rad) return false;
		}

		return true;
	};

	Ultra.Math.degToRad = function(degrees) {
		return degrees * Math.PI / 180;
	};

	Ultra.Math.sgn = function(val) {
		if(val > 0.0) return 1.0;
		if(val < 0.0) return -1.0;

		return 0.0;
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

	Ultra.Math.Matrix4.reflect = function(m, plane) {
		Ultra.Math.Plane.normalize(plane, plane);

		var nX = plane[0], nY = plane[1], nZ = plane[2], d = plane[3];

		m[0] = -2 * nX * nX + 1;
		m[1] = -2 * nX * nY;
		m[2] = -2 * nX * nZ;
		m[3] = -2 * nX * d;

		m[4] = -2 * nY * nX;
		m[5] = -2 * nY * nY + 1;
		m[6] = -2 * nY * nZ;
		m[7] = -2 * nY * d;

		m[8] = -2 * nZ * nX;
		m[9] = -2 * nZ * nY;
		m[10] = -2 * nZ * nZ + 1;
		m[11] = -2 * nZ * d;

		m[12] = 0;
		m[13] = 0;
		m[14] = 0;
		m[15] = 1;
	};

	Ultra.Math.Matrix4.getPosition = function(m, dest) {
		var pos = dest;
		if(!pos)
			pos = Ultra.Math.Vector3.create();

		Ultra.Math.Vector3.set(pos, m[12], m[13], m[14]);

		return pos;
	};

	Ultra.Math.Matrix4.getRotation = function(m, dest) {
		var rot = dest;
		if(!rot)
			rot = Ultra.Math.Vector3.create();

		Ultra.Math.Matrix4.getScale(m, rot);
		var rotMat = Ultra.Math.Matrix4.clone(m);

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
				Ultra.Math.Vector3.set(rot, Math.atan2(-rotMat[9], rotMat[10]), Math.asin(rotMat[8]), Math.atan2(-rotMat[4], rotMat[0]));
			} else {
				Ultra.Math.Vector3.set(rot, -Math.atan2(rotMat[6], rotMat[5]), -Math.PI / 2, 0);
			}
		} else {
			Ultra.Math.Vector3.set(rot, Math.atan2(rotMat[6], rotMat[5]), Math.PI / 2, 0);
		}

		//Ultra.Math.Vector3.set(rot, [m[12], m[13], m[14]]);

		return rot;
	};

	Ultra.Math.Matrix4.getScale = function(m, dest) {
		var scale = dest;
		if(!scale)
			scale = Ultra.Math.Vector3.create();

		Ultra.Math.Vector3.set(scale, m[0], m[1], m[2]);
		var x = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set(scale, m[4], m[5], m[6]);
		var y = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set(scale, m[8], m[9], m[10]);
		var z = Ultra.Math.Vector3.length(scale);

		Ultra.Math.Vector3.set(scale, x, y, z);

		return scale;
	};
});