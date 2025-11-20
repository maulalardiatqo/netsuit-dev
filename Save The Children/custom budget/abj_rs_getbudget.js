/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const searchBudget = (account, department, classId, sofId, yearId, monthIdx) => {
        var amountBudget = 0;

        var budgetimportSearchObj = search.create({
            type: "budgetimport",
            filters: [
                ["account","anyof",account],
                "AND",
                ["class","anyof",classId],
                "AND",
                ["department","anyof",department],
                "AND",
                ["cseg_stc_sof","anyof",sofId],
                "AND",
                ["year","anyof",yearId]
            ],
            columns: [
                search.createColumn({ name: "account" }),
                search.createColumn({ name: "year" }),
                search.createColumn({ name: "amount" }),
                search.createColumn({ name: "department" }),
                search.createColumn({ name: "class" }),
                search.createColumn({ name: "cseg_stc_sof" }),
                search.createColumn({ name: "category" }),
                search.createColumn({ name: "global" }),
                search.createColumn({ name: "currency" }),
                search.createColumn({ name: "internalid" })
            ]
        });

        var transSearchResult = budgetimportSearchObj.run().getRange({ start: 0, end: 1 });
        var idBudget;

        if (transSearchResult.length > 0) {
            idBudget = transSearchResult[0].getValue({ name: "internalid" });
        }

        log.debug('idBudget', idBudget);

        if (idBudget) {
            var recBudget = record.load({
                type: "budgetImport",
                id: idBudget
            });

            log.debug('recBudget loaded', idBudget);

            var nameField = 'periodamount' + monthIdx;
            var cekField = recBudget.getField(nameField);
            log.debug('cekField', cekField);

            if (cekField) {
                var amt = recBudget.getValue(nameField);
                if (amt) {
                    amountBudget = amt;
                }
            }
        }

        log.debug('amountBudget', amountBudget);
        return amountBudget;
    };

    const get = (request) => {
        try {
            log.debug("request params", request);

            let account = request.custscript_account_id;
            let department = request.custscript_department_id;
            let classId = request.custscript_class_id;
            let sofId = request.custscript_sof_id;
            let yearId = request.custscript_year_id;
            let monthIdx = request.custscript_monthidx;

            let budgetAmt = searchBudget(account, department, classId, sofId, yearId, monthIdx);

            log.debug('budgetAmt', budgetAmt);

            return {
                success: true,
                amount: budgetAmt ? budgetAmt : 0
            };

        } catch (e) {
            log.error('RESTLET ERROR', e);
            return {
                success: false,
                error: e.message
            };
        }
    };

    return { get };
});
