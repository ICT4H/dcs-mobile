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
        //TODO if (!this.project) throw Error
        console.log('Setting up project to context: ' + project.name);
        this.project = project;// project should be set before submission
        if(!this.isChildProject())
            delete this.parentProject;
        if (this.isParentProject())
            this.parentProject = project;
    }

    this.getProject = function() {
        return this.project;
    }

    this.setSubmission = function(submission) {
        this.submission = submission;
        if (this.isParentProject())
            this.parentSubmission = submission;

        if (this.isChildProject()) {
            //TODO fixme when editing child submission, parentSubmission wont hv been loaded.
            relationHandler = new SurveyRelation(this.project, this.parentSubmission? JSON.parse(this.parentSubmission.data): JSON.parse(this.submission.data));
        }
        //TODO commenting as this wont allow to navigate across child submissions
        //delete this.parentSubmission;
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
        if (this.isChildProject())
            return relationHandler.add_note_fields_for_parent_values();
        return this.project.xform;
    }

    this.getModelStr = function() {
        var is_child_and_is_not_edit_of_child = this.isChildProject() && !this.submission;
        if (is_child_and_is_not_edit_of_child)
            // getUpdatedModelStr rename to getModelStrWithParentValues
            return relationHandler.getUpdatedModelStr();
        return this.submission? this.submission.xml : '';
    }

    this.getUrlsToAddChildren =  function() {
        var is_new_parent_or_is_not_parent = !this.submission || !this.isParentProject()
        if (is_new_parent_or_is_not_parent) return [];

        var urlToAddChild = '/projects/'+this.project.child_ids+
                    '/submissions/new_child?parent_id='+this.project.project_uuid+
                    '&parent_submission_id='+this.parentSubmission.submission_id;
        var urlsToAddChildren = [];
        //TODO remove harcoded action label; use value from child project.
        //TODO loop and create as many add as many children by split by ',' on project.child_ids
        urlsToAddChildren.push({
            'label': 'New Entry',
            'url': urlToAddChild
        });
        return urlsToAddChildren;
    };
}]);

