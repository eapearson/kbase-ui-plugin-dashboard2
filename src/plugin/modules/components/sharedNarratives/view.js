define([
    'kb_knockout/lib/generators',
    'kb_lib/html',
    'kb_lib/htmlBuilders',
    '../common'
], function (
    gen,
    html,
    builders,
    common
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span');

    function template() {
        return div({
            class: 'panel panel-default kbase-widget',
            style: {
                width: '100%'
            },
            dataKBTesthookComponent: 'shared-narratives'
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
                            class: ['fa',  'pull-left'],
                            dataBind: {
                                class: '"fa-" + icon'
                            },
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
                            span({style: {fontSize: '80%'}}, builders.loading()),
                            gen.if('narratives().length === 0',
                                span('Sorry, no narratives found in this category'),
                                gen.if('narrativesFilteredCount() === 0',
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
                                                text: 'narrativeFilter().input'
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
                                        gen.if('narrativesFilteredCount() < narratives().length',
                                            span([
                                                ', matching on ',
                                                span({
                                                    style: {
                                                        fontWeight: 'bold'
                                                    },
                                                    dataBind: {
                                                        text: 'narrativeFilter().input'
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

    return template;
});