define([
    'kb_knockout/registry',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/html'
], function (
    reg,
    ViewModelBase,
    html
) {
    'use strict';

    const t = html.tag,
        a = t('a');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.username = params.username;
            this.realname = params.realname;
            this.newWindow = params.newWindow;
        }
    }

    function template() {
        return a({
            dataBind: {
                attr: {
                    href: '"#people/" + username',
                    target: 'newWindow ? "_blank" : null'
                },
                text: 'realname'
            }
        });
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});