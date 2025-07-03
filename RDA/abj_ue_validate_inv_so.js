/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/error'], (search, error) => {
    const beforeSubmit = (context) => {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;

        const invoice = context.newRecord;
        const createdFrom = invoice.getValue('createdfrom');
        if(createdFrom){
            const result = search.lookupFields({
                type: 'transaction',
                id: createdFrom,
                columns: ['recordtype', 'tranid']
            });

            const recordType = result.recordtype;
            const tranid = result.tranid;
            log.debug('Created From Type', recordType);
            log.debug('Transaction ID (tranid)', tranid);
            if (recordType === 'salesorder'){
                log.debug('Entered Condition')
                const invoiceLineCount = invoice.getLineCount({ sublistId: 'item' });

                const invoiceLineMap = {};

                for (let i = 0; i < invoiceLineCount; i++) {
                    const orderLine = invoice.getSublistValue({ sublistId: 'item', fieldId: 'orderline', line: i });
                    log.debug('orderLine', orderLine)
                    if (!orderLine) {
                        var message = 'Warning! You are not allowed to add a line that is not from the related Sales Order.';
                        throw message;
                    }

                    invoiceLineMap[orderLine] = {
                        item: invoice.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
                        quantity: parseFloat(invoice.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || 0),
                        amount: parseFloat(invoice.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) || 0)
                    };
                }

                const soLineMap = {};
                const soSearch = search.create({
                    type: "salesorder",
                    settings: [
                        { name: "consolidationtype", value: "ACCTTYPE" },
                        { name: "includeperiodendtransactions", value: "F" }
                    ],
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["customgl", "is", "F"],
                        "AND",
                        ["internalid", "anyof", createdFrom]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", join: "item", label: "Internal ID" }),
                        search.createColumn({ name: "line", label: "Line ID" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({ name: "amount", label: "Amount" })
                    ]
                });

                soSearch.run().each(result => {
                    const lineId = result.getValue({ name: 'line' });
                    soLineMap[lineId] = {
                        item: result.getValue({ name: 'internalid', join: 'item' }),
                        quantity: parseFloat(result.getValue({ name: 'quantity' }) || 0),
                        amount: parseFloat(result.getValue({ name: 'amount' }) || 0)
                    };
                    return true;
                });

                for (const orderLine in invoiceLineMap) {
                    const invLine = invoiceLineMap[orderLine];
                    const soLine = soLineMap[orderLine];

                    if (!soLine) {
                        var message = 'SO line not found.';
                        throw message;
                    }

                    if (parseInt(invLine.item) !== parseInt(soLine.item)) {
                        var message = 'Item in the Invoice does not match the Item in the Sales Order.';
                        throw message;
                    }
                    var invQty = invLine.quantity
                    var soQTy = soLine.quantity
                    log.debug('data banding qty', {invQty : invQty, soQTy : soQTy} )
                    if (invLine.quantity > soLine.quantity) {
                        var message = `Invoice quantity on line ${orderLine} (${invLine.quantity}) exceeds the Sales Order quantity (${soLine.quantity}).`;
                        throw message;
                    }
                    log.debug('soLine AMount', soLine.amount);
                    log.debug('invLine Amount', invLine.amount)
                    const toInteger = (val) => {
                    const num = Number(val);
                    if (isNaN(num)) return NaN;
                        return Math.trunc(num); 
                    };

                    const invAmount = toInteger(invLine.amount);
                    const soAmount = toInteger(soLine.amount);

                    if (isNaN(invAmount) || isNaN(soAmount)) {
                        throw new Error(`Invalid numeric value on line ${orderLine}.`);
                    }
                    log.debug('perbandingan data amount', {invAmount : invAmount, soAmount : soAmount})
                    if (Math.abs(invAmount) > Math.abs(soAmount)) {
                        const message = `Invoice amount on line ${orderLine} (${invAmount}) exceeds the Sales Order amount (${soAmount}).`;
                        throw message;
                    }
                }
            }
         
        }
        
        
    };

    return { beforeSubmit };
});
