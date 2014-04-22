
var ProjectStore = (function(window){

	console.log('ProjectStore initilising');
	window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

	if ('webkitIndexedDB' in window) {
		window.IDBTransaction = window.webkitIDBTransaction;
		window.IDBKeyRange = window.webkitIDBKeyRange;
	}
	var PROJECT = 'PROJECT';
	var projectStore = {};
	projectStore.indexedDB = {};
	projectStore.indexedDB.db = null;

	projectStore.onerror = function(e) {
		console.log('Error: ' + e);
	}

	projectStore.init = function() {

		var promise = new Promise(function(resolve, reject){
			var version = 1;
			var request = indexedDB.open(PROJECT, version);

			request.onupgradeneeded = function(e) {
				var db = e.target.result;

				e.target.transaction.onerror = onerror;

				if (db.objectStoreNames.contains(PROJECT)) {
					db.deleteObjectStore(PROJECT);
					
				}
				db.createObjectStore(PROJECT, {
					keyPath: "timeStamp"
				});
			};

			request.onsuccess = function(e) {
				projectStore.indexedDB.db = e.target.result;
				//indexedDB.getAllTodoItems();
				resolve();
				console.log('Project db cerated');
			};

			request.onerror = function(e){
	            reject("Couldn't open DB");
	        };

		});
		return promise;
	}

	projectStore.create = function(data) {

		var promise = new Promise(function(resolve, reject){
			console.log('Creating new project')
			var db = projectStore.indexedDB.db;
			var trans = db.transaction([PROJECT], "readwrite");
			var store_local = trans.objectStore(PROJECT);
			
			var request = store_local.put(data);

			request.onsuccess = function(e) {
				console.log('project created');
				resolve();
			};

			request.onerror = function(e) {
				console.log("Error Adding project: ", e);
				reject("Couldn't create project");
			};
		});
		return promise;
	};

	projectStore.getById = function(id) {
		var promise = new Promise(function(resolve, reject) {
			var db = projectStore.indexedDB.db;
			var trans = db.transaction([PROJECT], "readwrite");
			var store = trans.objectStore(PROJECT);
			var cursorRequest = store.get(id);

			cursorRequest.onsuccess = function(e) {
				var result = e.target.result;
				resolve(result);
			};
			cursorRequest.onerror = function() {
				console.log("Error find by id: ", e);
				reject("Couldn't find project");
			};

		});

		return promise;
	}

	projectStore.list = function() {
		var promise = new Promise(function(resolve, reject) {
			console.log('Project listing');
			var projects = [];
			var db = projectStore.indexedDB.db;
			var trans = db.transaction([PROJECT], "readwrite");
			var store = trans.objectStore(PROJECT);

			// Get everything in the store;
			var keyRange = IDBKeyRange.lowerBound(0);
			var cursorRequest = store.openCursor(keyRange);

			cursorRequest.onsuccess = function(e) {
				var result = e.target.result;
				if ( !! result == false) {
					return;
					//resolve(projects);
				}
				projects.push(result.value);
				result.continue();
				
			};
			trans.oncomplete = function(e) {
			    // Execute the callback function.
			    resolve(projects);
		  	};	
			cursorRequest.onerror = function() {
				console.log("Error listing project: ", e);
				reject("Couldn't list project");
			};
		});
		return promise;
	};

	return projectStore;
})(window);




function insertDummySubmission() {
	var form_html = '<root xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa" xmlns:xf="http://www.w3.org/2002/xforms" xmlns:xsd="http://www.w3.org/2001/XMLSchema"> <model> <instance> <repeat_sample-119 id="repeat_sample-119"> <familyname/> <city/> <family template=""> <name/> <age/> </family> <meta> <instanceID/> </meta> <form_code> 119 </form_code> <eid> rep276 </eid> </repeat_sample-119> </instance> </model> <form autocomplete="off" class="or clearfix" id="repeat_sample-119" novalidate="novalidate"> <!--This form was created by transforming a OpenRosa-flavored (X)Form using an XSLT sheet created by Enketo LLC.--> <section class="form-logo"> </section> <h3 id="form-title"> repeat_sample-119 </h3> <label class="question non-select "> <span class="question-label active" lang=""> What is the family name? </span> <input autocomplete="off" data-type-xml="string" name="/repeat_sample-119/familyname" type="text"/> </label> <label class="question non-select "> <span class="question-label active" lang=""> City name? </span> <input autocomplete="off" data-type-xml="string" name="/repeat_sample-119/city" type="text"/> </label> <section class="or-group " name="/repeat_sample-119/family"> <h4> <span class="question-label active" lang=""> Family </span> </h4> <section class="or-repeat " name="/repeat_sample-119/family"> <label class="question non-select "> <span class="question-label active" lang=""> What is the member name? </span> <input autocomplete="off" data-type-xml="string" name="/repeat_sample-119/family/name" type="text"/> </label> <label class="question non-select "> <span class="question-label active" lang=""> Enter age </span> <input autocomplete="off" data-type-xml="int" name="/repeat_sample-119/family/age" type="number"/> </label> </section> <!--end of repeat fieldset with name /repeat_sample-119/family--> </section> <!--end of group --> <fieldset id="or-calculated-items" style="display:none;"> <label class="calculation non-select "> <input autocomplete="off" data-calculate="concat(\'uuid:\', uuid())" data-type-xml="string" name="/repeat_sample-119/meta/instanceID" type="hidden"/> </label> </fieldset> </form> </root>';
	var data = {
		"xml": '<repeat_sample-119 id="repeat_sample-119"> <familyname> Sharma </familyname> <city> Bangalore </city> <family> <name> Kamal </name> <age> 20 </age> </family> <family> <name> Ramesh </name> <age> 33 </age> </family> <meta> <instanceID> uuid:0ab0281e-3593-437b-b2c7-4e9a3a1181fc </instanceID> </meta> <form_code> 119 </form_code> <eid> rep276 </eid> </repeat_sample-119>',
		 "timeStamp": new Date().getTime(),
		 "form_html": form_html,
		 "id": "1"
	};

	ProjectStore.init().then(function(){
		ProjectStore.create(data).then(function(){
			ProjectStore.list().then(function(result){
				for (var i=0; i<result.length; i++) {
					console.log('list of submission:' + result[i].xml);
				}
			},function(err){
				console.log('Error: listing');
			});
		},function(err){
			console.log('Error: creating');
		});

	}, function(err){
		// store failed
		console.log('Error: init'+ err);
	});
}

function listAll() {
	ProjectStore.init().then(function(){
		ProjectStore.list().then(function(result){
			for (var i=0; i<result.length; i++) {
				console.log('list of submission:' + result[i].timeStamp + " : " + result[i].xml);
			}
		},function(err){
			console.log('Error: listing');
		});
	}, function(err){
		// store failed
		console.log('Error: init'+ err);
	});	
}


 insertDummySubmission();
 insertDummySubmission();
