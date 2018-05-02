define([
    'kb_knockout/registry',
    './view',
    './viewModel'
], function (
    reg,
    View,
    ViewModel
) {
    'use strict';

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: View()
        };
    }

    return reg.registerComponent(component);
});