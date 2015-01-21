dcsApp.service('projectDao',['$q', 'store', function($q, store){

	this.createProject = function(project) {
		return store.execute(
			'INSERT INTO projects (project_uuid, version, status, name, xform, headers, last_fetch) VALUES (?,?,?,?,?,?,?)',
			[project.project_uuid, project.version, 'updated', project.name, project.xform, project.headers, project.created]);
	};

	this.getAll = function() {
		return store.execute('select project_uuid as id, version as rev from projects', []);
	};

	this.setprojectStatus = function(project_uuid, status) {
		return store.execute('update projects set status=? where project_uuid=?',[status, project_uuid])
	};

	this.updateProject = function(project_uuid, project) {
		var values = getProjectValues(project);
		values.push(project_uuid);
		return store.execute('UPDATE projects SET version=?, status=?, name=?, xform=?, headers=? where project_uuid=?', values);
	};

	this.getProjectsforUpdate = function(project_uuids) {
		return store.execute('select project_uuid as id, version as rev from projects where project_uuid IN(' + getParamHolders(project_uuids) +')', project_uuids)
	};

	this.deleteProject = function(projects) {
		return store.execute('DELETE FROM submissions where project_uuid IN(' + getParamHolders(projects) + ')', projects)
		.then(function(tx, resp){
			store.execute('DELETE FROM projects WHERE project_uuid IN(' + getParamHolders(projects) + ')', projects);
		});
	};

	this.getProjectsList = function(offset,limit) {
		var deferred = $q.defer();
		store.execute('select count(*) as total FROM projects', [], true).then(function(countResultset) {
			store.execute('SELECT * FROM projects limit ? offset ?', [limit, offset]).then(function(projectsResultset) {
				var result = {};
				result.total = countResultset.total;
				result.projects = projectsResultset;
				deferred.resolve(result);
			}, deferred.reject);
		}, deferred.reject);
		return deferred.promise;
	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

}]);	