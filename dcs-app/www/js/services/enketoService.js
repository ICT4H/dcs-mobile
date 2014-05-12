define(['idbstore'], function(IDBStore){
	var enketoService = {};

	var db = null;
	
	enketoService.init = function(){
		var promise = new Promise(function(resolve, reject){
			db = new IDBStore({
				  dbVersion: 6,
				  storeName: 'DCS',
				  autoIncrement: true,
				  onError: function(error){
				  	reject();
				  },
				  onStoreReady: function(){
				    resolve();
				  },
				  indexes: [{ name: 'document_type' },{name:'form_code'}]
			});
		});
		return promise;
	};
	
	enketoService.put = function(item){
		var promise = new Promise(function(resolve, reject){
			db.put(item,function(id){
				resolve(id);
			},function(error){
				reject(error);
			});
		});
		return promise;
	};

	enketoService.get = function(itemId){
		var promise = new Promise(function(resolve, reject){
				var temp;
				var keyRange = db.makeKeyRange({
					lower: itemId,
 					upper: itemId
				});
				
				var onItem = function(item){
					temp = item;
				};
				
				var onEnd = function(){
				    resolve(temp);
				};

				var onError = function(error){
					reject(error);
				};

				db.iterate(onItem, {
					keyRange: keyRange,
					filterDuplicates: false,
					onEnd: onEnd,
					onError:onError
				});
			});
		return promise;
	};

	enketoService.getAll = function(){
		var promise = new Promise(function(resolve, reject){
			db.getAll(function(items){
				resolve(items);
			},function(error){
				reject(error);
			});
		});
		return promise;
	};

	enketoService.remove = function(itemId){
		var promise = new Promise(function(resolve, reject){
			db.remove(itemId, function(){
				resolve();
			}, function(error){
				reject(error);
			});
		});
		return promise;
	};
	return enketoService;
});