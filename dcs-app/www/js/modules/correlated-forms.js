/**

Get the model from xform, remove meta and form code.
update the model with parent values.

SurveyRelation | ModelHandler | DisplayHandler

model/instance/prj -add note
     /bind -add note && update text to be readonly

html:body -add note

**/

var EditModelStr = function(model_doc, submission_json, parent_field_codes) {
    this.submission_json = submission_json;
    this.model_doc = model_doc;
    this.parent_field_codes = parent_field_codes;
    
    this.$model = $(model_doc);
    this.model_instance_childrens = this.$model.find('instance:eq(0)').children();

    this.getUpdatedModelStr = function($xform_doc) {
        this._add_parent_values();
        return this._get_model_edit_str();
    }

    this._get_model_edit_str = function() {
        var model_edit_str = this.model_instance_childrens[0];
        return (new XMLSerializer()).serializeToString(model_edit_str);
    }

    this._add_parent_values = function() {
        for(var i=0; i<this.parent_field_codes.length; i++) {
            var parent_value = this.submission_json[this.parent_field_codes[i]];
            this.$model.find(parent_field_codes[i]).text(parent_value);
        };
    }
}


var SurveyRelation = function(child_project, parent_submission) {
    this.parent_field_codes = child_project.parent_field_codes.split(',');;
    this.submission_json = parent_submission;
    this.xform_doc = $.parseXML( child_project.xform );

    this.$xform_doc = $( this.xform_doc );
    this.model_doc = this.$xform_doc.find( 'model:eq(0)' )[ 0 ];
    this.$model = $(this.model_doc);
    this.model_instance_childrens = this.$model.find('instance:eq(0)').children();

    this.getUpdatedModelStr = function() {
        //Clonning to avoid getting values be added to the original xform/model/instance
        var model_doc = this.$xform_doc.find( 'model:eq(0)' )[ 0 ].cloneNode(true);
        var editor = new EditModelStr(model_doc, this.submission_json, this.parent_field_codes);
        return editor.getUpdatedModelStr()
    }   

    this.add_note_fields_for_parent_values = function() {
        this._add_nodes_to_instance();
        this._add_nodes_to_form();
        this._hide_parent_matching_fields();

        xform_str = ( new XMLSerializer() ).serializeToString(this.xform_doc);
        return xform_str;
    }

    this._hide_parent_matching_fields = function() {
        //TODO make this class attribute
        var prj_name = this.$model.find('instance:eq(0)')[0].firstElementChild.localName;
        var form = this.$xform_doc.find('form:eq(0)')[0];
        var $form = $(form);

        for(var i=0;i<this.parent_field_codes.length;i++) {
            var input_name = '/'+ prj_name + '/' + this.parent_field_codes[i];
            // set input data-relevant="false()" and hide input enclosing parent label
            $form.find('input[name="'+input_name+'"]').attr('data-relevant', 'false()')
                .parent('label').attr('class', 'question or-branch pre-init non-select');
        }
    }

    this._add_nodes_to_instance = function() {
        for(var i=0;i<this.parent_field_codes.length;i++) {
            this.model_instance_childrens.append('<'+this.parent_field_codes[i]+'_note/>')
        }
    }

    this._add_nodes_to_form = function() {
        var prj_name = this.$model.find('instance:eq(0)')[0].firstElementChild.localName;
        var note_fields = [];
        for(var i=0;i<this.parent_field_codes.length;i++) {
            var parent_field_code = this.parent_field_codes[i];
            var field_name = '/'+prj_name+'/'+parent_field_code;
            note_fields.push(SurveyRelation.create_note_field(parent_field_code, field_name+'_note', field_name));
        }
        this.$xform_doc.find('form label:eq(0)').before(note_fields);
    }
}

SurveyRelation.create_note_field = function(field_label, note_name, parent_field_name) {
    return '<label class="note non-select ">' +
        '<span lang="" class="question-label active">' + field_label + ': ' +
        '<span class="or-output" data-value=" ' + parent_field_name + ' "></span>' +
        '</span>' +
        '<input autocomplete="off" type="text" name="' + note_name + '" data-type-xml="string" readonly="readonly"/>' +
        '</label>';

}

