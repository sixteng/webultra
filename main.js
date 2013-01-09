requirejs.config({
    paths: {
    	ultra: '/engine',
		ultra_engine: '/engine',
        underscore: '/engine/libs/underscore',
        jquery: '/engine/libs/jquery',
        Jvent : '/engine/libs/jvent.min'
    }
    //urlArgs: "bust=" +  (new Date()).getTime()
});

requirejs(['ultra/ultra', 'ultra_engine/mainengine', 'ultra_engine/camera/base_camera', 'ultra_engine/resources/texture', 'ultra_engine/mesh/terrain_mesh'], function (Ultra) {
	function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

	var shader;
	var texture;
	var heightmap;

	var mask;
	var combined;

    var pMatrix = mat4.create();

    var mesh;
    var camera;
    
    var terrain = null;

	var onTick = function(e, engine, device) {
		//Do some cooool stuff ???
		mat4.perspective(45, device.gl.viewportWidth / device.gl.viewportHeight, 0.1, 1000.0, pMatrix);

		camera.pMatrix = pMatrix;
		terrain.render(device, camera);

		mesh.render(device, camera);
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

	engine.on('init', function(e, device) {
		/*
		if(mesh) {
			mesh.createFromFile('/engine/model?name=cube_with_diffuse_texture.3DS', device);
		} else {
			mesh = new Ultra.Web3DEngine.Mesh(engine);
			//mesh.createFromFile('/engine/model?name=cube_with_diffuse_texture.3DS', device);
			mesh.createFromFile('/engine/model?name=Altair Model/altair.3ds', device);
			
			mesh.setShaders(['basic_vs', 'basic_ps']);
		}
		*/
		mesh = new Ultra.Web3DEngine.Mesh(engine);
		mesh.createFromFile('/engine/model?name=Inn/Inn.3ds', device);
		mesh.setShaders(['basic_vs', 'basic_ps']);

		//device.wireframe = true;

		mesh.setPos(55, 8.6, -20);
		mesh.setRot(90, 0, 0);
		mesh.setScale(30, 30, 30);
		
		//mesh.createFromFile('/engine/model?name=Altair Model/altair.3ds');

		//TODO: Move to material loading instead ....
		var texMg = engine.textureManager;//new Ultra.Resources.TextureManager({});
		var tex = texMg.getTexture('/assets/models/Inn/Roof.jpg', device, {});
		tex.on('load', function(e, tex) {
			mesh.textures['roof'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Stone Wall2.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['stone_wall'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Stone Wall-new.png', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['stone'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Wood floor 2.png', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['wood_floor'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Plaster.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['plaster'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/InnSign.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['sign'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/InnSign2.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['sign2'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Window2.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['window2'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Window.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['window'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Rusted Metal.png', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['metal_rusted'] = tex.data;
		});

		tex2 = texMg.getTexture('/assets/models/Inn/Door3.jpg', device, {});
		tex2.on('load', function(e, tex) {
			mesh.textures['door'] = tex.data;
		});

		terrain = new Ultra.Web3DEngine.Terrain(engine);
		terrain.buildPlanes(device);
		terrain.addPatch('/assets/images/heightmap.png', device);
		terrain.addPatch('/assets/images/heightmap.png', device, [1, 0]);

		engine.shaderManager.loadFromFile('/assets/shaders/basic.xml');
		engine.run();
	});

	var im = new Ultra.InputManager({ target : document.getElementById("glcanvas") });

	camera = new Ultra.Web3DEngine.BaseCamera(im);
	camera.setPos([0.0, 0.0, 25.0]);
	engine.on('tick', camera.tick.bind(camera));
	engine.on('tick', onTick);
	engine.init();
	im.enable();
	
	$('#mesh_x, #mesh_y, #mesh_z').change(function() {
		mesh.setPos(parseFloat($('#mesh_x').val()), parseFloat($('#mesh_y').val()), parseFloat($('#mesh_z').val()));
	});

	$('#mesh').change(function() {
		mesh.createFromFile('/engine/model?name=' + $('#mesh').val());
	});

	$('#wireframe').change(function() {
		if($('#wireframe').is(':checked'))
			engine.getRenderDevice('WebGL').setConfig('wireframe', true);
		else
			engine.getRenderDevice('WebGL').setConfig('wireframe', false);
	});

	$('#FPS').change(function() {
		if($('#FPS').is(':checked'))
			engine.setConfig('renderFPS', true);
		else
			engine.setConfig('renderFPS', false);
	});
});