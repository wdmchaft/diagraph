/**
 * application class, cares on initialization and maintenance
 * @namespace
 * @param {int} id
 */
vonline.Document = function(id) {
	this.id = id;
	// storage for undo-/redoable actions
	this.undoList = [];
	this.redoList = [];
	// observe if command was executed
	var that = this;
	vonline.events.bind('commandexec', function(event, command) {
		that.undoList.push(command);
		that.redoList = [];
		that.updateMenu();
	});
	
	// initialization of UI
	this.sidebar = new vonline.Sidebar('#sidebar');
	
	// init top menu
	this.sidebar.setTopMenu(this.initTopMenu());
	this.updateMenu();

	// init bottom menu
	this.sidebar.setBottomMenu(this.initBottomMenu());
	
	this.loadCategories();
	
	this.canvas = new vonline.Canvas();
	
	vonline.events.bind('drop', function(event, data) {
		var command = new vonline.CreateCommand(that.canvas, data);
		command.execute();
		vonline.events.trigger('commandexec', command);
	});
	
	// example
	this.canvas.load([
	                  {type:'rectangle', id:1, x: 100, y:50, text: 'rectangle'},
	                  {type:'rectangle', id:2, x: 200, y:100},
	                  ]);
}

/**
 * initializes the top-menu
 * @return vonline.Menu
 */
vonline.Document.prototype.initTopMenu = function() {
	var that = this,  // reference to current context (need to get the correct scope in click-hanlder functions)
		topmenu = new vonline.Menu();
	topmenu.addItem(new vonline.MenuItem('open an other document', 'images/menu/open_document_view', function() {
		that.openDocumentView();
	}));
	this.undoItem = new vonline.MenuItem('undo last action', 'images/menu/undo', function() {
		that.undoCommand();
	});
	topmenu.addItem(this.undoItem);
	this.redoItem = new vonline.MenuItem('redo previous action', 'images/menu/redo', function() {
		that.redoCommand();
	});
	topmenu.addItem(this.redoItem);
	topmenu.addItem(new vonline.MenuItem('save a snapshot of the current document', 'images/menu/save', function() {
		that.saveSnapshot();
	}));
	topmenu.addItem(new vonline.MenuItem('view the history of the current document', 'images/menu/open_history', function() {
		// TODO: init history view
		that.loadSnapshot(1); // for the moment: just load a snapshot
	}));
	return topmenu;
}

/**
 * initializes the bottom-menu
 * @return vonline.Menu
 */
vonline.Document.prototype.initBottomMenu = function() {
	var bottommenu = new vonline.Menu();
	bottommenu.addItem(new vonline.MenuItem('edit categories', 'images/menu/open_category_edit_view', function() {
		// TODO: init category edit view
	}));
	bottommenu.addItem(new vonline.MenuItem('zoom in', 'images/menu/zoom_in', function() {
		// TODO: canvas viewport manipulation
	}));
	bottommenu.addItem(new vonline.MenuItem('zoom out', 'images/menu/zoom_out', function() {
		// TODO: canvas viewport manipulation
	}));
	bottommenu.addItem(new vonline.MenuItem('zoom fit best', 'images/menu/zoom_fit_best', function() {
		// TODO: canvas viewport manipulation
	}));
	return bottommenu;
}

/**
 * disable undo/redo-button if there is nothing to undo/redo
 */
vonline.Document.prototype.updateMenu = function() {
	if (this.undoList.length == 0) {
		this.undoItem.disable();
	}
	else {
		this.undoItem.enable();
	}
	if (this.redoList.length == 0) {
		this.redoItem.disable();
	}
	else {
		this.redoItem.enable();
	}
	vonline.events.trigger('canvaschanged');
}

/**
 * redirect browser to document list
 */
vonline.Document.prototype.openDocumentView = function() {
	// TODO
	console.log(this);
}

/**
 * undo action (if possible)
 */
vonline.Document.prototype.undoCommand = function() {
	if (this.undoList.length > 0) {
		var command = this.undoList.pop();
		command.undo();
		this.redoList.push(command);
		this.updateMenu();
	}
}

/**
 * redo action (if possible)
 */
vonline.Document.prototype.redoCommand = function() {
	if (this.redoList.length > 0) {
		var command = this.redoList.pop();
		command.execute();
		this.undoList.push(command);
		this.updateMenu();
	}
}

/**
 * loads specific snapshot and display the corresponding document
 */
vonline.Document.prototype.loadSnapshot = function(id) {
	var that = this;
	$.ajax({
		data: {task: 'loadSnapshot', snapshotID: id},
		dataType: 'json',
		success: function(json) {
			// load objects
			that.canvas.load(json.objects);
		}
	});
}

/**
 * save a snapshot of the current document / send document data to server
 */
vonline.Document.prototype.saveSnapshot = function() {
	var that = this;
	
	var documentData = '{ ';
	//documentData += '\"objects\": ' + this.canvas.exportJSON(); // TODO: make this work
	documentData += '\"objects\": ' + JSON.stringify(this.canvas.objects);
	// TODO: add other stuff that needs to be saved
	documentData += ' }';
	
	$.ajax({
		data: {task: 'saveSnapshot', documentData: documentData},
		dataType: 'text',
		success: function(data) {
			//
			if(data == '1') {
				var currentTime = new Date();
				var month = currentTime.getMonth()+1;
				var day = currentTime.getDate();
				var hours = currentTime.getHours();
				var mins = currentTime.getMinutes();
				var secs = currentTime.getSeconds();
				if(month < 10) month = '0'+month;
				if(day < 10) day = '0'+day;
				if(hours < 10) hours = '0'+hours;
				if(mins < 10) mins = '0'+mins;
				if(secs < 10) secs = '0'+secs;
				
				var status = 'Snapshot saved ' + currentTime.getFullYear() + '/' + month + '/' + day + ' ' + hours + ':' + mins + ':' + secs;
				window.status = status; // TODO: also output this somewhere else
			}
			else window.status = 'Saving Snapshot failed!';
		}
	});
}

/**
 * load the categories for the document
 * @deprecated should be placed in another class
 */
vonline.Document.prototype.loadCategories = function() {
	var that = this;
	$.ajax({
		data: {task: 'getCategories', documentID: this.id},
		dataType: 'json',
		success: function(json) {
			for (var name in json) {
				if (json[name].show) {
					var category = new vonline.Category(name, json[name].id)
					that.sidebar.addCategory(category);
					for (var item in json[name].elements) {
						category.add(new vonline.CategoryItem(item, json[name].elements[item]));
					}
				}
			}
		}
	});
}