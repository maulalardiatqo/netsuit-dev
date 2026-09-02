/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function(currentRecord) {

    function lineInit(context) {
        var sublistId = 'recmachcustrecord_tori_id';
        
        if (context.sublistId !== sublistId) {
            return;
        }

        setTimeout(function() {
            var removeBtn = document.getElementById(sublistId + '_remove');
            var expCopy = document.getElementById('expense_copy')
            console.log('removeBtn', removeBtn)
            console.log('expCopy', expCopy)
            if (removeBtn && !document.getElementById('expense_copy')) {
                
                var copyBtn = document.createElement('input');
                copyBtn.type = 'button';
                copyBtn.id = 'expense_copy';
                copyBtn.name = 'expense_copy';
                
                copyBtn.value = '📄 Make Copy'; 
                copyBtn.className = 'nlinlineeditbutton bntBgT'; 
                
                copyBtn.style.backgroundImage = 'none';
                copyBtn.style.color = '#333333';
                copyBtn.style.fontWeight = 'bold';
                
                copyBtn.setAttribute('onmousedown', "this.setAttribute('_mousedown','T'); setButtonDown(true, true, this);");
                copyBtn.setAttribute('onmouseup', "this.setAttribute('_mousedown','F'); setButtonDown(false, true, this);");
                copyBtn.setAttribute('onmouseout', "if(this.getAttribute('_mousedown')=='T') setButtonDown(false, true, this);");
                copyBtn.setAttribute('onmouseover', "if(this.getAttribute('_mousedown')=='T') setButtonDown(true, true, this);");
                copyBtn.setAttribute('_mousedown', 'F');
                
                copyBtn.addEventListener('click', function(e) {
                    e.preventDefault(); 
                    copyCurrentLine(); 
                });
                
                var tdElem = removeBtn.closest('td'); 
                console.log('tdElem', tdElem);

                if (tdElem) {
                    console.log('masuk kondisi');
                    var newTd = document.createElement('td');
                    newTd.style.paddingLeft = '4px'; 
                    newTd.style.paddingRight = '4px'; 
                    newTd.appendChild(copyBtn);
                    
                    // Sisipkan <td> baru tepat setelah <td> yang berisi tombol remove
                    tdElem.parentNode.insertBefore(newTd, tdElem.nextSibling);
                    }
            }
        }, 200); 
    }
    function copyCurrentLine() {
        var rec = currentRecord.get();
        var sublistId = 'recmachcustrecord_tori_id'; 
        
        var fieldsToCopy = [
            'custrecord_tori_item', 
            'custrecord_tor_transaction_type', 
            'custrecord_tor_quantity', 
            'custrecord_tor_description', 
            'custrecord_tori_cost_center', 
            'custrecord_tori_project_code', 
            'custrecord_tor_project',      
            'custrecord_tor_activity_code', 
            'custrecord_stc_tor_justification', 
            'custrecord_tor_rpv_vendor', 
            'custrecord_tori_source_of_funding', 
            'custrecord_tor_drc',          
            'custrecord_tor_dea'
        ]; 
        
        var delayedFields = [
            'custrecord_tor_uom', 
            'custrecord_tor_project_task',
            'custrecord_tor_unit_cost',
            'custrecord_tori_amount'
        ];
        
        var copiedData = {};
        for (var i = 0; i < fieldsToCopy.length; i++) {
            var val = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: fieldsToCopy[i] });
            copiedData[fieldsToCopy[i]] = (val !== null && val !== undefined) ? val : '';
        }

        var delayedData = {};
        for (var k = 0; k < delayedFields.length; k++) {
            var valDel = rec.getCurrentSublistValue({ sublistId: sublistId, fieldId: delayedFields[k] });
            delayedData[delayedFields[k]] = (valDel !== null && valDel !== undefined) ? valDel : '';
        }
        
        try {
            rec.commitLine({ sublistId: sublistId });
        } catch (e) {
            alert('Harap lengkapi field wajib (mandatory) pada baris ini sebelum melakukan copy.');
            return; 
        }
        
        rec.selectNewLine({ sublistId: sublistId });
        
        for (var j = 0; j < fieldsToCopy.length; j++) {
            console.log('Paste Utama: ' + fieldsToCopy[j] + ' | Value: ' + copiedData[fieldsToCopy[j]]);
            rec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldsToCopy[j],
                value: copiedData[fieldsToCopy[j]], 
                ignoreFieldChange: false 
            });
        }

        setTimeout(function() {
            for (var m = 0; m < delayedFields.length; m++) {
                if (delayedData[delayedFields[m]] !== '') {
                    console.log('Paste Delay: ' + delayedFields[m] + ' | Value: ' + delayedData[delayedFields[m]]);
                    rec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: delayedFields[m],
                        value: delayedData[delayedFields[m]],
                        ignoreFieldChange: false
                    });
                }
            }
        }, 1000); 
    }
    return {
        lineInit: lineInit
    };
});