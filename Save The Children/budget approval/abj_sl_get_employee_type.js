/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget',"N/search"], (serverWidget, search) => {

    const searchSOF = (sofId) => {
        var searchRec = search.lookupFields({
            type: 'customrecord_cseg_stc_sof',
            id: sofId,
            columns: [
                'custrecord_sof_project',                // Project link
                'custrecord_sof_emp_finalpostingdate',   // Final posting date (Employee level)
                'custrecord15',                          // Partner
                'custrecord10'                           // Final posting date (Partner level)
            ]
        });

        return {
            sofProject: searchRec.custrecord_sof_project?.[0] || '',
            employeeFinalPostingDate: searchRec.custrecord_sof_emp_finalpostingdate,
            partner: searchRec.custrecord15?.[0] || '',
            partnerFinalPostingDate: searchRec.custrecord10,
        };
    };

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            let employeeID = context.request.parameters.custscript_emp_id;
            let sofId = context.request.parameters.custscript_sof_id;
            log.debug('EMPLOYEE ID', employeeID);
            log.debug('SOF  ID', sofId);
            let employeSearch = search.lookupFields({
                type : 'employee',
                id : employeeID,
                columns : ['custentity_stc_employee_type']
            });

            let employeeType = employeSearch.custentity_stc_employee_type?.[0]?.value || '';

            let sofData = searchSOF(sofId);
            let finalPostingDate = sofData.employeeFinalPostingDate;

            // If employee type = 2 → partner
            if (employeeType == 2) {
                finalPostingDate = sofData.partnerFinalPostingDate;
            }
            context.response.write(finalPostingDate ? finalPostingDate : 'no_data');
        } else {
            context.response.write('POST request received');
        }
    };

    return { onRequest };
});
