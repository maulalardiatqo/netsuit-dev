/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], (serverWidget, search) => {
    const SEARCH_CONFIG = {
        title: 'Transaction Summary Report',
        sublistId: 'custpage_report_sublist',
        pageSize: 1000
    };

    /**
     * Renders a Suitelet report based on grouped transaction search results.
     *
     * @param {Object} context - Suitelet execution context.
     * @param {Object} context.request - Incoming request.
     * @param {Object} context.response - Outgoing response.
     */
    const onRequest = context => {
        const form = serverWidget.createForm({
            title: SEARCH_CONFIG.title
        });

        form.addSubmitButton({
            label: 'Refresh'
        });

        const summaryField = form.addField({
            id: 'custpage_report_summary',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Summary'
        });

        const reportSublist = form.addSublist({
            id: SEARCH_CONFIG.sublistId,
            type: serverWidget.SublistType.LIST,
            label: 'Report Results'
        });

        addSublistFields(reportSublist);

        const results = getReportResults();
        populateSublist(reportSublist, results);

        summaryField.defaultValue = buildSummaryHtml(results.length);

        context.response.writePage(form);
    };

    /**
     * Builds the transaction search that powers the report.
     *
     * @returns {search.Search} Configured transaction search.
     */
    const createTransactionSearch = () =>
        search.create({
            type: 'transaction',
            filters: [
                ['posting', 'is', 'T'],
                'AND',
                ['amount', 'greaterthan', '0.00'],
                'AND',
                ['postingperiod', 'abs', '60']
            ],
            columns: [
                search.createColumn({
                    name: 'account',
                    summary: search.Summary.GROUP,
                    label: 'Account'
                }),
                search.createColumn({
                    name: 'department',
                    summary: search.Summary.GROUP,
                    label: 'Cost Center'
                }),
                search.createColumn({
                    name: 'class',
                    summary: search.Summary.GROUP,
                    label: 'Project Code'
                }),
                search.createColumn({
                    name: 'amount',
                    summary: search.Summary.SUM,
                    label: 'Amount'
                }),
                search.createColumn({
                    name: 'postingperiod',
                    summary: search.Summary.GROUP,
                    label: 'Period'
                }),
                search.createColumn({
                    name: 'custrecord_stc_account_cam_mapping',
                    join: 'account',
                    summary: search.Summary.GROUP,
                    label: 'CAM Account Mapping'
                })
            ]
        });

    /**
     * Reads all search results using paged data to avoid the 4,000 row .each() limit.
     *
     * @returns {Array<Object>} Normalized report rows.
     */
    const getReportResults = () => {
        const transactionSearch = createTransactionSearch();
        const pagedData = transactionSearch.runPaged({
            pageSize: SEARCH_CONFIG.pageSize
        });
        const results = [];

        pagedData.pageRanges.forEach(pageRange => {
            const page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(result => {
                results.push({
                    account: getResultTextOrValue(result, 'account', search.Summary.GROUP),
                    department: getResultTextOrValue(result, 'department', search.Summary.GROUP),
                    className: getResultTextOrValue(result, 'class', search.Summary.GROUP),
                    amount: result.getValue({
                        name: 'amount',
                        summary: search.Summary.SUM
                    }),
                    postingPeriod: getResultTextOrValue(result, 'postingperiod', search.Summary.GROUP),
                    camAccountMapping: getResultTextOrValue(
                        result,
                        'custrecord_stc_account_cam_mapping',
                        search.Summary.GROUP,
                        'account'
                    )
                });
            });
        });

        return results;
    };

    /**
     * Adds report columns to the Suitelet sublist.
     *
     * @param {serverWidget.Sublist} sublist - Target sublist.
     */
    const addSublistFields = sublist => {
        sublist.addField({
            id: 'custpage_col_account',
            type: serverWidget.FieldType.TEXT,
            label: 'Account'
        });

        sublist.addField({
            id: 'custpage_col_department',
            type: serverWidget.FieldType.TEXT,
            label: 'Cost Center'
        });

        sublist.addField({
            id: 'custpage_col_class',
            type: serverWidget.FieldType.TEXT,
            label: 'Project Code'
        });

        sublist.addField({
            id: 'custpage_col_amount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Amount'
        });

        sublist.addField({
            id: 'custpage_col_period',
            type: serverWidget.FieldType.TEXT,
            label: 'Period'
        });

        sublist.addField({
            id: 'custpage_col_cam_mapping',
            type: serverWidget.FieldType.TEXT,
            label: 'CAM Account Mapping'
        });
    };

    /**
     * Populates the Suitelet sublist with report data.
     *
     * @param {serverWidget.Sublist} sublist - Target sublist.
     * @param {Array<Object>} results - Report rows.
     */
    const populateSublist = (sublist, results) => {
        results.forEach((row, line) => {
            setSublistText(sublist, 'custpage_col_account', line, row.account);
            setSublistText(sublist, 'custpage_col_department', line, row.department);
            setSublistText(sublist, 'custpage_col_class', line, row.className);
            setSublistText(sublist, 'custpage_col_amount', line, formatCurrencyValue(row.amount));
            setSublistText(sublist, 'custpage_col_period', line, row.postingPeriod);
            setSublistText(sublist, 'custpage_col_cam_mapping', line, row.camAccountMapping);
        });
    };

    /**
     * Sets a text value on a sublist field when a value is present.
     *
     * @param {serverWidget.Sublist} sublist - Target sublist.
     * @param {string} fieldId - Sublist field ID.
     * @param {number} line - Zero-based line number.
     * @param {string} value - Value to set.
     */
    const setSublistText = (sublist, fieldId, line, value) => {
        sublist.setSublistValue({
            id: fieldId,
            line,
            value: normalizeDisplayValue(value)
        });
    };

    /**
     * Gets search result text first, then falls back to raw value.
     *
     * @param {search.Result} result - Search result row.
     * @param {string} name - Column name.
     * @param {string} summary - Summary type.
     * @param {string} [join] - Optional join ID.
     * @returns {string} Displayable value.
     */
    const getResultTextOrValue = (result, name, summary, join) => {
        const textValue = result.getText({
            name,
            join,
            summary
        });

        if (textValue) {
            return textValue;
        }

        const rawValue = result.getValue({
            name,
            join,
            summary
        });

        return normalizeDisplayValue(rawValue);
    };

    /**
     * Formats amount values for currency sublist fields.
     *
     * @param {string|number|null} value - Raw amount.
     * @returns {string} Amount ready for display.
     */
    const formatCurrencyValue = value => {
        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return '0.00';
        }

        return numericValue.toFixed(2);
    };

    /**
     * Normalizes values for safe Suitelet display.
     *
     * @param {string|number|boolean|null|undefined} value - Raw value.
     * @returns {string} Display-safe value.
     */
    const normalizeDisplayValue = value => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        return String(value);
    };

    /**
     * Builds the summary banner shown above the report.
     *
     * @param {number} rowCount - Number of rows returned.
     * @returns {string} Inline HTML markup.
     */
    const buildSummaryHtml = rowCount => `
        <div style="font-family: Arial, sans-serif; padding: 12px 0 18px; line-height: 1.6;">
            <div style="padding: 16px; background: #f8fafc; border: 1px solid #dbeafe; border-radius: 8px;">
                <h3 style="margin: 0 0 8px; color: #1f2937;">Transaction Summary Report</h3>
                <p style="margin: 0; color: #4b5563;">
                    Report ini menampilkan data grouped berdasarkan Account, Cost Center, Project Code, Period,
                    dan CAM Account Mapping untuk transaksi posting dengan amount > 0 pada posting period internal ID 60.
                </p>
                <p style="margin: 8px 0 0; color: #111827;">
                    <strong>Total baris:</strong> ${rowCount}
                </p>
            </div>
        </div>
    `;

    return {
        onRequest
    };
});
