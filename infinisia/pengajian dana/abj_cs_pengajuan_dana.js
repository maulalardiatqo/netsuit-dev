/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
        const customLink = document.getElementById('recmachcustrecord_fund_journaltxt');
        console.log('customLink', customLink)
        if (customLink) {
            customLink.style.display = 'none';
        }
   const pageInit = () => {

    };
    return { pageInit };
});
