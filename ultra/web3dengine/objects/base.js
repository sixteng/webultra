/*global: document:false*/
define(['ultra/ultra', 'underscore'], function(Ultra, _) {
	'use strict';

	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Objects))
		Ultra.Web3DEngine.Objects = {};

	Ultra.Web3DEngine.Objects.Base = function() {
		this.id = _.uniqueId('object');
		this.name = '';

		this.position = Ultra.Math.Vector3.create();
		this.rotation = Ultra.Math.Vector3.create();
		this.scale = Ultra.Math.Vector3.fromValues(1, 1, 1);

		this.matrix = Ultra.Math.Matrix4.create();
		this.tmatrix = Ultra.Math.Matrix4.create();

		this.vTmp = Ultra.Math.Vector3.create();

		this.children = [];
		this.parent = false;
		this.material = false;
		this.visible = true;

		this.matrixDirty = true;
	};

	_.extend(Ultra.Web3DEngine.Objects.Base.prototype, {
		applyMatrix: function(mat) {
			Ultra.Math.Matrix4.multiply(this.matrix, this.matrix, mat);

			Ultra.Math.Matrix4.getPosition(this.matrix, this.position);
			Ultra.Math.Matrix4.getScale(this.matrix, this.scale);
			Ultra.Math.Matrix4.getRotation(this.matrix, this.rotation);
		},
		setPosition: function(pos) {
			Ultra.Math.Vector3.copy(this.position, pos);
			this.matrixDirty = true;
		},
		translate: function(dist, axis) {
			//TODO: MAKE THIS BETTER!!!! SUCKS!!!!
			Ultra.Math.Vector3.copy(this.vTmp, axis);
			Ultra.Math.Vector3.scale(this.vTmp, this.vTmp, dist);

			Ultra.Math.Matrix4.identity(this.tmatrix);
			Ultra.Math.Matrix4.rotateX(this.tmatrix, this.tmatrix, this.rotation[0]);
			Ultra.Math.Matrix4.rotateY(this.tmatrix, this.tmatrix, this.rotation[1]);
			Ultra.Math.Matrix4.rotateZ(this.tmatrix, this.tmatrix, this.rotation[2]);
			Ultra.Math.Matrix4.invert(this.tmatrix, this.tmatrix);

			Ultra.Math.Vector3.transformMat4(this.vTmp, this.vTmp, this.tmatrix);
			Ultra.Math.Vector3.add(this.position, this.position, this.vTmp);

			this.matrixDirty = true;
		},
		translateX: function(dist) {
			this.translate(dist, [1, 0, 0]);
		},
		translateY: function(dist) {
			this.translate(dist, [0, 1, 0]);
		},
		translateZ: function(dist) {
			this.translate(dist, [0, 0, 1]);
		},
		rotateX: function(rot) {
			this.rotation[0] += rot;
			this.matrixDirty = true;
		},
		rotateY: function(rot) {
			this.rotation[1] += rot;
			this.matrixDirty = true;
		},
		rotateZ: function(rot) {
			this.rotation[2] += rot;
			this.matrixDirty = true;
		},
		getPosition: function() {
			return this.position;
		},
		setScale: function(scale) {
			Ultra.Math.Vector3.copy(this.scale, scale);
			this.matrixDirty = true;
		},
		getScale: function() {
			return this.scale;
		},
		setRotation: function(rot) {
			Ultra.Math.Vector3.copy(this.rotation, rot);

			this.matrixDirty = true;
		},
		getRotation: function() {
			return this.rotation;
		},
		updateMatrix: function() {
			if(!this.matrixDirty) return;

			Ultra.Math.Matrix4.identity(this.matrix);
			Ultra.Math.Matrix4.translate(this.matrix, this.matrix, this.position);
			Ultra.Math.Matrix4.scale(this.matrix, this.matrix, this.scale);
			Ultra.Math.Matrix4.rotateX(this.matrix, this.matrix, this.rotation[0]);
			Ultra.Math.Matrix4.rotateY(this.matrix, this.matrix, this.rotation[1]);
			Ultra.Math.Matrix4.rotateZ(this.matrix, this.matrix, this.rotation[2]);

			this.matrixDirty = false;
		},
		getMatrix: function() {
			if(this.matrixDirty)
				this.updateMatrix();

			return this.matrix;
		}
	});
});