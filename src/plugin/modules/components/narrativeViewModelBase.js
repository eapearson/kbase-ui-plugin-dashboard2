define([
    'knockout',
    'kb_common/html',
    'kb_knockout/lib/viewModelBase',
    './common',
    './dialogs/deleteNarrative',
    './dialogs/shareNarrative'
], function (
    ko,
    html,
    ViewModelBase,
    common,
    DeleteNarrativeComponent,
    ShareNarrativeComponent
) {
    'use strict';

    class ViewModel extends ViewModelBase {
        constructor(params, context, element) {
            super(params);

            this.started = new Date().getTime();

            // import runtime
            let runtime = context['$root'].runtime;
            this.methodStoreImageURL = runtime.config('services.narrative_method_store.image_url');
            this.username = runtime.service('session').getUsername();

            // import params
            this.overlayComponent = params.overlayComponent;
            this.loading = params.narrativesLoading;
            this.narrativeFilter = params.narrativeFilter;
            this.deleteNarrative = params.deleteNarrative;
            this.shareNarrative = params.shareNarrative;
            this.changeShareNarrative = params.changeShareNarrative;
            this.unshareNarrative = params.unshareNarrative;
            this.shareNarrativeGlobal = params.shareNarrativeGlobal;
            this.unshareNarrativeGlobal = params.unshareNarrativeGlobal;


            this.scrolled = ko.observable();
            this.slider = element.querySelector('.slider');


            // Own props
            this.devMode = false;

            // OVERRIDE;

            this.narratives = ko.pureComputed(() => {
                return params.narratives().filter((narrative) => {
                    return this.filterNarrative(narrative);
                });
            });

            this.narrativesAvailableCount = ko.pureComputed(() => {
                return this.narratives().length;
            });

            this.narrativesFilteredCount = ko.pureComputed(() => {
                return this.narratives().filter((narrative) => {
                    return narrative.ui.show();
                }).length;
            });

            // this.subscribe(this.narratives, (newValue) => {
            //     console.log('have narratives?', newValue);
            //     if (newValue.length > 0) {
            //         this.scrolled({timestamp: new Date().getTime()});
            //     }
            // });

            // this.filteredNarratives = this.narratives;

            // this.filteredNarratives = ko.pureComputed(() => {
            //     let narrativeFilter = this.narrativeFilter();
            //     if (!narrativeFilter) {
            //         return this.narratives();
            //     }
            //     if (narrativeFilter.length < 3) {
            //         return this.narratives();
            //     }
            //     function showIt(narrative, matcher) {
            //         if (matcher.test(narrative.title)) {
            //             return true;
            //         }
            //         if (matcher.test(narrative.owner)) {
            //             return true;
            //         }
            //         if (matcher.test(narrative.savedBy)) {
            //             return true;
            //         }
            //         if (narrative.appsMethods.some((app) => {
            //             if (matcher.test(app.name)) {
            //                 return true;
            //             }
            //         })) {
            //             return true;
            //         }
            //         return false;
            //     }
            //     let matcher = new RegExp(narrativeFilter, 'i');
            //     let filtered = this.narratives()
            //         .filter((narrative) => {
            //             return showIt(narrative, matcher);
            //         });
            //     return filtered;
            // });



            // DOM SUBS

            this.scrollPending = false;


            this.slider.addEventListener('scroll', () => {
                this.forceScroll();
            });

            let obs = new MutationObserver((mutationRecord, inst) => {
                // console.log('mut', mutationRecord);
                // this.show(this.isVisible());
                this.forceScroll();
            });
            obs.observe(this.slider, {attributes: true, childList: true, subtree: true});
        }

        forceScroll() {
            if (this.scrollPending) {
                return;
            }
            this.scrollPending = true;
            window.requestAnimationFrame((timestamp) => {
                this.scrollPending = false;
                this.scrolled({
                    timestamp: timestamp
                });
            });
        }

        // OVERRIDE THIS
        filterNarrative() {
            return true;
        }

        plural (singular, plural, count) {
            if (count === 1) {
                return singular;
            }
            return plural;
        }

        reloadNarratives() {
            // return this.getNarratives({reload: true});
        }

        removeNarrative(narrative) {
            this.narratives.remove(narrative);
        }

        // ACTIONS

        doOpenNarrative(narrative) {
            let narrativeUrl = [
                '/narrative/ws',
                narrative.ref.workspaceId,
                'obj',
                narrative.ref.objectId
            ].join('.');
            window.open(narrativeUrl, '_blank');
        }

        doShareNarrative(data) {
            this.overlayComponent({
                name: ShareNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    shareNarrative: this.shareNarrative,
                    unshareNarrative: this.unshareNarrative,
                    changeShareNarrative: this.changeShareNarrative,
                    shareNarrativeGlobal: this.shareNarrativeGlobal,
                    unshareNarrativeGlobal: this.unshareNarrativeGlobal
                }
            });
        }

        doDeleteNarrative(data) {
            this.overlayComponent({
                name: DeleteNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    deleteNarrative: this.deleteNarrative
                }
            });
        }

        // TODO: remove
        doNarrativesRendered() {
            this.scrolled({timestamp: new Date().getTime()});
        }

        // koDescendantsComplete() {
        //     let elapsed = new Date().getTime() - this.started ;
        //     console.log('finished in ...', elapsed);
        // }


    }

    return ViewModel;
});