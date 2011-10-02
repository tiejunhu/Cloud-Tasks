// Copyright (C) Nik Silver 2010.
// See licence.txt for terms and conditions not explicitly stated elsewhere.

/**
 * Class which allows the various dependent events to be retried.
 * The events are run in the following independent sequences...
 * 
 * - Connection manager
 *   - Only do this if connection manager not yet defined
 *   - Set up connection manager
 *   
 * - Push changes
 *   - Have an internet connection
 *   - Make sure no on-going network requests for pushing changes
 *   - Be authorised to access the user's Remember The Milk data.
 *   - Have a timeline
 *   - Push local changes
 * 
 * - Pull tasks
 *   - Have an internet connection
 *   - Make sure no on-going network requests for pulling tasks
 *   - Be authorised to access the user's Remember The Milk data.
 *   - Pull tasks and record the latest modified time
 */

/**
 * Create a new retrier.
 * @param {RTM} rtm  The RTM client.
 */
function Retrier(rtm) {
	this.rtm = rtm;
	this.resetPullEventSpacer();
	this.resetPullListsEventSpacer();
	rtm.addOnNetworkRequestsChangeListener(this.onNetworkRequestsChange.bind(this));
}

Retrier.prototype.resetPullEventSpacer = function() {
	this.pullEventSpacer = new EventSpacer(60*60*1000); // Pull no more than every 60 mins
}

/**
 * The constructor function used to create a service request.
 * By default Mojo.Service.Request, but override for testing if needed.
 */
Retrier.prototype.serviceRequestConstructor = Mojo.Service.Request;

/**
 * Set this so that the Retrier has tasks to push
 * and knows what to merge with pulled tasks.
 */
Retrier.prototype.taskListModel = undefined;

/**
 * Override this to respond whenever taskListModel changes.
 */
Retrier.prototype.onTaskListModelChange = function() {};

/**
 * Fire the next event where possible.
 * Won't do anything if there is ongoing network activity.
 */
Retrier.prototype.fire = function() {
	Mojo.Log.info("Retrier.fire: Entering");
	
	this.fireSetUpConnectionManagerSequence();
	this.firePushChangesSequence();
	this.firePullTasksSequence();
	this.firePullListsSequence();
}

/**
 * Do necessary work to set up connection manager.
 * Won't do anything if connection manager already set up.
 */
Retrier.prototype.fireSetUpConnectionManagerSequence = function() {
	if (this.rtm.connectionManager) {
		return;
	}
	Mojo.Log.info("Retrier.fire: Setting up connection manager");
	this.rtm.setUpConnectionManager(this.serviceRequestConstructor);
}

Retrier.prototype.firePushChangesSequence = function() {
	if (!this.rtm.haveNetworkConnectivity) {
		// Can't do anything about this, just have to wait for a connection
		Mojo.Log.info("Retrier.fire: Need an internet connection, but can't take action");
	}
	else if (this.rtm.networkRequestsForPushingChanges() > 0) {
		Mojo.Log.info("Retrier.fire: Network requests for pushing changes ongoing, so won't take action");
		return;
	}
	else if (!this.rtm.getToken()) {
		Mojo.Log.info("Retrier.fire: No auth token, can't go further");
	}
	else if (!this.rtm.timeline) {
		Mojo.Log.info("Retrier.fire: Getting timeline");
		this.rtm.createTimeline();
	}
	else if (this.taskListModel) {
		Mojo.Log.info("Retrier.fire: Can push local changes");
		this.rtm.pushLocalChanges(this.taskListModel);
	}
	else {
		Mojo.Log.info("Retrier.fire: No actions to take");
	}
}

Retrier.prototype.firePullTasksSequence = function() {
	if (!this.pullEventSpacer.isReady()) {
		Mojo.Log.info("Retrier.firePullTasksSequence: Too soon after last pull to pull tasks again");
		return;
	}
	else if (!this.rtm.haveNetworkConnectivity) {
		// Can't do anything about this, just have to wait for a connection
		Mojo.Log.info("Retrier.firePullTasksSequence: Need an internet connection, but can't take action");
	}
	else if (this.rtm.networkRequestsForPullingTasks() > 0) {
		Mojo.Log.info("Retrier.firePullTasksSequence: Network requests for pulling tasks ongoing, so won't take action");
		return;
	}
	else if (!this.rtm.getToken()) {
		Mojo.Log.info("Retrier.firePullTasksSequence: No auth token, can't go further");
	}
	else {
		this.pullTasks();
	}
}

