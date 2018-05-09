define([
    'knockout',
    'kb_ko/KO',
    'kb_common/html',
    './common',
    './narrativesBase'
], function (
    ko,
    KO,
    html,
    common,
    NarrativesComponentBase
) {
    'use strict';

    let base = new NarrativesComponentBase({
        testhook: 'shared-narratives',
        icon: 'globe'
    });

    class ViewModel extends base.viewModelClass {
        constructor(params, context) {
            super(params, context);

            // IMPLEMENTED
            this.title = 'Public Narratives';

            // IMPLEMENTED
            // this.getNarratives();
        }
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: base.template()
        };
    }

    return KO.registerComponent(component);
});