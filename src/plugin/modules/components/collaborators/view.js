define([
    'kb_knockout/lib/generators',
    'kb_lib/html',
    'kb_lib/htmlBuilders',
    '../table'
], function (
    gen,
    html,
    builders,
    TableComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span');

    function buildNoCollaborators() {
        return p([
            'You do not yet have any collaborators. ',
            'To gain collaborators, you need to create narratives and share with other users, or be given share access to Narratives of other users. ',
            'Your collaborators are those users who are "share partners" with all Narratives you own or share.'
        ]);
    }

    function buildCollaborators() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            p([
                'You have ',
                span({
                    dataBind: {
                        text: 'collaborators().length'
                    }
                }),
                ' collaborators.'
            ]),
            div({
                style: {
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                },
                dataBind: {
                    component: {
                        name: TableComponent.quotedName(),
                        params: {
                            table: 'table',
                            rows: 'collaborators'
                        }
                    }
                }
            })
        ]);
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

    function buildLoading() {
        return builders.loading('Loading collaborators');
    }

    function buildPanel() {
        return div({
            class: 'panel panel-default kbase-widget',
            style: {
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            },
            dataKBTesthookWidget: 'collaborators'
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
                            class: 'fa fa-users pull-left',
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
                        }, 'Collaborators')
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
                class: 'panel-body',
                style: {
                    backgroundColor: '#F5F5F5',
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, [
                div({
                    dataPlaceholder: 'alert'
                }),
                gen.if('loading',
                    buildLoading(),
                    gen.if('collaborators() &&  collaborators().length > 0',
                        buildCollaborators(),
                        buildNoCollaborators()))
            ])
        ]);
    }

    function template() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            buildPanel()
        ]);
    }

    return template;
});

