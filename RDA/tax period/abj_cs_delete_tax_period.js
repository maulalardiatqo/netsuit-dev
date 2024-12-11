/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/error', 'N/ui/dialog', 'N/url', "N/record", "N/currentRecord", "N/log", "N/search"],
    function (error, dialog, url, record, currentRecord, log, search) {
        function pageInit(context) {
            console.log("masuk client");
        }
        function handleDeleteTP(context){
            var currRecord = currentRecord.get();
            var selectedMonth = currRecord.getValue({ fieldId: 'custpage_month' });
            var selectedYear = currRecord.getValue({ fieldId: 'custpage_year' });

            if (selectedMonth && selectedYear) {
                var nameSearch = selectedMonth + ' ' + selectedYear;
                var userConfirm = confirm("Are you sure you want to delete the period: " + nameSearch + "?");

                if (userConfirm) {
                        var allId = [];
                        var taxperiodSearchObj = search.create({
                            type: "taxperiod",
                            filters:
                            [
                                ["periodname","contains",nameSearch]
                            ],
                            columns:
                            [
                                search.createColumn({name: "periodname", label: "Name"}),
                                search.createColumn({name: "internalid", label: "Internal ID"})
                            ]
                        });
                        var searchResultCount = taxperiodSearchObj.runPaged().count;
                        log.debug("taxperiodSearchObj result count",searchResultCount);
                        taxperiodSearchObj.run().each(function(result){
                        var internalId = result.getValue({ name: "internalid" });
                            allId.push(internalId);
                            return true;
                        });

                        console.log('allId', allId);
                        allId.forEach(someId => {
                            var idToDelete = someId;
                            console.log('idToDelete', idToDelete);
                            record.delete({
                                type: 'taxperiod',
                                id: idToDelete
                            });
                        });

                        alert("Delete Success");
                      
                    
                } else {
                    alert("Delete action canceled.");
                }
            } else {
                alert("Please select month and year to delete.");
            }
        }
        function handleDeleteAP(context) {
            // Ambil record saat ini
            var currRecord = currentRecord.get();
            var selectedMonth = currRecord.getValue({ fieldId: 'custpage_month' });
            var selectedYear = currRecord.getValue({ fieldId: 'custpage_year' });
        
            if (selectedMonth && selectedYear) {
                var nameSearch = selectedMonth + ' ' + selectedYear;
                var userConfirm = confirm("Are you sure you want to delete the period: " + nameSearch + "?");
        
                if (userConfirm) {
                    var allId = [];
                    var taxperiodSearchObj = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "contains", nameSearch]
                        ],
                        columns: [
                            search.createColumn({ name: "periodname", label: "Name" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                    });
        
                    var searchResultCount = taxperiodSearchObj.runPaged().count;
                    log.debug("taxperiodSearchObj result count", searchResultCount);
        
                    taxperiodSearchObj.run().each(function (result) {
                        var internalId = result.getValue({ name: "internalid" });
                        allId.push(internalId);
                        return true;
                    });
        
                    console.log('allId', allId);
                    var errors = []; // Array untuk mencatat ID yang gagal dihapus
        
                    allId.forEach(someId => {
                        try {
                            var idToDelete = someId;
                            console.log('idToDelete', idToDelete);
                            record.delete({
                                type: 'accountingperiod',
                                id: idToDelete
                            });
                        } catch (error) {
                            log.error("Error deleting ID", { id: someId, message: error.message });
                            errors.push({ id: someId, message: error.message }); // Simpan error ke array
                        }
                    });
        
                    if (errors.length > 0) {
                        alert("Delete completed with some errors. Check logs for details.");
                        console.log('Errors:', errors);
                    } else {
                        alert("Delete Success");
                    }
        
                } else {
                    alert("Delete action canceled.");
                }
            } else {
                alert("Please select month and year to delete.");
            }
        }
        

        return {
            pageInit: pageInit,
            handleDeleteAP: handleDeleteAP,
            handleDeleteTP : handleDeleteTP
        };
    });
