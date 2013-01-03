if(typeof UltraWebEngine === "undefined") {
	UltraWebEngine = {
		ShaderEditor : {}
	};
} else {
	UltraWebEngine.ShaderEditor = {};
}

Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
	
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox(),
        p = [{x: bb1.x + bb1.width / 2, y: bb1.y - 1},
        {x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1},
        {x: bb1.x - 1, y: bb1.y + bb1.height / 2},
        {x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2},
        {x: bb2.x + bb2.width / 2, y: bb2.y - 1},
        {x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1},
        {x: bb2.x - 1, y: bb2.y + bb2.height / 2},
        {x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2}],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};

UltraWebEngine.ShaderEditor.Editor = new JS.Class({
	initialize: function(config) {
		var self = this;
		
		this.raphael = Raphael($(config.target)[0], config.width, config.height);
		
		this.raphael.area = this.raphael.rect(0, 0, config.width, config.height);
		this.raphael.area.attr({fill: "#EEE", opacity : 1});
		
		this.raphael.area.click(function() {
			if(this.paper.start) {
				this.paper.start.setColor('#000');
				this.paper.start = false;
			}
		});
		
		//TODO: Check that all params are included
		this.config = config;
		this.shaderTypes = {};
		this.nodes = [];
	},
	addShaderType: function(name, data) {
		data.name = name;
		this.shaderTypes[name] = data;
	},
	addEdge: function(start, end) {
		//var con = this.raphael.connection(node1, node2, "#000");
		if(start.isA(UltraWebEngine.ShaderEditor.Input)) {
			var tmp = start;
			start = end;
			end = tmp;
		}

		new UltraWebEngine.ShaderEditor.Edge(this.raphael, start, end);
	},
	addNode: function(name, pos, config) {
		config.raphael = this.raphael;
		
		config.type = this.shaderTypes[config.type];
		
		var node = new UltraWebEngine.ShaderEditor.Node(name, pos, config);
		node.editor = this;
		this.nodes.push(node);

		return node;
	},
	generateShaderXML: function() {
		var obj = {};
		for(var i in this.nodes) {
			obj[this.nodes[i].name] = this.nodes[i].generateShaderObject();
		}
		
		return obj;
	}
});

UltraWebEngine.ShaderEditor.Edge = new JS.Class({
	initialize: function(raphael, start, end) {
		this.start = start;
		this.end = end;
		this.raphael = raphael;
		
		this.create();
	},
	create: function() {
		this.el = this.raphael.connection(this.start.el, this.end.el, "#000");
		
		this.start.edges.push(this);
		this.end.edges.push(this);
	},
	update: function() {
		this.raphael.connection(this.el);
	},
	remove: function() {
		this.el.line.remove();
	}
});

UltraWebEngine.ShaderEditor.IO = new JS.Class({
	size: 8,
	offset_x: 0,
	offset_y: 0,
	text_offset_x: 0,
	text_offset_y: 0,
	text_anchor: 'start',
	multiple: false,
	initialize: function(id, raphael, x, y, config) {
		this.id = id;
		this.pos = {x : x, y : y};
		this.raphael = raphael;
		this.config = config;
		this.edges = [];
		this.create();
	},
	create: function() {
		this.el = this.raphael.rect(this.pos.x + this.offset_x, this.pos.y + this.offset_y, this.size, this.size);
		this.el.data = this;
		this.el.attr({fill: '#000' });
		this.el.click(this.click);
		this.el.edges = [];
		this.text = this.raphael.text(this.pos.x + this.text_offset_x, this.pos.y + this.text_offset_y, this.config.title).attr({'text-anchor' : this.text_anchor, 'font-size' : '12', 'font-weight' : 'bold'});
		
	},
	setPos: function(x, y) {
		this.el.attr({x : x + this.offset_x, y : y + this.offset_y});
		this.text.attr({x : x + this.text_offset_x, y : y + this.text_offset_y});
		
		for (var i = this.edges.length; i--;) {
			this.edges[i].update();
		} 
	},
	setColor: function(color) {
		this.el.attr({fill: color });
	},
	check: function(input) {
		return input.config.type == this.config.type;
	},
	click: function() {
		if(this.paper.start) {
			if(this.paper.start.isA(this.klass))
				return;
			
			if(!this.paper.start.check(this.data))
				return;

			if(!this.paper.start.multiple && this.paper.start.edges.length > 0) {
				this.paper.start.edges[0].remove();
				delete this.paper.start.edges[0];
				this.paper.start.edges.length = 0;
			}
		
			this.data.parent.editor.addEdge(this.paper.start, this.data);
			this.paper.start.setColor('#000');
			this.paper.start = false;
			return;
		}
		this.paper.start = this.data;
		this.data.setColor('#FF0000');
	}
});

