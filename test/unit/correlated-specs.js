describe("Corelated module", function() {

    var xform_html_str,
        child_project,
        parent_submission,
        relationHandler;

    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = "base/test/unit/";
        xform_html_str = jasmine.getFixtures().read('xform_html.html');
        child_project = {
            xform: xform_html_str,
            parent_field_codes: 'loan_ac_number,borrower_id,borrower_name'
        }
        parent_submission = {"loan_ac_number":"ac1","borrower_id":"bid1","borrower_name":"name1","address":"add1","form_code":"005","_id":"loan-account"};
        relationHandler = new SurveyRelation(child_project, parent_submission);
    });

    it("should create child submission edit model xml with selected parent submission reference values", function() {
        var edit_model_instance_child_str = relationHandler.getUpdatedModelStr();

        var $model_children = $($.parseXML(edit_model_instance_child_str));

        //Ex: mode/instance/proj_name/loan_ac_number
        expect($model_children.find('loan_ac_number')[0].textContent).toBe('ac1');
        expect($model_children.find('borrower_name')[0].textContent).toBe('name1');
        expect($model_children.find('borrower_id')[0].textContent).toBe('bid1');
    });

    it("should hide the parents fields in child form", function() {
        var updated_xform_html_doc = relationHandler.add_note_fields_for_parent_values();

        var $xfrom_html = $($.parseXML(updated_xform_html_doc));

        var loan_ac_number_relevant = $($xfrom_html.find('input[name="/repayment/loan_ac_number"]')[0]).attr('data-relevant');
        var borrower_name_relevant = $($xfrom_html.find('input[name="/repayment/borrower_name"]')[0]).attr('data-relevant');
        var borrower_id_relevant = $($xfrom_html.find('input[name="/repayment/borrower_id"]')[0]).attr('data-relevant');
        expect(loan_ac_number_relevant).toBe('false()');
        expect(borrower_name_relevant).toBe('false()');
        expect(borrower_id_relevant).toBe('false()');

    });

    it("should add note field types to model_instance with common parent fields value", function() {
        var updated_xform_html_doc = relationHandler.add_note_fields_for_parent_values();

        _assert_instance_has_relation_fields(updated_xform_html_doc);
    });


    it("should add note fields to form node with common parent fields value", function() {
        var updated_xform_html_str = relationHandler.add_note_fields_for_parent_values();

        _assert_form_has_notes(updated_xform_html_str);
    });

    it("should create html markup for note field type", function() {
        var field_label = 'Some Label';
        var note_name = 'some_parent_field_note';
        var parent_field_name = 'some_parent_field';
        var expected_html_str = '<label class="note non-select "><span lang="" class="question-label active">Some Label: <span class="or-output" data-value=" some_parent_field "></span></span><input autocomplete="off" type="text" name="some_parent_field_note" data-type-xml="string" readonly="readonly"/></label>';

        var note_html_str = SurveyRelation.create_note_field(field_label, note_name, parent_field_name);

        expect(expected_html_str).toBe(note_html_str);
    });

    xit("should not change the initial child xform when edit model xml is created", function() {
        //TODO
    });

    function _assert_instance_has_relation_fields(updated_xform_html_doc) {
        var updated_xform_html_doc = $.parseXML(updated_xform_html_doc);
        $xfom_html = $(updated_xform_html_doc);
        var $instance_children = $xfom_html.find('instance:eq(0)').children()[0];

        var children = [];
        $.each($instance_children.children, function(i, item) {
            children.push(item.localName)
        });
        expect(children).toContain('loan_ac_number_note');
        expect(children).toContain('borrower_name_note');
        expect(children).toContain('loan_ac_number_note');
    }

    var _assert_form_has_notes = function(updated_xform_html_str) {
        var updated_xform_html_doc = $.parseXML(updated_xform_html_str);
        $xfrom = $(updated_xform_html_doc);
        var $loan_ac_note = $xfrom.find('form input[name="/repayment/loan_ac_number_note"]');
        var $borrower_id_note = $xfrom.find('form input[name="/repayment/borrower_id_note"]');
        var $borrower_name_note = $xfrom.find('form input[name="/repayment/borrower_name_note"]');

        expect($loan_ac_note.length).toBe(1);
        expect($borrower_id_note.length).toBe(1);
        expect($borrower_name_note.length).toBe(1);
    }
});