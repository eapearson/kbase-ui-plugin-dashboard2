define([
    'kb_knockout/lib/generators',
    'kb_common/html',
    './narrativeCard'
], function (
    gen,
    html,
    NarrativeCardComponent
) {
    'use strict';

    var t = html.tag,
        a = t('a'),
        p = t('p'),
        div = t('div'),
        span = t('span'),
        label = t('label'),
        select = t('select'),
        input = t('input');

    function buildButtonBar(options) {
        options = options || {};
        let newNarrativeButton;
        if (options.newNarrativeButton) {
            newNarrativeButton = a({
                class: 'btn btn-primary btn-kbase',
                role: 'button',
                href: '#narrativemanager/new',
                target: '_blank'
            }, [
                span({
                    class: 'fa fa-plus-circle',
                    style: 'margin-right: 5px'
                }),
                span({
                    class: 'kb-nav-btn-txt',
                    style: {
                        verticalAlign: 'middel'
                    }
                }, 'New Narrative')
            ]);
        }
        return [
            newNarrativeButton,
            div({
                class: 'navbar-form navbar-group'
            }, [
                div({
                    class: 'form-group'
                }, [
                    input({
                        type: 'text',
                        class: 'form-control',
                        placeholder: 'Search ' + options.label + ' Narratives',
                        dataBind: {
                            textInput: 'narrativeFilterInput'
                        }
                    })
                ])
            ])
        ];
    }

    function buildNewNarrativeButtonCard() {
        return  div({
            class: '-card -short'
        }, [
            div({
                class: '-inner -box'
            }, [
                a({
                    role: 'button',
                    class: 'btn btn-primary btn-base',
                    href: '#narrativemanager/new',
                    style: {
                        height: '100%',
                        width: '100%',
                        paddingTop: '15px'
                    },
                    target: '_blank'
                }, [
                    div(span({
                        class: 'fa fa-plus'
                    })),
                    div({
                        dataBind: {
                            text: 'createButtonLabel'
                        }
                    })
                ])
            ])
        ]);
    }

    function buildMessageCard(message) {
        return div({
            class: '-card -short'
        }, div({
            class: '-inner -message'
        }, message));
    }

    function buildSlider() {
        return div({
            class: 'slider your-narratives-slider',
            dataKBTesthookSlider: 'narratives'
        }, gen.if('loading',
            //then
            buildMessageCard(div({
                style: {
                    textAlign: 'center'
                }
            }, html.loading('Loading Narratives'))),
            //else
            gen.if('narrativesAvailableCount() === 0',
                // then
                [
                    gen.if('$data.createButtonLabel',
                        buildNewNarrativeButtonCard()),
                    buildMessageCard(div({
                        style: {
                            textAlign: 'center'
                        }
                    }, gen.if('$data.noNarrativesMessage',
                        span({
                            dataBind: {
                                text: 'noNarrativesMessage'
                            }
                        }),
                        'No narratives available in this category')
                    ))
                ],
                //else
                [
                    gen.if('narrativesFilteredCount() === 0 ',
                        //then
                        buildMessageCard(
                            p({
                                style: {
                                    textAlign: 'center'
                                }
                            }, 'No Narratives match your search')
                        )),
                    // always
                    gen.foreach({
                        data: 'narratives',
                        descendantsComplete: 'function(){$component.doNarrativesRendered.call($component);}'
                    }, gen.component({
                        name: NarrativeCardComponent.name(),
                        params: {
                            narrative: '$data',
                            narrativeFilter: '$component.narrativeFilter',
                            username: '$component.username',
                            methodStoreImageURL: '$component.methodStoreImageURL',
                            scrolled: '$component.scrolled',
                            doShareNarrative: '$component.doShareNarrative',
                            doOpenNarrative: '$component.doOpenNarrative',
                            doDeleteNarrative: '$component.doDeleteNarrative'
                        }
                    }))
                ]
            )));
    }

    return {
        buildSlider,
        buildButtonBar
    };
});