UltraWebEngine.ShaderEditor.Output = new JS.Class(UltraWebEngine.ShaderEditor.IO, {
	offset_x: -8,
	text_offset_x: 5,
	text_offset_y: 4,
	multiple: true
});

UltraWebEngine.ShaderEditor.Input = new JS.Class(UltraWebEngine.ShaderEditor.IO, {
	text_offset_x: -5,
	text_offset_y: 4,
	text_anchor: 'end'
});

UltraWebEngine.ShaderEditor.Node = new JS.Class({
	edge_offset: 10,
	initialize: function(name, pos, config) {
		_.defaults(config, {
			movable: true
		});
		
		//this.uid = _.uniqueId('node');
		
		this.name = name;
		this.pos = pos;
		this.config = config;
		this.el = this.render();
	},
	generateShaderObject: function() {
		var obj = {
			type : this.config.type.name,
			inputs : {}
		};
		
		for(var i in this.inputs) {
			if(this.inputs[i].edges.length === 0) continue;
			obj.inputs[i] = {
				key : this.inputs[i].edges[0].start.id,
				node : this.inputs[i].edges[0].start.parent.name
			};
		}
		
		return obj;
	},
	render: function() {
		var color = Raphael.getColor();
		var el = this.config.raphael.rect(this.pos.x, this.pos.y, this.pos.width, this.pos.height);
		el.attr({fill: color, stroke: color, "fill-opacity": .5, "stroke-width": 2, cursor: this.config.movable ? "move" : ""});
		this.text = this.config.raphael.text(this.pos.x + 5, this.pos.y + 10, this.name).attr({'text-anchor' : 'start', 'font-size' : '15', 'font-weight' : 'bold'});
		
		el.data = this;
		
		this.outputs = [];
		this.inputs = [];
		var child_pos = this.edge_offset + 15;
		for(var i in this.config.type.outputs) {
			var child = new UltraWebEngine.ShaderEditor.Output(i, this.config.raphael, this.pos.x, this.pos.y + child_pos, this.config.type.outputs[i]);
			child.parent = this;
			this.outputs[i] = child;
			
			child_pos += 15;
		}
		
		child_pos = this.edge_offset + 15;
		for(var i in this.config.type.inputs) {
			var child = new UltraWebEngine.ShaderEditor.Input(i, this.config.raphael, this.pos.x + this.pos.width, this.pos.y + child_pos, this.config.type.inputs[i]);
			child.parent = this;
			this.inputs[i] = child;
			
			child_pos += 15;
		}
		
		if(this.config.movable)
			el.drag(this.node_move, this.node_dragger, this.node_up);
			
		return el;
	},
	node_move: function(dx, dy) {
		var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
		this.attr(att);
		this.data.text.attr({x : att.x + 5, y : att.y + 10})
		var height = this.attr('height');
		var child_pos = this.data.edge_offset + 15;
		for(var i in this.data.outputs) {
			this.data.outputs[i].setPos(att.x, att.y + child_pos);
			child_pos += 15;
		}
		
		child_pos = this.data.edge_offset + 15;
		for(var i in this.data.inputs) {
			this.data.inputs[i].setPos(att.x + this.data.pos.width, att.y + child_pos);
			child_pos += 15;
		}
	},
	node_dragger: function() {
		this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
		this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
		this.animate({"fill-opacity": 1.0}, 500); 
	},
	node_up: function() {
		this.animate({"fill-opacity": .5}, 500);
	}
});