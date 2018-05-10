define([
    '../narrativeViewModelBase'
], function (
    NarrativeViewModelBase
) {
    'use strict';

    class ViewModel extends NarrativeViewModelBase {
        constructor(params, context, element) {
            super(params, context, element);

            this.title = 'Your Narratives';
            this.icon = 'user';
            this.testhook = 'your-narratives';

            this.createButtonLabel = 'Create your first Narrative!';
            this.noNarrativesMessage = 'Wow, it looks like you haven\'t created any Narratives yet. It\'s easy -- just click the button on the left to get started.';
        }

        filterNarrative(narrative) {
            return (narrative.owner === this.username);
        }
    }

    return ViewModel;
});