define(['ultra/ultra', 'underscore', 'Jvent', 'ultra_engine/shader/shader'], function(Ultra, _, Jvent) {
	if(_.isUndefined(Ultra.Web3DEngine))
		Ultra.Web3DEngine = {};

	if(_.isUndefined(Ultra.Web3DEngine.Material))
		Ultra.Web3DEngine.Material = {};

	Ultra.Web3DEngine.Material.Base = function() {
		this.transparent = false;
		this.light = false;
		this.affectedByLight = true;

		this.graph = null;
		this.shader = null;
	};

	_.extend(Ultra.Web3DEngine.Material.Base.prototype, {
		isOpaque: function() {
			return !this.transparent;
		},
		isTransparent: function() {
			return this.transparent;
		},
		isLight: function() {
			return this.light;
		},
		setGraph: function(graph) {
			this.graph = graph;
		},
		getShaderProgram: function(device, base_shaders) {
			//Compile graph!!
			
			//TODO: Add support for when sing other base shaders, recompile ? Cache ??
			if(this.shader)
				return this.shader;

			var graph = this.graph.compile(device);
			var baseShaders = [];

			for(var shader in base_shaders)
				baseShaders.push(device.engine.shaderBuilder.baseShaders[base_shaders[shader]]);

			this.shader = new Ultra.Web3DEngine.Shader2.ShaderProgram(baseShaders, this.graph);
			return this.shader;
		}
	});
});