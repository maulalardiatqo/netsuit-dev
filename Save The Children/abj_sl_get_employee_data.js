/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log'], (serverWidget, search, log) => {

    const searchData = (employeeId) => {
        try {
            const empLookup = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: employeeId,
                columns: [
                    'custentity_stc_employee_type',
                    'custentity_stc_exclude_max_advnc',
                    'custentity_stc_exc_max_adv_amt',
                    'custentity_stc_lv_employee'
                ]
            });
            const getVal = (field) => {
                if (Array.isArray(field) && field.length > 0) return field[0].value;
                return field;
            };

            return {
                empType: getVal(empLookup.custentity_stc_employee_type),
                isMaxAdvance: empLookup.custentity_stc_exclude_max_advnc,
                maxAmount: parseFloat(empLookup.custentity_stc_exc_max_adv_amt) || 0,
                lvEmployee: getVal(empLookup.custentity_stc_lv_employee)
            };
        } catch (e) {
            log.error('Error in searchData', e);
            return null;
        }
    };

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            const employeeID = context.request.parameters.employee_id;
            
            if (!employeeID) {
                context.response.setHeader({ name: 'Content-Type', value: 'text/plain' });
                return context.response.write('Missing employee_id parameter');
            }

            log.debug('Processing Employee ID', employeeID);

            const data = searchData(employeeID);
            log.debug('data', data);
            
            if (!data) {
                context.response.setHeader({ name: 'Content-Type', value: 'text/plain' });
                return context.response.write('no_data');
            }
            
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });

            context.response.write(JSON.stringify(data));
            
        } else {
            context.response.setHeader({ name: 'Content-Type', value: 'text/plain' });
            context.response.write('POST request received');
        }
    };

    return { onRequest };
});