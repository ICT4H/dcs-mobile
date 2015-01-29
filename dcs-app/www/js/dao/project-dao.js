dcsApp.service('projectDao',['store', function(store){

	this.createProject = function(project) {
		console.log('in create project; project_type: ' + project.project_type +' action_label: '+ project.parent_info.action_label +' parent_fields_code_label_str: '+ project.parent_info.parent_fields_code_label_str +' child_ids: '+ project.child_ids);

		return store.execute(
			'insert into projects (project_uuid, version, status, name, xform, headers, last_fetch, project_type, action_label, parent_fields_code_label_str, child_ids) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
			[project.project_uuid, project.version, 'updated', project.name, project.xform, project.headers, project.created, project.project_type, project.parent_info.action_label, project.parent_info.parent_fields_code_label_str, project.child_ids]);
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
		return store.execute('update projects SET version=?, status=?, name=?, xform=?, headers=? where project_uuid=?', values);
	};

	this.getProjectsforUpdate = function(project_uuids) {
		return store.execute('select project_uuid as id, version as rev from projects where project_uuid IN(' + getParamHolders(project_uuids) +')', project_uuids)
	};

	this.deleteProject = function(projects) {
		var queries = [];
		queries.push({'statement': 'delete FROM submissions where project_uuid IN(' + getParamHolders(projects) + ')', 'values': projects});
		queries.push({'statement': 'delete FROM projects WHERE project_uuid IN(' + getParamHolders(projects) + ')', 'values': projects});

		return store.executeMultipleQueries(queries);
	};

	this.getProjectsList = function(offset, limit, searchStr) {
		var queries = [];
		var searchString = searchStr || '';
		queries.push({'statement': 'select count(*) as total FROM projects where name like "%' + searchString +'%"','isSingleRecord':true})
		queries.push({'statement': 'select * FROM projects where name like "%' + searchString +'%" limit ? offset ?','values':[limit, offset], 'holder': 'projects'})

		return store.executeMultipleQueries(queries);
	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

}]);	