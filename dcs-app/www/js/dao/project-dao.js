dcsApp.service('projectDao',['store', function(store){

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

	this.deleteProject = function(project_uuid) {
		return store.execute('DELETE FROM submissions where project_uuid=?', [project_uuid])
		.then(function(tx, resp){
			store.execute('DELETE FROM projects WHERE project_uuid = ? ', [project_uuid]);
		});
	};

	this.getCountOfProjects = function() {
		return store.execute('select count(*) as total FROM projects',[], true);
	};

	this.getProjects = function(offset,limit) {
		return store.execute('SELECT * FROM projects limit ? offset ?', [limit,offset]);
	};

	this.getProjectById = function(project_uuid) {
		return store.execute('SELECT * FROM projects where project_uuid = ? ', [project_uuid], true);
	};

	this.getSubmissionHeaders = function(project_uuid) {
        return store.execute('SELECT local_headers as headers from projects WHERE project_uuid = ?',[project_uuid], true);
    };

   	this.setSubmissionHeaders = function(project_uuid, headers) {
	    return store.execute('UPDATE projects SET local_headers = ? WHERE project_uuid = ?',[JSON.stringify(headers), project_uuid]);
   	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

}]);	