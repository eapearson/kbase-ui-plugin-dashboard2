define([
    'knockout',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html',
    './common',
    '../lib/data',
    './dialogs/deleteNarrative',
    './dialogs/shareNarrative'
], function (
    ko,
    gen,
    ViewModelBase,
    html,
    common,
    Data,
    DeleteNarrativeComponent,
    ShareNarrativeComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    class NarrativeViewModelBase extends ViewModelBase {
        constructor(params, context) {
            super(params);

            let runtime = context['$root'].runtime;

            this.methodStoreImageURL = runtime.config('services.narrative_method_store.image_url');
            this.username = runtime.service('session').getUsername();

            this.devMode = false;

            this.data = Data.make({
                runtime: runtime
            });

            this.overlayComponent = params.overlayComponent;

            this.narratives = params.narratives.narratives;
            this.loading = params.narratives.loading;

            this.plural = function(singular, plural, count) {
                if (count === 1) {
                    return singular;
                }
                return plural;
            };

            this.narrativeFilter = params.narrativeFilter;

            this.filteredNarratives = ko.pureComputed(() => {
                let narrativeFilter = this.narrativeFilter();
                if (!narrativeFilter) {
                    return this.narratives();
                }
                if (narrativeFilter.length < 3) {
                    return this.narratives();
                }
                let filtered = this.narratives().filter((narrative) => {
                    let matcher = new RegExp(narrativeFilter, 'i');
                    if (matcher.test(narrative.workspace.metadata.narrative_nice_name)) {
                        return true;
                    }
                    if (matcher.test(narrative.workspace.owner)) {
                        return true;
                    }
                    if (matcher.test(narrative.object.saved_by)) {
                        return true;
                    }
                    if (narrative.appsMethods().some((app) => {
                        if (matcher.test(app.name)) {
                            return true;
                        }
                    })) {
                        return true;
                    }
                    return false;
                });
                return filtered;
            });


            // PROVIDE...

            this.title = 'YOUR LABEL HERE';

            // START
            // implemented in subclass
        }

        reloadNarratives() {
            return this.getNarratives({reload: true});
        }

        removeNarrative(narrative) {
            this.narratives.remove(narrative);
        }

        // PROVIDE
        getNarratives() {
        }

        // ACTIONS

        doOpenNarrative(data) {
            let narrativeUrl = '/narrative/ws.' + data.workspace.id + '.obj.' + data.object.id;
            window.open(narrativeUrl, '_blank');
        }

        doShareNarrative(data) {
            this.overlayComponent({
                name: ShareNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    onSuccess: () => {
                        // return this.reloadNarratives();
                        // return this.removeNarrative(data);
                    }
                }
            });
        }

        doDeleteNarrative(data) {
            this.overlayComponent({
                name: DeleteNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    onSuccess: () => {
                        // return this.reloadNarratives();
                        return this.removeNarrative(data);
                    }
                }
            });
        }
    }

    class Component {
        constructor(options) {
            this.testhook = options.testhook;

            this.icon = options.icon;

            this.viewModelClass = NarrativeViewModelBase;
        }

        template() {
            return div({
                class: 'panel panel-default kbase-widget',
                style: {
                    width: '100%'
                },
                dataKBTesthookWidget: this.testhook
            }, [
                div({
                    class: 'panel-heading'
                }, [
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-sm-6'
                        }, [
                            span({
                                class: ['fa',  'pull-left', 'fa-' + this.icon],
                                style: {
                                    fontSize: '150%',
                                    paddingRight: '10px'
                                }
                            }),
                            span({
                                class: 'fa fa-files-o pull-left',
                                style: {
                                    fontSize: '150%',
                                    paddingRight: '10px'
                                }
                            }),

                            span({
                                class: 'panel-title',
                                style: {
                                    verticalAlign: 'middle'
                                },
                                dataBind: {
                                    text: 'title'
                                }
                            })
                        ]),
                        div({
                            class: 'col-sm-6',
                            dataPlaceholder: 'buttonbar',
                            style: {
                                textAlign: 'right'
                            }
                        }, [
                            gen.if('loading',
                                span({style: {fontSize: '80%'}}, html.loading()),
                                gen.if('narratives().length === 0',
                                    span('Sorry, no narratives found in this category'),
                                    gen.if('filteredNarratives().length === 0',
                                        span([
                                            'Sorry, none of the ',
                                            span({
                                                dataBind: {
                                                    text: 'narratives().length'
                                                }
                                            }),
                                            ' ',
                                            gen.plural('narratives().length', 'narrative', 'narratives'),
                                            ' matched on ',
                                            span({
                                                style: {
                                                    fontWeight: 'bold'
                                                },
                                                dataBind: {
                                                    text: 'narrativeFilter'
                                                }
                                            })
                                        ]),
                                        span([
                                            'Showing ',
                                            span({
                                                dataBind: {
                                                    text: 'narrativesFilteredCount()'
                                                }
                                            }),
                                            gen.if('narrativesFilteredCount() < narratives().length',
                                                span([
                                                    ' of ',
                                                    span({
                                                        dataBind: {
                                                            text: 'narratives().length'
                                                        }
                                                    })
                                                ])),
                                            ' narratives',
                                            gen.if('filteredNarratives().length < narratives().length',
                                                span([
                                                    ', matching on ',
                                                    span({
                                                        style: {
                                                            fontWeight: 'bold'
                                                        },
                                                        dataBind: {
                                                            text: 'narrativeFilter'
                                                        }
                                                    })
                                                ]))
                                        ]))))

                        ])
                    ])
                ]),
                div({
                    class: 'panel-body',
                    style: {
                        backgroundColor: '#F5F5F5'
                    }
                }, [
                    div({
                        dataPlaceholder: 'alert'
                    }),
                    div(common.buildSlider())
                ])
            ]);
        }
    }

    return Component;
});