define([
    'bluebird',
    'knockout',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/props',
    '../../lib/timer',
    '../dialogs/shareNarrative',
    '../dialogs/deleteNarrative'
], function (
    Promise,
    ko,
    ViewModelBase,
    props,
    Timer,
    ShareNarrativeComponent,
    DeleteNarrativeComponent
) {
    'use strict';

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            let runtime = context['$root'].runtime;

            // TODO: all runtime stuff should actually be set in params...
            //       ... other than service urls?
            this.username = runtime.service('session').getUsername();

            this.model = params.model;


            // Evaluate dev mode and app tag behavior.

            let roles = runtime.service('session').getRoles().map((role) => {
                return role.id;
            });

            this.isDevMode = ko.observable();

            // set the dev mode flag if the DevToken role is assigned
            // let deployEnvironment = runtime.config('deploy.environment');
            if (roles.indexOf('DevToken') >= 0) {
                this.isDevMode(true);
            } else {
                this.isDevMode(false);
            }

            this.narrativeFilterInput = ko.observable().extend({
                rateLimit: 300
            });

            this.narrativeFilter = ko.pureComputed(() => {
                let input = this.narrativeFilterInput();
                let regex;
                if (!input) {
                    regex = null;
                } else {
                    // todo: ensure doesn't break!
                    regex = new RegExp(input, 'i');
                }
                return {
                    input: this.narrativeFilterInput(),
                    regex: regex
                };
            });

            this.overlayComponent = ko.observable();

            this.narratives = ko.observableArray();

            this.narrativesLoading = ko.observable(true);


            // SUBSCRIPTIONS

            // BUS
            this.on('reload', () => {
                this.reloadNarratives();
            });

            // STARTUP

            let timer = new Timer();
            timer.start('main:start');
            this.model.getNarratives2()
                .then((narratives) => {
                    // now create a view model version of the narratives.
                    timer.start('main:convert to view model');

                    let n = narratives.map((narrative) => {
                        // some top level properties.
                        return this.narrativeModelToViewModel(narrative);
                    })
                        .sort((a, b) => {
                            return (b.savedAt.getTime() - a.savedAt.getTime());
                        });
                    this.narrativesLoading(false);
                    this.narratives(n);
                    timer.start('main:update apps');
                })
                .catch((err) => {
                    console.error('ERROR', err);
                })
                .finally(() => {
                    timer.stop();
                });

            this.actions = {
                deleteNarrative: (narrative) => {
                    return this.deleteNarrative(narrative);
                },
                shareNarrative: (narrative, username, permission) => {
                    return this.shareNarrative(narrative, username, permission);
                },
                unshareNarrative: (narrative, username) => {
                    return this.unshareNarrative(narrative, username);
                },
                changeShareNarrative: (narrative, username, permission) => {
                    return this.changeShareNarrative(narrative, username, permission);
                },
                shareNarrativeGlobal: (narrative) => {
                    return this.shareNarrativeGlobal(narrative);
                },
                unshareNarrativeGlobal: (narrative) => {
                    return this.unshareNarrativeGlobal(narrative);
                }
            };
        }

        appViewModel(app) {
            let appVM = {
                type: app.type,
                // key: app.key,
                id: app.id,
                count: app.count,
                spec: app.spec,
                name: null,
                state: null,
                title: null,
                iconUrl: null
            };

            // if (app.type === 'app') {
            // console.log('app view model...', app);
            // }

            if (app.obsolete) {
                // old methods not supported at all.
                appVM.name = app.id.name;
                appVM.state = 'error',
                appVM.title = 'Pre-SDK methods not supported';
            } else {
                // old style apps without modules (pre-sdk) are not supported either.
                if (!app.id.module) {
                    appVM.name = app.id.name;
                    appVM.state = 'error';
                    appVM.title = 'Pre-SDK apps not supported';
                } else {
                    let appId = app.id.module + '/' + app.id.name;
                    if (!app.notFound) {
                        appVM.name = app.title;
                        appVM.state = 'ok';
                        appVM.title = app.title;
                        appVM.iconUrl = props.getProp(app, 'iconUrl', null);
                    } else {
                        appVM.name = appId;
                        appVM.state = 'error';
                        appVM.title = 'App not found';
                    }
                }
            }
            return appVM;
        }

        narrativeModelToViewModel(narrative) {
            return {
                title: narrative.title,
                owner: narrative.owner,
                narrativeId: 'ws.' + narrative.workspaceId + '.obj.' + narrative.objectId,
                // Last saved
                // Need both? Probably not.
                // modifiedAt: narrative.workspace.modDate,
                savedAt: narrative.savedAt,
                savedBy: narrative.savedBy,
                // workspace permission of the current user
                userPermission: narrative.permission,
                ref: {
                    workspaceId: narrative.workspaceId,
                    objectId: narrative.objectId,
                    objectVersion: narrative.objectVersion,
                    ref: [narrative.workspaceId, narrative.objectId, narrative.objectVersion].join('/'),
                    // TODO: not implemented?
                    path: narrative.path
                },
                isPublic: ko.observable(narrative.isPublic),
                isNarratorial: ko.observable(narrative.isNarratorial),
                // isPublic: ko.observable(narrative.workspace.globalread === 'r'),
                // isNarratorial: ko.observable(narrative.workspace.metadata.narratorial === '1'),
                permissions: ko.observableArray(narrative.permissions
                    .filter((permission) => {
                        // remove current user for permissions in narratives owned by the
                        // current user.
                        if (permission.username === this.username && narrative.owner === this.username) {
                            return false;
                        }
                        return true;
                    })
                    .map((permission) => {
                        return {
                            username: permission.username,
                            profile: this.makeProfileVM(permission.username, permission.profile),
                            permission: ko.observable(permission.perm)
                        };
                    })),
                apps: narrative.apps
                    .map((app) => {
                        return this.appViewModel(app);
                    })
                    .sort((a, b) => {
                        if (a.name.toLowerCase() < b.name.toLowerCase()) {
                            return -1;
                        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
                            return 1;
                        }
                        return 0;
                    }),
                cellTypes: narrative.cellTypes,
                ui: {
                    show: ko.observable(true),
                    active: ko.observable(),
                    canView: true, // by definition!
                    canEdit: narrative.permission !== 'n',
                    canShare: narrative.permission === 'a',
                    canDelete: narrative.owner === this.username
                }
            };
        }

        reloadNarratives() {
            this.loadNarratives(true);
        }

        deleteNarrative(narrative) {
            return this.model.deleteNarrative(narrative.ref.workspaceId)
                .then(() => {
                    this.narratives.remove(narrative);
                });
        }

        makeAvatar(profile) {
            switch (props.getProp(profile, 'profile.userdata.avatarOption', null) || 'gravatar') {
            case 'gravatar':
            // console.log('gravatar??', props.hasProp(profile, 'profile.synced.gravatarHash'), )
                if (props.hasProp(profile, 'profile.synced.gravatarHash')) {
                    var gravatarDefault = props.getProp(profile, 'profile.userdata.gravatarDefault', null) || 'identicon';
                    var gravatarHash = props.getProp(profile, 'profile.synced.gravatarHash', null);
                    if (gravatarHash) {
                        return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=32&amp;r=pg&d=' + gravatarDefault;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            case 'silhouette':
            case 'mysteryman':
            default:
                return null;
            }
        }

        makeProfileVM(username, profile){
            if (profile === null) {
                return {
                    username: username,
                    realname: username,
                    gravatarHash: null,
                    gravatarDefault: null,
                    avatarUrl: null
                };
            } else {
                return {
                    username: profile.user.username,
                    realname: profile.user.realname,
                    gravatarHash: props.getProp(profile, 'profile.synced.gravatarHash', null),
                    gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
                    avatarUrl: this.makeAvatar(profile)
                };
            }
        }

        // profileToVM(profile) {
        //     return {
        //         username: profile.user.username,
        //         realname: profile.user.realname,
        //         gravatarHash: props.getProp(profile, 'profile.synced.gravatarHash'),
        //         gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
        //         avatarUrl: this.makeAvatar(profile)
        //     };
        // }

        shareNarrative(narrative, username, permission) {
            return this.model.shareNarrative(narrative.ref.workspaceId, username, permission)
                .then(() => {
                    return this.model.getUserProfile(username)
                        .then((profile) => {
                            console.log('profile?', this.makeProfileVM(username, profile));
                            narrative.permissions.push({
                                username: username,
                                profile: this.makeProfileVM(username, profile),
                                permission: ko.observable(permission)
                            });
                        });
                });
        }

        changeShareNarrative(narrative, username, permission) {
            return this.model.shareNarrative(narrative.ref.workspaceId, username, permission);
        }

        unshareNarrative(narrative, username) {
            return this.model.unshareNarrative(narrative.ref.workspaceId, username)
                .then(() => {
                    // TODO: remove from the view model
                    narrative.permissions.remove((permission) => {
                        return permission.username === username;
                    });
                });
        }

        shareNarrativeGlobal(narrative) {
            return this.model.shareNarrativeGlobal(narrative.ref.workspaceId)
                .then(() => {
                    narrative.isPublic(true);
                });
        }

        unshareNarrativeGlobal(narrative) {
            return this.model.unshareNarrativeGlobal(narrative.ref.workspaceId)
                .then(() => {
                    narrative.isPublic(false);
                });
        }

        doShareNarrative(data) {
            this.overlayComponent({
                name: ShareNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    // Note that we need to wrap the action methods in an arrow function in order to
                    // retain the "this" context
                    shareNarrative: (...args) => {return this.shareNarrative.apply(this, args);},
                    unshareNarrative: (...args) => {return this.unshareNarrative.apply(this, args);},
                    changeShareNarrative: (...args) => {return this.changeShareNarrative.apply(this, args);},
                    shareNarrativeGlobal: (...args) => {return this.shareNarrativeGlobal.apply(this, args);},
                    unshareNarrativeGlobal: (...args) => {return this.unshareNarrativeGlobal.apply(this, args);}
                }
            });
        }

        doDeleteNarrative(data) {
            this.overlayComponent({
                name: DeleteNarrativeComponent.name(),
                type: 'info',
                viewModel: {
                    narrative: data,
                    deleteNarrative: (narrative) => {return this.deleteNarrative.call(this, narrative);}
                }
            });
        }

        doOpenNarrative(narrative) {
            let narrativeUrl = [
                '/narrative/ws',
                narrative.ref.workspaceId,
                'obj',
                narrative.ref.objectId
            ].join('.');
            window.open(narrativeUrl, '_blank');
        }
    }

    return ViewModel;
});