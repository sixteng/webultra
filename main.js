requirejs.config({
    paths: {
		ultra: '/ultra',
		ultra_engine: '/ultra/web3dengine',
        underscore: '/ultra/web3dengine/libs/underscore',
        jquery: '/ultra/web3dengine/libs/jquery',
        Jvent : '/ultra/web3dengine/libs/jvent.min'
    }
	//urlArgs: "bust=" +  (new Date()).getTime()
});

requirejs([
	'ultra/ultra',
	'ultra_engine/engine',
	'ultra_engine/cameras/base',
	'ultra_engine/resources/texture',
	'ultra_engine/objects/mesh',
	'ultra_engine/objects/terrain_mesh',
	'ultra/common/console',
	'ultra/common/math'],
function (Ultra) {
	var shader;
	var texture;
	var heightmap;

	var mask;
	var combined;

    var pMatrix = mat4.create();

    var mesh;
    var camera;
    
    var terrain = null;

    var lightDir = vec3.fromValues(0, 0, 100);
    var lightRot = mat4.create();

	var onTick = function(e, engine, device, elapsed) {
		//Do some cooool stuff ???
		var shader = engine.shaderManager.getShaderProgram(['basic_vs', 'basic_ps']);

		mat4.identity(lightRot);
		mat4.rotate(lightRot, lightRot, Ultra.Math.degToRad(0.5), [10, 0, 0]);

		lightDir = Ultra.Math.Vector3.transformMat4(lightDir, lightDir, lightRot);

		if(shader)
			shader.setParam('lightDir', lightDir);

		shader = engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
		if(shader)
			shader.setParam('lightDir', lightDir);

		terrain.render(device, camera);

		mesh.setShaders(['basic_vs', 'basic_ps']);
		mesh.render(device, camera);

		//mesh.setShaders(['basic_debug_normals_vs', 'basic_debug_ps']);

		//mesh.renderDebug(device, camera);
	};

	var engine = new Ultra.Web3DEngine.Engine({
		devices: {
			//TODO: Fix support for multiple active devices
			'WebGL' : {
				device: 'WebGL',
				target : document.getElementById("glcanvas")
			}
		}
	});

	var heightMapCtx;

	engine.on('init', function(e, device) {
		terrain = new Ultra.Web3DEngine.Terrain(engine);
		terrain.buildPlanes(device);
		terrain.addPatch('/assets/images/heightmap.png', device);
		//terrain.addPatch('/assets/images/heightmap.png', device, [1, 0]);

		engine.run();
	});

	engine.shaderManager.loadFromFile('/assets/shaders/basic.xml');

	mesh = new Ultra.Web3DEngine.Objects.Mesh(engine);
	mesh.createFromFile('/engine/model?name=Inn/Inn.3ds');
	mesh.setShaders(['basic_vs', 'basic_ps']);

	mesh.setRotation([Ultra.Math.degToRad(90), 0, 0]);
	mesh.setPosition([55, 20, 6.5]);
	
	//TODO: Move to material loading instead ....
	
	mesh.textures['roof'] = engine.textureManager.getTexture('/assets/models/Inn/Roof.jpg', {});
	mesh.textures['stone_wall'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall2.jpg', {});
	mesh.textures['stone'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall-new.png', {});
	mesh.textures['wood_floor'] = engine.textureManager.getTexture('/assets/models/Inn/Wood floor 2.png', {});
	mesh.textures['plaster'] = engine.textureManager.getTexture('/assets/models/Inn/Plaster.jpg', { wrap : true, format : Ultra.Resources.Texture.Formats.RGB});
	mesh.textures['sign'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign.jpg', {});
	mesh.textures['sign2'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign2.jpg', {});
	mesh.textures['window2'] = engine.textureManager.getTexture('/assets/models/Inn/Window2.jpg', {});
	mesh.textures['window'] = engine.textureManager.getTexture('/assets/models/Inn/Window.jpg', {});
	mesh.textures['metal_rusted'] = engine.textureManager.getTexture('/assets/models/Inn/Rusted Metal.png', {});
	mesh.textures['door'] = engine.textureManager.getTexture('/assets/models/Inn/Door3.jpg', {});

	var im = new Ultra.InputManager({ target : document.getElementById("glcanvas") });

	var freefly = false;
	camera = new Ultra.Web3DEngine.Cameras.FirstPersonCamera(im, 45, 800 / 600, 0.1, 1000.0);
	
	camera.setRotation([-Ultra.Math.degToRad(90), 0.0, 0.0]);
	camera.setPosition([0, 0, 0]);

	/*
	var heightMap = engine.fileManager.loadFile('/assets/images/heightmap.png');
	heightMap.on('load', function(e, file) {
		var img = new Image();
		img.onload = function(e) {
			heightMapCtx = document.createElement("canvas");
			heightMapCtx.width = img.width;
			heightMapCtx.height = img.height;
			heightMapCtx = heightMapCtx.getContext("2d");
			heightMapCtx.drawImage(img, 0, 0, img.width, img.height);
		};

		img.src = window.URL.createObjectURL(file.data);
	});

	
	engine.on('tick', function() {
		if(!heightMapCtx || freefly)
			return;

		var pos = camera.pos;

		var data = heightMapCtx.getImageData(pos[0] / 127 * 1024, 1024 - pos[1] / 127 * 1024, 3, 3).data;

		$('#posx').val(pos[0] / 127 * 1024);
		$('#posy').val(pos[1] / 127 * 1024);
		$('#posz').val(data[0] / 255 * 25 + 2);
		camera.setPos([pos[0], pos[1], data[0] / 255 * 25 + 1]);
	});
	*/

	engine.on('tick', camera.tick.bind(camera));
	engine.on('tick', onTick);

	engine.init();
	im.enable();

	$('#wireframe').change(function() {
		if($('#wireframe').is(':checked'))
			engine.getRenderDevice('WebGL').setConfig('wireframe', true);
		else
			engine.getRenderDevice('WebGL').setConfig('wireframe', false);
	});

	engine.setConfig('renderFPS', $('#FPS')[0]);

	$('#freefly').change(function() {
		if($('#freefly').is(':checked')) {
			freefly = true;
			camera.speed = 200;
		} else {
			freefly = false;
			camera.speed = 50;
		}
	});

	var con = new Ultra.Console($('#glcanvas'), engine);

	/*
	var func = lua_parser.parse('function printLn() \n local p = Ultra.create(); print(p) \n end');

	//var script = eval("(function () {\n" + func + "\n})()");

	console.log(func);

	//var jsFunc = lua_tableget(script[0], "print");

	//jsFunc();

	Tmp = function () {
		this.pelle = 'Nisse';
	};

	Factory = {
		create: function() {
			console.log('Woho');
			return 'apa';
		}
	};

	var func = lua_load('function printLn() \n local p = Ultra.create(); print(p) \n end');
	var g = func();

	//g.objs['engine'] = engine;
	lua_tableset(g, 'Ultra', lua_newtable(null, 'create', Factory.create));
	//console.log(lua_newtable(false, 'Ultra', Ultra));
	lua_call(lua_tableget(g, "printLn"), [1, 2, 3]);
	//console.log(lua_tableget(g, "print"));
	*/
});