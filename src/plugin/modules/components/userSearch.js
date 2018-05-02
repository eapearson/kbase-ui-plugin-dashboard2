define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html',
    '../lib/data'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    Data
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        table = t('table'),
        tr = t('tr'),
        tbody = t('tbody'),
        td= t('td');

    const modes = {
        ENTRY: Symbol(),
        VIEW: Symbol()
    };

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.selectedUser = params.selectedUser;
            this.omitUsers = params.omitUsers;


            let runtime = context['$root'].runtime;

            let data = Data.make({runtime});

            this.users = ko.observableArray();

            this.query = ko.observable().extend({
                rateLimit: {
                    timeout: 300,
                    method: 'notifyWhenChangesStop'
                }
            });

            this.subscribe(this.query, (newValue) => {
                if (newValue === '') {
                    this.users([]);
                    return;
                }
                data.userProfileSearch(newValue)
                    .then((profiles) => {
                        let users = profiles
                            .filter((profile) => {
                                return this.omitUsers()[profile.user.username] ? false : true;
                            })
                            .map((profile) => {
                                return {
                                    username: profile.user.username,
                                    realname: profile.user.realname,
                                    avatar: null
                                };
                            })
                            .sort((a, b) => {
                                if (a.realname) {
                                    if (b.realname) {
                                        var aName = a.realname.toLowerCase();
                                        var bName = b.realname.toLowerCase();
                                        if (aName < bName) {
                                            return -1;
                                        } else if (aName > bName) {
                                            return 1;
                                        } else {
                                            return 0;
                                        }
                                    } else {
                                        return -1;
                                    }
                                } else {
                                    return 0;
                                }
                            });
                        this.users(users);
                    });
            });

            this.modes = modes;

            this.mode = ko.observable(this.modes.ENTRY);
        }

        doSelectUser(data) {
            this.selectedUser(data);
            this.mode(this.modes.VIEW);
        }

        doEdit() {
            this.mode(this.modes.EDIT);
        }

        doInputKeyup(data, event) {
            if (event.key === 'Escape') {
                this.mode(this.modes.VIEW);
            }
        }

        doResultsKeyup(data, event) {
            if (event.key === 'Escape') {
                this.mode(this.modes.VIEW);
            }
        }
    }

    let styles = html.makeStyles({
        component: {
            css: {

            }
        },
        results: {
            css: {
                backgroundColor: '#FFF',
                width: '100%',
                // prevents the results from forcing the dialog to scroll
                overflow: 'hidden'
            },
            inner: {
                td: {
                    padding: '4px'
                },
                'td:nth0child(1)': {
                    width: '48px'
                },
                '.avatar': {
                    width: '40px'
                }
            }
        },
        wrapper: {
            css: {
                position: 'relative',
                zIndex: '2',
                left: '0',
                right: '0'
            }
        },
        container: {
            css: {
                position: 'relative',
                maxHeight: '300px',
                overflowY: 'auto',
                left: '0',
                right: '0',
                border: '1px silver solid',
                backgroundColor: '#FFF',
                padding: '10px'
            }
        },
        userRow: {
            css: {
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'rgba(200,200,200,0.5)'
                }
            }
        }
    });
    // input({
    //     class: 'form-control',
    //     placeholder: 'Share with a KBase User...'
    // })

    function buildInput() {
        return div({
            class: 'form'
        }, [
            input({
                class: 'form-control',
                type: 'text',
                autocomplete: 'off',
                placeholder: 'Search for a KBase user to share with ...',
                dataBind: {
                    textInput: 'query',
                    event: {
                        keyup: 'function (d,e) {$component.doInputKeyup.call($component,d,e);}'
                    }
                }
            })
        ]);
    }

    function buildUserTable() {
        return table({
            style: {
                width: '100%'
            }
        }, tbody([
            tr([
                td({
                    style: {
                        width: '16.667%'
                    }
                }),
                td({
                    colspan: '2',
                    style: {
                        width: '83.333'
                    }
                }, [
                    'Found ' +
                    span({
                        dataBind: {
                            text: 'users().length'
                        },
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    ' users matching ',
                    span({
                        dataBind: {
                            text: 'query'
                        }
                    })
                ])
            ]),
            gen.foreach('users',
                tr({
                    dataBind: {
                        click: 'function (d, e) {$component.doSelectUser.call($component, d, e);}'
                        // click: 'function () {alert("here");}'
                    },
                    class: styles.classes.userRow
                }, [
                    td({
                        style: {
                            width: '16.667%'
                        }
                    }),
                    td({
                        dataBind: {
                            text: '$data.realname'
                        },
                        style: {
                            width: '50%'
                        }
                    }),
                    td({
                        dataBind: {
                            text: '$data.username'
                        },
                        style: {
                            width: '33.333%'
                        }
                    })
                ]))
        ]));
    }

    function buildResults() {
        return div({
            class: styles.classes.results
        }, div({
            class: styles.classes.wrapper
        }, div({
            class: styles.classes.container,
            dataBind: {
                event: {
                    keyup: 'function (d,e) {$component.doResultsKeyup.call($component,d,e);}'
                }
            }
        }, buildUserTable()
        )));
    }

    function buildView() {
        return div({
            dataBind: {
                click: '$component.doEdit'
            },
            class: 'form-control'
        }, gen.if('selectedUser',
            table({
                style: {
                    width: '100%'
                }
            }, tr({}, [
                td({
                    style: {
                        width: '16.667%'
                    }
                }),
                td({
                    dataBind: {
                        text: 'selectedUser().realname'
                    },
                    style: {
                        width: '50%'
                    }
                }),
                td({
                    dataBind: {
                        text: 'selectedUser().username'
                    },
                    style: {
                        width: '33.333'
                    }
                })
            ])),
            span('Select a user...')));
    }


    function template() {
        return div({
            class: styles.classes.component,
            dataKBTesthookComponent: 'user-search'
        }, [
            gen.if('mode() === modes.EDIT',
                [
                    buildInput(),
                    gen.if('users().length > 0', buildResults())
                ],
                buildView())
        ]);
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});