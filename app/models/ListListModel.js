function ListListModel() {
	this._list_list = [];
}

ListListModel.objectToListList = function(data_obj) {
	Mojo.Log.info("ListListModel.objectToListList: Entering");
	var list_list = [];
	var lists_obj = data_obj.rsp.lists;
	var list_array = TaskListModel.makeArray(lists_obj.list);
	list_array.each(function(list_obj) {
		var list_id = list_obj.id;
		var list_name = list_obj.name;
		var list_deleted = list_obj.deleted == '1';
		var list_locked = list_obj.locked == '1';
		var list_archived = list_obj.archived == '1';
		var list_position = list_obj.position;
		var list_smart = list_obj.smart == '1';
		var list_filter = list_smart ? list_obj.filter : '';
		var list = new ListModel({
			listID: list_id,
			name: list_name,
			deleted: list_deleted,
			locked: list_locked,
			archived: list_archived,
			position: list_position,
			smart: list_smart,
			filter: list_filter
		});
		list_list.push(list);
	});
	
	Mojo.Log.info("ListListModel.objectToListList: Exiting");
	return list_list;
}

ListListModel.prototype.setListList = function(list_list) {
	list_list.each(function(list) {
		if (!(list instanceof ListModel)) {
			throw new Error("ListListModel.setListList needs an array of ListModel objects");
		}
	});
	this._list_list = list_list;
}

ListListModel.prototype.getListList = function() {
	return this._list_list;
}

ListListModel.prototype.getRegularListList = function() {
	var list_list = []
	this._list_list.each(function(list) {
		if (!list.smart) {
			list_list.push(list);
		}
	});
	return list_list;
}

ListListModel.prototype.getListNameByListID = function(listID) {
	for (var i = 0; i < this._list_list.length; i++) {
		var list = this._list_list[i];
		if (list.listID == listID) {
			return list.name;
		}
	}
	return 'All Tasks';
}

ListListModel.prototype.loadListList = function() {
	Mojo.Log.info("ListListModel.loadListList: Entering");
	
	Store.loadAllLists(function(lists) {
		Mojo.Log.info("ListListModel.loadListList: In success callback");
		this._list_list = lists;
	}.bind(this));
}

ListListModel.prototype.replaceListList = function(lists) {
	Mojo.Log.info("ListListModel.replaceListList: Entering");
	
	Store.replaceAllLists(lists, function() {
		Mojo.Log.info("ListListModel.replaceListList: In success callback");
		this._list_list = lists;
	}.bind(this));
}
