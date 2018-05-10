define([
    'knockout',
    'kb_ko/components/overlayPanelBootstrappish',
    'kb_common/html',
    '../toolbar',
    '../yourNarratives/component',
    '../sharedNarratives/component',
    '../publicNarratives/component',
    '../tutorialNarratives/component',
    '../metrics',
    '../collaborators/component'
], function (
    ko,
    OverlayPanelComponent,
    html,
    ToolbarComponent,
    YourNarrativesComponent,
    SharedNarrativesComponent,
    PublicNarrativesComponent,
    TutorialNarrativesComponent,
    MetricsComponent,
    CollaboratorsComponent
) {
    'use strict';

    let t = html.tag,
        div = t('div');

    function template() {
        return  div({
            class: 'kbase-viewx dashboard-plugin xcontainer-fluid',
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 0px',
                margin: '10px 10px 0 10px'
            },
            dataKBTesthookPlugin: 'dashboard'
        }, [
            div({
                dataBind: {
                    component: {
                        name: OverlayPanelComponent.quotedName(),
                        params: {
                            component: 'overlayComponent',
                            hostVm: '$data'
                        }
                    }
                }
            }),
            div({
                style: {
                    flex: '0 0 75px'
                },
                dataBind: {
                    component: {
                        name: ToolbarComponent.quotedName(),
                        params: {
                            isDevMode: 'isDevMode',
                            narrativeFilterInput: 'narrativeFilterInput',
                            reloadNarratives: 'reloadNarratives',
                            bus: 'bus'
                        }
                    }
                }
            }),
            div({
                style: {
                    flex: '1 1 0px',
                    overflow: 'auto'
                }
            }, div([
                div([
                    div({
                        dataBind: {
                            component: {
                                name: YourNarrativesComponent.quotedName(),
                                params: {
                                    narrativeFilter: 'narrativeFilter',
                                    overlayComponent: 'overlayComponent',
                                    narrativesLoading: 'narrativesLoading',
                                    narratives: 'narratives',
                                    deleteNarrative: 'actions.deleteNarrative',
                                    shareNarrative: 'actions.shareNarrative',
                                    unshareNarrative: 'actions.unshareNarrative',
                                    changeShareNarrative: 'actions.changeShareNarrative',
                                    shareNarrativeGlobal: 'actions.shareNarrativeGlobal',
                                    unshareNarrativeGlobal: 'actions.unshareNarrativeGlobal'
                                }
                            }
                        }
                    }),
                    div({
                        dataBind: {
                            component: {
                                name: TutorialNarrativesComponent.quotedName(),
                                params: {
                                    narrativeFilter: 'narrativeFilter',
                                    overlayComponent: 'overlayComponent',
                                    narrativesLoading: 'narrativesLoading',
                                    narratives: 'narratives',
                                    deleteNarrative: 'actions.deleteNarrative',
                                    shareNarrative: 'actions.shareNarrative',
                                    unshareNarrative: 'actions.unshareNarrative',
                                    changeShareNarrative: 'actions.changeShareNarrative',
                                    shareNarrativeGlobal: 'actions.shareNarrativeGlobal',
                                    unshareNarrativeGlobal: 'actions.unshareNarrativeGlobal'
                                }
                            }
                        }
                    }),
                    div({
                        dataBind: {
                            component: {
                                name: SharedNarrativesComponent.quotedName(),
                                params: {
                                    narrativeFilter: 'narrativeFilter',
                                    overlayComponent: 'overlayComponent',
                                    narrativesLoading: 'narrativesLoading',
                                    narratives: 'narratives',
                                    deleteNarrative: 'actions.deleteNarrative',
                                    shareNarrative: 'actions.shareNarrative',
                                    unshareNarrative: 'actions.unshareNarrative',
                                    changeShareNarrative: 'actions.changeShareNarrative',
                                    shareNarrativeGlobal: 'actions.shareNarrativeGlobal',
                                    unshareNarrativeGlobal: 'actions.unshareNarrativeGlobal'
                                }
                            }
                        }
                    }),
                    div({
                        dataBind: {
                            component: {
                                name: PublicNarrativesComponent.quotedName(),
                                params: {
                                    narrativeFilter: 'narrativeFilter',
                                    overlayComponent: 'overlayComponent',
                                    narrativesLoading: 'narrativesLoading',
                                    narratives: 'narratives',
                                    deleteNarrative: 'actions.deleteNarrative',
                                    shareNarrative: 'actions.shareNarrative',
                                    unshareNarrative: 'actions.unshareNarrative',
                                    changeShareNarrative: 'actions.changeShareNarrative',
                                    shareNarrativeGlobal: 'actions.shareNarrativeGlobal',
                                    unshareNarrativeGlobal: 'actions.unshareNarrativeGlobal'
                                }
                            }
                        }
                    })
                ]),
                div({
                    style: {
                        display: 'flex',
                        flexDirection: 'row'
                    }
                }, [
                    div({
                        style: {
                            flex: '1 1 0px',
                            marginRight: '6px'
                        }
                    }, div({
                        dataBind: {
                            component: {
                                name: CollaboratorsComponent.quotedName(),
                                params: {
                                    narratives: 'narratives',
                                    narrativesLoading: 'narrativesLoading'
                                }
                            }
                        }
                    })),
                    div({
                        style: {
                            flex: '1 1 0px',
                            marginLeft: '6px'
                        }
                    }, div({
                        dataBind: {
                            component: {
                                name: MetricsComponent.quotedName(),
                                params: {
                                    narratives: 'narratives',
                                    narrativesLoading: 'narrativesLoading'
                                }
                            }
                        }
                    }))
                ])
            ]))
        ]);
    }

    return template;
});