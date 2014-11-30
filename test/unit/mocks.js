var DCSMocks = function($q) {
    this.$q = $q;
}

DCSMocks.prototype.add_message_service_spy = function(first_argument) {
    this.messageService = jasmine.createSpyObj('messageService', ['showLoading', 'hideLoadingWithErr', 'hideAll', 'showLoadingWithInfo', 'hideLoadingWithInfo']);
};

DCSMocks.prototype.add_project_dao_spy_1_local_project = function() {
    this.project_dao_with_1_local_project = jasmine.createSpyObj('projectDao', ['getCountOfProjects', 'getProjects', 'getAll', 'setprojectStatus'])
    this.project_dao_with_1_local_project.getProjects.and.returnValue(
        this.$q.when( [this.createLocalProject('1', 'BOTH')] )
    );
    this.project_dao_with_1_local_project.getAll.and.returnValue(
        this.$q.when( [this.createLocalProject('1', 'BOTH')] )
    );
    this.project_dao_with_1_local_project.getCountOfProjects.and.returnValue(this.$q.when( {'total':'1'} ));    
};

DCSMocks.prototype.add_dcsService_spy_1_updated_server_project = function(first_argument) {
    this.dcsService_with_1_updated_server_project = jasmine.createSpyObj('dcsService', ['checkProjectsStatus']);
    var prjs_with_status = [{id: '1', status: 'OUTDATED'}];
    this.dcsService_with_1_updated_server_project.checkProjectsStatus.and.returnValue(
        this.$q.when( prjs_with_status )
    );
};

DCSMocks.prototype.createProject = function(i) {
    return {
        "name": "project-" + i,
        "project_uuid": "prj-uuid-" + i,
        "version": "prj-" + i + "-ver-1"
    };
};

DCSMocks.prototype.createLocalProject = function(i) {
    var project = this.createProject(i);
    project.id = i;
    project.status = status;

    return project;
};
