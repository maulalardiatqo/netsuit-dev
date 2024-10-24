/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/record", "N/query", "N/search", "../gateway/BudgetValidationsGateway", "../../common/constants/Constants", "../useCase/BudgetValidationsUseCase", "N/runtime", "N/currency", "N/format", "N/translation", "N/cache"], function (_exports, record, query, search, _BudgetValidationsGateway, _Constants, _BudgetValidationsUseCase, runtime, currency, format, translation, cache) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.onRequest = void 0;
  record = _interopRequireWildcard(record);
  query = _interopRequireWildcard(query);
  search = _interopRequireWildcard(search);
  _BudgetValidationsGateway = _interopRequireDefault(_BudgetValidationsGateway);
  _BudgetValidationsUseCase = _interopRequireDefault(_BudgetValidationsUseCase);
  runtime = _interopRequireWildcard(runtime);
  currency = _interopRequireWildcard(currency);
  format = _interopRequireWildcard(format);
  translation = _interopRequireWildcard(translation);
  cache = _interopRequireWildcard(cache);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  var _createGateway = function _createGateway() {
    return new _BudgetValidationsGateway["default"]({
      dependencies: {
        'N/search': search,
        'N/record': record,
        'N/query': query,
        'N/runtime': runtime,
        'N/currency': currency,
        'N/format': format,
        'N/translation': translation
      },
      constants: _Constants.Constants
    });
  };

  var onRequest = function onRequest(context) {
    if (context.request.method === 'POST') {
      _onPostMethod(context);
    }
  };

  _exports.onRequest = onRequest;

  var _onPostMethod = function _onPostMethod(context) {
    var useCase = new _BudgetValidationsUseCase["default"]({
      dependencies: {
        budgetValidationsGateway: _createGateway()
      }
    });
    var request = context.request;
    var requestBody = JSON.parse(request.body);
    var budgetType;
    var updatedData;
    var _a = _Constants.Constants.UTILS.BUDGET_VALIDATION_CACHE,
        TRANSACTION_LINES_CACHE = _a.TRANSACTION_LINES_CACHE,
        TRANSACTION_LINES_KEY = _a.TRANSACTION_LINES_KEY;
    var response = context.response;

    if (requestBody.hasOwnProperty('recordDetails')) {
      var recordDetails = requestBody['recordDetails'];
      budgetType = recordDetails.budgetPreferences['custrecord_bm_budgetvalidation_source'];
      updatedData = useCase.fetchDataBeforeSave(requestBody);
    }

    if (typeof updatedData === 'boolean') {
      response.write({
        output: JSON.stringify(updatedData)
      });
    } else {
      var globalNameIdMappingDataStore = useCase._BMUtils.createGlobalMappingObject(budgetType);

      var segregateData = useCase.segregateRequestData(updatedData, globalNameIdMappingDataStore);
      var userTransactionData = segregateData[0];
      var budgetTransactionData = segregateData[1];
      var accountingPeriod = updatedData['recordDetails'].accountingPeriod;
      var finalOutput = useCase.processValidations(userTransactionData, budgetTransactionData, globalNameIdMappingDataStore, accountingPeriod);
      var linesCache = cache.getCache({
        name: TRANSACTION_LINES_CACHE,
        scope: cache.Scope.PROTECTED
      });
      linesCache.put({
        key: TRANSACTION_LINES_KEY,
        value: JSON.stringify(finalOutput),
        ttl: 300
      });
      response.write({
        output: JSON.stringify(finalOutput)
      });
    }
  };
});