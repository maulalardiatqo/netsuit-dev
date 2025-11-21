/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/search"], (search) => {

    const searchPeriod = (periodName) => {
        var periodId = '';
        var resultSet = search.create({
            type: "accountingperiod",
            filters: [["periodname", "is", periodName]],
            columns: ["internalid"]
        }).run().getRange({ start: 0, end: 1 });

        if (resultSet && resultSet.length) {
            periodId = resultSet[0].getValue("internalid");
        }

        return periodId;
    };

    const onRequest = (context) => {
        let params = context.request.parameters;

        let yearId = searchPeriod(params.custscript_year_name);
        let periodId = searchPeriod(params.custscript_period_name);
        log.debug('yearId', yearId);
        log.debug('periodId', periodId)
        context.response.write(JSON.stringify({
            yearId: yearId || '',
            periodId: periodId || ''
        }));
    };

    return { onRequest };
});
