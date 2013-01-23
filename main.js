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
	'ultra_engine/cameras/firstperson',
	'ultra_engine/resources/texture',
	'ultra_engine/objects/mesh',
	'ultra_engine/objects/terrain_mesh',
	'ultra_engine/rendersystem/renderer/deffered',
	'ultra/common/console',
	'ultra_engine/objects/plane',
	'ultra_engine/objects/box',
	'ultra_engine/objects/skybox',
	'ultra_engine/shader/shader',
	'ultra_engine/scene/base',
	'ultra_engine/material/base',
	'ultra/common/math'],
function (Ultra) {
    var rCamera = mat4.create();

    var house;
    var water;
    var camera;
    var reflectedCamera;
    
    var terrain;

    //Clipping plane for the water surface
    var clipPlane = Ultra.Math.Vector4.fromValues(0, 1, 0, -5.0);

    //Setup reflection matrix for the water surface
    var mRef = mat4.create();
    Ultra.Math.Matrix4.reflect(mRef, [clipPlane[0], clipPlane[1], clipPlane[2], 0]);

    //Render function
	var onTick = function(e, engine, device, elapsed) {
		//Calc reflcection Camera
		mat4.multiply(rCamera, camera.getMatrix(), mRef);
		mat4.translate(rCamera, rCamera, [0, 2 * clipPlane[3], 0]);

		reflectedCamera.setMatrix(rCamera);
		//reflectedCamera.matrix = rCamera;
		reflectedCamera.updateFustrum();

		water.envCamera = reflectedCamera;

		reflectedCamera.setNearPlane(clipPlane);

		//Needs to be set for the deffered render to change the depth check.. other wise nothing is rendered
		reflectedCamera.reflect = true;

		//Render reflected camera / env map
		deffered.render(device, water.envMap, [terrain, house, box, skybox], reflectedCamera, elapsed);
		deffered.render(device, null, [terrain, house, box, skybox, water], camera, elapsed);

	};

	//Configure Engine
	var engine = new Ultra.Web3DEngine.Engine({
		devices: {
			//TODO: Fix support for multiple active devices
			'WebGL' : {
				device: 'WebGL',
				target : document.getElementById("glcanvas")
			}
		}
	});

	//Create render system
	var deffered = new Ultra.Web3DEngine.RenderSystem.Renderer.Deffered(engine);

	//Executes when the engine is done setting up
	engine.on('init', function(e, device) { 
		//Enter Main Loop
		engine.run();
	});

	//Load shader files
	engine.shaderManager.loadFromFile('/assets/shaders/basic.xml');
	engine.shaderManager.loadFromFile('/assets/shaders/deffered.xml');
	engine.shaderManager.loadFromFile('/assets/shaders/water.xml');

	//Shader Builder
	//var shaderBuilder = new Ultra.Web3DEngine.Shader2.Builder(engine.fileManager);
	//shaderBuilder.loadFunctionsFromFile('/assets/shaders/basic_shader_functions.xml');
	
	//shaderBuilder.once('load', function() {
	//	shaderBuilder.loadMaterialsFromFile('/assets/materials/terrain.xml');
	//	shaderBuilder.once('load', function() {
	//		shaderBuilder.compile(shaderBuilder.materials['terrain']);
	//	});
	//});
	/*
	if(func.sources[$(sources[i]).attr('device')].lua) {
		self.compile(func.sources[$(sources[i]).attr('device')], {
			inputs : { value : { name : 'value', type : 'float3'} },
			outputs : {}
		});
	}
	*/

	//Create Terrain Patches
	terrain = new Ultra.Web3DEngine.Terrain(engine);
	terrain.buildPlanes();
	terrain.addPatch('/assets/images/heightmap.png');
	terrain.material = new Ultra.Web3DEngine.Material.Base();
	//terrain.addPatch('/assets/images/heightmap.png', [127, 0]);

	//Create the water plane for the terrain
	water = new Ultra.Web3DEngine.Objects.Plane(64, 64, 16);
	water.setRotation([-Ultra.Math.degToRad(90), 0, 0]);
	water.setPosition([32, 5, -32]);
	water.envMap = engine.createRenderTarget(512, 512, {
		magFilter : Ultra.Consts.LinearFilter,
		minFilter : Ultra.Consts.LinearFilter,
		format : Ultra.Consts.RGBFormat,
		type : Ultra.Consts.UByteType,
		mipmap: false,
		stencilBuffer: false
	});

	water.material = new Ultra.Web3DEngine.Material.Base();
	water.material.transparent = true;

	//Load an Mesh and place it
	house = new Ultra.Web3DEngine.Objects.Mesh(engine);
	house.createFromFile('/engine/model?name=Inn/Inn.3ds');
	house.setPosition([0, 6.5, -25]);

	//Load textures for the mesh, should be done with materials ???
	house.textures['roof'] = engine.textureManager.getTexture('/assets/models/Inn/Roof.jpg');
	house.textures['stone_wall'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall2.jpg');
	house.textures['stone'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall-alpha.png');
	house.textures['wood_floor'] = engine.textureManager.getTexture('/assets/models/Inn/Wood floor 2.png');
	house.textures['plaster'] = engine.textureManager.getTexture('/assets/models/Inn/Plaster.jpg', { format : Ultra.Consts.RGBFormat });
	house.textures['sign'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign.jpg');
	house.textures['sign2'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign2.jpg');
	house.textures['window2'] = engine.textureManager.getTexture('/assets/models/Inn/Window2.jpg');
	house.textures['window'] = engine.textureManager.getTexture('/assets/models/Inn/Window.jpg');
	house.textures['metal_rusted'] = engine.textureManager.getTexture('/assets/models/Inn/Rusted Metal.png');
	house.textures['door'] = engine.textureManager.getTexture('/assets/models/Inn/Door3.jpg');
	house.textures['water'] = engine.textureManager.getTexture('/assets/images/water.png');
	house.textures['water_bump'] = engine.textureManager.getTexture('/assets/images/water.jpg');

	house.material = new Ultra.Web3DEngine.Material.Base();

	box = new Ultra.Web3DEngine.Objects.Box(10, 10);
	box.setPosition([10, 7, -10]);
	box.setScale([5, 5, 5]);
	box.tex = house.textures['sign'];

	var skybox = new Ultra.Web3DEngine.Objects.SkyBox(engine);
	skybox.create(['/assets/images/skybox/px.jpg', '/assets/images/skybox/nx.jpg', '/assets/images/skybox/ny.jpg', '/assets/images/skybox/py.jpg', '/assets/images/skybox/pz.jpg', '/assets/images/skybox/nz.jpg']);
	skybox.setPosition([0, 0.1, 0]);

	skybox.material = new Ultra.Web3DEngine.Material.Base();
	skybox.material.affectedByLight = false;
	//Initialize InputHandler, binds and buffers all inputs to the canvas
	var im = new Ultra.InputManager({ target : document.getElementById("glcanvas") });

	//Setup the Main FirstPerson Camera, will use input from the input manager
	camera = new Ultra.Web3DEngine.Cameras.FirstPersonCamera(im, 45, 1024 / 800, 0.1, 1000.0);
	camera.setRotation([0, 0.0, 0.0]);
	camera.setPosition([0, -20, -40]);

	//Setup the reflection / perspective camera.. used for the water surface
	reflectedCamera = new Ultra.Web3DEngine.Cameras.PerspectiveCamera(45, 1024 / 800, 0.1, 1000.0);

	var scene = new Ultra.Web3DEngine.Scene.Base();
	scene.add(terrain);
	scene.add(water);
	scene.add(house);
	scene.add(skybox);

	console.log(scene.traverse(Ultra.Enum.Scene.OPAQUE));

	//Load the heightmap to be able to lookup height data to position the camera
	var heightMapCtx;
	var heightMap = engine.fileManager.loadFile('/assets/images/heightmap.png');
	heightMap.on('load', function(e, file) {
		var img = new Image();
		img.onload = function(e) {
			heightMapCtx = document.createElement("canvas");
			//heightMapCtx = $('#heightmap')[0];
			heightMapCtx.width = img.width;
			heightMapCtx.height = img.height;
			heightMapCtx = heightMapCtx.getContext("2d");
			heightMapCtx.drawImage(img, 0, 0, img.width, img.height);
		};

		img.src = window.URL.createObjectURL(file.data);
	});

	//On each frame / tick, position the camera on the correct height
	engine.on('tick', function() {
		if(!heightMapCtx || $('#freefly').is(':checked'))
			return;

		var pos = camera.getPosition();
		var data = heightMapCtx.getImageData(1024 - (pos[0] + 64) / 127 * 1024, (pos[2] + 64) / 127 * 1024, 1, 1).data;

		camera.setPosition([pos[0], -(data[0] / 255 * 25 + 2), pos[2]]);
	});


	//Move camera on tick, 
	engine.on('tick', camera.tick.bind(camera));
	//Bind the main render function
	engine.on('tick', onTick);

	//Initialize the engine
	engine.init();

	//Enable capture of input
	im.enable();

	//Toggle wireframe rendering
	$('#wireframe').change(function() {
		if($('#wireframe').is(':checked'))
			engine.getRenderDevice('WebGL').setConfig('wireframe', true);
		else
			engine.getRenderDevice('WebGL').setConfig('wireframe', false);
	});

	//Tells the engine where to print the current FPS
	engine.setConfig('renderFPS', $('#FPS')[0]);

	var con = new Ultra.Console($('#glcanvas'), engine);

	$('#posx, #posy, #posz').change(function() {
		box.setPosition([parseFloat($('#posx').val()), parseFloat($('#posy').val()), parseFloat($('#posz').val())]);
	});

	//TODO: Enable LUA scripting
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