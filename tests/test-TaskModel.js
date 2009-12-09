/**
 * Test the task model
 */

testCases.push( function(Y) {

	return new Y.Test.Case({

		testConstructorPickedUp: function() {
			var task = new TaskModel();
			Y.Assert.isNotUndefined(task, 'TaskModel constructor failed');
		},
		
		testConstructorProperties: function() {
			var task = new TaskModel({
				listID: '123456',
				taskseriesID:'223344',
				taskID: '667788',
				name: 'My test task',
				due: '2008-07-13T00:00:00Z'
			});
			
			Y.Assert.areEqual('123456', task.listID, "List ID doesn't get set");
			Y.Assert.areEqual('223344', task.taskseriesID, "Task series ID doesn't get set");
			Y.Assert.areEqual('667788', task.taskID, "Task ID doesn't get set");
			Y.Assert.areEqual('My test task', task.name, "Task name doesn't get set");
			Y.Assert.areEqual('2008-07-13T00:00:00Z', task.due, "Task due date doesn't get set");
		},
		
		testIsDue: function() {
			var task;
			var today = Date.parse('2009-12-01T00:00:00Z');
			
			// A task from yesterday is due
			task = new TaskModel({ due: '2009-11-30T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isDueFlag, 'A task from yesterday should be due');
			
			// A task for today is due
			task = new TaskModel({ due: '2009-12-01T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isDueFlag, 'A task for today should be due');
			
			// A task for tomorrow is not due
			task = new TaskModel({ due: '2009-12-02T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isDueFlag, 'A task for tomorrow should not be due');
			
			// A task with no due date set is due
			task = new TaskModel();
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isDueFlag, 'A task with no due date should be due');
			
			// A task with empty due date set is due
			task = new TaskModel({ due: '' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isDueFlag, 'A task with empty due date should be due');
			
			// A task with empty object due date set is due
			task = new TaskModel({ due: {} });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isDueFlag, 'A task with empty object due date should be due');
		},

		testIsOverdue: function() {
			var task;
			var today = Date.parse('2009-12-01T00:00:00Z');
			
			// A task from yesterday is overdue
			task = new TaskModel({ due: '2009-11-30T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(true, task.isOverdueFlag, 'A task from yesterday should be overdue');
			
			// A task for today is not overdue
			task = new TaskModel({ due: '2009-12-01T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isOverdueFlag, 'A task for today should not be due');
			
			// A task for tomorrow is not overdue
			task = new TaskModel({ due: '2009-12-02T00:00:00Z' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isOverdueFlag, 'A task for tomorrow should not be overdue');
			
			// A task with no due date set is not overdue
			task = new TaskModel();
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isOverdueFlag, 'A task with no due date should not be overdue');

			// A task with empty due date set is not overdue
			task = new TaskModel({ due: '' });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isOverdueFlag, 'A task with empty due date should not be overdue');
			
			// A task with empty object due date set is not overdue
			task = new TaskModel({ due: {} });
			task.today = function() { return today };
			task.update();
			Y.Assert.areEqual(false, task.isOverdueFlag, 'A task with empty object due date should not be overdue');

		},
		
		testSortByDueThenName: function(){
			var nov30 = new TaskModel({ due: '2009-11-30T00:00:00Z', name: 'B' });
			var nov30_2 = new TaskModel({ due: '2009-11-30T00:00:00Z', name: 'A' });
			var nov30_3 = new TaskModel({ due: '2009-11-30T00:00:00Z', name: 'C' });
			var nov30_3_again = new TaskModel({ due: '2009-11-30T00:00:00Z', name: 'C' });
			var dec1 = new TaskModel({ due: '2009-12-01T00:00:00Z' });
			
			Y.Assert.areEqual(-1, TaskModel.sortByDueThenName(nov30, dec1), 'Nov 30 should be before Dec 1');
			Y.Assert.areEqual(1, TaskModel.sortByDueThenName(dec1, nov30), 'Dec 1 should be before Nov 30');
			Y.Assert.areEqual(-1, TaskModel.sortByDueThenName(nov30_2, nov30), 'Nov 30 A should be before Nov 30 B');
			Y.Assert.areEqual(-1, TaskModel.sortByDueThenName(nov30_2, nov30_3), 'Nov 30 A should be before Nov 30 C');
			Y.Assert.areEqual(1, TaskModel.sortByDueThenName(nov30_3, nov30_2), 'Nov 30 C should be after Nov 30 A');
			Y.Assert.areEqual(0, TaskModel.sortByDueThenName(nov30_3, nov30_3_again), 'Nov 30 C should be same as Nov 30 C');
		},
		
		testSetForPushShouldFlagLocalChanges: function() {
			var task = new TaskModel({
				listID: '123456',
				taskseriesID:'223344',
				taskID: '667788',
				name: 'My test task',
				due: '2008-07-13T00:00:00Z'
			});
			
			Y.Assert.areEqual(0, task.localChanges.length, "There should be no local changes initially");
			
			task.setForPush('name', 'My changed test task');			
			Y.Assert.areEqual(1, task.localChanges.length, "Only name should have changed (1)");
			Y.Assert.areEqual('name', task.localChanges[0], "Only name should have changed (2)");
			
			// Changing the name again should result in the name flagged only once, still

			task.setForPush('name', 'My changed test task 2');
			Y.Assert.areEqual(1, task.localChanges.length, "Only name should have changed again (1)");
			Y.Assert.areEqual('name', task.localChanges[0], "Only name should have changed again (2)");
		},
		
		testMarkNotForPush: function() {
			var task = new TaskModel({
				listID: '123456',
				taskseriesID:'223344',
				taskID: '667788',
				name: 'My test task',
				due: '2008-07-13T00:00:00Z'
			});
			task.setForPush('name', 'My changed test task');			
			task.setForPush('due', '2009-12-01T00:00:00Z');
			task.setForPush('name', 'My second changed test task');
			
			Y.assert(task.localChanges.indexOf('name') >= 0, "Name not set for push");
			Y.assert(task.localChanges.indexOf('due') >= 0, "Due date not set for push");			
			
			task.markNotForPush('name');
			Y.Assert.areEqual(-1, task.localChanges.indexOf('name'), "Name is still set for push");
			
			task.markNotForPush('mistakenproperty');
			Y.Assert.areEqual(1, task.localChanges.length, "Problem marking non-existent property");
			
			task.markNotForPush('due');
			Y.Assert.areEqual(-1, task.localChanges.indexOf('due'), "Due date is still set for push");
		}

	});

} );