define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        a = t('a'),
        span = t('span'),
        label = t('label'),
        input = t('input'),
        select = t('select'),
        button = t('button');


    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.isDevMode = params.isDevMode;

            this.appTag = params.appTag;
            this.appTagValues = params.appTagValues;

            this.narrativeFilterInput = params.narrativeFilterInput;
        }

        reloadNarratives() {
            this.sendToParent('reload');
        }
    }

    function buildNewNarrativeButton() {
        return a({
            class: 'btn btn-primary btn-kbase',
            role: 'button',
            href: '#narrativemanager/new',
            target: '_blank'
        }, [
            span({
                class: 'fa fa-plus',
                style: 'margin-right: 5px'
            }),
            span({
                class: 'kb-nav-btn-txt',
                style: {
                    verticalAlign: 'middle'
                }
            }, 'New Narrative')
        ]);
    }

    function buildReloadNarrativesButton() {
        return button({
            type: 'button',
            class: 'btn btn-primary btn-kbase',
            role: 'button',
            dataBind: {
                click: '$component.reloadNarratives'
                // click: 'function (d, e) {$component.reloadNarratives.call($component,d,e);}'
            }
        }, [
            span({
                class: 'fa fa-refresh',
                style: 'margin-right: 5px'
            }),
            span({
                class: 'kb-nav-btn-txt',
                style: {
                    verticalAlign: 'middle'
                }
            }, 'Reload Narratives')
        ]);
    }

    function buildButtonBar() {
        return [
            div({
                class: 'btn-toolbar',
                // style: {
                //     padding: '0',
                //     marginLeft: '10px'
                // }
            }, [
                buildNewNarrativeButton(),
                buildReloadNarrativesButton()
            ])
        ];
    }

    function buildAppTagSelector() {
        return  div({
            class: 'form-group',
            style: {
                marginRight: '10px'
            }
        }, [
            label({
                style: {
                    marginRight: '4px'
                }
            }, 'App Tag: '),
            select({
                dataBind: {
                    value: 'appTag',
                    options: 'appTagValues',
                },
                class: 'form-control'
            })
        ]);
    }

    function buildSearchBar() {
        return div({
            class: 'input-group'
        }, [
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer',
                    borderRadius: '4px',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                }
            }, div({
                style: {
                    display: 'inline-block',
                    width: '23m',
                    textAlign: 'center'
                }
            }, span({
                class: 'fa fa-search',
                style: {
                    fontSize: '100%',
                    color: '#000'
                },
                // dataBind: {
                //     css: {
                //         'fa-search': '!searching()',
                //         'fa-spinner fa-pulse': 'searching()'
                //     }
                // }
            }))),
            div({
                class: 'form-control',
                style: {
                    display: 'inline-block',
                    width: '100%',
                    position: 'relative',
                    padding: '0',
                    border: 'none'
                }
            }, [
                input({
                    type: 'text',
                    class: 'form-control',
                    placeholder: 'Filter Narratives',
                    dataBind: {
                        textInput: 'narrativeFilterInput'
                    }
                })
            ])
        ]);
    }

    function buildPanel() {
        return div({
            class: 'well'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-sm-6'
                }, [
                    buildButtonBar()
                    // span({
                    //     class: 'fa fa-tachometer pull-left',
                    //     style: {
                    //         fontSize: '150%',
                    //         paddingRight: '10px'
                    //     }
                    // }),
                    // span({
                    //     class: 'panel-title',
                    //     style: {
                    //         verticalAlign: 'middle'
                    //     }
                    // }, 'Your Dashboard')
                ]),
                div({
                    class: 'col-sm-6',
                    dataPlaceholder: 'buttonbar',
                    style: {
                        textAlign: 'right'
                    }
                }, div({
                    class: 'navbar-form navbar-group'
                }, [

                    gen.koIf('isDevMode',
                        buildAppTagSelector()),
                    buildSearchBar()
                ]))
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