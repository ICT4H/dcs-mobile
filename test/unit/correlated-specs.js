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
            parent_fields_code_label_str: '{"loan_ac_number": "Loan account no.","borrower_id": "Borrower ID","borrower_name": "Borrower name"}'
        }
        parent_submission = {"loan_ac_number":"ac1","borrower_id":"bid1","borrower_name":"name1","address":"add1","form_code":"005","_id":"loan-account"};
        relationHandler = new SurveyRelation(child_project, parent_submission);
    });

    xit("should create child submission edit model xml with selected parent submission reference values", function() {
        var edit_model_instance_child_str = relationHandler.getUpdatedModelStr();

        var $model_children = $($.parseXML(edit_model_instance_child_str));

        //Ex: mode/instance/proj_name/loan_ac_number
        expect($model_children.find('loan_ac_number')[0].textContent).toBe('ac1');
        expect($model_children.find('borrower_name')[0].textContent).toBe('name1');
        expect($model_children.find('borrower_id')[0].textContent).toBe('bid1');
    });

    xit("should hide the parents fields in child form", function() {
        var updated_xform_html_doc = relationHandler.add_note_fields_for_parent_values();

        var $xfrom_html = $($.parseXML(updated_xform_html_doc));

        var loan_ac_number_relevant = $($xfrom_html.find('input[name="/repayment/loan_ac_number"]')[0]).attr('data-relevant');
        var borrower_name_relevant = $($xfrom_html.find('input[name="/repayment/borrower_name"]')[0]).attr('data-relevant');
        var borrower_id_relevant = $($xfrom_html.find('input[name="/repayment/borrower_id"]')[0]).attr('data-relevant');
        expect(loan_ac_number_relevant).toBe('false()');
        expect(borrower_name_relevant).toBe('false()');
        expect(borrower_id_relevant).toBe('false()');

    });

    xit("should add note field types to model_instance with common parent fields value", function() {
        var updated_xform_html_doc = relationHandler.add_note_fields_for_parent_values();

        _assert_instance_has_relation_fields(updated_xform_html_doc);
    });


    it("should add note fields to form node with common parent fields value", function() {
        var updated_xform_html_str = relationHandler.add_note_fields_for_parent_values();

        _assert_form_has_notes(updated_xform_html_str);
    });

    xit("should create html markup string for note field type", function() {
        var field_label = 'Some Label';
        var note_name = 'some_parent_field_note';
        var parent_field_name = 'some_parent_field';
        var expected_html_str = '<label class="note non-select "><span lang="" class="question-label active">Some Label: <span class="or-output" data-value=" some_parent_field "></span></span><input autocomplete="off" type="text" name="some_parent_field_note" data-type-xml="string" readonly="readonly"/></label>';

        var note_html_str = SurveyRelation.create_note_field(field_label, note_name, parent_field_name);

        expect(expected_html_str).toBe(note_html_str);
    });

    it("should not change the initial child xform when edit model xml is created", function() {
        var field_codes = relationHandler.parent_field_codes;
        expect(field_codes).toContain('loan_ac_number');
        expect(field_codes.length).toBe(3);
    });

    function _assert_instance_has_relation_fields(updated_xform_html_doc) {
        var updated_xform_html_doc = $.parseXML(updated_xform_html_doc);
        $xfom_html = $(updated_xform_html_doc);
        var $instance_children = $xfom_html.find('instance:eq(0)').children()[0];

        var children = [];
        $.each($instance_children.children, function(i, item) {
            children.push(item.tagName);
        });
        // This still doesn't validates that elemets added were elements rather than just string
        expect(children).toContain('loan_ac_number_note');
        expect(children).toContain('borrower_name_note');
        expect(children).toContain('loan_ac_number_note');
    }

    var _assert_form_has_notes = function(updated_xform_html_str) {
        var updated_xform_html_doc = $.parseXML(updated_xform_html_str);
        $xfrom = $(updated_xform_html_doc);
        var $loan_ac_note = $( $xfrom.find('form input[name="/repayment/loan_ac_number_note"]')[0] );
        var $borrower_id_note = $( $xfrom.find('form input[name="/repayment/borrower_id_note"]')[0] );
        var $borrower_name_note = $( $xfrom.find('form input[name="/repayment/borrower_name_note"]')[0] );

        expect($loan_ac_note.attr('name')).toBe("/repayment/loan_ac_number_note");
        expect($loan_ac_note.parent().find('span[class="question-label active"]').text()).toBe('Loan account no.: ');

        expect($borrower_id_note.attr('name')).toBe("/repayment/borrower_id_note");
        expect($borrower_id_note.parent().find('span[class="question-label active"]').text()).toBe('Borrower ID: ');
        
        expect($borrower_name_note.attr('name')).toBe("/repayment/borrower_name_note");
        expect($borrower_name_note.parent().find('span[class="question-label active"]').text()).toBe('Borrower name: ');
    }
});