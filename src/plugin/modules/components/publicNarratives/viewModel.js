define([
    '../narrativeViewModelBase'
], function (
    NarrativeViewModelBase
) {
    'use strict';

    class ViewModel extends NarrativeViewModelBase {
        constructor(params, context, element) {
            super(params, context, element);

            this.title = 'Public Narratives';
            this.icon = 'globe';
            this.testhook = 'public-narratives';

            this.createButtonLabel = null;
            this.noNarrativesMessage = null;

            // this.narratives = ko.pureComputed(() => {
            //     return params.narratives().filter((narrative) => {
            //         return narrative.isPublic();
            //     });
            // });
        }

        filterNarrative(narrative) {
            return narrative.isPublic();
        }

    }

    return ViewModel;
});
