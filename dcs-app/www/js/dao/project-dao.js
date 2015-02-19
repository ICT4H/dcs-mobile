dcsApp.service('projectDao',['store', function(store){

	this.createProject = function(project) {
		console.log('in create project; project_type: ' + project.project_type +' parent_uuid: ' +project.parent_info.parent_uuid+ ' action_label: '+ project.parent_info.action_label +' parent_fields_code_label_str: '+ project.parent_info.parent_fields_code_label_str +' child_ids: '+ project.child_ids);

		return store.execute(
			'insert into projects (project_uuid, version, status, name, xform, headers, last_fetch, project_type, parent_uuid, action_label, parent_fields_code_label_str, child_ids) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
			[project.project_uuid, project.version, 'updated', project.name, project.xform, project.headers, Date.parse(project.created), project.project_type, project.parent_info.parent_uuid, project.parent_info.action_label, project.parent_info.parent_fields_code_label_str, project.child_ids]);
	};

	this.getProjectByUuids = function(projectUuids) {
		return store.execute('select * from projects where project_uuid IN(' +getParamHolders(projectUuids) +')',  projectUuids);
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
		return store.execute('delete FROM projects WHERE project_uuid IN(' + getParamHolders(projects) + ')', projects);
	};

	this.getProjectsList = function(offset, limit, searchStr) {
		var queries = [];
		var searchString = searchStr || '';
		queries.push({'statement': 'select count(*) as total from projects where name like "%' + searchString +'%"','isSingleRecord':true})
		queries.push({'statement': 'SELECT p.*, COUNT(s.project_uuid) AS unsubmitted_count FROM projects p LEFT JOIN (select project_uuid from submissions where status="modified") s ON p.project_uuid = s.project_uuid  where p.name like "%' + searchString +'%" GROUP BY p.project_uuid limit ? offset ?','values':[limit, offset], 'holder': 'projects'})
		return store.executeMultipleQueries(queries);
	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

}]);