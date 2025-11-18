/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord','N/search', 'N/url','N/https'], (currentRecord, search, url, https) => {

    const mapRecType = {
        expensereport : {
            sublistId : 'expense',
            sofFieldId : 'cseg_stc_sof',
            employeeFieldId : 'entity',
            dateFieldId : 'trandate'
        },
        purchaserequisition : {
            sublistId : 'item',
            sofFieldId : 'cseg_stc_sof',
            employeeFieldId : 'entity',
            dateFieldId : 'trandate'
        },
        purchaseorder : {
            sublistId : 'item',
            sofFieldId : 'cseg_stc_sof',
            employeeFieldId : 'employee',
            dateFieldId : 'trandate'
        },
        vendorbill : {
            sublistId : 'item',
            sofFieldId : 'cseg_stc_sof',
            employeeFieldId : 'entity',
            dateFieldId : 'trandate'
        },
        customrecord_tar : {
            sublistId : 'recmachcustrecord_tar_e_id',
            sofFieldId : 'custrecord_tare_source_of_funding',
            employeeFieldId : 'custrecord_tar_staf_name',
            dateFieldId : 'custrecord_tar_date'
        },
        customrecord_tor : {
            sublistId : 'recmachcustrecord_tori_id',
            sofFieldId : 'custrecord_tori_source_of_funding',
            employeeFieldId : 'custrecord_tor_create_by',
            dateFieldId : 'custrecord_tor_date'
        },
        customrecord_ter : {
            sublistId : 'recmachcustrecord_terd_id',
            sofFieldId : 'custrecord_terd_sourcing_of_funding',
            employeeFieldId : 'custrecord_ter_staf_name',
            dateFieldId : 'custrecord_ter_date'
        },
    }

    const pageInit = (context) => {
        console.log('Page Initialized');
    };

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

    const fieldChanged = (context) => {
        const rec = currentRecord.get();
        const recType = rec.type;
        console.log('REC TYPE', recType);
        const recTypeFieldMap = mapRecType[recType];
        console.log('rec type data', recTypeFieldMap);
        const fieldID = context.fieldId;
        const sublistId = context.sublistId;

        console.log(`Field Changed: ${fieldID}`);
        console.log(`sublistID: ${sublistId}`);

        // Trigger validation when SOF, date, or entity changes
        if (
            (fieldID == recTypeFieldMap.sofFieldId && sublistId) ||
            fieldID == recTypeFieldMap.dateFieldId ||
            fieldID == recTypeFieldMap.employeeFieldId
        ) {
            let sofValue = rec.getCurrentSublistValue({
                sublistId: sublistId ? sublistId : recTypeFieldMap.sublistId,
                fieldId: recTypeFieldMap.sofFieldId
            }) || null;

            let employee = rec.getValue({ fieldId : recTypeFieldMap.employeeFieldId });
            let tranDate = rec.getValue({ fieldId : recTypeFieldMap.dateFieldId });

            if (sofValue && employee && tranDate) {
                // let testSearchEmpType = searchEmployeeType(recType, rec.id)
                // let employeeSearch2 = search.load({ id : "customsearch328"});
                // // employeeSearch2.filters.push(
                // //     search.createFilter({name: "internalid", operator: search.Operator.IS, values: employee})
                // // )
                // var employeeSearch2Set = employeeSearch2.run();
                // var result = employeeSearch2Set.getRange(0, 1);
                // var employeeRec = result[0];
                // console.log('employee search', employeeRec)
                // let employeSearch = search.lookupFields({
                //     type : 'employee',
                //     id : employee,
                //     columns : ['custentity_stc_employee_type']
                // });
                const suiteletUrl = url.resolveScript({
                    scriptId: "customscript_abj_sl_get_employee_type",
                    deploymentId: "customdeploy_abj_sl_get_employee_type",
                    params: {
                        custscript_emp_id: employee,
                        custscript_sof_id : sofValue
                    }
                });

                const response = https.get({ url: suiteletUrl });
                log.debug('response', response);
                console.log('response', response);
                // let employeeType = employeSearch.custentity_stc_employee_type?.[0]?.value || '';
                let finalPostingDate = response.body || '';
                console.log('final Posting date', finalPostingDate);
                if(finalPostingDate == 'no_data'){
                    return false;
                }
                // return false;

                // let sofData = searchSOF(sofValue);
                // let finalPostingDate = sofData.employeeFinalPostingDate;

                // // If employee type = 2 → partner
                // if (employeeType == 2) {
                //     finalPostingDate = sofData.partnerFinalPostingDate;
                // }

                let tranDateObj = new Date(tranDate);
                let finalPostingDateSplit = finalPostingDate.split('/');
                console.log('final posting date split', finalPostingDateSplit);
                let finalPostingDateObj = new Date(finalPostingDateSplit[2], finalPostingDateSplit[1] - 1, finalPostingDateSplit[0]);

                console.log('tranDateObj',tranDateObj);
                console.log('finalPostingDateObj',finalPostingDateObj);
                console.log('tranDateObj > finalPostingDateObj', tranDateObj > finalPostingDateObj);

                if (tranDateObj > finalPostingDateObj) {
                    alert('Transaction date exceeds the Final Posting Date of the related SOF. Please adjust the transaction date or contact the administrator.');
                    rec.setCurrentSublistValue({
                        sublistId: recTypeFieldMap.sublistId,
                        fieldId: recTypeFieldMap.sofFieldId,
                        value: '',
                        ignoreFieldChange: true
                    });
                    return false;
                }

                
            }
        }
    };

    const saveRecord = (context) => {
        console.log('Before Save');
        return true;
    };

    return { pageInit, fieldChanged, saveRecord };
});
