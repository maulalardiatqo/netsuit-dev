/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/log', 'N/record'], (search, log, record) => {

    const onRequest = (context) => {
        try {
            var regId = context.request.parameters.regId;
            var employeeId = context.request.parameters.empId;
            log.debug('regId', regId)
            log.debug('employeeId', employeeId)
            if (!employeeId) {
                context.response.write('No employeeId');
                return;
            }

            log.debug('Employee ID', employeeId);

            var result = {
                timeApprover: getEmployeeByField('timeapprover', employeeId),
                departmentHead: getEmployeeByField('custentity_stc_department_head', employeeId),
                supervisor: getEmployeeByField('supervisor', employeeId)
            };

            log.debug('Final Result', result);
            if (result.timeApprover.length > 0) {
                updateEmployeeField(result.timeApprover, 'timeapprover', regId);
            }

            if (result.departmentHead.length > 0) {
                updateEmployeeField(result.departmentHead, 'custentity_stc_department_head', regId);
            }

            if (result.supervisor.length > 0) {
                updateEmployeeField(result.supervisor, 'supervisor', regId);
            }

            context.response.write(JSON.stringify({
                success: true,
                message: 'Data Successfully Updated'
            }));

        } catch (e) {
            log.error('Error Suitelet', e);

            context.response.write(JSON.stringify({
                success: false,
                message: e.message
            }));
        }
    };
    function updateEmployeeField(ids, fieldId, value) {
        ids.forEach(function(empId) {
            try {
                record.submitFields({
                    type: 'employee',
                    id: empId,
                    values: {
                        [fieldId]: value
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                log.debug('Updated ' + fieldId, empId);

            } catch (e) {
                log.error('Error ' + fieldId + ' ' + empId, e);
            }
        });
    }
    function getEmployeeByField(fieldId, employeeId) {
        var results = [];

        var employeeSearchObj = search.create({
            type: "employee",
            filters: [
                [fieldId, "anyof", employeeId]
            ],
            columns: [
                search.createColumn({ name: "internalid" })
            ]
        });

        employeeSearchObj.run().each(function (result) {
            results.push(result.getValue({ name: "internalid" }));
            return true;
        });

        return results;
    }

    return { onRequest };
});