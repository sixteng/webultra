define(['ultra/ultra', 'underscore', 'Jvent', 'jquery', 'ultra_engine/engine'], function(Ultra, _, Jvent, $) {
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Scene))
		Ultra.Web3DEngine.Scene = {};

	Ultra.Enum.add('Scene', 'OPAQUE');
	Ultra.Enum.add('Scene', 'TRANSPARENT');
	Ultra.Enum.add('Scene', 'LIGHT');
	Ultra.Enum.add('Scene', 'ALL');

	Ultra.Web3DEngine.Scene.Base = function() {
		this.objects = [];
		this.visited = {};
	};

	_.extend(Ultra.Web3DEngine.Scene.Base.prototype, {
		add: function(obj) {
			this.objects.push(obj);
		},
		traverse: function(mask, callback) {
			var objs = [];
			var sceneObjs = false;

			for(var i = 0; i < this.objects.length; i++) {
				sceneObjs = this.traverseSceneObject(this.objects[i], mask, callback);
				if(sceneObjs !== false)
					objs = objs.concat(sceneObjs);
			}

			return objs;
		},
		traverseSceneObject: function(scene_obj, mask, callback) {
			var objs = [scene_obj];
			var childObj = false;
			if(this.visited[scene_obj.id] || scene_obj.visible === false) return false;

			this.visited[scene_obj.id] = true;

			scene_obj.updateMatrix();
			for(var i = 0; i < scene_obj.children.length; i++) {
				childObj = this.traverseSceneObject(scene_obj.children[i], mask, callback);
				if(childObj !== false)
					objs.push(childObj);
			}

			if(scene_obj.material === false) return false;

			var objMask = 0;
			if(scene_obj.material.isOpaque()) objMask += Ultra.Enum.Scene.OPAQUE;
			else if(scene_obj.material.isTransparent()) objMask += Ultra.Enum.Scene.TRANSPARENT;

			if(scene_obj.material.isLight()) objMask += Ultra.Enum.Scene.LIGHT;

			if(!callback) {
				if(objMask != mask && mask != Ultra.Enum.Scene.ALL) 
					return false;
			} else if(!callback(scene_obj, mask, objMask)) {
				return false;
			}

			return objs;
		}
	});
});