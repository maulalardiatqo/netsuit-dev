/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/search', 'N/error'], function(search, error) {

    function _get(context) {
        try {
            log.debug("Request Params", context);
            if (!context.integration_type || !context.record_type) {
                throw error.create({
                    name: 'MISSING_PARAM',
                    message: 'integration_type and record_type is mandatory.'
                });
            }
            var configSearch = search.create({
                type: "customrecord_int_fld_restriction_holder",
                filters: [
                    ['custrecord_integration_source', 'is', context.integration_type],
                    "AND",
                    ['custrecord_rec_type', 'is', context.record_type] 
                ],
                columns: ['custrecord_flds_to_retrieve', 'custrecord1']
            });

            var configResult = configSearch.run().getRange({ start: 0, end: 1 });

            if (configResult.length === 0) {
                throw error.create({
                    name: 'CONFIG_NOT_FOUND',
                    message: 'config not found for: ' + context.integration_type + ' & Record: ' + context.record_type
                });
            }

            var req_fields = configResult[0].getValue('custrecord_flds_to_retrieve');
            var additionalFilterRaw = configResult[0].getValue('custrecord1'); 
            
            log.debug("Fields to retrieve", req_fields);

            var req_cols = req_fields.split(',');
            var _columns = [];

            req_cols.forEach(function(fieldRaw) {
                var f = fieldRaw.trim();
                if (f) {
                    if (f.indexOf('.') > -1) {
                        var parts = f.split('.');
                        _columns.push(search.createColumn({
                            join: parts[0],
                            name: parts[1]
                        }));
                    } else {
                        _columns.push(search.createColumn({
                            name: f
                        }));
                    }
                }
            });

            var searchFilters = []; 

            if (additionalFilterRaw) {
                try {
                    var parsedFilters = JSON.parse('[' + additionalFilterRaw + ']');
                    
                    parsedFilters.forEach(function(filter, index) {
                        if (index > 0) {
                            searchFilters.push("AND");
                        }
                        searchFilters.push(filter);
                    });
                } catch (e) {
                    log.error("FILTER_PARSE_ERROR", "Failed To Parsing custrecord1: " + additionalFilterRaw);
                }
            }
            
            log.debug('searchFilters Final', JSON.stringify(searchFilters));

            var dynamicSearch = search.create({
                type: context.record_type, 
                filters: searchFilters,
                columns: _columns
            });

            var pageSize = parseInt(context.pageSize, 10) || 10;
            var pageIndex = parseInt(context.pageIndex, 10) || 0;

            var pagedData = dynamicSearch.runPaged({
                pageSize: pageSize
            });

            var totalPages = pagedData.pageRanges.length;

            if (pageIndex >= totalPages && totalPages > 0) {
                return {
                    status: 'FAILED',
                    message: 'pageIndex out of range',
                    totalPages: totalPages
                };
            }

            var page = pagedData.fetch({ index: pageIndex });
            var results = [];

            page.data.forEach(function(row) {
                var rowData = {};
                _columns.forEach(function(col) {
                    var key = col.join ? (col.join + '_' + col.name) : col.name;
                    rowData[key] = row.getValue(col);
                });

                results.push(rowData);
            });

            return {
                status: 'SUCCESS',
                pageIndex: pageIndex,
                pageSize: pageSize,
                totalPages: totalPages,
                totalResults: pagedData.count,
                data: results 
            };

        } catch (ex) {
            log.error(ex.name, ex.message);
            return {
                status: 'FAILED',
                error_name: ex.name,
                message: ex.message
            };
        }
    }

    return {
        get: _get
    };
});