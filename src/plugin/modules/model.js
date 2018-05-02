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

        getNarratives2({appTag: appTag}) {
            let timer = new Timer();
            timer.start('get workspaces');

            // TODO undo this
            let profiles;
            return this.rpc.call('NarrativeService', 'list_all_narratives', {})
                .spread((result, stats) => {
                    console.log('stats', stats);
                    // let s = stats.reduce((s, row) => {
                    //     s[row[0]] = row[1];
                    //     return s;
                    // }, {});
                    // var cacheKeys = s['cache keys'];
                    // let tryIt = '31932_2018-04-28T00:03:44+0000';
                    // var foundIt = cacheKeys.indexOf(tryIt);
                    // console.log('have it?', tryIt, foundIt, cacheKeys);
                    timer.start('process metadata');
                    profiles = result.profiles;

                    // console.log('profiles', profiles);

                    let narratives = result.narratives.map((result) => {
                        // Now make sense of narrative metadata.
                        // console.log('narrative?', result.permissions);
                        // if (!result.object_info) {
                        //     console.log('null object', result);
                        // }
                        let narrative = result;
                        // let narrative = {
                        //     workspace: result.workspace_info,
                        //     object: result.object_info,
                        //     permissions: result.permissions,
                        //     appsMethods: result.apps,
                        //     cellTypes: result.cell_stats
                        // };
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
                    //     gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
                    //     avatarUrl: this.makeAvatar(profile)
                    // };
                });
        }

        // getNarratives() {
        //     let timer = new Timer();
        //     timer.start('get workspaces');

        //     return this.rpc.call('Workspace', 'list_workspace_info', {
        //         excludeGlobal: 0,
        //         showDeleted: 0,
        //         meta: {
        //             is_temporary: 'false'
        //         }
        //     })
        //         .spread((narrativeWorkspaces) => {
        //             timer.start('process workspaces');
        //             // Use preallocated arrays for efficiency, that's all.
        //             let narratives = new Array(narrativeWorkspaces.length);
        //             let objectIds = new Array(narrativeWorkspaces.length);
        //             let skipped = 0;

        //             // First loop through the workspaces is to collect the object ids so
        //             // we can get the object info.
        //             narrativeWorkspaces.forEach((info, index) => {
        //                 let workspaceInfo = apiUtils.workspaceInfoToObject(info);
        //                 let narrativeObjectId = parseInt(workspaceInfo.metadata.narrative, 10);
        //                 if (isNaN(narrativeObjectId)) {
        //                     skipped += 1;
        //                     return;
        //                 }
        //                 narratives[index - skipped] = {
        //                     workspace: workspaceInfo
        //                 };
        //                 objectIds[index - skipped] = {
        //                     wsid: workspaceInfo.id,
        //                     objid: narrativeObjectId
        //                 };
        //             });

        //             narratives = narratives.slice(0, narratives.length - skipped);
        //             objectIds = objectIds.slice(0, objectIds.length - skipped);

        //             timer.start('get object info');
        //             // Now get the info for all objects.
        //             return this.rpc.call('Workspace', 'get_object_info3', {
        //                 objects: objectIds,
        //                 includeMetadata: 1,
        //                 ignoreErrors: 1
        //             })
        //                 .spread((result) => {
        //                     timer.start('process object info');
        //                     result.infos.forEach((info, index) => {
        //                         if (info !== null) {
        //                             narratives[index].object = apiUtils.objectInfoToObject(info);
        //                             narratives[index].path = result.paths[index];
        //                         }
        //                     });
        //                     return narratives.filter((narrative) => {
        //                         return narrative.workspace ? true : false;
        //                     });
        //                 });
        //         })
        //         .then((narratives) => {
        //             timer.start('process metadata');
        //             narratives.forEach((narrative) => {
        //                 // Now make sense of narrative metadata.
        //                 let cellTypes = {
        //                     app: 0,
        //                     markdown: 0,
        //                     code: 0
        //                 };
        //                 let apps = [];
        //                 let metadata = narrative.object.metadata;

        //                 // Convert some narrative-specific metadata properties.
        //                 if (metadata.job_info) {
        //                     metadata.jobInfo = JSON.parse(metadata.job_info);
        //                 }
        //                 if (metadata.methods) {
        //                     metadata.cellInfo = JSON.parse(metadata.methods);
        //                 }

        //                 /* Old narrative apps and method are stored in the cell info.
        //                     * metadata: {
        //                     *    methods: {
        //                     *       app: {
        //                     *          myapp: 1,
        //                     *          myapp2: 1
        //                     *       },
        //                     *       method: {
        //                     *          mymethod: 1,
        //                     *          mymethod2: 1
        //                     *       }
        //                     *    }
        //                     * }
        //                     */
        //                 if (metadata.cellInfo) {
        //                     cellTypes.code += props.getProp(metadata.cellInfo, 'ipython.code', 0);
        //                     cellTypes.markdown += props.getProp(metadata.cellInfo, 'ipython.markdown', 0);
        //                 }

        //                 /* New narrative metadata is stored as a flat set of
        //                     * metdata: {
        //                     *    app.myapp: 1,
        //                     *    app.myotherapp: 1,
        //                     *    method.my_method: 1,
        //                     *    method.my_other_method: 1
        //                     * }
        //                     * Note that jupyter cell types are stored as
        //                     * jupyter.markdown: "n" and
        //                     * jupyter.code: "n"
        //                     */
        //                 let appOccurences = {};
        //                 let parsedId;
        //                 Object.keys(metadata).forEach((key) => {
        //                     let keyParts = key.split('.');
        //                     switch (keyParts[0]) {
        //                     case 'method':
        //                         // New style app cells have the metadata prefix set to
        //                         // "method." !!
        //                         parsedId = this.parseAppKey(keyParts[1]);
        //                         apps.push({
        //                             type: 'app',
        //                             key: keyParts[1],
        //                             id: parsedId,
        //                             count: parseInt(metadata[key]),
        //                         });
        //                         cellTypes.app += 1;
        //                         props.incrProp(appOccurences, parsedId.shortRef);
        //                         break;
        //                     case 'app':
        //                         // Old style kbase (markdown-app) cells used "app." as the
        //                         // metadata key prefix. We just treat them as regular apps
        //                         // now.
        //                         parsedId = this.parseAppKey(keyParts[1]);
        //                         apps.push({
        //                             type: 'method',
        //                             key: keyParts[1],
        //                             id: parsedId,
        //                             count: parseInt(metadata[key]),
        //                         });
        //                         cellTypes.app += 1;
        //                         props.incrProp(appOccurences, parsedId.shortRef);
        //                         break;
        //                     case 'ipython':
        //                     case 'jupyter':
        //                         var cellType = keyParts[1];
        //                         // TODO: HMM, should check if it is one of the expected
        //                         // cell types.
        //                         cellTypes[cellType] += parseInt(metadata[key]);
        //                         break;
        //                     default:
        //                     }
        //                 });

        //                 apps.forEach((app) => {
        //                     app.occurences = appOccurences[app.id.shortRef];
        //                 });

        //                 narrative.appsMethods = apps;
        //                 narrative.cellTypes = cellTypes;
        //             });
        //             return narratives;
        //         })
        //         .then((narratives) => {
        //             timer.start('get permissions');
        //             let permParams = narratives
        //                 .map((narrative) => {
        //                     return {
        //                         id: narrative.workspace.id
        //                     };
        //                 });
        //             // let currentUsername = this.runtime.service('session').getUsername();
        //             return this.rpc.call('Workspace', 'get_permissions_mass', {
        //                 workspaces: permParams
        //             })
        //                 .spread((result) => {
        //                     result.perms.forEach((permissions, index) => {
        //                         // The permission comes back as a map of username to permission.
        //                         // if (narratives[index].workspace.user_permission === 'r') {
        //                         //     narratives[index].permissions = null;
        //                         //     return;
        //                         // }

        //                         let perms = Object.keys(permissions).reduce((perms, username) => {
        //                             // Filter out owner, public user, and workspace owner.
        //                             // if (username === currentUsername ||
        //                             //     username === '*' ||
        //                             //     username === narratives[index].workspace.owner) {
        //                             //     return perms;
        //                             // }
        //                             // perms.push({
        //                             //     username: username,
        //                             //     permission: permissions[username]
        //                             // });
        //                             if (username === '*') {
        //                                 return perms;
        //                             }
        //                             perms.push({
        //                                 username: username,
        //                                 permission: permissions[username]
        //                             });
        //                             return perms;
        //                         }, []);

        //                         narratives[index].permissions = perms;
        //                     });
        //                     return narratives;
        //                 });
        //         })
        //         .then((narratives) => {
        //             timer.start('get profiles for users with permissions');
        //             // now, yuck, we need to get the user profile for all users with permissions.
        //             // If this were super fast and slick we could just do this later...
        //             let users = narratives.reduce((users, narrative) => {
        //                 narrative.permissions.forEach((permission) => {
        //                     users[permission.username] = true;
        //                 });
        //                 return users;
        //             }, {});

        //             let userList = Object.keys(users);
        //             return this.rpc.call('UserProfile', 'get_user_profile', userList)
        //                 .spread((profiles) => {
        //                     let users = profiles.reduce((users, profile, index) => {
        //                         if (profile === null) {
        //                             console.warn('user without profile', userList[index]);
        //                             users[userList[index]] = {
        //                                 username: userList[index],
        //                                 realname: userList[index],
        //                                 gravatarDefault: null,
        //                                 avatarUrl: null
        //                             };
        //                         } else {
        //                             users[profile.user.username] = {
        //                                 username: profile.user.username,
        //                                 realname: profile.user.realname,
        //                                 gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
        //                                 avatarUrl: this.makeAvatar(profile)
        //                             };
        //                         }
        //                         return users;
        //                     }, {});
        //                     narratives.forEach((narrative) => {
        //                         narrative.permissions.forEach((permission) => {
        //                             permission.profile = users[permission.username];
        //                         });
        //                     });
        //                     return narratives;
        //                 });
        //         })
        //         .then((narratives) => {
        //             timer.stop();
        //             return narratives;
        //         });
        // }

        deleteNarrative(workspaceId) {
            return this.rpc.call('NarrativeService', 'delete_narrative', {
                wsi:{
                    id: workspaceId
                }
            });
        }

        shareNarrative(workspaceId, username, permission) {
            return this.rpc.call('NarrativeService', 'share_narrative', {
                wsi: {
                    id: workspaceId
                },
                permission: permission,
                users: [username]
            });
        }

        unshareNarrative(workspaceId, username) {
            return this.rpc.call('NarrativeService', 'unshare_narrative', {
                wsi: {
                    id: workspaceId
                },
                users: [username]
            });
        }

        shareNarrativeGlobal(workspaceId) {
            return this.rpc.call('NarrativeService', 'share_narrative_global', {
                wsi: {
                    id: workspaceId
                }
            });
        }

        unshareNarrativeGlobal(workspaceId) {
            return this.rpc.call('NarrativeService', 'unshare_narrative_global', {
                wsi: {
                    id: workspaceId
                }
            });
        }

    }

    return Model;
});