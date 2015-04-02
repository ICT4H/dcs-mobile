dcsApp.service('contextService', [function() {
/*
This service provides the xform html and model string. For Correlated project,
it uses SurveyRelation to provide xform html and model string.
For parent edit/view, url links to create children are provided.

The assumption is for new child submission, parent submission will be accessed first.
This service holds the latest accessed parent data.
*/

    var relationHandler;

    this.setProject = function(project) {
        console.log('starting normal flow');
        this.project = project;
        this.selectParentFlow = false;
        delete this.childProject;
        delete this.parentSubmission;
    }

    this.setParentAndChildProjects = function(parentProject, childProject) {
        console.log('starting the child flow');
        this.project = parentProject;
        this.childProject = childProject;
        this.selectParentFlow = true;
        delete this.submission
    }

    this.resetFlowForChildProject = function() {
        this.project = this.childProject;
        this.selectParentFlow = false;
        relationHandler = new SurveyRelation(this.childProject, JSON.parse(this.parentSubmission.data));
    }

    this.setSubmission = function(submission) {
        this.submission = submission;
        if (this.selectParentFlow)
            this.parentSubmission = submission;
    }

    this.getProjectUuid = function() {
        return this.project.project_uuid;
    }

    this.getSecondaryTitleForListing = function() {
        if (this.selectParentFlow)
            return 'View ' + this.project.name + ' to continue';
        else
            return this.project.name;
    }

    this.getChildProject = function() {
        return this.childProject;
    }

    this.getParentProject = function() {
        return this.project;
    }

    this.getProject = function() {
        return this.project;
    }

    this.isChildProject = function() {
        return this.project.project_type == 'child';
    }

    this.getParentUuid = function() {
        return this.parentProject? this.parentProject.project_uuid: undefined;
    }

    this.isParentProject = function() {
        return this.project.project_type == 'parent';
    }

    this.getXform = function() {
        if (this.isChildProject()) {
            var mayBeParentDataJson = this.parentSubmission && JSON.parse(this.parentSubmission.data)
            relationHandler = new SurveyRelation(this.project, mayBeParentDataJson);
            return relationHandler.add_note_fields_for_parent_values();
        }
        return this.project.xform;
    }

    this.getModelStr = function() {
        var parentDataSelectedAndNewChild = this.parentSubmission && this.isChildProject();
        if (parentDataSelectedAndNewChild)
            return relationHandler.getUpdatedModelStr();
        return this.submission? this.submission.xml : '';
    }
}]);

