var dbService = {};
var db;
db = new IDBStore({
	  dbVersion: 6,
	  storeName: 'DCS',
	  autoIncrement: true,
	  onError: function(error){
	  	console.log(error);
	  },
	  onStoreReady: function(){
	    console.log('db ready!!!');
	  },
	  indexes: [{ name: 'document_type' },{name:'form_code'}]
});

dbService.put = function(item){
	var promise = new Promise(function(resolve, reject){
		db.put(item,function(id){
			resolve(id);
		},function(error){
			reject(error);
		});
	});
	return promise;
};

dbService.getByDoucmentType = function(documentType){
	var promise = new Promise(function(resolve, reject){
		var items = [];
		var keyRange = db.makeKeyRange({
			lower: documentType,
				upper: documentType
		});
		
		var onItem = function(item){
			items.push(item);
		};
		
		var onEnd = function(){
		    resolve(items);
		};

		var onError = function(error){
			reject(error);
		};

		db.iterate(onItem, {
			index: 'document_type',
			keyRange: keyRange,
			filterDuplicates: false,
			onEnd: onEnd,
			onError:onError
		});
	});
	return promise;
};

dbService.getBySurveyId = function(id){
	var promise = new Promise(function(resolve, reject){
		var items = [];
		var keyRange = db.makeKeyRange({
			lower: id,
				upper: id
		});
		
		var onItem = function(item){
			items.push(item);
		};
		
		var onEnd = function(){
		    resolve(items);
		};

		var onError = function(error){
			reject(error);
		};

		db.iterate(onItem, {
			index: 'form_code',
			keyRange: keyRange,
			filterDuplicates: false,
			onEnd: onEnd,
			onError:onError
		});
	});	
	return promise;
};

dbService.get = function(itemId){
	var promise = new Promise(function(resolve, reject){
		db.get(itemId, function(item){
			resolve(item);
		},function(error){
			reject(error);
		});
	});
	return promise;
};

dbService.getAll = function(){
	var promise = new Promise(function(resolve, reject){
		db.getAll(function(items){
			resolve(items);
		},function(error){
			reject(error);
		});
	});
	return promise;
};

dbService.remove = function(itemId){
	var promise = new Promise(function(resolve, reject){
		db.remove(itemId, function(){
			resolve(itemId);
		}, function(error){
			reject(error);
		});
	});
	return promise;
};
