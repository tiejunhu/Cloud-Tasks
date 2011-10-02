function ListModel(properties) {
	if (properties) {
		this.listID = properties.listID;
		this.name = properties.name;
		this.deleted = properties.deleted || false;
		this.locked = properties.locked || false;
		this.archived = properties.archived || false;
		this.position = properties.position;
		this.smart = properties.smart || false;
		this.filter = properties.filter;
	}
}

ListModel.prototype.toString = function() {
	return "ListModel{listID: " + this.listID + ", "
		+ "name: " + this.name + ", "
		+ "deleted: " + this.deleted + ", "
		+ "locked: " + this.locked + ", "
		+ "archived: " + this.archived + ", "
		+ "position: " + this.position + ", "
		+ "smart: " + this.smart + ", "
		+ "filter: " + this.filter + "}";
}

ListModel.prototype.toObject = function() {
	return {
		listID: this.listID,
		name: this.name,
		deleted: this.deleted,
		locked: this.locked,
		archived: this.archived,
		position: this.position,
		smart: this.smart,
		filter: this.filter
	}
}

ListModel.createFromObject = function(obj) {
	var list = new ListModel(obj);
	return list;
}
