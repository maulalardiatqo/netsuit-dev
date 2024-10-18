/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/log", "N/search"],
    function (error, dialog, url, record, currentRecord, log, search) {
        function pageInit(context) {
            console.log("masuk client");
        }

        function handleDelete(context) {
            var currRecord = currentRecord.get();
            var selectedMonth = currRecord.getValue({ fieldId: 'custpage_month' });
            var selectedYear = currRecord.getValue({ fieldId: 'custpage_year' });

            if (selectedMonth && selectedYear) {
                var nameSearch = selectedMonth + ' ' + selectedYear;
                var userConfirm = confirm("Are you sure you want to delete the period: " + nameSearch + "?");

                if (userConfirm) {
                    dialog.alert({
                        title: 'Processing',
                        message: 'The deletion process is currently ongoing. Please wait...'
                    }).then(function() {
                        var accountingperiodSearchObj = search.create({
                            type: "accountingperiod",
                            filters: [
                                ["periodname", "is", nameSearch]
                            ],
                            columns: [
                                search.createColumn({ name: "periodname", label: "Name" }),
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "fiscalcalendar", label: "fiscalcalendar" })
                            ]
                        });

                        var searchResults = accountingperiodSearchObj.run().getRange({ start: 0, end: 1 });

                        if (searchResults.length > 0) {
                            var idMonth = searchResults[0].getValue({ name: 'internalid' });
                            var allId = [];
                            var accountingperiodSearchObj = search.create({
                                type: "accountingperiod",
                                filters: [
                                    ["parent", "anyof", idMonth]
                                ],
                                columns: [
                                    search.createColumn({ name: "periodname", label: "Name" }),
                                    search.createColumn({ name: "internalid", label: "Internal ID" })
                                ]
                            });

                            var searchResultCount = accountingperiodSearchObj.runPaged().count;
                            log.debug("accountingperiodSearchObj result count", searchResultCount);
                            accountingperiodSearchObj.run().each(function (data) {
                                var internalId = data.getValue({ name: "internalid" });
                                allId.push(internalId);
                                return true;
                            });

                            console.log('allId', allId);
                            allId.forEach(someId => {
                                var idToDelete = someId;
                                console.log('idToDelete', idToDelete);
                                record.delete({
                                    type: 'accountingperiod',
                                    id: idToDelete
                                });
                            });

                            alert("Delete Success");
                        } else {
                            alert("Period Does Not Exist!");
                        }
                    });
                } else {
                    alert("Delete action canceled.");
                }
            } else {
                alert("Please select month and year to delete.");
            }
        }

        return {
            pageInit: pageInit,
            handleDelete: handleDelete
        };
    });
