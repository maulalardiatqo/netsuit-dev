/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 **/
define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/search', 'N/format', 'N/error'], function(serverWidget, file, record, search, format, error) {
	function onRequest(context)
	{
		var reqObj	= context.request;
		try {
			if(reqObj.method == "GET") {
				var recId				= context.request.parameters.recordId;
				var recType				= context.request.parameters.recordType;
				log.debug({title:"recId", details: recId});
				var buttonType			= context.request.parameters.Button_Type;
				log.debug({title:"buttonType", details: buttonType});
				if(buttonType == 'Import') {
					var form				= serverWidget.createForm({title: "Import Serial/Lot Number"});
					var InsertFile			= form.addField({id: "custpage_insert_file", label: "Insert File", type: serverWidget.FieldType.FILE});
					var recId_field			= form.addField({id: "custpage_po_recid", label: "PO Rec Id", type: serverWidget.FieldType.SELECT, source: 'transaction'});
					recId_field.defaultValue= Number(recId);
					recId_field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
					var submitButton		= form.addSubmitButton({id: "custpage_sub_butt", label:"Submit"});
					context.response.writePage({pageObject: form});
				}
				else if(buttonType == 'Export') {
					var MainLine = "PO ID" + ',' + "Line ID" + ',' + "Item Name" + ',' + "Quantity" + "," + "Remaining Quantity" + "," + "Quantity To Receive" + "," + "Lot/Serial Number" + "," + "Lot Expiration Date"
					var poRecLoad	= record.load({type: recType, id: recId});
					var getLineCnt	= poRecLoad.getLineCount('item');
					log.debug("getLineCnt ",getLineCnt);
					for(var s=0; s<getLineCnt; s++) {
						var itemType		= poRecLoad.getSublistValue({sublistId: 'item',fieldId: 'itemtype',line: s});
						if(itemType != "Group" && itemType != "EndGroup") {
							var itemLineId		= poRecLoad.getSublistValue({sublistId: 'item',fieldId: 'line',line: s});
							var itemName		= poRecLoad.getSublistText({sublistId: 'item',fieldId: 'item',line: s});
							var itemQuantity	= poRecLoad.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: s});
							var recQuantity		= poRecLoad.getSublistValue({sublistId: 'item',fieldId: 'quantityreceived',line: s});
							var qtyToFulfill	= Number(itemQuantity) - Number(recQuantity);
							log.debug({title:"PO Line Details", details: "Item Line Id = "+itemLineId+",  Item Name = "+itemName+", Item Quantity = "+itemQuantity+", Rec Quantity = "+recQuantity+", Quantity To Fullfill= "+qtyToFulfill});
                          	if(qtyToFulfill > 0) {
								LineItems			= recId + ',' + itemLineId + ',' + itemName + ',' + itemQuantity + "," + qtyToFulfill;
								MainLine 			= MainLine + "\n" + LineItems;
                            }
						}
					}
					/*var purchaseorderSearchObj = search.create({
						type: "purchaseorder",
						filters:
						[
							["type","anyof","PurchOrd"], 
							"AND", 
							["internalid","anyof",recId], 
							"AND", 
							["mainline","is","F"], 
							"AND", 
							["taxline","is","F"], 
							"AND", 
							["cogs","is","F"]
						],
						columns:
						[
							search.createColumn({name: "internalid"}),
							search.createColumn({name: "line"}),
							search.createColumn({name: "itemid",join: "item"}),
							search.createColumn({name: "quantity"}),
							search.createColumn({name: "quantityshiprecv"}),
							search.createColumn({name: "formulanumeric",formula: "{quantity} - {quantityshiprecv}"})
						]
					});
					var searchResultCount = purchaseorderSearchObj.runPaged().count;
					log.debug("purchaseorderSearchObj result count",searchResultCount);
					var LineItems			= "";
					purchaseorderSearchObj.run().each(function(result){
						var poIntId			= result.getValue({name: "internalid"});
						var itemLineId		= result.getValue({name: "line"});
						var itemName		= result.getValue({name: "itemid",join: "item"});
						var itemQuantity	= result.getValue({name: "quantity"});
						var recQuantity		= result.getValue({name: "quantityshiprecv"});
						var qtyToFulfill	= result.getValue({name: "formulanumeric",formula: "{quantity} - {quantityshiprecv}"});
						
						LineItems			= poIntId + ',' + itemLineId + ',' + itemName + ',' + itemQuantity + "," + qtyToFulfill;
						MainLine 			= MainLine + "\n" + LineItems;
						return true;
					});*/
					var fileName			= "Import_File_"+new Date()+".csv";
					var fileObj 			= file.create({name: fileName,fileType: file.Type.CSV,contents: MainLine});
					context.response.writeFile({file: fileObj, isInline: true});
				}
			}
			else {
				var poRecId				= context.request.parameters['custpage_po_recid'];
				log.debug({title:"Inside Post poRecId", details: poRecId});
				var fileObj				= context.request.files['custpage_insert_file'];
				
				var poLookUp			= search.lookupFields({type: 'purchaseorder',id: Number(poRecId),columns: ['location']});
				log.debug({title: "poLookUp", details: poLookUp});
				var locationObj			= poLookUp.location[0].value;
				if(_dataValidation(fileObj)) {
					fileObj.folder	= 338; //replace with own folder ID
					var file_id		= fileObj.save();
					log.debug({title:"file_id", details: file_id});
					//File Iteration to get line wise data
					if(_dataValidation(file_id)) {
						var fileObj			= file.load({id: file_id});
						log.debug({ title: 'fileObj first: ', details: fileObj});
						var fileName		= fileObj.name;
						log.debug({ title: 'fileName: ', details: fileName});
						var fileContents	= fileObj.getContents();
						log.debug(' File Contents -->',fileContents);
						
						if(fileContents)	{	
							var fileContentsSplit	= fileContents.split('\n');
							log.debug('File Contents Split', fileContentsSplit);
							var fileLineCount		= fileContentsSplit.length;
							log.debug('File Line Count',fileLineCount);
							var fileRowObj			= '';
							var itemLineId			= '';
							var serLotNum			= '';
							var quantity			= '';
							var itemIntId			= '';
							var locObj				= '';
							var expDate				= '';
							var trecord				= record.transform({fromType: 'purchaseorder',fromId: Number(poRecId),toType: 'itemreceipt',});
							
							var csvItemObj			= {};
							var serLotObj			= {};
							var totalQuant			= {};
							var tempQuant			= 0;
							for(var i=0; i<fileLineCount; i++) {
								fileRowObj	 		= fileContentsSplit[i].split(',');
								if(i != 0 && _dataValidation(fileRowObj[0])) {//Skip first line/Header line & if item name present in file
									log.debug('fileRowObj Line No. = '+i, fileRowObj);
									itemLineId		= fileRowObj[1];
									itemNameObj		= fileRowObj[2];
									quantity		= fileRowObj[5];
									serLotNum		= fileRowObj[6];
									expDate			= fileRowObj[7];
									
									log.debug('Row Details For Line No. = '+i, " Item Line Id = "+itemLineId+"  , Searial/Lot Number  = "+serLotNum+",   Item Quantity"+quantity);
									if(Number(quantity) > 0) {
										if (csvItemObj[itemLineId])
										{
											serLotObj			 = {};
											var serLotObj = {
												serLotNumber: serLotNum,
												itemQuantity: quantity,
												expDate		: expDate
											}
											csvItemObj[itemLineId].serialArray.push(serLotObj);
											//Validation for quantity
											if(csvItemObj[itemLineId].QTY) {
												csvItemObj[itemLineId].QTY		= Number(csvItemObj[itemLineId].QTY) + Number(quantity);
											}
											else {
												csvItemObj[itemLineId].QTY		= quantity;
											}
											csvItemObj[itemLineId].itemName		= itemNameObj;
										}
										else {
											serLotObj			 = {};
											
											csvItemObj[itemLineId] = {
												serialArray: []
											}
											
											var serLotObj = {
												serLotNumber: serLotNum,
												itemQuantity: quantity,
												expDate		: expDate
											}
										
											csvItemObj[itemLineId].serialArray.push(serLotObj)
											//Validation for quantity
											if(csvItemObj[itemLineId].QTY) {
												csvItemObj[itemLineId].QTY		= Number(csvItemObj[itemLineId].QTY) + Number(quantity);
											}
											else {
												csvItemObj[itemLineId].QTY		= quantity;
											}
											csvItemObj[itemLineId].itemName		= itemNameObj;
										}
									}
								}
							}
							log.debug({ title: 'csvItemObj :  ', details: csvItemObj});
							var itemReceiptLineCnt	= trecord.getLineCount({sublistId: 'item'});
							log.debug({ title: 'itemReceiptLineCnt :  ', details: itemReceiptLineCnt});
							var poItemArray			= [];
							var remQtyFlag			= false;
							var lineIds_Array		= [];
							var bodyDet				= "";
							//Using below for loop for Item Receipt Creation as per the availabel items in CSV file
							for(var k=0; k<itemReceiptLineCnt; k++) {
								//var itemRecei_ItemId	= trecord.getSublistText({sublistId: 'item',fieldId: 'item',line: k});
								var poitemRecQTY		= trecord.getSublistValue({sublistId: 'item',fieldId: 'quantityremaining',line: k});
								var poItemLineId		= trecord.getSublistValue({sublistId: 'item',fieldId: 'orderline',line: k});
								log.debug({ title: 'Item Receipt Details :  ', details: " Remaining Quantity = "+poitemRecQTY+", Order Line Id ="+poItemLineId});
								
								//Checking if PO Item is present in CSV or not
								if(_dataValidation(csvItemObj[poItemLineId])) {
									if(Number(poitemRecQTY) >= Number(csvItemObj[poItemLineId].QTY)) {
										trecord.setSublistValue({sublistId: 'item',fieldId: 'quantity',line: k,value: csvItemObj[poItemLineId].QTY});//itemIntId_Array.indexOf(poItemLineId)
										trecord.setSublistValue({sublistId: 'item',fieldId: 'itemreceive',line: k,value: true});
										log.debug({ title: 'csvItemObj[poItemLineId].serialArray.length :  ', details: csvItemObj[poItemLineId].serialArray.length});
										//Logic to set Inventory Detail SubRecord:- Start 
										var invDetSubRecord		= trecord.getSublistSubrecord({sublistId: 'item',fieldId: 'inventorydetail',line: k});
										log.debug({ title: 'invDetSubRecord :  ', details: invDetSubRecord});
										for(var q=0; q<csvItemObj[poItemLineId].serialArray.length; q++) {
											//var lineNum 			= invDetSubRecord.selectLine({sublistId: 'inventoryassignment',line: q});
											invDetSubRecord.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', line: q, value: csvItemObj[poItemLineId].serialArray[q].itemQuantity});
											invDetSubRecord.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: q, value: csvItemObj[poItemLineId].serialArray[q].serLotNumber});
											log.debug({ title: 'csvItemObj Date:  ', details: csvItemObj[poItemLineId].serialArray[q].expDate});
											if(_dataValidation(csvItemObj[poItemLineId].serialArray[q].expDate)) {
												var splitDate		= (csvItemObj[poItemLineId].serialArray[q].expDate).split("-");
												log.debug({ title: 'splitDate :  ', details: splitDate});
												if(_dataValidation(splitDate[1])) {//Cheking if month is availabel or not
													log.debug({title: 'Entered Inside', details: "Date Condition"});
													var newDateObj		= new Date(Number(splitDate[2]), Number(splitDate[1]) - Number(1), Number(splitDate[0]));
													log.debug({ title: 'newDateObj :  ', details: newDateObj});
													invDetSubRecord.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'expirationdate', line: q, value: newDateObj});
												}
											}
										}
										//END
										//poItemArray.push(poItemLineId);
									}
									else {
										remQtyFlag		= true;
										lineIds_Array.push(poItemLineId);
										bodyDet +='<tr>';
										bodyDet +='<td style="border: 1px solid #000000; padding: 5px 4px;">'+poItemLineId+'</td>';
										bodyDet +='<td style="border: 1px solid #000000; padding: 5px 4px;">'+csvItemObj[poItemLineId].itemName+'</td>';
										bodyDet +='<td style="border: 1px solid #000000; padding: 5px 4px;">'+poitemRecQTY+'</td>';
										bodyDet +='<td style="border: 1px solid #000000; padding: 5px 4px;">'+csvItemObj[poItemLineId].QTY+'</td>';
										bodyDet +='</tr>';
										
									}
								}
								else {
									trecord.setSublistValue({sublistId: 'item',fieldId: 'itemreceive',line: k,value: false});
								}
								if(_dataValidation(locationObj)) {
									trecord.setSublistValue({sublistId: 'item',fieldId: 'location',line: k,value: locationObj});
								}
								else {
									trecord.setSublistValue({sublistId: 'item',fieldId: 'location',line: k,value: 2});
								}
							}
							/*log.debug({title: 'poItemArray', details: poItemArray});
							log.debug({ title: 'csvItemObj length:  ', details: Object.keys(csvItemObj).length});
							//Using below for loop to show item that are not present in PO but in CSV file
							var itemNotInPo_Arr		= [];
							for(var k=0; k<Object.keys(csvItemObj).length; k++) {
								log.debug({title: 'csvItemObj['+k+']', details: (Object.keys(csvItemObj))[k]});
								if(poItemArray.indexOf((Object.keys(csvItemObj))[k]) == -1) {
									itemNotInPo_Arr.push((Object.keys(csvItemObj))[k]);
								}
							}
							log.debug({title: 'itemNotInPo_Arr', details: itemNotInPo_Arr});*/
							try {
								if(!remQtyFlag) {//itemNotInPo_Arr.length == 0 && 
									var itemReceiptId 		= trecord.save({enableSourcing: true});
									log.debug('itemReceiptId = ', itemReceiptId);
								}
								else if(remQtyFlag) {
									var errform 	= serverWidget.createForm({title: 'In below Line Ids, Remaining Quantity is less then the Item Quantity(Which user using in csv file)'});
									var statusfield = errform.addField({id: 'custpage_status',type: serverWidget.FieldType.INLINEHTML,label: 'Status'});
									var htmlObj1  ='';
									htmlObj1 +='<table class="minimalistBlack" style="border: 1px solid #000000;width: 100%;text-align: left;  border-collapse: collapse;">';
									htmlObj1 +='<thead style ="background: #CFCFCF; background: -moz-linear-gradient(top, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%); background: -webkit-linear-gradient(top, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%);  background: linear-gradient(to bottom, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%);  border-bottom: 1px solid #989898;">';
									htmlObj1 +='<tr>';
									htmlObj1 +='<th style="border:1px solid#000000;padding:5px 4px;">Line Id</th>';
									htmlObj1 += '<th style="border: 1px solid #000000; padding: 5px 4px;">Item Name</th>';
									htmlObj1 += '<th style="border: 1px solid #000000; padding: 5px 4px;">Remaining Quantity</th>';
									htmlObj1 += '<th style="border: 1px solid #000000; padding: 5px 4px;">Total CSV Quantity</th>';
									htmlObj1 += '</tr>';
									htmlObj1 += '</thead>';
									htmlObj1 += '<tbody>';
									htmlObj1 += bodyDet;
									htmlObj1 +='</table>';
									statusfield.defaultValue = htmlObj1;//"<h3><p style='font-size:15px'>"+lineIds_Array+"</p></h3>";
									context.response.writePage(errform);
								}
								/*else {
									var errform = serverWidget.createForm({title: 'Below Lines are not availabel in Purchase Order'});
									var statusfield = errform.addField({id: 'custpage_status',type: serverWidget.FieldType.INLINEHTML,label: 'Status'});
									statusfield.defaultValue = "<h3><p style='font-size:15px'>" + itemNotInPo_Arr + "</p></h3>";
									context.response.writePage(errform);
								}*/
							}
							catch(e) {
								var errform = serverWidget.createForm({title: 'Item Receipt Creation Failed'});
								var statusfield = errform.addField({id: 'custpage_status',type: serverWidget.FieldType.INLINEHTML,label: 'Status'});
								statusfield.defaultValue = "<h3><p style='font-size:15px'>" + e.message + "</p></h3>";
								context.response.writePage(errform);
							}
							//If Item Receipt get created Successfully
							if(_dataValidation(itemReceiptId)) {
								context.response.write('<html><body><script>window.parent.close(); </script></body></html>');
								log.debug({title: 'fileObj',details: JSON.stringify(fileObj)});
							}
						}
					}
				}
			}
		}
		catch(exp) {
			log.debug({title:"Exception log", details: exp});
			//log.debug({title:"Exception log", details: exp});
			var errform = serverWidget.createForm({title: 'Item Receipt Creation Failed'});
			var statusfield = errform.addField({id: 'custpage_status',type: serverWidget.FieldType.INLINEHTML,label: 'Status'});
			if (exp.message) {
				// if (exp.message.indexOf("The number of serial numbers entered (1) is not equal to the item quantity") != -1) {
					// statusfield.defaultValue = "<h3>Serial number should not be greter then 1.</h3>";
				// } else {
					statusfield.defaultValue = "<h3><p style='font-size:15px'>" + exp.message + "</p></h3>";
				//}
			}
			else {
				statusfield.defaultValue = "<h3><p style='font-size:15px'>" + exp.id + "</p></h3>";
			}
			context.response.writePage(errform);
			//InsertFile.defaultValue	= exp.message;
		}
		//context.response.writePage({pageObject: form});
	}
	
	function _dataValidation(value) 
	{
		if(value!='null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined'&& value != 'NaN' && value != NaN && value != '- None -') 
		{
			return true;
		}
		else 
		{ 
			return false;
		}
	}
	
	return {
		onRequest : onRequest
	}
});