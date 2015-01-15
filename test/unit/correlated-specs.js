describe("Corelated module", function() {


	it("should hide", function() {
		var model_string = '';
	});


	xit("should update edit xml with parent reference values", function() {
		var xml = '<random_form_id><borrower_id></borrower_id><borrower_name></borrower_name></random_form_id>';
		var output_xml = updateParentValues(xml, 'borrower_id', 'borrower_name');

		expect(output_xml).toBe('<random_form_id><borrower_id>some borrower id</borrower_id><borrower_name>some name</borrower_name></random_form_id>');

	});

	xit("should hide the parents fields in child form", function() {
		
	});

	xit("should update edit xml of child with parent submission values", function() {
		var parent_field_codes = "loan_ac_number,borrower_id,borrower_name";
		var parent_submission_data = {"loan_ac_number":"ac1","borrower_id":"bid1","borrower_name":"name1","address":"add1","form_code":"005","_id":"loan-account"};
		var xml = '<model><instance><loan-account id="loan-account"><loan_ac_number/><borrower_id/><borrower_name/><address/><meta><instanceID/></meta><form_code>005</form_code></loan-account></instance></model>'
		// var xml = '<random_form_id><loan_ac_number></loan_ac_number><borrower_id></borrower_id><borrower_name></borrower_name></random_form_id>';
		
		var output_xml = _update(parent_field_codes, parent_submission_data, xml);

		expect(output_xml).toBe('<random_form_id><loan_ac_number>ac12</loan_ac_number><borrower_id>bid1</borrower_id><borrower_name>name1</borrower_name></random_form_id>');

	});



	xit("should get the model str from form", function() {
		
		var xml = '<model><instance><loan-account id="loan-account"><loan_ac_number/><borrower_id/><borrower_name/><address/><meta><instanceID/></meta><form_code>005</form_code></loan-account></instance></model>'
		var output_xml = _get_model_str(xml);

		expect(output_xml).toBe('<loan-account><loan_ac_number/><borrower_id/><borrower_name/><address/></loan-account>')
	});

	it("should create child submission model xml with selected parent submission reference values", function() {
		
		var child_project = {
			xform: '<some_elements_of_xform><model><instance><loan-account id="loan-account"><loan_ac_number/><borrower_id/><borrower_name/><address/><meta><instanceID/></meta><form_code>005</form_code></loan-account></instance></model></some_elements_of_xform>',
			parent_field_codes: 'loan_ac_number,borrower_id,borrower_name'
		}
		var parent_submission = {"loan_ac_number":"ac1","borrower_id":"bid1","borrower_name":"name1","address":"add1","form_code":"005","_id":"loan-account"};

		var relationHandler = new SurveyRelation(child_project, parent_submission);
        var create_child_submission = relationHandler.getUpdatedModelStr();
		expect(create_child_submission).toBe('<loan-account><loan_ac_number>ac1</loan_ac_number><borrower_id>bid1</borrower_id><borrower_name>name1</borrower_name><address/><form_code>005</form_code></loan-account>');

	});

	it("should add note field types to show parent fields value", function() {
		//styleXfromParentFields();
	});

	it("should hide input fields that matched parent fields", function() {
		
	});

});