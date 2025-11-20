/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/search", "N/record"], (search, record) => {

    const searchBudget = (customerId, date_from, date_to, noDo, subsidiary) => {
        var allData = []
        var dataSearch = search.load({
            id: "customsearch588",
        });
        if(customerId){
            dataSearch.filters.push(
                search.createFilter({
                name: "name",
                join : "custrecord_packship_itemfulfillment",
                operator: search.Operator.ANYOF,
                values: customerId,
                })
            );
        }
        if(date_from){
            dataSearch.filters.push(
                search.createFilter({
                name: "trandate",
                join : "custrecord_packship_itemfulfillment",
                operator: search.Operator.ONORAFTER,
                values: date_from,
                })
            );
        }
        if(date_to){
                dataSearch.filters.push(
                search.createFilter({
                name: "trandate",
                join : "custrecord_packship_itemfulfillment",
                operator: search.Operator.ONORBEFORE,
                values: date_to,
                })
            );
        }
        if(noDo){
            dataSearch.filters.push(
                search.createFilter({
                name: "createdfrom",
                join : "custrecord_packship_itemfulfillment",
                operator: search.Operator.ANYOF,
                values: noDo,
                })
            );
        }
        if(subsidiary){
            dataSearch.filters.push(
                search.createFilter({
                name: "subsidiary",
                join : "custrecord_packship_itemfulfillment",
                operator: search.Operator.ANYOF,
                values: subsidiary,
                })
            );
        }
        var dateSearchSet = dataSearch.run();
        log.debug('runSearch result', JSON.stringify(dateSearchSet));
        var dataSearch = dateSearchSet.getRange({
            start: 0,
            end: 1000
        });
        if(dataSearch.length > 0){
            for (var i = 0; i < dataSearch.length; i++) {
                var doNumber = dataSearch[i].getValue({
                    name: dateSearchSet.columns[0],
                });
                var soNumber = dataSearch[i].getText({
                    name: dateSearchSet.columns[1],
                });
                var doDate = dataSearch[i].getValue({
                    name: dateSearchSet.columns[2],
                });
                var customer = dataSearch[i].getText({
                    name: dateSearchSet.columns[3],
                });
                var idCus = dataSearch[i].getValue({
                    name: dateSearchSet.columns[3],
                });
                var currency = dataSearch[i].getText({
                    name: dateSearchSet.columns[4],
                });
                var idSubs = dataSearch[i].getValue({
                    name: dateSearchSet.columns[5],
                });

                var idFul = dataSearch[i].getValue({
                    name: dateSearchSet.columns[6],
                });
                var packCartonId = dataSearch[i].getValue({
                    name: dateSearchSet.columns[7],
                });
                var packCartonText = dataSearch[i].getText({
                    name: dateSearchSet.columns[7],
                });
                allData.push({
                    doNumber : doNumber,
                    soNumber : soNumber,
                    doDate : doDate,
                    customer : customer,
                    currency : currency,
                    idCus : idCus,
                    idSubs : idSubs,
                    idFul : idFul,
                    packCartonId : packCartonId,
                    packCartonText : packCartonText
                })
            }
        }
        return allData
    };

    const onRequest = (context) => {
        let params = context.request.parameters;

        let allData = searchBudget(
            params.custscript_customer_id,
            params.custscript_date_from,
            params.custscript_date_to,
            params.custscript_no_do,
            params.custscript_subs_id,
        );
        log.debug('allData', allData)
        context.response.write(JSON.stringify({
            allData: allData || 0
        }));
    };

    return { onRequest };
});
