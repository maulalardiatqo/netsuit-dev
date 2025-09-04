/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    const btn = document.getElementById('tr_custpageworkflow252');
        console.log('btn', btn)
        if (btn) {
            btn.style.display = 'none';
        }
    const pageInit = () => {
        
    };
    return { pageInit };
});
