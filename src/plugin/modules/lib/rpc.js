define([
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/exceptions',
    './errors'
], function (
    DynamicService,
    GenericClient,
    exceptions,
    errors
) {
    'use strict';

    class RPC {
        constructor(config) {
            this.runtime = config.runtime;
        }

        call(moduleName, functionName, params) {
            let override = this.runtime.config(['services', moduleName, 'url'].join('.'));
            let token = this.runtime.service('session').getAuthToken();
            let client;
            if (override) {
                client = new GenericClient({
                    module: moduleName,
                    url: override,
                    token: token
                });
            } else {
                client = new DynamicService({
                    url: this.runtime.config('services.service_wizard.url'),
                    token: token,
                    module: moduleName
                });
            }
            let funcParams = params ? [params] : [];
            return client.callFunc(functionName, funcParams)
                .catch((err) => {
                    if (err instanceof exceptions.AjaxError) {
                        console.error('AJAX Error', err);
                        throw new errors.DataSearchError('AJAX Error: ' + err.name, err.code, err.message, null, {
                            originalError: err
                        });
                    } else if (err instanceof exceptions.RpcError) {
                        console.error('RPC Error', err);
                        let message = 'An error was encountered running an rpc method';
                        let detail = 'The module is "' + err.module + '", the method "' + err.func + '", ' +
                                    'the error returned from the service is "' + (err.message || 'unknown') + '"';
                        throw new errors.DataSearchError('service-call-error', err.name, message, detail , {
                            originalError: err
                        });
                    } else {
                        throw new errors.DataSearchError('rpc-call', err.name, err.message, null, {
                            originalError: err
                        });
                    }
                });
        }
    }
    return RPC;
});