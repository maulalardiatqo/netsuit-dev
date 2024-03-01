/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/https","N/record", "N/search", "N/file"], function(
    https, record, search, file
    ) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var idItem = rec.id
                log.debug('idItem', idItem);
                var itemSearch = search.load({
                    id: 'customsearch3908'
                });
                itemSearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: idItem
                }, ));
                var itemSearchSet = itemSearch.run();
                itemSearch = itemSearchSet.getRange(0, 1);
                log.debug('itemSearch', itemSearch)
                if(itemSearch.length > 0){
                    var existingRec = itemSearch[0];
                    var displayName = existingRec.getValue({
                        name : "displayname"
                    })
                    var image = existingRec.getValue({
                        name : "custitem_atlas_item_image"
                    })
                    var filelogo;
                    var urlImage = '';
                        if (image) {
                            filelogo = file.load({
                                id: image
                            });
                            var headerUrl = 'https://td2871145.app.netsuite.com'
                            urlImage = headerUrl + filelogo.url
                            var availableWLogin = filelogo.isonline = true;
                            filelogo.isOnline = true;
                            log.debug('availableWLogin', availableWLogin)
                            var fileId = filelogo.save();
                            log.debug('fileId', fileId)
                        }else{
                            urlImage = 'https://d3ndwuuxpr6t02.cloudfront.net/system/item/images/images/043/852/199/large/3fc67f6c80c4d0e8ba8e0f00c3e987a5.jpg?'
                        }
                    var categoryName = existingRec.getText({
                        name : "custitem_og_item_group_field"
                    })|| 'No Category'
                    log.debug('categoryName', categoryName)
                    var brandName = existingRec.getText({
                        name : "custitem_og_brand_field"
                    })||'No Brand';

                    // varian
                    var varName = existingRec.getValue({
                        name : "custitem_atlas_item_image"
                    })
                    var option = 'xxl'
                    var sku = existingRec.getValue({
                        name : "itemid"
                    })
                    var barcode = existingRec.getValue({
                        name : "upccode"
                    })|| '890645ji'
                    var description = existingRec.getValue({
                        name : "salesdescription"
                    })
                    var avgCost = existingRec.getValue({
                        name : "averagecost"
                    })
                    var onlineCost = existingRec.getValue({
                        name : "price5"
                    })||avgCost
                    var quantity = existingRec.getValue({
                        name : "quantityonhand"
                    }) || '1'
                    var weight = existingRec.getValue({
                        name : "weight"
                    }) || '1'
                    var width = '1'
                    var height = '1'
                    var length = '1'
                    let itemSend = { items :[{
                        name: displayName,
                        brand_name: brandName,
                        category_name: categoryName,
                        image_urls: [urlImage],
                        variants: [
                            {
                                name: displayName,
                                options: [{size : option}],
                                sku_code: sku,
                                barcode: barcode,
                                description: description,
                                price: onlineCost,
                                cost_price : avgCost,
                                quantity: quantity,
                                weight: weight,
                                width: width,
                                height: height,
                                length: length
                            }
                        ]
                    }
                    ]
                        
                    };
                    
                    let body = JSON.stringify(itemSend);
                    log.debug('body', body)
                    log.debug('items', itemSend)
                    let responseLogin = https.post({
                        url: "https://integration.forstok.com/api/v2/auth?id=abdulhakimhsn@gmail.com&secret_key=57246394d2cd0207a0eed96365f62b1b&type=seller&",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    log.debug('responseLogin', responseLogin)
                    if (responseLogin.code == 200) {
                        let dataLogin = JSON.parse(responseLogin.body);
                        log.debug("data login", dataLogin);
                        log.debug("data token", dataLogin.data.token);
                        var tokenUrl = dataLogin.data.token;
                        let response = https.post({
                            url: 'https://accounts.forstok.com/api/v1/items/create?user_id=abdulhakimhsn@gmail.com&auth_type=jwt',
                            body: body,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${tokenUrl}`,
                            }
                        });
                
                        log.debug("response data", response);
                    }
                }
            }
            if(context.type == context.UserEventType.EDIT) {
                var rec = context.newRecord;
                var idItem = rec.id
                log.debug('idItem', idItem);
                var itemSearch = search.load({
                    id: 'customsearch3908'
                });
                itemSearch.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: idItem
                }, ));
                var itemSearchSet = itemSearch.run();
                itemSearch = itemSearchSet.getRange(0, 1);
                log.debug('itemSearch', itemSearch)

                
                if(itemSearch.length > 0){
                    var existingRec = itemSearch[0];
                    var image = existingRec.getValue({
                        name : "custitem_atlas_item_image"
                    })
                    var filelogo;
                    var urlImage = '';
                        if (image) {
                            filelogo = file.load({
                                id: image
                            });
                            var headerUrl = 'https://td2871145.app.netsuite.com'
                            urlImage = headerUrl + filelogo.url
                            var availableWLogin = filelogo.isonline
                            filelogo.isOnline = true;
                            var nameFIle = filelogo.name
                            
                            log.debug('nameFIle', nameFIle)
                            var fileId = filelogo.save();
                            log.debug('availableWLogin', availableWLogin)
                        }
                    var displayName = existingRec.getValue({
                        name : "displayname"
                    })
                    var categoryName = 'Food'
                    var brandName = existingRec.getText({
                        name : "custitem_og_brand_field"
                    })||'No Brand';

                    // varian
                    var option = 'xxl'
                    var sku = existingRec.getValue({
                        name : "itemid"
                    })
                    var barcode = existingRec.getValue({
                        name : "upccode"
                    })|| '890645ji'
                    var description = existingRec.getValue({
                        name : "salesdescription"
                    })
                    var avgCost = parseInt(existingRec.getValue({
                        name : "averagecost"
                    }))
                    log.debug('avgCost', avgCost)
                    var onlineCost = parseInt(existingRec.getValue({
                        name : "price5"
                    })||avgCost)
                    var quantity = existingRec.getValue({
                        name : "quantityonhand"
                    }) || '1'
                    var weight = existingRec.getValue({
                        name : "weight"
                    }) || 1
                    var width = 1
                    var height = 1
                    var length = 1
                    log.debug('displayname', displayName);
                    var variantUpdate = {
                        variants : [{
                            sku : sku,
                            quantity_hand : quantity
                        }]
                    }
                    var itemUpdate = {
                        sku :sku,
                        name : displayName,
                        description : description,
                        package_weight : weight,
                        package_height : height,
                        package_length : length,
                        package_width : width,
                        price : onlineCost,
                        barcode : barcode,
                        cost_price : avgCost
                    }

                    let body = JSON.stringify(itemUpdate);
                    variantUpdate = JSON.stringify(variantUpdate);
                    log.debug('body', body)
                    log.debug('items', itemUpdate)
                    let responseLogin = https.post({
                        url: "https://integration.forstok.com/api/v2/auth?id=abdulhakimhsn@gmail.com&secret_key=57246394d2cd0207a0eed96365f62b1b&type=seller&",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    log.debug('responseLogin', responseLogin)
                    if (responseLogin.code == 200) {
                        let dataLogin = JSON.parse(responseLogin.body);
                        log.debug("data login", dataLogin);
                        log.debug("data token", dataLogin.data.token);
                        var tokenUrl = dataLogin.data.token;
                        let response = https.post({
                            url: 'https://accounts.forstok.com/api/v1/variants.json?user_id=abdulhakimhsn@gmail.com&auth_type=jwt',
                            body: body,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${tokenUrl}`,
                                'X-HTTP-Method-Override': 'PATCH'
                            }
                        });
                        let resPonseVarian = https.post({
                            url: 'https://accounts.forstok.com/api/v2/variants/quantities.json?user_id=abdulhakimhsn@gmail.com&auth_type=jwt',
                            body: variantUpdate,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${tokenUrl}`,
                                'X-HTTP-Method-Override': 'PATCH'
                            }
                        });
                
                        log.debug("response data", response);
                        log.debug("resPonseVarian", resPonseVarian);
                    }
                }
            }
        }catch (e) {
            err_messages = 'error in after submit ' + e.name + ': ' + e.message;
            log.debug(err_messages);
        }
    }
    
    return {
        afterSubmit: afterSubmit,
    };
});