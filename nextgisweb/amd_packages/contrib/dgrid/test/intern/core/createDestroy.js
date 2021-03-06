define([
	"intern!tdd",
	"intern/chai!assert",
	"dojo/_base/declare",
	"dojo/on",
	"dojo/store/Memory",
	"dgrid/List",
	"dgrid/OnDemandList",
	"dgrid/TouchScroll",
	"dijit/registry",
	"dijit/form/TextBox",
	"dgrid/test/data/base"
], function (test, assert, declare, on, Memory, List, OnDemandList, TouchScroll, registry, TextBox) {
	
	test.suite("createDestroy", function(){
		test.test("no params list", function(){
			var list = new List();
			document.body.appendChild(list.domNode);
			list.startup();
			list.renderArray([ "foo", "bar", "baz" ]);
			
			assert.strictEqual(list.contentNode.children.length, 3, 
				"List's contentNode has expected number of children after renderArray");
			
			list.destroy();
			assert.notStrictEqual(document.body, list.parentNode,
				"List is removed from body after destroy");
		});
		
		test.test("TouchScroll with useTouchScroll: false", function(){
			// Ensure TouchScroll is inherited for this test
			var list = new (declare([TouchScroll, List]))({ useTouchScroll: false });
			
			// This should not cause an error
			assert.doesNotThrow(function(){
				list.destroy();
			}, null, 'destroy should not throw error');
		});
		
		// Test for issue #1030
		test.test("OnDemandList#refresh should not throw error if domNode is nullified when destroyed", function(){
			var CustomList = declare(OnDemandList, {
				destroy: function () {
					this.inherited(arguments);
					// If dgrid is mixed in with dijit hierarchy, destroy() may unset domNode
					this.domNode = null;
				}
			});
			var dfd = this.async();
			
			var grid = new CustomList({
				store: new Memory({ data: [
					{ id: 1 },
					{ id: 2 },
					{ id: 3 }
				] })
			});
			document.body.appendChild(grid.domNode);
			grid.startup();
			
			assert.strictEqual(grid.contentNode.children.length, 5,
				"Grid's contentNode has expected number of children after renderArray");
			
			grid.destroy();
			
			assert.notStrictEqual(document.body, grid.parentNode, "Grid is removed from body after destroy");
			
			// Start watching for global error. There should be none.
			// (Can't use assert.doesNotThrow since this will be thrown asynchronously)
			var errorCatchingHandle = on(window, "error", function(error){
				dfd.reject(error);
			});
			
			// The error had been happening in a callback queued with setTimeout(0) in
			// refresh(). Here we queue another which will run after that one to close
			// out the test.
			setTimeout(dfd.callback(function(){
				errorCatchingHandle.remove();
			}), 0);
		});
	});
});