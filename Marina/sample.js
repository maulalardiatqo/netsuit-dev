/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
  ], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config
  ) {
    function getAllResults(s) {
      var results = s.run();
      var searchResults = [];
      var searchid = 0;
      do {
        var resultslice = results.getRange({
          start: searchid,
          end: searchid + 1000,
        });
        resultslice.forEach(function (slice) {
          searchResults.push(slice);
          searchid++;
        });
      } while (resultslice.length >= 1000);
      return searchResults;
    }
  
    function onRequest(context) {
      var contextRequest = context.request;
      var form = serverWidget.createForm({
        title: "Stock Availability List View",
      });
      var filterOption = form.addFieldGroup({
        id: "filteroption",
        label: "FILTERS",
      });
      var locationOpt = (form.addField({
        id: "custpage_location_opt",
        label: "LOCATION",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
        source: "location",
      }).isMandatory = true);
      var itemName = form.addField({
        id: "custpage_item_name",
        label: "ITEM NAME",
        type: serverWidget.FieldType.TEXT,
        container: "filteroption",
      });
      var itemBrand = form.addField({
        id: "custpage_item_brand",
        label: "ITEM BRAND",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemType = form.addField({
        id: "custpage_item_type",
        label: "ITEM TYPE",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemUsage = form.addField({
        id: "custpage_item_usage",
        label: "ITEM USAGE",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemCategory = form.addField({
        id: "custpage_item_category",
        label: "ITEM CATEGORY",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemSubCategory = form.addField({
        id: "custpage_item_sub_category",
        label: "ITEM SUB CATEGORY",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemProductLine = form.addField({
        id: "custpage_item_product_line",
        label: "PRODUCT LINE",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemGender = form.addField({
        id: "custpage_item_gender",
        label: "GENDER",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemColor = form.addField({
        id: "custpage_item_color",
        label: "ITEM COLOR",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemSize = form.addField({
        id: "custpage_item_size",
        label: "ITEM SIZE",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      var itemStock = form.addField({
        id: "custpage_item_stock",
        label: "STOCK",
        type: serverWidget.FieldType.SELECT,
        container: "filteroption",
      });
      itemStock.addSelectOption({
        value: "",
        text: "",
      });
      itemStock.addSelectOption({
        value: "1",
        text: "Available",
      });
      itemStock.addSelectOption({
        value: "2",
        text: "Not Available",
      });
  
      //   Get data for select custom
      var itemSearchObjType = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_type",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetType = getAllResults(itemSearchObjType);
      resultSetType.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_type",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_type",
          summary: "GROUP",
        });
        itemType.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjBrand = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_brand",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetBrand = getAllResults(itemSearchObjBrand);
      resultSetBrand.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_brand",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_brand",
          summary: "GROUP",
        });
        itemBrand.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjUsage = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_usage",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetUsage = getAllResults(itemSearchObjUsage);
      resultSetUsage.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_usage",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_usage",
          summary: "GROUP",
        });
        itemUsage.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjCategory = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_category",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetCategory = getAllResults(itemSearchObjCategory);
      resultSetCategory.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_category",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_category",
          summary: "GROUP",
        });
        itemCategory.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjSubCategory = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_subcategory",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetSubCategory = getAllResults(itemSearchObjSubCategory);
      resultSetSubCategory.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_subcategory",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_subcategory",
          summary: "GROUP",
        });
        itemSubCategory.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjProductLine = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_productline",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetProductLine = getAllResults(itemSearchObjProductLine);
      resultSetProductLine.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_productline",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_productline",
          summary: "GROUP",
        });
        itemProductLine.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjGender = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_gender",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetGender = getAllResults(itemSearchObjGender);
      resultSetGender.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_gender",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_gender",
          summary: "GROUP",
        });
        itemGender.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjColor = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_color",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetColor = getAllResults(itemSearchObjColor);
      resultSetColor.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_color",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_color",
          summary: "GROUP",
        });
        itemColor.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
  
      var itemSearchObjSize = search.create({
        type: "item",
        filters: [],
        columns: [
          search.createColumn({
            name: "custitem_abj_item_size",
            summary: "GROUP",
          }),
        ],
      });
      var resultSetSize = getAllResults(itemSearchObjSize);
      resultSetSize.forEach(function (row) {
        let selectItemVal = row.getValue({
          name: "custitem_abj_item_size",
          summary: "GROUP",
        });
        let selectItemText = row.getText({
          name: "custitem_abj_item_size",
          summary: "GROUP",
        });
        itemSize.addSelectOption({
          value: selectItemVal,
          text: selectItemText,
        });
        return true;
      });
      //   end getting data for select
  
      form.addSubmitButton({
        label: "Search",
      });
  
      form.addResetButton({
        label: "Clear",
      });
  
      if (contextRequest.method == "GET") {
        context.response.writePage(form);
      } else {
        let itemLocation = context.request.parameters.custpage_location_opt;
        let itemName = context.request.parameters.custpage_item_name;
        let itemBrand = context.request.parameters.custpage_item_brand;
        let itemType = context.request.parameters.custpage_item_type;
        let itemUsage = context.request.parameters.custpage_item_usage;
        let itemCategory = context.request.parameters.custpage_item_category;
        let itemSubCategory =
          context.request.parameters.custpage_item_sub_category;
        let itemProductLine =
          context.request.parameters.custpage_item_product_line;
        let itemGender = context.request.parameters.custpage_item_gender;
        let itemColor = context.request.parameters.custpage_item_color;
        let itemSize = context.request.parameters.custpage_item_size;
        let itemStock = context.request.parameters.custpage_item_stock;
        log.debug("data", {
          itemLocation: itemLocation,
          itemName: itemName,
          itemBrand: itemBrand,
          itemType: itemType,
          itemUsage: itemUsage,
          itemCategory: itemCategory,
          itemSubCategory: itemSubCategory,
          itemProductLine: itemProductLine,
          itemGender: itemGender,
          itemColor: itemColor,
          itemSize: itemSize,
        });
        var currentEmployee = runtime.getCurrentUser();
        var employeeID = currentEmployee.id;
        var employeeRec = record.load({
          type: "employee",
          id: employeeID,
          isDynamic: true,
        });
        var employeeDepartment = employeeRec.getValue("department");
  
        let filters = [];
        if (itemLocation) {
          let locationFilter = search.createFilter({
            name: "inventoryLocation",
            operator: search.Operator.ANYOF,
            values: itemLocation,
          });
          filters.push(locationFilter);
        }
  
        if (itemName) {
          let itemNameFilter = search.createFilter({
            name: "name",
            operator: search.Operator.CONTAINS,
            values: itemName,
          });
          filters.push(itemNameFilter);
        }
  
        if (itemBrand && itemBrand != "@NONE@") {
          let itemBrandFilter = search.createFilter({
            name: "custitem_abj_item_brand",
            operator: search.Operator.ANYOF,
            values: itemBrand,
          });
          filters.push(itemBrandFilter);
        }
  
        if (itemUsage && itemUsage != "@NONE@") {
          let itemUsageFilter = search.createFilter({
            name: "custitem_abj_item_usage",
            operator: search.Operator.ANYOF,
            values: itemUsage,
          });
          filters.push(itemUsageFilter);
        }
  
        if (itemType && itemType != "@NONE@") {
          let itemTypeFilter = search.createFilter({
            name: "custitem_abj_item_type",
            operator: search.Operator.ANYOF,
            values: itemType,
          });
          filters.push(itemTypeFilter);
        }
  
        if (itemCategory && itemCategory != "@NONE@") {
          let itemCategoryFilter = search.createFilter({
            name: "custitem_abj_item_category",
            operator: search.Operator.ANYOF,
            values: itemCategory,
          });
          filters.push(itemCategoryFilter);
        }
  
        if (itemSubCategory && itemSubCategory != "@NONE@") {
          let itemSubCategoryFilter = search.createFilter({
            name: "custitem_abj_item_subcategory",
            operator: search.Operator.ANYOF,
            values: itemSubCategory,
          });
          filters.push(itemSubCategoryFilter);
        }
  
        if (itemGender && itemGender != "@NONE@") {
          let itemGenderFilter = search.createFilter({
            name: "custitem_abj_item_gender",
            operator: search.Operator.ANYOF,
            values: itemGender,
          });
          filters.push(itemGenderFilter);
        }
  
        if (itemProductLine && itemProductLine != "@NONE@") {
          let itemProductLineFilter = search.createFilter({
            name: "custitem_abj_item_productline",
            operator: search.Operator.ANYOF,
            values: itemProductLine,
          });
          filters.push(itemProductLineFilter);
        }
  
        if (itemColor && itemColor != "@NONE@") {
          let itemColorFilter = search.createFilter({
            name: "custitem_abj_item_color",
            operator: search.Operator.ANYOF,
            values: itemColor,
          });
          filters.push(itemColorFilter);
        }
  
        if (itemSize && itemSize != "@NONE@") {
          let itemSizeFilter = search.createFilter({
            name: "custitem_abj_item_size",
            operator: search.Operator.ANYOF,
            values: itemSize,
          });
          filters.push(itemSizeFilter);
        }
  
        if (itemStock) {
          if (itemStock == "1") {
            var itemStockFilter = search.createFilter({
              name: "locationquantityonhand",
              operator: search.Operator.GREATERTHAN,
              values: 0,
            });
          } else {
            var itemStockFilter = search.createFilter({
              name: "locationquantityonhand",
              operator: search.Operator.LESSTHANOREQUALTO,
              values: 0,
            });
          }
          filters.push(itemStockFilter);
        }
  
        if (employeeDepartment) {
          // 36 is Logistics department
          if (employeeDepartment != 36) {
            var departmentFilter = search.createFilter({
              name: "custrecord_abj_locn_dept",
              join: "inventoryLocation",
              operator: search.Operator.ANYOF,
              values: employeeDepartment,
            });
            filters.push(departmentFilter);
          }
        }
  
        var currentRecord = createSublist("custpage_sublist_item", form);
  
        var itemSearchObj = search.create({
          type: "item",
          filters: filters,
          columns: [
            "displayname",
            "type",
            "internalid",
            "custitem_abj_item_color",
            "custitem_abj_item_size",
            "custitem_abj_item_type",
            "custitem_abj_item_gender",
            "custitem_abj_item_brand",
            "custitem_abj_item_year",
            "custitem_abj_item_category",
            "custitem_abj_item_subcategory",
            "custitem_abj_item_usage",
            "custitem_abj_item_productline",
            "inventoryLocation",
            "locationquantityonhand",
            search.createColumn({
              name: "custrecord_abj_locn_dept",
              join: "inventoryLocation",
            }),
            search.createColumn({
              name: "locationquantityonhand",
              sort: search.Sort.ASC,
            }),
            "custitem_abj_item_year",
          ],
        });
        var searchResultCount = itemSearchObj.runPaged().count;
        log.debug("itemSearchObj result count", searchResultCount);
        var resultSet = getAllResults(itemSearchObj);
        var i = 0;
        resultSet.forEach(function (row) {
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_internalid",
            value: row.getValue("internalid"),
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_name",
            value: row.getValue("displayname"),
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_location",
            value: row.getText("inventoryLocation") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_location_on_hand",
            value: row.getValue("locationquantityonhand") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_type",
            value: row.getText("custitem_abj_item_type") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_category",
            value: row.getText("custitem_abj_item_category") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_sub_category",
            value: row.getText("custitem_abj_item_subcategory") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_color",
            value: row.getText("custitem_abj_item_color") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_size",
            value: row.getText("custitem_abj_item_size") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_product_line",
            value: row.getText("custitem_abj_item_productline") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_usage",
            value: row.getText("custitem_abj_item_usage") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_gender",
            value: row.getText("custitem_abj_item_gender") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_brand",
            value: row.getText("custitem_abj_item_brand") || " ",
            line: i,
          });
          currentRecord.setSublistValue({
            sublistId: "custpage_sublist_item",
            id: "custpage_sublist_item_year",
            value: row.getValue("custitem_abj_item_year") || " ",
            line: i,
          });
          i++;
          return true;
        });
  
        context.response.writePage(form);
  
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage(),
        });
      }
    }
  
    function createSublist(sublistname, form) {
      var sublist_in = form.addSublist({
        id: sublistname,
        type: serverWidget.SublistType.LIST,
        label: "Item Stock",
        tab: "matchedtab",
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_internalid",
        label: "INTERNAL ID",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_name",
        label: "ITEM NAME",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_location",
        label: "LOCATION",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_location_on_hand",
        label: "LOCATION ON HAND",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_type",
        label: "ITEM TYPE",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_category",
        label: "ITEM CATEGORY",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_sub_category",
        label: "ITEM SUB CATEGORY",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_color",
        label: "ITEM COLOR",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_size",
        label: "ITEM SIZE",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_product_line",
        label: "ITEM PRODUCT LINE",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_usage",
        label: "ITEM USAGE",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_gender",
        label: "ITEM GENDER",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_brand",
        label: "ITEM BRAND",
        type: serverWidget.FieldType.TEXT,
      });
  
      sublist_in.addField({
        id: "custpage_sublist_item_year",
        label: "ITEM YEAR",
        type: serverWidget.FieldType.TEXT,
      });
      // END TRANSFER IN
  
      return sublist_in;
    }
  
    return {
      onRequest: onRequest,
    };
  });