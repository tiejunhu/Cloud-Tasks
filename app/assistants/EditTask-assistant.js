function EditTaskAssistant(config) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	Mojo.Log.info("EditTaskAssistant: Entering constructor");
	
	// this.config has properties
	//   - rtm
	//   - taskListModel
	//   - task
	//   - isNew (boolean)
	this.config = config;
}

EditTaskAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
	var task_name_attributes = {
		modelProperty: 'name',
		hintText: 'Enter task name',
		multiline: true,
		autoFocus: true,
		enterSubmits: true,
		requiresEnterKey: true
	};
	this.controller.setupWidget('TaskName', task_name_attributes, this.config.task);
	this.controller.listen('TaskName', Mojo.Event.propertyChange, this.handleTaskNameEvent.bind(this));
	
	var task_due_attributes = {
		modelProperty: 'due',
		hintText: 'Enter due time',
		multiline: false,
		autoFocus: false,
		enterSubmits: true,
		requiresEnterKey: true
	};
	this.controller.setupWidget('TaskDue', task_due_attributes, this.config.task);
	this.controller.listen('TaskDue', Mojo.Event.propertyChange, this.handleTaskDueEvent.bind(this));
	
	var delete_task_model = {
		buttonClass : 'negative',
		label: "Delete"
	};
	this.controller.setupWidget('DeleteTask', {}, delete_task_model);
	this.controller.listen('DeleteTask', Mojo.Event.tap, this.handleDeleteTaskEvent.bind(this));
	
	var complete_task_model = {
		buttonClass : 'affirmative',
		label: "Complete"
	};
	this.controller.setupWidget('CompleteTask', {}, complete_task_model);
	this.controller.listen('CompleteTask', Mojo.Event.tap, this.handleCompleteTaskEvent.bind(this));
	
	//Mojo.Event.back.stopPropagation();
}

EditTaskAssistant.prototype.handleTaskNameEvent = function(event) {
	Mojo.Log.info("EditTaskAssistant.handleTaskNameEvent: Entering");
	Mojo.Log.info("EditTaskAssistant.handleTaskNameEvent: Task name is '" + this.config.task.name + "'");
	this.config.task.setForPush('name', this.config.task.name);
}

EditTaskAssistant.prototype.handleTaskDueEvent = function(event) {
	Mojo.Log.info("EditTaskAssistant.handleTaskDueEvent: Entering");
	Mojo.Log.info("EditTaskAssistant.handleTaskDueEvent: Task due date is '" + this.config.task.due + "'");
	this.config.task.setForPush('due', this.config.task.due);
}

EditTaskAssistant.prototype.handleDeleteTaskEvent = function(event) {
	Mojo.Log.info("EditTaskAssistant.handleDeleteTaskEvent: Entering");
	this.controller.showAlertDialog({
		onChoose: this.handleDeleteTaskConfirmation.bind(this),
		title: "Are you sure?",
		choices: [
			{ label: "Delete", value: true, type: 'negative' },
			{ label: "Cancel", value: false, type: 'dismiss' }
		]
	});
}

EditTaskAssistant.prototype.handleDeleteTaskConfirmation = function(choice) {
	Mojo.Log.info("EditTaskAssistant.handleDeleteTaskConfirmation: Entering");
	if (choice == true) {
		Mojo.Log.info("EditTaskAssistant.handleDeleteTaskConfirmation: Confirmed deletion");
		this.config.task.setForPush('deleted', true);
		this.popScene();
	}
}

EditTaskAssistant.prototype.handleCompleteTaskEvent = function(event){
	Mojo.Log.info("EditTaskAssistant.handleCompleteTaskEvent: Entering");
	this.config.task.setForPush('completed', true);
	this.popScene();
}

EditTaskAssistant.prototype.handleCommand = function(event){
	Mojo.Log.info("EditTaskAssistant.handleCommand: Entering");
	if (event.type == Mojo.Event.back) {
		Mojo.Log.info("TaskListAssistant.handleCommand: Got back event");
		this.popScene();
	}
}

EditTaskAssistant.prototype.popScene = function() {
	Mojo.Log.info("EditTaskAssistant.popScene: Entering");
	Mojo.Controller.stageController.popScene({
		lastScene: 'EditTask',
		task: this.config.task,
		isNew: this.config.isNew
	});
}

EditTaskAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


EditTaskAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

EditTaskAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
