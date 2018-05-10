define([
    'kb_knockout/lib/generators',
    'kb_common/html',
    '../table'
], function (
    gen,
    html,
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
        return div([
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
        return html.loading('Loading collaborators');
    }

    function buildPanel() {
        return div({
            class: 'panel panel-default kbase-widget',
            style: {
                width: '100%'
            },
            dataKBTesthookWidget: 'your-narratives'
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
                    backgroundColor: '#F5F5F5'
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
        return div([
            buildPanel()
        ]);
    }

    return template;
});

