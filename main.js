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
	'ultra_engine/rendersystem/renderer/deffered',
	'ultra/common/console',
	'ultra_engine/objects/plane',
	'ultra/common/math'],
function (Ultra) {
	var heightmap;

	var mask;
	var combined;

    var mRef = mat4.create();
    var rCamera = mat4.create();
    var pCamera = mat4.create();
    var iCamera = mat4.create();

    var mesh;
    var mesh2;
    var camera;
    
    var terrain = null;

    var lightDir = vec3.fromValues(0, 0.25, 0.75);
    var lightRot = mat4.create();

    var v = Ultra.Math.Vector3.fromValues(1, 5, 1);
    var d = -Ultra.Math.Vector3.dot(v, [0, 1, 0]);

    var clipPlane = Ultra.Math.Vector4.fromValues(0, 1, 0, -5.0);
    var tmpv4 = Ultra.Math.Vector4.create();
    var q = Ultra.Math.Vector4.create();

    var sgn = function(val) {
		if(val > 0.0) return 1.0;
		if(val < 0.0) return -1.0;

		return 0.0;
    };

	var onTick = function(e, engine, device, elapsed) {
		//Do some cooool stuff ???

		//Calc reflcection Camera

		//(0, 1, 0, -Y)

		var Y = 0.0;
		var ny = 1.0;

		mRef[0] = 1;
		mRef[1] = 0;
		mRef[2] = 0;
		mRef[3] = 0;
		mRef[4] = 0;
		mRef[5] = -2 * (ny * ny) + 1;
		mRef[6] = 0;
		mRef[7] = -2 * ny * Y;
		mRef[8] = 0;
		mRef[9] = 0;
		mRef[10] = 1;
		mRef[11] = 0;
		mRef[12] = 0;
		mRef[13] = 0;
		mRef[14] = 0;
		mRef[15] = 1;

		mat4.multiply(rCamera, camera.getMatrix(), mRef);

		camera2.matrix = rCamera;
		camera2.updateFustrum();

		mat4.invert(iCamera, camera2.matrix);
		mat4.transpose(iCamera, iCamera);
		vec4.transformMat4(tmpv4, clipPlane, iCamera);

		camera2.updateProjectionMatrix();
		pCamera = camera2.getProjectionMatrix();

		camera2.oldProj = mat4.clone(pCamera);
		camera.oldProj = camera.getProjectionMatrix();
		//mat4.invert(mRef, pCamera);
		//vec4.transformMat4(q, [sgn(tmpv4[0]), sgn(tmpv4[1]), 1.0, 1.0], mRef);

		q[0] = (sgn(tmpv4[0]) + pCamera[8]) / pCamera[0];
		q[1] = (sgn(tmpv4[1]) + pCamera[9]) / pCamera[5];
		q[2] = 1.0;
		q[3] = (1.0 - pCamera[10]) / pCamera[14];

		var d1 = 1.0 / Ultra.Math.Vector4.dot(tmpv4, q);

		Ultra.Math.Vector4.scale(q, tmpv4, d1);

		pCamera[2] = q[0];
		pCamera[6] = q[1];
		pCamera[10] = q[2] + 1.0;
		pCamera[14] = q[3];

		//camera2.updateProjectionMatrix();
		mesh2.envCamera = camera2;

		camera2.reflect = true;
		deffered.render(device, mesh2.envMap, [terrain, mesh], camera2, elapsed);
		
		if($('#freefly').is(':checked'))
			deffered.render(device, null, [terrain, mesh], camera2, elapsed);
		else
			deffered.render(device, null, [terrain, mesh, mesh2], camera, elapsed);
		
		//var shader = engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
		//if(camera && shader)
		//	terrain.render(device, camera, shader);

		//var pos = Ultra.Math.Matrix4.getPosition(mesh.getMatrix());

		//$('#posx').val(mesh2.clipped);
	};
	var canvas = document.getElementById("glcanvas");
	var engine = new Ultra.Web3DEngine.Engine({
		devices: {
			//TODO: Fix support for multiple active devices
			'WebGL' : {
				device: 'WebGL',
				target : canvas
			}
		}
	});

	var heightMapCtx;

	var deffered = new Ultra.Web3DEngine.RenderSystem.Renderer.Deffered(engine);

	engine.on('init', function(e, device) {
		terrain = new Ultra.Web3DEngine.Terrain(engine);
		terrain.buildPlanes(device);
		terrain.addPatch('/assets/images/heightmap.png', device);
		//terrain.addPatch('/assets/images/heightmap.png', device, [1, 0]);

		engine.run();
	});

	engine.shaderManager.loadFromFile('/assets/shaders/basic.xml');
	engine.shaderManager.loadFromFile('/assets/shaders/deffered.xml');
	engine.shaderManager.loadFromFile('/assets/shaders/water.xml');


	mesh = new Ultra.Web3DEngine.Objects.Mesh(engine);
	mesh.createFromFile('/engine/model?name=Inn/Inn.3ds');
	mesh.setShaders(['basic_light_vs', 'basic_light_ps']);

	//mesh.setRotation([Ultra.Math.degToRad(90), 0, 0]);
	mesh.setPosition([0, 6.5, -25]);

	mesh2 = new Ultra.Web3DEngine.Objects.Plane(64, 64, 64);
	mesh2.setRotation([-Ultra.Math.degToRad(90), 0, 0]);
	//mesh2.setPosition([32, 5, -32]);
	//TODO: Move to material loading instead ....

	mesh2.setPosition([32, 5, -32]);

	mesh2.envMap = engine.createRenderTarget(1024, 800, {
		magFilter : Ultra.Consts.NearestFilter,
		minFilter : Ultra.Consts.NearestFilter,
		format : Ultra.Consts.RGBFormat,
		type : Ultra.Consts.UByteType,
		mipmap: false,
		stencilBuffer: false
	});
	
	mesh.textures['roof'] = engine.textureManager.getTexture('/assets/models/Inn/Roof.jpg');
	mesh.textures['stone_wall'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall2.jpg');
	mesh.textures['stone'] = engine.textureManager.getTexture('/assets/models/Inn/Stone Wall-alpha.png');
	mesh.textures['wood_floor'] = engine.textureManager.getTexture('/assets/models/Inn/Wood floor 2.png');
	mesh.textures['plaster'] = engine.textureManager.getTexture('/assets/models/Inn/Plaster.jpg', { format : Ultra.Consts.RGBFormat });
	mesh.textures['sign'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign.jpg');
	mesh.textures['sign2'] = engine.textureManager.getTexture('/assets/models/Inn/InnSign2.jpg');
	mesh.textures['window2'] = engine.textureManager.getTexture('/assets/models/Inn/Window2.jpg');
	mesh.textures['window'] = engine.textureManager.getTexture('/assets/models/Inn/Window.jpg');
	mesh.textures['metal_rusted'] = engine.textureManager.getTexture('/assets/models/Inn/Rusted Metal.png');
	mesh.textures['door'] = engine.textureManager.getTexture('/assets/models/Inn/Door3.jpg');
	mesh.textures['water'] = engine.textureManager.getTexture('/assets/images/water.png');
	mesh.textures['water_bump'] = engine.textureManager.getTexture('/assets/images/water.jpg');

	var im = new Ultra.InputManager({ target : document.getElementById("glcanvas") });

	var freefly = false;
	camera = new Ultra.Web3DEngine.Cameras.FirstPersonCamera(im, 45, 1024 / 800, 0.1, 1000.0);
	
	//Ultra.Math.degToRad(90)
	camera.setRotation([0, 0.0, 0.0]);
	camera.setPosition([0, -20, -40]);

	camera2 = new Ultra.Web3DEngine.Cameras.FirstPersonCamera(null, 45, 1024 / 800, 0.1, 1000.0);
	//camera2.setRotation([0.0, 0.0, 0.0]);
	//camera2.setPosition([0, 0, 0]);

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

	$('#posx, #posy, #posz').change(function() {
		mesh.setPosition([parseFloat($('#posx').val()), parseFloat($('#posy').val()), parseFloat($('#posz').val())]);
	});

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