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
        icon: 'share-alt'
    });

    class ViewModel extends base.viewModelClass {
        constructor(params, context) {
            super(params, context);

            // IMPLEMENTED
            this.title = 'Narratives Shared with You';

            // IMPLEMENTED
            // this.getNarratives();
        }

        // IMPLEMENTED
        // getNarratives() {
        //     this.loading(true);
        //     let options = {
        //         tag: this.appTag()
        //     };
        //     return this.data.getSharedNarratives(options)
        //         .then((narratives) => {
        //             this.loading(false);
        //             this.narratives(narratives);
        //         })
        //         .finally(() => {
        //             this.loading(false);
        //         });
        // }
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: base.template()
        };
    }

    return KO.registerComponent(component);
});