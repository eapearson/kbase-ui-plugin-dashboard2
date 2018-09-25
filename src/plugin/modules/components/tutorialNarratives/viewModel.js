define([
    '../narrativeViewModelBase'
], function (
    NarrativeViewModelBase
) {
    'use strict';

    class ViewModel extends NarrativeViewModelBase {
        constructor(params, context, element) {
            super(params, context, element);

            this.title = 'Tutorial Narratives';
            this.icon = 'mortar-board';
            this.testhook = 'tutorial-narratives';

            this.createButtonLabel = null;
            this.noNarrativesMessage = null;
        }

        filterNarrative(narrative) {
            return narrative.isNarratorial();
        }
    }

    return ViewModel;
});
