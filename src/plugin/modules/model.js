define([
    'bluebird',
    'kb_lib/props',
    './lib/rpc',
    './lib/dashboardError'
], function (
    Promise,
    props,
    RPC,
    DashboardError
) {
    'use strict';

    class Model {
        constructor(config) {
            this.runtime = config.runtime;
            this.dashboardService = this.runtime.service('rpc').makeClient({
                module: 'DashboardService'
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
            // TODO undo this
            let profiles;
            return this.dashboardService.callFunc('list_all_narratives', [{}])
                .spread((result, error, stats) => {
                    console.log('stats', stats);

                    profiles = result.profiles.reduce((profiles, profile) => {
                        profiles[profile.user.username] = profile;
                        return profiles;
                    }, {});

                    let narratives = result.narratives.map((narrative) => {
                        narrative.savedAt = new Date(narrative.savedTime);
                        narrative.modifiedAt = new Date(narrative.modifiedTime);
                        return narrative;
                    });
                    return narratives;
                })
                .then((narratives) => {
                    narratives.forEach((narrative) => {
                        narrative.permissions.forEach((permission) => {
                            permission.profile = profiles[permission.username] || null;
                        });
                    });
                    return narratives;
                })
                .then((narratives) => {
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
            return this.dashboardService.callFunc('delete_narrative', [{
                obji:{
                    workspace_id: workspaceId,
                    object_id: objectId
                }
            }]);
        }

        shareNarrative(workspaceId, username, permission) {
            return this.dashboardService.callFunc('share_narrative', [{
                wsi: {
                    id: workspaceId
                },
                permission: permission,
                users: [username]
            }]);
        }

        unshareNarrative(workspaceId, username) {
            return this.dashboardService.callFunc('unshare_narrative', [{
                wsi: {
                    id: workspaceId
                },
                users: [username]
            }]);
        }

        shareNarrativeGlobal(workspaceId) {
            return this.dashboardService.callFunc('share_narrative_global', [{
                wsi: {
                    id: workspaceId
                }
            }]);
        }

        unshareNarrativeGlobal(workspaceId) {
            return this.dashboardService.callFunc('unshare_narrative_global', [{
                wsi: {
                    id: workspaceId
                }
            }]);
        }

    }

    return Model;
});