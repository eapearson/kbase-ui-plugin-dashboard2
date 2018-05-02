define([
    'module',
    'promise',
    'kb_ko/KO',
    'kb_ko/lib/generators',
    'kb_common/html',
    './components/main/component',
    './model'
], function (
    module,
    Promise,
    KO,
    gen,
    html,
    MainComponent,
    Model
) {
    'use strict';

    let t = html.tag,
        div = t('div');

    let ko = KO.ko;

    function createRootComponent(runtime, name) {
        let pluginPath = module.uri.split('/').slice(1, -2).join('/');
        let model = new Model({
            runtime: runtime
        });
        let vm = {
            runtime: runtime,
            running: ko.observable(false),
            initialParams: ko.observable(),
            pluginPath: pluginPath,
            model: model
        };
        let temp = document.createElement('div');
        temp.innerHTML = div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            },
            dataKBTesthookPlugin: 'dashboard'
        }, gen.if('running',
            KO.komponent({
                name: name,
                params: {
                    runtime: 'runtime',
                    initialParams: 'initialParams',
                    model: 'model'
                }
            })));
        let node = temp.firstChild;
        ko.applyBindings(vm, node, function (context) {
            context.runtime = runtime;
            // context.pluginPath = pluginPath;
        });

        function start(params) {
            vm.initialParams(params);
            vm.running(true);
        }

        function stop() {
            vm.running(false);
        }

        return {
            vm: vm,
            node: node,
            start: start,
            stop: stop
        };
    }

    function widget(config) {
        let hostNode, container, rootComponent,
            runtime = config.runtime;

        // API
        function attach(node) {
            return Promise.try(function () {
                hostNode = node;

                rootComponent = createRootComponent(runtime, MainComponent.name());
                container = hostNode.appendChild(rootComponent.node);
            });
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'Your Dashboard');
            rootComponent.start(params);
        }


        function stop() {
            rootComponent.stop();
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return widget(config);
        }
    };
});