define([
    'module',
    'promise',
    'knockout',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    './components/main/component',
    './model'
], function (
    module,
    Promise,
    ko,
    gen,
    html,
    MainComponent,
    Model
) {
    'use strict';

    const t = html.tag,
        div = t('div');

    function createRootComponent(runtime, name) {
        const pluginPath = module.uri.split('/').slice(1, -2).join('/');
        const model = new Model({
            runtime: runtime
        });
        const vm = {
            runtime: runtime,
            running: ko.observable(false),
            initialParams: ko.observable(),
            pluginPath: pluginPath,
            model: model
        };
        const temp = document.createElement('div');
        temp.innerHTML = div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            },
            dataKBTesthookPlugin: 'dashboard'
        }, gen.if('running',
            gen.component({
                name: name,
                params: {
                    runtime: 'runtime',
                    initialParams: 'initialParams',
                    model: 'model'
                }
            })));
        const node = temp.firstChild;
        ko.applyBindings(vm, node, (context) => {
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

    class Panel {
        constructor({runtime}) {
            this.runtime = runtime;

            this.hostNode = null;
            this.container = null;
            this.rootComponent = null;
        }

        // API
        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.rootComponent = createRootComponent(this.runtime, MainComponent.name());
                this.container = this.hostNode.appendChild(this.rootComponent.node);
            });
        }

        start(params) {
            this.runtime.send('ui', 'setTitle', 'Your Dashboard');
            this.rootComponent.start(params);
        }


        stop() {
            this.rootComponent.stop();
        }

        detach() {
            if (this.hostNode && this.container) {
                this.hostNode.removeChild(this.container);
            }
        }
    }

    return Panel;
});