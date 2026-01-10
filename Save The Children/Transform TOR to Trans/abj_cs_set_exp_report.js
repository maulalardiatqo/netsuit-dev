/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord'], function (currentRecord) {
    function formatDateDDMMYYYY(dateStr) {
        if (!dateStr) return null;

        var parts = dateStr.split('/');
        if (parts.length !== 3) return null;

        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // JS month 0-based
        var year = parseInt(parts[2], 10);

        return new Date(year, month, day);
    }
    function pageInit(context) {
        var rec = currentRecord.get();

        if (rec.getValue('custbody_exp_autofilled')) return;

        var payload = getParam('dataParamsString');
        console.log('payload', payload)
        if (!payload) return;

        var data;
        try {
            data = JSON.parse(decodeURIComponent(payload));
        } catch (e) {
            console.log('Invalid payload', e);
            return;
        }

        if (!data || !data.length) return;

        /** =========================
         * HEADER (setValue)
         * ========================= */
        rec.setValue({ fieldId: 'custbody_id_to', value: data[0].idTor });
        rec.setValue({ fieldId: 'custbody_stc_link_to_tor', value: data[0].idTor });
        rec.setValue({ fieldId: 'custbody_stc_expense_report_type', value: '2' });
        rec.setValue({ fieldId: 'entity', value: data[0].emp });
        rec.setValue({ fieldId: 'expensereportcurrency', value: '1' });
        rec.setValue({ fieldId: 'trandate', value: formatDateDDMMYYYY(data[0].date) });
        rec.setValue({ fieldId: 'department', value: data[0].costCenter });
        rec.setValue({ fieldId: 'class', value: data[0].projectCode || '114' });
        rec.setValue({ fieldId: 'location', value: '3' });
        rec.setValue({ fieldId: 'cseg_stc_sof', value: data[0].sof || '66' });

        /** =========================
         * LINES (expense sublist)
         * ========================= */
        data.forEach(function (line) {

            rec.selectNewLine({ sublistId: 'expense' });

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'expensedate',
                value: formatDateDDMMYYYY(data[0].date),
                ignoreFieldChange: true
            });
             var itemId = line.item
            console.log('itemId', itemId)
            var expAcc = ''
            if(itemId){
                var itemSearchObj = search.create({
                        type: "item",
                        filters:
                        [
                            ["internalid","anyof",itemId]
                        ],
                        columns:
                        [
                            search.createColumn({name: "expenseaccount", label: "Expense/COGS Account"})
                        ]
                        });
                        var searchResultCount = itemSearchObj.runPaged().count;
                        console.log("itemSearchObj result count",searchResultCount);
                        itemSearchObj.run().each(function(result){
                            expAcc = result.getValue({
                                name : 'expenseaccount'
                            })
                        return true;
                    });
                }
            console.log('expAcc', expAcc)
            var category = '';

            if (expAcc) {
                var expensecategorySearchObj = search.create({
                    type: "expensecategory",
                    filters: [
                        ["account", "anyof", expAcc]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" })
                    ]
                });

                var searchResultCount = expensecategorySearchObj.runPaged().count;
                console.log("expensecategorySearchObj result count", searchResultCount);

                if (searchResultCount === 1) {
                    expensecategorySearchObj.run().each(function (result) {
                        category = result.getValue({ name: 'internalid' });
                        return false;
                    });
                }
            }
            console.log('category', category)
            if (category) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'category',
                    value: category,
                    ignoreFieldChange: true
                });
            }

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: line.amount,
                ignoreFieldChange: true
            });

            if (line.costCenter) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'department',
                    value: line.costCenter,
                    ignoreFieldChange: true
                });
            }

            if (line.projectCode) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'class',
                    value: line.projectCode,
                    ignoreFieldChange: true
                });
            }

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'currency',
                value: '1',
                ignoreFieldChange: true
            });

            rec.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'expenseaccount',
                value: '488',
                ignoreFieldChange: true
            });

            if (line.project) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'customer',
                    value: line.project,
                    ignoreFieldChange: true
                });
            }

            if (line.projectTask) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'projecttask',
                    value: line.projectTask,
                    ignoreFieldChange: true
                });

                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custrecord_tare_project_task',
                    value: line.projectTask,
                    ignoreFieldChange: true
                });
            }

            if (line.drc) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'cseg_stc_drc_segmen',
                    value: line.drc,
                    ignoreFieldChange: true
                });
            }

            if (line.dea) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'cseg_stc_segmentdea',
                    value: line.dea,
                    ignoreFieldChange: true
                });
            }

            if (line.sof) {
                rec.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'cseg_stc_sof',
                    value: line.sof,
                    ignoreFieldChange: true
                });
            }

            rec.commitLine({ sublistId: 'expense' });
        });

        // flag supaya tidak re-run
        rec.setValue({
            fieldId: 'custbody_exp_autofilled',
            value: true,
            ignoreFieldChange: true
        });
    }

    function getParam(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    return {
        pageInit: pageInit
    };
});
