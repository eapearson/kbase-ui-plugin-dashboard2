define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    '../../lib/ui',
    '../../lib/data',
    './userPermission'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    BS,
    ui,
    Data,
    userPermission
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        ul = t('ul'),
        li = t('li'),
        span = t('span');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.data = Data.make({
                runtime: context['$root'].runtime
            });

            // import params
            this.narrative = params.narrative;
            this.deleteNarrative = params.deleteNarrative;

            this.title = 'Delete Narrative "' + this.narrative.title + '"';

            // todo: this stuff should be transformed into something more vm-friendly
            // when ingested...
            this.narrativeTitle = this.narrative.title;
            this.lastSavedAt = this.narrative.savedAt;
            this.shareCount = this.narrative.permissions().length;
            this.isPublic = this.narrative.isPublic;
            // console.log('narrative perms', narrative.permissions);
            this.usersSharedWith = this.narrative.permissions.map((permission) => {
                return {
                    username: permission.username,
                    realname: permission.profile.realname,
                    permission: new userPermission.UserPermission(permission.permission)
                };
            });

            this.workspaceId = this.narrative.ref.workspaceId;

            // NB: onClose is passed by the slidey panel
            this.onClose = params.onClose;

            this.state = {
                INPROGRESS: Symbol(),
                SUCCESS: Symbol(),
                ERROR: Symbol()
            };

            this.status = ko.observable();

            this.error = ko.observable();

            this.onSuccess = params.onSuccess;
        }

        doClose() {
            this.onClose();
        }

        doDelete() {
            this.status(this.state.INPROGRESS);
            this.deleteNarrative(this.narrative)
                .then(() => {
                    this.status(this.state.SUCCESS);
                })
                .catch((err) => {
                    console.error('Error deleting narrative', err);
                    this.status(this.state.ERROR);
                    this.error(err.message);
                });
        }
    }

    function buildBody() {
        return div({}, [
            p([
                'Proceed to delete narrative ',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'narrativeTitle'
                    }
                }),
                ' last saved ',
                span({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        typedText: {
                            value: 'lastSavedAt',
                            type: '"date"',
                            format: '"elapsed"'
                        }
                    }
                }),
                gen.koIf('shareCount > 0',
                    span([
                        ' and shared with ',
                        span({
                            style: {
                                fontWeight: 'bold'
                            },
                            dataBind: {
                                typedText: {
                                    value: 'shareCount',
                                    type: '"number"',
                                    format: '"0,0"'
                                }
                            }
                        }),
                        gen.koPlural('shareCount', ' user', ' users')
                    ])),
                '?'
            ]),
            gen.koIf('shareCount > 0',
                div({
                    class: 'alert alert-warning'
                }, [
                    p([
                        'Warning: This narrative is shared with ',
                        gen.koIf('shareCount === 1',
                            'another user.',
                            span([
                                span({
                                    style: {
                                        fontWeight: 'bold'
                                    },
                                    dataBind: {
                                        typedText: {
                                            value: 'shareCount',
                                            type: '"number"',
                                            format: '"0,0"'
                                        }
                                    }
                                }),
                                ' other users'
                            ]))
                    ]),
                    p([
                        'The following ',
                        gen.koPlural('shareCount', 'user', 'users'),
                        ' will lose access to this narrative.'
                    ]),
                    ul({
                        dataBind: {
                            foreach: 'usersSharedWith'
                        }
                    }, li([
                        span({
                            dataBind: {
                                text: 'realname'
                            }
                        }),
                        ' - ',
                        span({
                            dataBind: {
                                text: 'username'
                            }
                        }),
                        ' (',
                        span({
                            dataBind: {
                                text: 'permission.label'
                            }
                        }),
                        ')'
                    ]))
                ])),
            gen.koIf('isPublic',
                div({
                    class: 'alert alert-warning'
                }, [
                    p([
                        'Warning: This Narrative is shared with all other KBase users. ',
                        'All KBase users will lose access to the Narrative. ',
                        'When deleted this Narrative will no longer appear in the Public Narratives ',
                        'dashboard panel'
                    ])
                ])),
            gen.koSwitch('status', [
                [
                    '$component.state.INPROGRESS',
                    div({
                        class: 'alert alert-info'
                    }, [
                        p([
                            html.loading('Deleting')
                        ])
                    ])
                ],
                [
                    '$component.state.SUCCESS',
                    div({
                        class: 'alert alert-success'
                    }, [
                        p([
                            'Successfully deleted this narrative.'
                        ])
                    ])
                ],
                [
                    '$component.state.ERROR',
                    div({
                        class: 'alert alert-danger'
                    }, [
                        p([
                            'Error attempting to delete this Narrative!'
                        ]),
                        p({
                            dataBind: {
                                text: 'error'
                            }
                        })
                    ])
                ]])
        ]);
    }

    function template() {
        return ui.buildDialog({
            type: 'danger',
            title: span({dataBind: {text: 'title'}}),
            icon: 'trash',
            body: buildBody(),
            buttons: [
                {
                    type: 'default',
                    label: 'Cancel',
                    onClick: 'doClose'
                },
                {
                    type: 'danger',
                    label: 'Delete',
                    onClick: 'doDelete',
                    disable: 'status() === state.SUCCESS'
                },
            ],
        });
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});