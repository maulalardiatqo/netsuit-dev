/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {

    /**
     * Disable Auto Name field ketika Create
     * @param {Object} context
     */
    const pageInit = (context) => {
        if (context.mode !== 'create') {
            console.log('masuk kondisi')
            return;
        }

        const autoNameField = context.currentRecord.getField({
            fieldId: 'autoname'
        });
        console.log('autoNameField', autoNameField)
        if (autoNameField) {
            autoNameField.isDisabled = true;
        }
    };

    return {
        pageInit
    };
});