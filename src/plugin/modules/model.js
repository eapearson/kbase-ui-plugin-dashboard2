define([
    'bluebird',
    'kb_service/utils',
    'kb_lib/props',
    './lib/rpc',
    './lib/timer',
    './lib/dashboardError'
], function (
    Promise,
    apiUtils,
    props,
    RPC,
    Timer,
    DashboardError
) {
    'use strict';

    class Model {
        constructor(config) {
            this.runtime = config.runtime;
            this.rpc = new RPC({
                runtime: this.runtime
            });

            this.appCache = {
                dev: null,
                beta: null,
                release: null
            };
        }

        makeAvatar(profile) {
            switch (props.getProp(profile, 'profile.userdata.avatarOption', null) || 'gravatar') {
            case 'gravatar':
                if (props.hasProp(profile, 'profile.synced.gravatarHash')) {
                    var gravatarDefault = props.getProp(profile, 'profile.userdata.gravatarDefault', null) || 'identicon';
                    var gravatarHash = profile.profile.synced.gravatarHash;
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

        parseAppKey(id) {
            var parts = id.split(/\//).filter((part) => {
                    return (part.length > 0);
                }),
                method;

            if (parts.length === 1) {
                // legacy method
                method = {
                    name: parts[0],
                    shortRef: parts[0],
                    ref: parts[0]
                };
            } else if (parts.length === 3) {
                method = {
                    module: parts[0],
                    name: parts[1],
                    gitCommitHash: parts[2],
                    shortRef: parts[0] + '/' + parts[1],
                    ref: parts[0] + '/' + parts[1] + '/' + parts[2]
                };
            } else if (parts.length === 2) {
                method = {
                    module: parts[0],
                    name: parts[1],
                    shortRef: parts[0] + '/' + parts[1],
                    ref: parts[0] + '/' + parts[1]
                };
            } else {
                console.error('ERROR');
                console.error('parts');
                throw new Error('Invalid method metadata');
            }
            return method;
        }

        getApps(tag) {
            // TODO: hmm, used to use the release tag for prod, dev otherwise.
            // good, or bad?
            return Promise.try(() => {
                if (this.appCache[tag]) {
                    return this.appCache[tag];
                }
                return this.rpc.call('NarrativeMethodStore', 'list_methods', {
                    tag: tag
                })
                    .spread((release) => {
                        this.appCache[tag] = release.reduce((apps, app) => {
                            apps[app.id] = {
                                info: app,
                                tag: tag
                            };
                            return apps;
                        }, {});
                        return this.appCache[tag];
                    });
            });
        }

        getAppsSpecs(appIds) {
            // TODO: hmm, used to use the release tag for prod, dev otherwise.
            // good, or bad?
            return Promise.try(() => {
                // if (this.appCache[tag]) {
                //     return this.appCache[tag];
                // }
                return this.rpc.call('NarrativeMethodStore', 'get_method_brief_info', {
                    ids: appIds
                })
                    .spread((appSpecs) => {
                        // this.appCache[tag] = release.reduce((apps, app) => {
                        //     apps[app.id] = {
                        //         info: app,
                        //         tag: tag
                        //     };
                        //     return apps;
                        // }, {});
                        // return this.appCache[tag];
                        return appSpecs;
                    });
            });
        }

        getNarratives2() {
            let timer = new Timer();
            timer.start('get workspaces');

            // TODO undo this
            let profiles;
            return this.rpc.call('DashboardService', 'list_all_narratives', {})
                .spread((result, stats) => {
                    console.log('stats', stats);

                    timer.start('process metadata');
                    profiles = result.profiles;

                    let narratives = result.narratives.map((narrative) => {
                        narrative.savedAt = new Date(narrative.savedTime);
                        narrative.modifiedAt = new Date(narrative.modifiedTime);
                        return narrative;
                    });
                    return narratives;
                })
                .then((narratives) => {
                    timer.start('get profiles for users with permissions');
                    narratives.forEach((narrative) => {
                        narrative.permissions.forEach((permission) => {
                            permission.profile = profiles[permission.username] || null;
                        });
                    });
                    return narratives;
                })
                .then((narratives) => {
                    timer.stop();
                    return narratives;
                });
        }

        getUserProfile(username) {
            return this.rpc.call('UserProfile', 'get_user_profile', [username])
                .spread(([profile]) => {
                    return profile;
                    // return {
                    //     username: profile.user.username,
                    //     realname: profile.user.realname,
                    //     gravatarHash: props.getProp(profile, 'profile.synced.gravatarHash'),
                    //     gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
                    //     avatarUrl: this.makeAvatar(profile)
                    // };
                });
        }


        deleteNarrative(workspaceId, objectId) {
            return this.rpc.call('DashboardService', 'delete_narrative', {
                obji:{
                    workspace_id: workspaceId,
                    object_id: objectId
                }
            });
        }

        shareNarrative(workspaceId, username, permission) {
            return this.rpc.call('DashboardService', 'share_narrative', {
                wsi: {
                    id: workspaceId
                },
                permission: permission,
                users: [username]
            });
        }

        unshareNarrative(workspaceId, username) {
            return this.rpc.call('DashboardService', 'unshare_narrative', {
                wsi: {
                    id: workspaceId
                },
                users: [username]
            });
        }

        shareNarrativeGlobal(workspaceId) {
            return this.rpc.call('DashboardService', 'share_narrative_global', {
                wsi: {
                    id: workspaceId
                }
            });
        }

        unshareNarrativeGlobal(workspaceId) {
            return this.rpc.call('DashboardService', 'unshare_narrative_global', {
                wsi: {
                    id: workspaceId
                }
            });
        }

    }

    return Model;
});