define([
    '../narrativeViewModelBase'
], function (
    NarrativeViewModelBase
) {
    'use strict';

    class ViewModel extends NarrativeViewModelBase {
        constructor(params, context, element) {
            super(params, context, element);

            this.title = 'Narratives Shared with You';
            this.icon = 'share-alt';
            this.testhook = 'shared-narratives';

            this.createButtonLabel = null;
            this.noNarrativesMessage = null;
        }

        filterNarrative(narrative) {
            return (
                narrative.owner !== this.username &&
                !narrative.isPublic() &&
                narrative.permissions().some((permission) => {
                    return permission.username === this.username;
                })
            );
        }
    }

    return ViewModel;
});
