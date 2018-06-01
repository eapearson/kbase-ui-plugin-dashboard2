// a wrapper for the help component, loads the search help.
define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    '../../lib/ui',
    '../userSearch',
    './userPermission'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    BS,
    ui,
    UserSearchComponent,
    UserPermission
) {
    'use strict';

    const t = html.tag,
        a = t('a'),
        div = t('div'),
        p = t('p'),
        img = t('img'),
        input = t('input'),
        select = t('select'),
        label = t('label'),
        span = t('span'),
        button = t('button'),
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        td= t('td');

    const states = {
        INPROGRESS: Symbol(),
        SUCCESS: Symbol(),
        ERROR: Symbol()
    };


    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            // NOLIKE
            this.username = context['$root'].runtime.service('session').getUsername();

            // import from parent
            this.narrative = params.narrative;
            this.shareNarrative = params.shareNarrative;
            this.unshareNarrative = params.unshareNarrative;
            this.changeShareNarrative = params.changeShareNarrative;
            this.shareNarrativeGlobal = params.shareNarrativeGlobal;
            this.unshareNarrativeGlobal = params.unshareNarrativeGlobal;

            // import from user permission module.
            this.permissions = UserPermission.permissions;

            this.title = 'Share Narrative "' + this.narrative.title+ '"';

            // todo: this stuff should be transformed into something more vm-friendly
            // when ingested...
            this.narrativeTitle = this.narrative.title;
            this.lastSavedAt = this.narrative.savedAt;
            // this.shareCount = narrative.permissions().length;
            this.isPublic = this.narrative.isPublic;

            this.subscribe(this.isPublic, (newValue) => {
                if (newValue) {
                    this.shareNarrativeGlobal(this.narrative)
                        .then(() => {
                            // signal success
                        })
                        .catch(() => {
                            // signal error
                        });
                } else {
                    this.unshareNarrativeGlobal(this.narrative)
                        .then(() => {
                            // signal success
                        })
                        .catch(() => {
                            // signal error
                        });
                }
            });

            // console.log('narrative perms', narrative.permissions);
            this.usersSharedWith = ko.pureComputed(() => {
                return this.narrative.permissions()
                    .map((permission) => {
                        // TODO: don't like this here...
                        this.subscribe(permission.permission, (newValue) => {
                            this.changeShareNarrative(this.narrative, permission.profile.username, newValue)
                                .then(() => {
                                    // change share on model? or ... that should be through the this.data which should be this.model...
                                    // console.log('yay, chaged share');
                                    // notify the user...
                                })
                                .catch((err) => {
                                    console.error('Error changing user share permissions', err);
                                });
                        });
                        return {
                            user: {
                                username: permission.profile.username,
                                realname: permission.profile.realname,
                                avatarUrl: permission.profile.avatarUrl
                            },
                            permission: new UserPermission.UserPermission(permission.permission)
                        };
                    })
                    .sort((a,b) => {
                        return a.user.username < b.user.username ? -1 : (a.user.username > b.user.username ? 1 : 0);
                    });
            });

            this.omitUsers = ko.pureComputed(() => {
                let omit = this.usersSharedWith().reduce((userMap, sharedUser) => {
                    userMap[sharedUser.user.username] = true;
                    return userMap;
                }, {});
                omit[this.username] = true;

                return omit;
            });

            this.workspaceId = this.narrative.ref.workspaceId;

            // NB: onClose is passed by the slidey panel
            this.onClose = params.onClose;

            this.states = states;

            this.state = ko.observable();

            this.error = ko.observable();

            this.selectedPermission = ko.observable();

            this.selectedUser = ko.observable();

            this.shareParams = ko.pureComputed(() => {
                return {
                    permission: this.selectedPermission(),
                    username: this.selectedUser()
                };
            });

            this.canShare = ko.pureComputed(() => {
                return this.selectedPermission() && this.selectedUser() ? true : false;
            });

            this.nopic = context['$root'].pluginPath + '/resources/images/nouserpic.png';

            this.onSuccess = params.onSuccess;
        }

        doClose() {
            this.onClose();
        }

        doShare() {
            let selectedUser = this.selectedUser();
            if (!selectedUser) {
                console.warn('attempt to share, but no selected user');
                return;
            }
            let permission = this.selectedPermission();
            if (!permission) {
                console.warn('attempt to share without a permission');
                return;
            }
            this.shareNarrative(this.narrative, selectedUser.username, permission)
                .catch((err) => {
                    console.error('Error sharing narrative:' , err, this.narrative, selectedUser.username, permission);
                });
        }

        doUnshare(data) {
            this.unshareNarrative(this.narrative, data.user.username)
                // .then((result) => {
                //     // this.usersSharedWith.remove(data);
                //     console.log('result', result);
                // })
                .catch((err) => {
                    console.error('Error unsharing with user', err);
                });
        }

        // doChangeShare(data) {
        //     this.changeShareNarrative(this.narrative, data.user.username, data.permission)
        //         .then(() => {
        //             // change share on model? or ... that should be through the this.data which should be this.model...
        //             // console.log('yay, chaged share');
        //             // notify the user...
        //         })
        //         .catch((err) => {
        //             console.error('Error changing user share permissions', err);
        //         });
        // }
    }

    function buildGravatar() {
        return gen.if('user.avatarUrl',
            img({
                dataBind: {
                    attr: {
                        src: 'user.avatarUrl'
                    }
                },
                style: {
                    width: '32px',
                    height: '32px'
                }
            }),
            img({
                dataBind: {
                    attr: {
                        src: '$component.nopic'
                    }
                },
                style: {
                    width: '32px',
                    height: '32px'
                }
            }));
    }

    function buildPermissionControl() {
        return select({
            dataBind:{
                value: 'selectedPermission',
                options: 'permissions',
                optionsValue: '"value"',
                optionsText: '"label"'
            },
            class: 'form-control'
        });
    }

    function buildBody() {
        return div({}, [
            p([
                'Share the narrative "',
                span({
                    style: {
                        fontWeight: 'bold'
                    },
                    dataBind: {
                        text: 'narrativeTitle'
                    }
                }),
                '", last saved ',
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
                '.'
            ]),
            div({
                class: 'form'
            }, div({
                class: 'input-group'
            }, [
                div({
                    class: 'checkbox'
                }, [
                    label([
                        input({
                            type: 'checkbox',
                            dataBind: {
                                checked: 'isPublic'
                            }
                        }),
                        span({
                            class: 'fa fa-globe fa-lg',
                            dataBind: {
                                style: {
                                    color: 'isPublic() ? "inherit" : "silver"'
                                }
                            }
                        }),
                        ' &ndash; ',
                        gen.if('isPublic', 'Shared', 'Share'),
                        ' as ',
                        span({
                            class: 'fa fa-eye'
                        }),
                        ' ',
                        span('Read Only'),
                        ' with all KBase Users'
                    ])
                ])
            ])),
            div({}, [
                p('Share with specific users:'),
                table({
                    class: 'table'
                }, [
                    thead(tr([
                        th({
                            style: {
                                width: '10%'
                            }
                        }),
                        th({
                            style: {
                                width: '30%'
                            }
                        }, 'Name'),
                        th({
                            style: {
                                width: '20%'
                            }
                        }, 'Username'),
                        th({
                            style: {
                                width: '30%'
                            }
                        }, 'Permission'),
                        th({
                            style: {
                                width: '10%'
                            }
                        })
                    ])),
                    tbody([
                        tr([
                            td({
                                colspan: '3'
                            }, div({
                                dataBind: {
                                    component: {
                                        name: UserSearchComponent.quotedName(),
                                        params: {
                                            selectedUser: 'selectedUser',
                                            omitUsers: 'omitUsers'
                                        }
                                    }
                                }
                            })),
                            td(buildPermissionControl()),
                            td(
                                button({
                                    class: 'btn btn-default',
                                    dataBind: {
                                        enable: '$component.canShare',
                                        click: 'function(d,e) {$component.doShare.call($component, d, e);}'
                                    }
                                }, span({
                                    class: 'fa fa-plus',
                                    style: {
                                        color: 'green'
                                    },
                                }))
                            )
                        ]),
                        gen.foreach('usersSharedWith', tr([
                            td(buildGravatar()),
                            td({
                                dataBind: {
                                    text: 'user.realname'
                                }
                            }),
                            td(a({
                                dataBind: {
                                    attr: {
                                        href: '"#people/" + user.username'
                                    },
                                    text: 'user.username'
                                },
                                target: '_blank'
                            })),
                            td({
                                class: 'form-inline'
                            }, div({
                                class: 'form-group'
                            }, [
                                span({
                                    class: 'fa',
                                    style: {
                                        marginRight: '8px',
                                        fontSize: '120%'
                                    },
                                    dataBind: {
                                        class: '"fa-" + permission.icon()'
                                    }
                                }),
                                select({
                                    class: 'form-control',
                                    dataBind:{
                                        value: 'permission.permission',
                                        options: '$component.permissions',
                                        optionsValue: '"value"',
                                        optionsText: '"label"'
                                    }
                                })
                            ])),
                            td(
                                button({
                                    class: 'btn btn-danger',
                                    dataBind: {
                                        click: 'function(d,e) {$component.doUnshare.call($component,d,e);}'
                                    }
                                }, span({
                                    class: 'fa fa-trash'
                                }))
                            )
                        ]))
                    ])
                ])
            ]),
            gen.koSwitch('state', [
                [
                    '$component.states.INPROGRESS',
                    div({
                        class: 'alert alert-info'
                    }, [
                        p([
                            html.loading('Sharing')
                        ])
                    ])
                ],
                [
                    '$component.states.SUCCESS',
                    div({
                        class: 'alert alert-success'
                    }, [
                        p([
                            'Successfully shared this narrative.'
                        ])
                    ])
                ],
                [
                    '$component.states.ERROR',
                    div({
                        class: 'alert alert-danger'
                    }, [
                        p([
                            'Error attempting to share this Narrative!'
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
            type: 'info',
            title: span({dataBind: {text: 'title'}}),
            icon: 'share',
            body: buildBody(),
            buttons: [
                {
                    type: 'default',
                    label: 'Close',
                    onClick: 'doClose'
                }
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