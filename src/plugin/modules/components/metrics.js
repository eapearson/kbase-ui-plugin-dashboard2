define([
    'bluebird',
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/viewModelBase',
    'kb_knockout/lib/generators',
    'kb_common/html',
    '../lib/data'
], function(
    Promise,
    ko,
    reg,
    ViewModelBase,
    gen,
    html,
    Data
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        h3 = t('h3'),
        span = t('span');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.runtime = context['$root'].runtime;

            this.loading = params.narrativesLoading;

            this.data = Data.make({
                runtime: this.runtime
            });
            this.username = this.runtime.service('session').getUsername();

            this.ownNarratives = ko.pureComputed(() => {
                return params.narratives().filter((narrative) => {
                    return narrative.owner === this.username;
                });
            });

            let narrativeData = ko.observable();
            let sharedNarrativeData = ko.observable();

            let totalUserNarratives = ko.pureComputed(() => {
                return this.ownNarratives().length;
            });

            let totalSharedNarratives = ko.pureComputed(() => {
                return this.ownNarratives().filter((narrative) => {
                    return (narrative.permissions().length > 0);
                }).length;
            });

            this.narrativesHistogram = ko.pureComputed(() => {
                let data = narrativeData();
                if (!data) {
                    return;
                }
                return this.data.calcNarrativesHistogram(data, totalUserNarratives());
            });

            this.sharedNarrativesHistogram = ko.pureComputed(() => {
                let data = sharedNarrativeData();
                if (!data) {
                    return;
                }
                return this.data.calcNarrativesHistogram(data, totalSharedNarratives());
            });

            this.runtime.service('data').getJson({
                path: 'metrics',
                file: 'narrative_histogram'
            }).then((data) => {
                narrativeData(data);
            });

            this.runtime.service('data').getJson({
                path: 'metrics',
                file: 'narrative_sharing_histogram'
            }).then((data) => {
                sharedNarrativeData(data);
            });
        }
    }

    function buildButtonBar() {
        return [
            // newNarrativeButton,
            div({
                class: 'navbar-form navbar-group'
            }, [
            ])
        ];
    }

    function buildHistogram() {
        return  div([
            gen.let({
                chartLength: 'histogram.chart.length'
            },
            gen.foreach('histogram.chart',
                // This is the column!
                div({
                    style: {
                        position: 'absolute',
                        bottom: '0'
                    },
                    dataBind: {
                        style: {
                            left: 'Math.round( $index() * width, 4) + "%"',
                            width: 'Math.round(width, 4) + "%"',
                            height: 'Math.round(height, 4) + "%"'
                        }
                    }
                }, [
                    // this is the fill (with "padding" on the left and right)
                    div({
                        style: {
                            position: 'absolute',
                            top: '0',
                            left: '5px',
                            right: '5px',
                            bottom: '0',
                            backgroundColor: '#CECECECE'
                        }
                    }),
                    // This is the count, at the top of the column
                    div({
                        style: {
                            position: 'absolute',
                            top: '-20px',
                            left: '0',
                            width: '100%',
                            color: 'gray',
                            fontSize: '80%',
                            fontStyle: 'italic',
                            textAlign: 'center'
                        },
                        dataBind: {
                            text: 'count'
                        }
                    }),

                    div({
                        style: {
                            position: 'absolute',
                            bottom: '-20px',
                            left: '0',
                            width: '100%',
                            color: 'gray',
                            fontSize: '80%',
                            textAlign: 'center'
                        }
                    }, [
                        gen.if('upper - lower === 1',
                            // then
                            span({
                                dataBind: {
                                    text: 'lower'
                                }
                            }),
                            // else
                            // TODO: special case for last, or calculate this in advance.
                            gen.if('$index() === (chartLength - 1)',
                                span({
                                    dataBind: {
                                        text: 'String(lower) + "-" + String(upper)'
                                    }
                                }),
                                span({
                                    dataBind: {
                                        text: 'String(lower) + "-" + String(upper - 1)'
                                    }
                                })
                            ))
                    ])
                ]))),
            // users's value here
            div({
                style: {
                    position: 'absolute',
                    bottom: '0',
                    width: '6px',
                    height: '100%',
                    backgroundColor: 'rgba(75,184,86,0.7)'
                },
                dataBind: {
                    style: {
                        left: 'Math.round(histogram.user.scale) + "%"'
                    }
                }
            }, div({
                style: {
                    position: 'absolute',
                    top: '0',
                    right: '6px',
                },
                dataBind: {
                    style: {
                        left: 'histogram.user.side === "right" ? "6px" : null',
                        right: 'histogram.user.side === "left" ? "6px" : null',
                    }
                }
            }, div({
                style: {
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '80%',
                    backgroundColor: 'rgba(75,184,86,0.7)',
                    whiteSpace: 'nowrap',
                    padding: '3px 6px 3px 3px'
                }
            }, [
                'You - ',
                span({
                    dataBind: {
                        text: 'histogram.user.value'
                    }
                })
            ]))),

            // y axis scale, inside
            div({
                style: {
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '5%',
                    height: '100%',
                    backgroundColor: 'transparent'
                }
            })

        ]);
    }

    function buildNarrativesHistogram() {
        return div({
            style: {
                marginLeft: '20px'
            }
        }, div({
            style: {
                position: 'relative',
                height: '150px',
                width: '100%'
            }
        }, div({
            style: {
                height: '100px',
                width: '100%',
                position: 'relative',
                top: '20px'
            }
        },[
            div({
                style: {
                    height: '100px',
                    borderBottom: '1px #CECECE solid'
                }
            }),
            gen.ifLet({
                histogram: 'narrativesHistogram()'
            }, buildHistogram())
        ])));
    }

    function buildSharedNarrativesHistogram() {
        return div({
            style: {
                marginLeft: '20px'
            }
        }, div({
            style: {
                position: 'relative',
                height: '150px',
                width: '100%'
            }
        }, div({
            style: {
                height: '100px',
                width: '100%',
                position: 'relative',
                top: '20px'
            }
        },[
            div({
                style: {
                    height: '100px',
                    borderBottom: '1px #CECECE solid'
                }
            }),
            gen.ifLet({
                histogram: 'sharedNarrativesHistogram()'
            }, buildHistogram())
        ])));
    }

    function buildPanel() {
        return div({
            class: 'panel panel-default kbase-widget',
            style: {
                width: '100%'
            },
            dataKBTesthookComponent: 'metrics'
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
                            class: 'fa fa-bar-chart pull-left',
                            style: {
                                fontSize: '150%',
                                paddingRight: '10px'
                            }
                        }),
                        span({
                            class: 'panel-title',
                            style: {
                                verticalAlign: 'middle'
                            }
                        }, 'Metrics')
                    ]),
                    div({
                        class: 'col-sm-6',
                        dataPlaceholder: 'buttonbar',
                        style: {
                            textAlign: 'right'
                        }
                    }, buildButtonBar())
                ])
            ]),
            div({
                class: 'panel-body'
            }, [
                div({
                    dataPlaceholder: 'alert'
                }),
                div([
                    h3('Total Narratives'),
                    gen.if('loading', html.loading(),
                        buildNarrativesHistogram()),
                    h3('Shared Narratives'),
                    gen.if('loading',html.loading(),
                        buildSharedNarrativesHistogram())
                ])
            ])
        ]);
    }

    function template() {
        return buildPanel();
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
