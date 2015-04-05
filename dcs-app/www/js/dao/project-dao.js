dcsApp.service('projectDao',['store', function(store){

	this.createProject = function(project) {
		console.log('in create project; last_fetch'+ Date.parse(project.created) +'project_type: ' + project.project_type +' parent_uuid: ' +project.parent_info.parent_uuid+ ' action_label: '+ project.parent_info.action_label +' parent_fields_code_label_str: '+ project.parent_info.parent_fields_code_label_str +' child_ids: '+ project.child_ids);

		return store.execute(
			'insert into projects (project_uuid, version, created, status, name, xform, headers, last_fetch, project_type, parent_uuid, action_label, parent_fields_code_label_str, child_ids, has_media_field, last_updated, is_assigned, displayable_mobile_fields) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
			[project.project_uuid, project.version, project.created,'updated', project.name, project.xform, project.headers, Date.parse(project.created), project.project_type, project.parent_info.parent_uuid, project.parent_info.action_label, project.parent_info.parent_fields_code_label_str, project.child_ids, project.has_media_field, project.last_updated, project.is_assigned, JSON.stringify(project.displayable_mobile_fields)]);
	};

	this.getProjectByUuids = function(projectUuids) {
		return store.execute('select * from projects where project_uuid IN(' +getParamHolders(projectUuids) +')',  projectUuids);
	};

	this.getUnassigedUuidsByChildUuids = function(childUuids) {
		return store.execute('select project_uuid from projects where is_assigned=\'false\' and child_ids IN(' +getParamHolders(childUuids) +')',  childUuids);
	};

	this.getAll = function() {
		return store.execute('select project_uuid, version, project_type from projects', []);
	};

	this.setProjectStatus = function(project_uuid, status) {
		return store.execute('update projects set status=? where project_uuid=?',[status, project_uuid]);
	};

	this.setLastUpdatedOfProjectUuids = function(projectUuids, lastUpdated) {
		return store.execute('update projects set last_updated=? where project_uuid IN('+getParamHolders(projectUuids)+ ')', [lastUpdated].concat(projectUuids));
	};

	//TODO remove the as no more used
	this.updateProject = function(project_uuid, project) {
		var values = getProjectValues(project);
		values.push(project_uuid);
		return store.execute('update projects SET version=?, status=?, name=?, xform=?, headers=? where project_uuid=?', values);
	};

	this.updateAssignedAndUnassigned = function(assignedUuids, unassignedUuids) {
		var queries = [];
		queries.push({'statement': 'update projects SET is_assigned=\'true\' where project_uuid IN(' +
			getParamHolders(assignedUuids) + ')', 'values': assignedUuids, 'holder': 'assign'});
		queries.push({'statement': 'update projects SET is_assigned=\'false\' where project_uuid IN(' +
			getParamHolders(unassignedUuids) + ')', 'values': unassignedUuids});

		return store.executeMultipleQueries(queries);
	}

	this.getProjectToRefresh = function(projectUuid) {
		return store.execute('select project_uuid, version, project_type from projects where project_uuid=?', [projectUuid])
	};

	this.deleteProjects = function(projectUuids) {
		return store.execute('delete FROM projects where project_uuid IN(' + getParamHolders(projectUuids) + ')', projectUuids);
	};

	this.deleteSub = function(projectUuids) {
		return store.execute('delete FROM submissions where project_uuid IN(' + getParamHolders(projectUuids) + ')', projectUuids);
	}

	this.getProjectsList = function(offset, limit) {
		var queries = [];
		queries.push({'statement': 'SELECT COUNT(*) AS total FROM projects','isSingleRecord':true})
		queries.push({'statement': 'SELECT p.*, IFNULL(local_count,0) as local_count, IFNULL(unsubmitted_count,0) as unsubmitted_count FROM projects p LEFT JOIN '+
									'(select project_uuid, COUNT(project_uuid) AS local_count from submissions group by project_uuid) as s1  ON s1.project_uuid = p.project_uuid LEFT JOIN '+
									'(select project_uuid, COUNT(project_uuid) AS unsubmitted_count from submissions where status="modified" group by project_uuid) as s2 '+
									'ON s2.project_uuid = p.project_uuid order by created desc LIMIT ? OFFSET ?',
					'values':[limit, offset], 'holder': 'projects'})
		return store.executeMultipleQueries(queries);
	};

	var getProjectValues = function(project){
		return [project.version, project.status, project.name, project.xform, project.headers];
	};

	var getParamHolders = function(paramArray) {
		return paramArray.map(function() { return '?';}).join(',');
	};

}]);