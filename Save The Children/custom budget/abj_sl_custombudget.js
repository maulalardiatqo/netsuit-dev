/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/search", "N/record"], (search, record) => {

    const searchBudget = (account, department, classId, sofId, yearId, monthIdx) => {
        var amountBudget = 0
        var budgetimportSearchObj = search.create({
            type: "budgetimport",
            filters:
            [
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
            columns:
            [
                search.createColumn({name: "account", label: "Account"}),
                search.createColumn({name: "year", label: "Year"}),
                search.createColumn({name: "amount", label: "Amount"}),
                search.createColumn({name: "department", label: "Cost Center"}),
                search.createColumn({name: "class", label: "Project Code"}),
                search.createColumn({name: "cseg_stc_sof", label: "Source of Funding"}),
                search.createColumn({name: "category", label: "Category"}),
                search.createColumn({name: "global", label: "Global"}),
                search.createColumn({name: "currency", label: "Currency"}),
                search.createColumn({name: "internalid", label: "Internal ID"})
            ]
            });

            var transSearchResult = budgetimportSearchObj.run().getRange({ start: 0, end: 1 });
            var idBudget
            if (transSearchResult.length > 0) {
                idBudget = transSearchResult[0].getValue({ name: "internalid"});
            }
            log.debug('idBudget', idBudget)
            if(idBudget){
                var recBudget = record.load({
                    type : "budgetImport",
                    id : idBudget
                });
                log.debug('recBudget', recBudget)
                var nameField = 'periodamount' + monthIdx
                var cekField = recBudget.getField(nameField)
                log.debug('cekField', cekField)
                if(cekField){
                    var amt = recBudget.getValue(nameField);
                    if(amt){
                        amountBudget = amt
                    }
                }

            }
            log.debug('amountBudget', amountBudget)
            return amountBudget
    };

    const onRequest = (context) => {
        let params = context.request.parameters;

        let budgetAmt = searchBudget(
            params.custscript_account_id,
            params.custscript_department_id,
            params.custscript_class_id,
            params.custscript_sof_id,
            params.custscript_year_id,
            params.custscript_monthidx
        );

        context.response.write(JSON.stringify({
            amount: budgetAmt || 0
        }));
    };

    return { onRequest };
});
