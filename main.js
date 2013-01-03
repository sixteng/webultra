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

requirejs(['ultra/ultra', 'ultra_engine/mainengine', 'ultra_engine/camera/base_camera', 'ultra_engine/resources/texture'], function (Ultra) {
	function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

	var shader;
	var texture;
	var heightmap;
    var pMatrix = mat4.create();

    var mesh;
    var camera;

    //var terSize = 256;
    //var cellSize = 2;

    var terrSize = 128;
    var cells = 127;

    var terrSize2 = 128;
    var cells2 = 63;
	//var planeCellSize = 2;
	var terrainVert;
	var terrainIndices;
	var terrain2Vert;
	var terrain2Indices;

	function BuildPlanePositions( cells, scale, height ) {
	    //var halfGridSize = (gridSize - 1) * cellSize * 0.5;

	    var positions = new Array();
	    for (var y = 0; y < cells + 1; ++y) {
	        for (var x = 0; x < cells + 1; ++x) {
	            positions.push(x * scale);
	            positions.push(y * scale);
	            positions.push(height);
	        }
	    }
	    return positions;
	}

	function BuildPlaneIndices( cells ) {
	    var indices = new Array();
	    var count = cells + 1;
	    var odd = true;
	    for (var y = 0; y < cells; ++y) {
	    	//if(y != 0)
	    		//indices.push(indices[indices.length - 1]);

	    	if(odd) {
	    		for (var x = 0; x < cells + 1; ++x) {
		            indices.push((y * count) + x);
		            indices.push(((y + 1) * count) + x);
		        }
	    	} else {
	    		for (var x = 0; x < cells + 1; ++x) {
		            indices.push(((y + 1) * count) - (x + 1));
		            indices.push(((y + 1) * count) + (count - x - 1));
		        }
	    	}
	   

	        //if(y != (cells - 2))
	    		//indices.push((y + 1) * cells + (cells - 1));

	    	odd = !odd;
	    }
	    return indices;
	}

    var rot = 1;
    var lightDir = vec3.create([1, -1, -0.5]);
    var lightRot = mat4.create();

    var terrMat = mat4.create();
    

	var onTick = function(e, engine, device) {
		//Do some cooool stuff ???
		mat4.perspective(45, device.gl.viewportWidth / device.gl.viewportHeight, 0.1, 1000.0, pMatrix);

        shader = engine.shaderManager.getShaderProgram(['basic_terrain_vs', 'basic_terrain_ps']);
        if(!shader)
        	return;

		shader.setParam('uPMatrix', pMatrix);
		shader.setParam('uMVMatrix', camera.getMatrix());
		shader.setParam('cameraPos', camera.getPos());

		$('#posx').val(camera.pos[0] / terrSize);
		$('#posy').val(camera.pos[1] / terrSize);
		$('#posz').val(camera.pos[2] / terrSize);

		//console.log(camera.pos[0]);
		shader.setParam('planePos', [0, 0]);
		shader.setParam('uSampler', heightmap);
		shader.setParam('aVertexPosition', terrain2Vert);

		mat4.identity(lightRot);
		mat4.rotate(lightRot, degToRad(0.5), [0, 1, 1]);
		lightDir = mat4.multiplyVec3(lightRot, lightDir);

		//device.gl.blendFunc(device.gl.SRC_ALPHA, device.gl.ONE);
		//device.gl.enable(device.gl.BLEND);
		//device.gl.disable(device.gl.DEPTH_TEST);
		//mesh.render(device, shader);
		
		shader.setParam('planeSize', [terrSize, terrSize]);
		shader.setParam('lightDir', lightDir);

		device.drawIndex(terrain2Indices, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);

		shader.setParam('planePos', [1, 0]);
		shader.setParam('aVertexPosition', terrainVert);
		device.drawIndex(terrainIndices, shader, Ultra.Web3DEngine.TRIANGLE_STRIP);
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
		//var vSrc = $('#shader-terrain-vs').text();
		//var pSrc = $('#shader-terrain-fs').text();

		if(mesh) {
			mesh.createFromFile('/engine/model?name=cube_with_diffuse_texture.3DS', device);
		} else {
			mesh = new Ultra.Web3DEngine.Mesh(engine);
			//mesh.createFromFile('/engine/model?name=cube_with_diffuse_texture.3DS', device);
			mesh.createFromFile('/engine/model?name=Altair Model/altair.3ds', device);
			
			mesh.setShaders(['basic_vs', 'basic_ps']);
		}

		//device.wireframe = true;

		//mesh.setRot(90, 0, 0);
		
		//mesh.createFromFile('/engine/model?name=Altair Model/altair.3ds');

		var texMg = new Ultra.Resources.TextureManager({});
		var tex = texMg.getTexture('/assets/images/test.png', device, { filters : 'nisse' });
		tex.on('load', function(e, tex) {
			texture = tex.data;
		});

		var tex2 = texMg.getTexture('/assets/images/height_map_large_300.png', device, {});
		tex2.on('load', function(e, tex) {
			heightmap = tex.data;
		});

		engine.shaderManager.loadFromFile('/assets/shaders/basic.xml');

		var tVert = BuildPlanePositions(cells, terrSize / (cells + 1), 0.0);
		var iVert = BuildPlaneIndices(cells);

		terrainVert = device.createVertexBuffer(tVert, 3);
		terrainIndices = device.createIndexBuffer(iVert);

		tVert = BuildPlanePositions(cells2, terrSize2 / (cells2 + 1), 0.0);
		iVert = BuildPlaneIndices(cells2);
		
		terrain2Vert = device.createVertexBuffer(tVert, 3);
		terrain2Indices = device.createIndexBuffer(iVert);

		//console.log(mesh[device.getName()]);

		engine.run();
	});

	var im = new Ultra.InputManager({ target : document.getElementById("glcanvas") });

	camera = new Ultra.Web3DEngine.BaseCamera(engine, im);
	engine.on('tick', onTick);
	engine.init();
	im.enable();
	
	$('#mesh_x, #mesh_y, #mesh_z').change(function() {
		mesh.setRot(parseInt($('#mesh_x').val()), parseInt($('#mesh_y').val()), parseInt($('#mesh_z').val()));
	});

	$('#mesh').change(function() {
		mesh.createFromFile('/engine/model?name=' + $('#mesh').val());
	});

	$('#wireframe').change(function() {
		if($('#wireframe').is(':checked'))
			engine.getRenderDevice('WebGL').wireframe = true;
		else
			engine.getRenderDevice('WebGL').wireframe = false;
	});
});