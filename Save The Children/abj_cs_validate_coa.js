/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/dialog', 'N/log', 'N/runtime'], (search, dialog, log, runtime) => {

    const CACHE = {
        accounts: {},
        items: {}
    };

    const FIELDS = {
        JE_SUBLIST: 'line',
        TRX_SUBLIST: 'item',
        EXPENSE_SUBLIST: 'expense', 
        ACCOUNT: {
            STAFF_CHECK: 'custrecord_stc_staff_id',
            FA_SHOW: 'custrecord_fam_account_showinfixedasset',
            PROP_CODE: 'custrecord_stc_property_code_'
        },
        ITEM: {
            EXP_ACCOUNT: 'expenseaccount'
        },
        LINE: {
            ACCOUNT: 'account',
            ITEM: 'item',
            ENTITY: 'entity',
            REL_ASSET: 'custcol_far_trn_relatedasset'
        }
    };

    const getAccountData = (accountId) => {
        if (!accountId) return null;
        if (CACHE.accounts[accountId]) return CACHE.accounts[accountId];

        try {
            const lookups = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountId,
                columns: [
                    FIELDS.ACCOUNT.STAFF_CHECK,
                    FIELDS.ACCOUNT.FA_SHOW,
                    FIELDS.ACCOUNT.PROP_CODE
                ]
            });
            CACHE.accounts[accountId] = lookups;
            return lookups;
        } catch (e) {
            console.error('Error lookup Account:', e);
            return null;
        }
    };

    const getItemExpenseAccount = (itemId) => {
        if (!itemId) return null;
        if (CACHE.items[itemId]) return CACHE.items[itemId];

        try {
            const lookups = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: [FIELDS.ITEM.EXP_ACCOUNT]
            });
            
            const expAcc = lookups[FIELDS.ITEM.EXP_ACCOUNT] ? lookups[FIELDS.ITEM.EXP_ACCOUNT][0].value : null;
            CACHE.items[itemId] = expAcc;
            return expAcc;
        } catch (e) {
            console.error('Error lookup Item:', e);
            return null;
        }
    };

    const runValidation = (context, isSave = false) => {
        const currRecord = context.currentRecord;
        const sublistId = context.sublistId;
        const recType = currRecord.type;
        
        let accountId = null;
        if (recType === 'journalentry' && sublistId === FIELDS.JE_SUBLIST) {
            
            accountId = currRecord.getCurrentSublistValue({ sublistId, fieldId: FIELDS.LINE.ACCOUNT });
        } 
        else if (recType === 'vendorbill' || recType === 'check') {
            if (sublistId === FIELDS.TRX_SUBLIST) {
                const itemId = currRecord.getCurrentSublistValue({ sublistId, fieldId: FIELDS.LINE.ITEM });
                accountId = getItemExpenseAccount(itemId);
            } else if (sublistId === FIELDS.EXPENSE_SUBLIST) {
                accountId = currRecord.getCurrentSublistValue({ sublistId, fieldId: FIELDS.LINE.ACCOUNT });
            }
        }

        if (!accountId) return true; 

        const accData = getAccountData(accountId);
        if (!accData) return true;

        if (recType === 'journalentry') {
            const isStaff = accData[FIELDS.ACCOUNT.STAFF_CHECK];
            const entityVal = currRecord.getCurrentSublistValue({ sublistId, fieldId: FIELDS.LINE.ENTITY });

            if (isStaff === true && !entityVal) {
                alert(' Please Enter Name First '); 
                return false;
            }
        }

        // --- VALIDASI 2: Fixed Asset Logic ---
        let faShow = accData[FIELDS.ACCOUNT.FA_SHOW]; 
        if (Array.isArray(faShow) && faShow.length > 0) faShow = faShow[0].value; 
        
        const isPropCode = accData[FIELDS.ACCOUNT.PROP_CODE];
        log.debug('faShow', faShow)
        if ((faShow.length > 0) || isPropCode === true) {
            log.debug('masuk kondisi')
            const relAsset = currRecord.getCurrentSublistValue({ sublistId, fieldId: FIELDS.LINE.REL_ASSET });
            
            if (!relAsset) {
                alert('Please Enter the Related Asset Field');
                return false;
            }
        }

        return true;
    };

    const validateLine = (context) => {
        try {
            const currentRecord = context.currentRecord;
            const recType = currentRecord.type;
            const sublist = context.sublistId;
            
            var currentUser = runtime.getCurrentUser();
            var roleUser = currentUser.role;
            log.debug('ROLE', roleUser);

            var cFrom = currentRecord.getValue('customform');

            if (recType === 'journalentry') {
                const allowedRoles = ['3', '1120', '1121', '1122', '1115', '1117'];
                const isAllowedRole = allowedRoles.indexOf(roleUser.toString()) !== -1;

                if (isAllowedRole && sublist !== FIELDS.JE_SUBLIST) {
                    return true;
                }

                if (cFrom == '140' || cFrom == '141') {
                    return true;
                }
            }

            if ((recType === 'vendorbill' || recType === 'check')) {
                if (sublist !== FIELDS.TRX_SUBLIST && sublist !== FIELDS.EXPENSE_SUBLIST) return true;
            }

            return runValidation(context);

        } catch (e) {
            log.error('ValidateLine Error', e);
            return true; 
        }
    };

    const saveRecord = (context) => {
        try {
            const rec = context.currentRecord;
            const recType = rec.type;
            
            let sublistsToCheck = [];

            if (recType === 'journalentry') {
                sublistsToCheck.push(FIELDS.JE_SUBLIST);
            } else if (recType === 'vendorbill' || recType === 'check') {
                sublistsToCheck.push(FIELDS.TRX_SUBLIST);     
                sublistsToCheck.push(FIELDS.EXPENSE_SUBLIST); 
            } else {
                return true;
            }

            for (let s = 0; s < sublistsToCheck.length; s++) {
                const currentSublist = sublistsToCheck[s];
                const lineCount = rec.getLineCount({ sublistId: currentSublist });

                for (let i = 0; i < lineCount; i++) {
                    rec.selectLine({ sublistId: currentSublist, line: i });
                    
                    const mockContext = { currentRecord: rec, sublistId: currentSublist };
                    
                    if (!runValidation(mockContext, true)) {
                        return false; 
                    }
                }
            }
            return true;
        } catch (e) {
            console.error('SaveRecord Error', e);
            return true;
        }
    };

    return {
        validateLine: validateLine,
        saveRecord: saveRecord
    };
});