define(['ultra/ultra', 'underscore', 'Jvent'], function(Ultra, _, Jvent) {
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Shader2))
		Ultra.Web3DEngine.Shader2 = {};

	Ultra.Web3DEngine.Shader2.Graph = function(nodes) {
		if(!nodes)
			nodes = {};

		this.nodes = nodes;
		this.compiled = {};
	};

	_.extend(Ultra.Web3DEngine.Shader2.Graph.prototype, {
		compile: function(device) {
			if(!this.compiled[device.getType()]) {
				this.compiled[device.getType()] = device.engine.shaderBuilder.compileMaterialGraph(this, device);
			}

			return this.compiled[device.getType()];
		},
		addNode: function(name, node) {
			this.nodes[name] = node;
		},
		getParams: function() {
			var params = {};
			for(var node in this.nodes ) {
				for(var param in this.nodes[node].params) {
					if(this.nodes[node].params[param].type) {
						params[this.nodes[node].params[param].value] = {
							type : this.nodes[node].params[param].type
						};
					}
				}
			}

			return params;
		}
	});
});