Retrier.prototype.pullTasks = function() {
	Mojo.Log.info("Retrier.pullTasks: Pulling tasks");
	var inst = this;
	this.rtm.callMethod('rtm.tasks.getList',
		this.getListParameters(),
		this.getListOnSuccessCallback.bind(this),
		function(err_msg) {
			Mojo.Log.info("Retrier.pullTasks: Error: " + err_msg);
			ErrorHandler.notify(err_msg + "\nLast Ajax response: " + Object.toJSON(inst.rtm.lastAjaxResponse),
					"Retrier.pullTasks");
		}
	);
}

Retrier.prototype.getListOnSuccessCallback = function(response) {
	Mojo.Log.info("Retrier.getListOnSuccessCallback: Response is good");
	// RTM.logResponse(response);
	var json = response.responseJSON;
	var task_list = TaskListModel.objectToTaskList(json);
	Utils.splitAndDefer(task_list, 10,
		this.taskListModel.mergeTaskList.bind(this.taskListModel),
		this.afterGetListSuccessAndMerge.bind(this));
}

Retrier.prototype.afterGetListSuccessAndMerge = function() {
	Mojo.Log.info("Retrier.afterGetListSuccessAndMerge: Entering");
	this.taskListModel.purgeTaskList();
	this.taskListModel.sort();
	this.rtm.setLatestModified(this.taskListModel.getLatestModified());
	this.pullEventSpacer.haveFired();
	this.onTaskListModelChange();
}

Retrier.prototype.getListParameters = function() {
	var params;
	if (this.rtm.getLatestModified()) {
		params = { last_sync: this.rtm.getLatestModified() };
	}
	else {
		params = { filter: 'status:incomplete' };
	}
	return params;
}

Retrier.prototype.onNetworkRequestsChange = function(old_values, new_values) {
	Mojo.Log.info("Retrier.onNetworkRequestsChange: Entering");
	if (this.taskListModel
			&& new_values.forPushingChanges == 0
			&& old_values.forPushingChanges > 0) {
		this.taskListModel.purgeTaskList();
	}
}

/*
 * methods regard Lists
 */

Retrier.prototype.listListModel = undefined;

Retrier.prototype.resetPullListsEventSpacer = function() {
	this.pullListsEventSpacer = new EventSpacer(60*60*1000); // Pull no more than every 60 mins
}

Retrier.prototype.firePullListsSequence = function() {
	if (!this.pullListsEventSpacer.isReady()) {
		Mojo.Log.info("Retrier.firePullListsSequence: Too soon after last pull to pull tasks again");
		return;
	}
	else if (!this.rtm.haveNetworkConnectivity) {
		// Can't do anything about this, just have to wait for a connection
		Mojo.Log.info("Retrier.firePullListsSequence: Need an internet connection, but can't take action");
	}
	else if (this.rtm.networkRequestsForPullingLists() > 0) {
		Mojo.Log.info("Retrier.firePullListsSequence: Network requests for pulling lists ongoing, so won't take action");
		return;
	}
	else if (!this.rtm.getToken()) {
		Mojo.Log.info("Retrier.firePullListsSequence: No auth token, can't go further");
	}
	else {
		this.pullLists();
	}	
}

Retrier.prototype.pullLists = function() {
	Mojo.Log.info("Retrier.pullLists: Pulling lists");
	var inst = this;
	this.rtm.callMethod('rtm.lists.getList',
		{},
		this.getListsListOnSuccessCallback.bind(this),
		function(err_msg) {
			Mojo.Log.info("Retrier.pullLists: Error: " + err_msg);
			ErrorHandler.notify(err_msg + "\nLast Ajax response: " + Object.toJSON(inst.rtm.lastAjaxResponse),
					"Retrier.pullLists");
		}
	);
}

Retrier.prototype.getListsListOnSuccessCallback = function(response) {
	Mojo.Log.info("Retrier.getListsListOnSuccessCallback: Response is good");
	var json = response.responseJSON;
	var list_list = ListListModel.objectToListList(json);
//	this.listListModel.setListList(list_list);
	this.listListModel.replaceListList(list_list);
	this.onTaskListModelChange();
}
