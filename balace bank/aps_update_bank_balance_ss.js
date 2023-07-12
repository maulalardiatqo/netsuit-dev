 /**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 *@NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/runtime', 'N/file', 'N/error', 'N/format'],
    function(search, record, runtime, file, error, format) {
        function execute(context) {
			var scriptId = runtime.getCurrentScript();
            var searchId = scriptId.getParameter("custscriptsave_search_id");
			log.debug("searchId", searchId);
            try {
				var InboundFolderId = scriptId.getParameter("custscriptinboundfolderid");
				var ProcessedFolderId = scriptId.getParameter("custscript_processed_folder_id");
				var ErrorFolderId = scriptId.getParameter("custscript_error_folder_id");
				var PBBBankAccount = scriptId.getParameter("custscript_pbb_bank_account");
				var RHBBankAccount = scriptId.getParameter("custscript_rhb_bank_account");
				var PBBfolder = scriptId.getParameter("custscript_sol_pbb_folder");
				var RHBfolder = scriptId.getParameter("custscript_sol_rhb_folder");

                var BankFileToProcess = search.load({
                    id: searchId
                });
				log.debug('PPB Folder', PBBfolder);
				log.debug('RHB Folder', RHBfolder);
				log.debug('RHB Bank Account', RHBBankAccount);
				log.debug('inboundId', InboundFolderId);

				BankFileToProcess.filters.push(search.createFilter(
					{name: 'folder',operator: search.Operator.IS,values: InboundFolderId},
				));
				
				var BankFileToProcessset = BankFileToProcess.run();
				var BankFileToProcess = BankFileToProcessset.getRange(0, 100);
				log.debug('BankFileToProcess', BankFileToProcess);
		
				BankFileToProcess.forEach(function(BankFile) {
					try {
						var fileId = BankFile.getValue({name: 'internalid'});
						var fileName = BankFile.getValue({name: 'name'});
						log.debug("fileId", fileId);
						var BankFileToProcess = file.load({id: fileId});
						log.debug("isPBStatement", isPBStatement);
						
						var iterator = BankFileToProcess.lines.iterator();						
						var linecount = 0;
						var isPBStatement = false;

						if(PBBfolder == InboundFolderId){
							isPBStatement=true;
						}
						iterator.each(function (line)
						{
							if (linecount==17) {
								var lineValues = line.value.split(',');
								var lineCol1 = lineValues[0];
								// if(lineCol1=='Trn. Date') {
								// 	isPBStatement=true;
								// }
							}		
							linecount++;
							return true;
						});
						log.debug("isPBStatement", isPBStatement);
						linecount = 0;
						var DebitAmntFldIdx; 
						var CreditAmntFldIdx; 
						var transdateFldIdx; 
						var TotalDebitAmnt;
						var TotalCrditAmnt;
						var transdate;
						if (isPBStatement) {
							var PBBBalanceAmnt = 0;
							const PBBBalanceFldIdx = 1; 
							DebitAmntFldIdx = 3; 
							CreditAmntFldIdx = 4; 
							transdateFldIdx = 1; 
							TotalDebitAmnt = 0;
							TotalCrditAmnt = 0;
							iterator = BankFileToProcess.lines.iterator();
							iterator.each(function (line)
							{
								var lineValues = line.value.split(',');
								// log.debug("lineValues", lineValues);
								if (linecount==5) {
									PBBBalanceAmnt = lineValues[PBBBalanceFldIdx];
									PBBBalanceAmnt = PBBBalanceAmnt.replace("MYR","");
									PBBBalanceAmnt = parseFloat(PBBBalanceAmnt);
									// log.debug("PBBBalanceAmnt", PBBBalanceAmnt);
								}
								if (linecount==3) {
									transdate = lineValues[transdateFldIdx];
									// log.debug("transdate", transdate);
								}
								if (linecount>17) {
									var DebitAmnt = lineValues[DebitAmntFldIdx]||0;
										DebitAmnt = DebitAmnt.toString().replaceAll(",",'');
										// log.debug("DebitAmnt0", DebitAmnt);
										DebitAmnt = Number(DebitAmnt);			
										// log.debug("DebitAmnt", DebitAmnt);
										log.debug('TotalDebitAmnt PBB', TotalDebitAmnt);
										if(DebitAmnt) 
											TotalDebitAmnt += DebitAmnt;
										var CreditAmnt = lineValues[CreditAmntFldIdx]||0;
										CreditAmnt = CreditAmnt.toString().replaceAll(",",'');
										// log.debug("CreditAmnt0", CreditAmnt);
										CreditAmnt = Number(CreditAmnt);			
										// log.debug("CreditAmnt", CreditAmnt);
								}		
								linecount++;
								return true;
							});
							log.debug('Total Debit Amount', TotalDebitAmnt);
						}

						linecount = 0;
						var isRHBStatement = false;
						iterator = BankFileToProcess.lines.iterator();
						if(RHBfolder == InboundFolderId){
							isRHBStatement=true;
						}
						iterator.each(function (line)
						{
							var lineValues = line.value.split(',');
						//	log.debug("lineValues", lineValues);
							if (linecount==3) {
								var lineCol1 = lineValues[0];
								lineCol1 = lineCol1.trim();
								// log.debug("lineCol1", lineCol1);
								// if(lineCol1=='Date') {
								// 	isRHBStatement=true;
								// }
							}		
							linecount++;
							return true;
						});
						// log.debug("isRHBStatement", isRHBStatement);
						
						if (isRHBStatement) {
							linecount = 0;
							var BalanceAmnt = 0;
							const BalanceFldIdx = 9; 
							DebitAmntFldIdx = 7; 
							CreditAmntFldIdx = 8; 
							transdateFldIdx = 1; 
							TotalDebitAmnt = 0;
							TotalCrditAmnt = 0;
							iterator = BankFileToProcess.lines.iterator();
							iterator.each(function (line)
							{
								var lineValues = line.value.split(',');
								if (linecount>4) {
									if (lineValues[BalanceFldIdx]) {
									  BalanceAmnt = Number(lineValues[BalanceFldIdx]);
									//   log.debug("BalanceAmnt", BalanceAmnt);
									}
								}		
								if (linecount==2) {
									transdate = lineValues[transdateFldIdx];
									transdate = transdate.replaceAll("'",'');
									transdate = transdate.replaceAll("-",'/');
									
								}
								if (linecount>5) {
									var transdate1 = lineValues[0];
									if (transdate1) {
										var DebitAmnt = lineValues[DebitAmntFldIdx]||0;
										DebitAmnt = DebitAmnt.toString().replaceAll(",",'');
										// log.debug("DebitAmnt0", DebitAmnt);
										DebitAmnt = Number(DebitAmnt);			
										// log.debug("DebitAmnt", DebitAmnt);
										log.debug('TotalDebitAmnt RHB', TotalDebitAmnt);
										if(DebitAmnt) 
											TotalDebitAmnt += DebitAmnt;
										var CreditAmnt = lineValues[CreditAmntFldIdx]||0;
										CreditAmnt = CreditAmnt.toString().replaceAll(",",'');
										// log.debug("CreditAmnt0", CreditAmnt);
										CreditAmnt = Number(CreditAmnt);			
										// log.debug("CreditAmnt", CreditAmnt);
										if(CreditAmnt) 
											TotalCrditAmnt += CreditAmnt;
									}
								}		
								linecount++;
								return true;
							});
						}
						// log.debug("BalanceAmnt", BalanceAmnt);
						if (isRHBStatement||isPBStatement) {
						
							log.debug("is RHB Statement", isRHBStatement);
							log.debug("is PBB statement", isPBStatement);
							
							// if (TotalDebitAmnt || TotalCrditAmnt) {
								var BankBalance_rec=record.create({
									type : 'customrecord_sol_bank_balances',
									isDynamic : true
								});
								if (transdate) {
									// transdate must be yesterday
									var date = new Date();
									log.debug('date', date);
									date.setDate(date.getDate() - 1);
									transdate = format.parse({value:date, type: format.Type.DATE});
									log.debug('trandate befor', transdate)
								}
								
								log.debug('Yesterday', transdate);

								var Bank_id = PBBBankAccount;
								if (isRHBStatement)
									Bank_id = RHBBankAccount;
								
								var SrcAccount = search.create({
								type: 'account',
								columns: ['balance'],
								filters: [{name: 'internalid', operator: 'is',values: Bank_id},
										  ]}).run().getRange({start:0,end:1});
										  
								var acctBalance;
								if (SrcAccount.length>0) {		  
									acctBalance = SrcAccount[0].getValue('balance');  
								} else {
									 throw error.create({
										name: 'INVALID_ACCOUNT',
										message: 'No Account Information for file : ' + fileName
									});
								}
								
								log.debug("Bank_id", Bank_id);
								BankBalance_rec.setValue({
									fieldId: "custrecord_sol_bb_bank_name",
									value: Bank_id,
								});								

								BankBalance_rec.setValue({
									fieldId: "custrecord_sol_bb",
									value: transdate,
								});								

								BankBalance_rec.setValue({
									fieldId: "custrecord_sol_bb_amt_pad",
									value: TotalCrditAmnt,
								});								
								
								BankBalance_rec.setValue({
									fieldId: "custrecord_sol_bb_amt_rvd",
									value: TotalDebitAmnt,
								});	
								if (isRHBStatement) {
							  	    BankBalance_rec.setValue({
									  fieldId: "custrecord_sol_bb_ns_bnk_bal",
									  value: acctBalance,
								    });	

							  	    BankBalance_rec.setValue({
									  fieldId: "custrecord_sol_bb_bank_bal",
									  value: BalanceAmnt,
								    });	
							    } else {
							  	    BankBalance_rec.setValue({
									  fieldId: "custrecord_sol_bb_bank_bal",
									  value: PBBBalanceAmnt,
								    });	
								}

								var BankBalance_rec_id = BankBalance_rec.save({
									enableSourcing: true,
									ignoreMandatoryFields: true
								});				
							// }	
							log.debug('BankBalance_rec_id', BankBalance_rec_id);
							if (BankBalance_rec_id) {
								BankFileToProcess.folder = ProcessedFolderId;
								BankFileToProcess.save();
							}
						}
						return true;
					} catch (e) {
						if (BankFileToProcess) {
							BankFileToProcess.folder = ErrorFolderId;
							BankFileToProcess.save();
						}
						log.debug("Error in Process File "+fileName, 
						e.name +' : '+e.message);
					}		
                });
				var scriptObj = runtime.getCurrentScript();
					log.debug({
					title: "Remaining usage units: ",
					details: scriptObj.getRemainingUsage()
				});

            } catch (e) {
				log.debug("Error in Update Running Number", e.name +' : '+e.message);
            }
        }
        return {
            execute: execute
        };
    }); 

        