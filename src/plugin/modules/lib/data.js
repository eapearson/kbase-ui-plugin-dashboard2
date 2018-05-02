define([
    'bluebird',
    'knockout',
    'kb_service/utils',
    'kb_common/utils',
    './rpc',
    './timer'
], function (
    Promise,
    ko,
    APIUtils,
    Utils,
    Rpc,
    Timer
) {
    'use strict';

    function factory(config) {
        let runtime = config.runtime;

        var rpc = new Rpc({
            runtime: runtime
        });



        // update just the core narratives -- the bits that have no inputs and won't change
        // unless there is a need to reload them.
        // function getOwnNarratives(options, target) {
        //     return Promise.try(() => {
        //         if (options.reload) {
        //             ownNarratives.loaded = false;
        //             ownNarratives.narrativeData(null);
        //         }
        //         if (ownNarratives) {
        //             return ownNarratives;
        //         }
        //         return Promise.try(() => {
        //             return rpc.call('NarrativeService', 'list_narratives', {
        //                 type: 'mine'
        //             })
        //                 .spread((result) => {
        //                     return processNarratives(result.narratives);
        //                 })
        //                 .then((narratives) => {
        //                     return getNarrativePermissions(narratives);
        //                 })
        //                 .then((narratives) => {
        //                     ownNarratives.narrativeData(narratives);
        //                     ownNarratives.loaded = true;
        //                 });
        //         });
        //     });
        // }

        // ko.subscribe(ownNarratives.narratives, (newNarratives) => {
        //     getNarrativeApps(newNarratives, )
        //         .then((narratives) => {
        //             ownNarratives.narratives(narratives);
        //             ownNarratives.loaded = true;
        //         });
        // });

        // function getOwnNarratives(options) {
        //     return Promise.try(() => {
        //         return rpc.call('NarrativeService', 'list_narratives', {
        //             type: 'mine'
        //         })
        //             .spread((result) => {
        //                 return processNarratives(result.narratives);
        //             })
        //             .then((narratives) => {
        //                 return getNarrativePermissions(narratives);
        //             })
        //             .then((narratives) => {
        //                 ownNarratives = getNarrativeApps(narratives, options);
        //                 return ownNarratives;
        //             });
        //     });
        // }

        // let sharedNarratives;
        // function getSharedNarratives(options) {
        //     if (options.reload) {
        //         sharedNarratives = null;
        //     }
        //     if (sharedNarratives) {
        //         return sharedNarratives;
        //     }
        //     return rpc.call('NarrativeService', 'list_narratives', {
        //         type: 'shared'
        //     })
        //         .spread((result) => {
        //             return processNarratives(result.narratives);
        //         })
        //         .then((narratives) => {
        //             return getNarrativePermissions(narratives);
        //         })
        //         .then((narratives) => {
        //             sharedNarratives = getNarrativeApps(narratives, options.appTag);
        //             return sharedNarratives;
        //         });
        // }

        // let publicNarratives;
        // function getPublicNarratives(options) {
        //     if (options.reload) {
        //         publicNarratives = null;
        //     }
        //     if (publicNarratives) {
        //         return publicNarratives;
        //     }
        //     return rpc.call('NarrativeService', 'list_narratives', {
        //         type: 'public'
        //     })
        //         .spread((result) => {
        //             return processNarratives(result.narratives);
        //         })
        //         .then((narratives) => {
        //             return getNarrativePermissions(narratives);
        //         })
        //         .then((narratives) => {
        //             publicNarratives = getNarrativeApps(narratives, options.appTag);
        //             return publicNarratives;
        //         });
        // }

        // let tutorialNarratives;
        // function getTutorialNarratives(options) {
        //     if (options.reload) {
        //         tutorialNarratives = null;
        //     }
        //     if (tutorialNarratives) {
        //         return tutorialNarratives;
        //     }
        //     return rpc.call('NarrativeService', 'list_narratorials', {})
        //         .spread((result) => {
        //             return processNarratives(result.narratorials);
        //         })
        //         .then((narratives) => {
        //             return getNarrativePermissions(narratives);
        //         })
        //         .then((narratives) => {
        //             tutorialNarratives = getNarrativeApps(narratives, options.appTag);
        //             return tutorialNarratives;
        //         });
        // }

        // function parseMethodId(id) {
        //     var parts = id.split(/\//).filter(function (part) {
        //             return (part.length > 0);
        //         }),
        //         method;
        //     if (parts.length === 1) {
        //         // legacy method
        //         method = {
        //             name: parts[0],
        //             ref: parts[0]
        //         };
        //     } else if (parts.length === 3) {
        //         method = {
        //             module: parts[0],
        //             name: parts[1],
        //             commitHash: parts[2],
        //             ref: parts[0] + '/' + parts[1]
        //         };
        //     } else if (parts.length === 2) {
        //         method = {
        //             module: parts[0],
        //             name: parts[1],
        //             ref: parts[0] + '/' + parts[1]
        //         };
        //     } else {
        //         console.error('ERROR');
        //         console.error('parts');
        //         throw new Error('Invalid method metadata');
        //     }
        //     return method;
        // }

        // function processNarratives(fetchedNarratives) {
        //     var narratives = [];
        //     var username = runtime.service('session').getUsername();

        //     for (var i = 0; i < fetchedNarratives.length; i += 1) {
        //         var narrative = fetchedNarratives[i];
        //         var workspace = APIUtils.workspaceInfoToObject(narrative.ws);
        //         if (workspace.metadata.is_temporary === 'true') {
        //             continue;
        //         }

        //         var object = APIUtils.object_info_to_object(narrative.nar);
        //         var cellTypes = { app: 0, markdown: 0, code: 0 };
        //         // var apps = [];
        //         // var methods = [];

        //         var appMap = {};
        //         var methodMap = {};

        //         if (object.metadata) {
        //             // Convert some narrative-specific metadata properties.
        //             if (object.metadata.job_info) {
        //                 object.metadata.jobInfo = JSON.parse(object.metadata.job_info);
        //             }
        //             if (object.metadata.methods) {
        //                 object.metadata.cellInfo = JSON.parse(object.metadata.methods);
        //             }

        //             /* Old narrative apps and method are stored in the cell info.
        //                 * metadata: {
        //                 *    methods: {
        //                 *       app: {
        //                 *          myapp: 1,
        //                 *          myapp2: 1
        //                 *       },
        //                 *       method: {
        //                 *          mymethod: 1,
        //                 *          mymethod2: 1
        //                 *       }
        //                 *    }
        //                 * }
        //                 */

        //             if (object.metadata.cellInfo) {
        //                 if (object.metadata.cellInfo.app) {
        //                     Object.keys(object.metadata.cellInfo.app).forEach(function (key) {
        //                         // apps.push(parseMethodId(key));
        //                         let id = parseMethodId(key);
        //                         Utils.incrProp(appMap, id.ref);
        //                     });
        //                 }
        //                 if (object.metadata.cellInfo.method) {
        //                     Object.keys(object.metadata.cellInfo.method).forEach(function (key) {
        //                         // methods.push(parseMethodId(key));
        //                         let id = parseMethodId(key);
        //                         Utils.incrProp(methodMap, id.ref);
        //                     });
        //                 }
        //                 // console.log('OLD', object.metadata.cellInfo.app, object.metadata.cellInfo.method);
        //             }

        //             /* New narrative metadata is stored as a flat set of
        //                 * metdata: {
        //                 *    app.myapp: 1,
        //                 *    app.myotherapp: 1,
        //                 *    method.my_method: 1,
        //                 *    method.my_other_method: 1
        //                 * }
        //                 * Note that cell jupyter cell types are stored as
        //                 * jupyter.markdown: "n" and
        //                 * jupyter.code: "n"
        //                 * The "." is, confusingly, actually a dot in the key has
        //                 * for the app and method keys.
        //                 */
        //             var id;
        //             Object.keys(object.metadata).forEach(function (key) {
        //                 var keyParts = key.split('.');
        //                 switch (keyParts[0]) {
        //                 case 'method':
        //                     // New style app cells have the metadata prefix set to
        //                     // "method." !!
        //                     // apps.push(parseMethodId(keyParts[1]));
        //                     id = parseMethodId(keyParts[1]);
        //                     Utils.incrProp(appMap, id.ref);
        //                     cellTypes['app'] += 1;
        //                     break;
        //                 case 'app':
        //                     // Old style kbase (markdown-app) cells used "app." as the
        //                     // metadata key prefix. We just treat them as regular apps
        //                     // now.
        //                     id = parseMethodId(keyParts[1]);
        //                     Utils.incrProp(appMap, id.ref);
        //                     // apps.push(parseMethodId(keyParts[1]));
        //                     cellTypes['app'] += 1;
        //                     break;
        //                 case 'ipython':
        //                 case 'jupyter':
        //                     var cellType = keyParts[1];
        //                     cellTypes[cellType] += parseInt(object.metadata[key]);
        //                     break;
        //                 default:
        //                 }
        //             });
        //         }

        //         var apps = Object.keys(appMap).map((appId) => {
        //             return {
        //                 key: appId,
        //                 id: parseMethodId(appId),
        //                 count: appMap[appId]
        //             };
        //         });
        //         var methods = Object.keys(methodMap).map((appId) => {
        //             return {
        //                 key: appId,
        //                 id: parseMethodId(appId),
        //                 count: appMap[appId]
        //             };
        //         });

        //         narratives.push({
        //             workspace: workspace,
        //             object: object,
        //             apps: apps,
        //             methods: methods,
        //             cellTypes: cellTypes,
        //             ui: {
        //                 active: ko.observable(),
        //                 canView: true, // by definition!
        //                 canEdit: workspace.user_permission !== 'n',
        //                 canShare: workspace.user_permission === 'a',
        //                 canDelete: workspace.owner === username
        //             }
        //         });
        //     }

        //     return narratives;
        // }

        function makeAvatar(profile) {
            switch (Utils.getProp(profile, 'profile.userdata.avatarOption', null) || 'gravatar') {
            case 'gravatar':
                if (Utils.hasProp(profile, 'profile.synced.gravatarHash')) {
                    var gravatarDefault = Utils.getProp(profile, 'profile.userdata.gravatarDefault', null) || 'identicon';
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

        let narrativePerms = {};
        function getNarrativePermissions(narratives) {
            return Promise.try(function () {
                if (narratives.length === 0) {
                    return [];
                }
                let permParams = narratives
                    .filter((toGet) => {
                        return narrativePerms[toGet.id] ? false : true;
                    })
                    .map((narrative) => {
                        return {
                            id: narrative.workspace.id
                        };
                    });
                let username = runtime.service('session').getUsername();
                return rpc.call('Workspace', 'get_permissions_mass', {
                    workspaces: permParams
                })
                    .spread(function (result) {
                        result.perms.forEach((perm, index) => {
                            narrativePerms[permParams[index].id] = perm;
                        });

                        narratives.forEach((narrative) => {
                            narrative.permissions = Utils.object_to_array(narrativePerms[narrative.workspace.id], 'username', 'permission')
                                .filter(function (x) {
                                    return !(x.username === username ||
                                            x.username === '*' ||
                                            x.username === narrative.workspace.owner);
                                })
                                .sort(function (a, b) {
                                    if (a.username < b.username) {
                                        return -1;
                                    } else if (a.username > b.username) {
                                        return 1;
                                    }
                                    return 0;
                                });
                        });

                        let users = narratives.reduce((users, narrative) => {
                            narrative.permissions.forEach((permission) => {
                                users[permission.username] = true;
                            });
                            return users;
                        }, {});

                        let userList = Object.keys(users);
                        return rpc.call('UserProfile', 'get_user_profile', userList)
                            .spread((profiles) => {
                                let users = profiles.reduce((users, profile, index) => {
                                    if (profile === null) {
                                        console.warn('user without profile', userList[index]);
                                        users[userList[index]] = {
                                            username: userList[index],
                                            realname: userList[index],
                                            gravatarDefault: null,
                                            avatarUrl: null
                                        };
                                    } else {
                                        users[profile.user.username] = {
                                            username: profile.user.username,
                                            realname: profile.user.realname,
                                            gravatarDefault: Utils.getProp(profile, 'profile.userdata.gravatarDefault', null),
                                            avatarUrl: makeAvatar(profile)
                                        };
                                    }
                                    return users;
                                }, {});
                                narratives.forEach((narrative) => {
                                    narrative.permissions.forEach((permission) => {
                                        permission.profile = users[permission.username];
                                    });
                                });
                            });
                    })
                    .then(() => {
                        return narratives;
                    });
            });
        }

        let appCache = {};
        function getApps(tag) {
            // TODO: hmm, used to use the release tag for prod, dev otherwise.
            // good, or bad?
            return Promise.try(() => {
                if (appCache[tag]) {
                    return appCache[tag];
                }
                return rpc.call('NarrativeMethodStore', 'list_methods', {
                    tag: tag
                })
                    .spread(function (release) {
                        appCache[tag] = release.reduce((apps, app) => {
                            apps[app.id] = {
                                info: app,
                                tag: tag
                            };
                            return apps;
                        }, {});
                        return appCache[tag];
                    });
            });
        }

        // This version of app-gathering is based on module/id/git-hash
        // this allows us to avoid asking for or setting the app tag,
        // at the cost of showing multiple instances of the same app
        // But let us face it, this version of the dashboard may only last a
        // few weeks or months longer.
        // function getNarrativeApps(narratives) {
        //     return Promise.try(() => {
        //         // gather all apps for this narrative
        //         let apps = narratives.reduce(function (apps, narrative) {
        //             narrative.appsMethods().forEach((app) => {
        //                 // We don't get infor for old-style apps.
        //                 if (app.type === 'method') {
        //                     return;
        //                 }
        //                 // Nor for apps which don't have a module, meaning they
        //                 // are also pre-sdk apps.
        //                 if (!app.id.module) {
        //                     return;
        //                 }
        //                 // Alas, some also don't have a git commit hash
        //                 // console.log('_app_', app.id);
        //                 if (!app.id.gitCommitHash) {
        //                     return;
        //                 }

        //                 // let key = [app.id.module, app.id.name, app.id.githash];
        //                 apps[app.id.ref] = true;

        //             });
        //             return apps;
        //         }, {});

        //         let appList = Object.keys(apps).map((app) => {
        //             let id = app.split('/');
        //             return {
        //                 id: id.slice(0,2).join('/'),
        //                 tag: id[2]
        //             };
        //         });

        //         // console.log('app list to get', appList.length, appList);

        //         return rpc.call('NarrativeMethodStore', 'get_method_brief_info', {ids: appList.map, tag: 'dev'})
        //             .then((result) => {
        //                 console.log('got app info...', appList, result);
        //             });

        //         // collect into unique list

        //         // get then all

        //         // add back to the narrative.

        //     })
        //         .then(() => {
        //             return narratives;
        //         });
        // }

        function decorateNarrativeApps(narratives, appTag) {
            return getApps(appTag)
                .then(function (appsMap) {
                    // add apps to narratives.
                    narratives.forEach((narrative) => {
                        // add methods to narratives.
                        narrative.appsMethods().forEach((app) => {
                            app.tag(appTag);
                            app.loading(false);

                            switch (app.type) {
                            case 'method':
                                // old methods not supported at all.
                                app.info({});
                                app.name(app.id.name);
                                app.view({
                                    state: 'error',
                                    title: 'Pre-SDK methods not supported'
                                });
                                break;
                            case 'app':
                                // old style apps without modules (pre-sdk) are not supported either.
                                if (!app.id.module) {
                                    app.name(app.id.name);
                                    app.view({
                                        state: 'error',
                                        title: 'Pre-SDK apps not supported'
                                    });
                                    app.info({});
                                } else {
                                    let appId = app.id.module + '/' + app.id.name;
                                    let appInfo = appsMap[appId];
                                    if (appInfo) {
                                        app.info(appInfo.info);
                                        app.name(appInfo.info.name);
                                        app.view({
                                            state: 'ok'
                                        });
                                    } else {
                                        // console.log('not found?', app, appId, appTag, appsMap, narrative);
                                        app.info({});
                                        app.name(appId);
                                        app.view({
                                            state: 'error',
                                            title: 'App not found'
                                        });
                                    }
                                }
                                break;
                            }
                        });

                        narrative.appsMethods.sort((a, b) => {
                            if (a.name().toLowerCase() < b.name().toLowerCase()) {
                                return -1;
                            } else if (a.name().toLowerCase() > b.name().toLowerCase()) {
                                return 1;
                            }
                            return 0;
                        });
                    });

                    // sort by date
                    // return narratives.sort(function (a, b) {
                    //     return b.object.saveDate.getTime() - a.object.saveDate.getTime();
                    // });
                });
        }

        function calcNarrativesHistogram (narrativeData, userValue) {
            // Just dummy data for now.
            var stats = narrativeData;
            var bins = stats.histogram;
            // var data = bins.binned;
            // Calculate widths, height.
            var width = 100 / bins.binned.length;
            var maxBinSize = Math.max.apply(null, bins.binned);
            var minBinSize = Math.min.apply(null, bins.binned);

            // consider the user's value in max/min too.
            maxBinSize = Math.max(maxBinSize, userValue);
            minBinSize = Math.min(minBinSize, userValue);

            var chartHeight = maxBinSize + maxBinSize / 10;
            var setup = bins.bins.map(function(col) {
                col.width = width;
                col.height = Math.round(100 * col.count / chartHeight);
                return col;
            });

                // user scaled to histogram.
                // put user value into the correct bin.
            var userBin;
            for (var i = 0; i < bins.bins.length; i++) {
                var bin = bins.bins[i];
                if (userValue >= bin.lower &&
                        ((bin.upperInclusive && userValue <= bin.upper) ||
                            (userValue < bin.upper) ||
                            (i === bins.bins.length - 1)
                        )) {
                    userBin = i;
                    if ((i === bins.bins.length - 1) && (userValue > bin.upper)) {
                        bin.upper = userValue;
                        bin.label = '(' + bin.lower + '-' + bin.upper + ']';
                    }
                    break;
                }
            }
            var user;
            if (userBin !== undefined) {
                user = {
                    scale: userBin * width + width / 2,
                    value: userValue,
                    bin: userBin,
                    side: (userBin < bins.bins.length / 2 ? 'right' : 'left')
                };
            } else {
                user = { scale: 0, value: 0 };
            }

            return {
                maxBinSize: maxBinSize,
                minBinSize: minBinSize,
                chartMax: chartHeight,
                binData: bins,
                chart: setup,
                user: user,
                stats: stats
            };
        }

        function calcSharedNarrativesHistogram(sharedNarrativeStats, userValue) {
            // Just dummy data for now.
            var stats = sharedNarrativeStats;
            var bins = stats.histogram;
            // var data = bins.binned;
            // Calculate widths, height.
            var width = 100 / bins.binned.length;
            var maxBinSize = Math.max.apply(null, bins.binned);
            var minBinSize = Math.min.apply(null, bins.binned);

            // consider the user's value in max/min too.
            maxBinSize = Math.max(maxBinSize, userValue);
            minBinSize = Math.min(minBinSize, userValue);

            var chartHeight = maxBinSize + maxBinSize / 10;
            var setup = bins.bins.map(function(col) {
                col.width = width;
                col.height = Math.round(100 * col.count / chartHeight);
                return col;
            });

            // user scaled to histogram.
            // put user value into the correct bin.

            var userBin;
            for (var i = 0; i < bins.bins.length; i++) {
                var bin = bins.bins[i];
                if (userValue >= bin.lower &&
                    ((bin.upperInclusive && userValue <= bin.upper) ||
                        (userValue < bin.upper) ||
                        (i === bins.bins.length - 1)
                    )) {
                    userBin = i;

                    if ((i === bins.bins.length - 1) && (userValue > bin.upper)) {
                        bin.upper = userValue;
                        bin.label = '(' + bin.lower + '-' + bin.upper + ']';
                    }

                    break;
                }
            }
            var user;
            if (userBin !== undefined) {
                user = {
                    scale: userBin * width + width / 2,
                    value: userValue,
                    bin: userBin,
                    side: (userBin < bins.bins.length / 2 ? 'right' : 'left')
                };
            } else {
                user = { scale: 0, value: 0 };
            }

            return {
                maxBinSize: maxBinSize,
                minBinSize: minBinSize,
                chartMax: chartHeight,
                binData: bins,
                chart: setup,
                user: user,
                stats: stats
            };
        }

        /*
        *  calcUserSummary provides the total count of owned and shared-with narratives.
        *
        */
        function calcUserSummary(narratives) {
            if (!narratives) {
                return 0;
            }
            var sharingCount = 0;
            for (var i = 0; i < narratives.length; i++) {
                var nar = narratives[i];
                if (nar.permissions.length > 0) {
                    sharingCount++;
                }
            }
            return sharingCount;
        }

        function getCollaborators() {
            // let username = runtime.getService('session').getUsername();
            return Promise.all([
                rpc.call('NarrativeService', 'list_narratives', { type: 'mine' }),
                rpc.call('NarrativeService', 'list_narratives', { type: 'shared' })
            ])
                .then(function (results) {
                    let narratives = results
                        .reduce(function (accum, result) {
                            return accum.concat(result[0].narratives);
                        }, [])
                        .map(function (narrative) {
                            narrative.object = APIUtils.object_info_to_object(narrative.nar);
                            narrative.workspace = APIUtils.workspaceInfoToObject(narrative.ws);
                            return narrative;
                        });

                    return getNarrativePermissions(narratives);
                })
                .then(function (narratives) {
                    let collaborators = narratives.reduce((collaborators, narrative) => {
                        narrative.permissions.forEach((permission) => {
                            // omit the public user.
                            if (permission.username === '*') {
                                return;
                            }
                            Utils.incrProp(collaborators, permission.username);
                        });
                        return collaborators;
                    }, {});
                    let profilesToFetch = Object.keys(collaborators);
                    return rpc.call('UserProfile', 'get_user_profile', profilesToFetch)
                        .spread((userProfiles) => {
                            // console.log('collabs?', collabs, usersToFetch, data);
                            return userProfiles.reduce((collabs, profile, index) => {
                                if (!profile || !profile.user) {
                                    console.warn('WARNING: user ' + profilesToFetch[index] + ' is a sharing partner but has no profile.');
                                    return collabs;
                                }
                                collabs.push({
                                    username: profile.user.username,
                                    realname: profile.user.realname || profile.user.username,
                                    count: collaborators[profile.user.username]
                                });
                                return collabs;
                            }, []);
                        });
                });
        }

        function deleteNarrative(workspaceId) {
            return rpc.call('Workspace', 'delete_workspace', {
                id: workspaceId
            });
        }

        function setNarrativePublic(workspaceId) {
            return rpc.call('Workspace', 'set_global_permission', {
                id: workspaceId,
                new_permission: 'r'
            });
        }

        function revokeNarrativePublic(workspaceId) {
            return rpc.call('Workspace', 'set_global_permission', {
                id: workspaceId,
                new_permission: 'n'
            });
        }

        function userProfileSearch(query) {
            return rpc.call('UserProfile', 'filter_users', {
                filter: query
            })
                .spread(function (users) {
                    let usernames = users.map((user) => {
                        return user.username;
                    });
                    return rpc.call('UserProfile', 'get_user_profile', usernames);
                })
                .spread((profiles) => {
                    return profiles;
                });
        }

        function shareNarrative(workspaceId, permission, username) {
            return rpc.call('Workspace', 'set_permissions', {
                id: workspaceId,
                new_permission: permission,
                users: [username]
            });
        }

        function unShareNarrative(workspaceId, username) {
            return rpc.call('Workspace', 'set_permissions', {
                id: workspaceId,
                new_permission: 'n',
                users: [username]
            });
        }

        function parseAppKey(id) {
            var parts = id.split(/\//).filter(function (part) {
                    return (part.length > 0);
                }),
                method;

            // console.log('parse', id, parts);

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

        function processNarratives(narrativeData) {
            let narratives = new Array(narrativeData.length);
            let username = runtime.service('session').getUsername();

            for (let i = 0; i < narrativeData.length; i += 1) {
                let narrative = narrativeData[i];
                let workspace = APIUtils.workspaceInfoToObject(narrative.ws);
                if (workspace.metadata.is_temporary === 'true') {
                    continue;
                }

                let object = APIUtils.object_info_to_object(narrative.nar);
                let cellTypes = { app: 0, markdown: 0, code: 0 };
                let apps = [];

                if (object.metadata) {
                    // Convert some narrative-specific metadata properties.
                    if (object.metadata.job_info) {
                        object.metadata.jobInfo = JSON.parse(object.metadata.job_info);
                    }
                    if (object.metadata.methods) {
                        object.metadata.cellInfo = JSON.parse(object.metadata.methods);
                    }

                    /* Old narrative apps and method are stored in the cell info.
                        * metadata: {
                        *    methods: {
                        *       app: {
                        *          myapp: 1,
                        *          myapp2: 1
                        *       },
                        *       method: {
                        *          mymethod: 1,
                        *          mymethod2: 1
                        *       }
                        *    }
                        * }
                        */

                    // if (object.metadata.cellInfo) {
                    //     if (object.metadata.cellInfo.app) {
                    //         Object.keys(object.metadata.cellInfo.app).forEach((key) => {
                    //             // apps.push(parseMethodId(key));
                    //             let id = parseMethodId(key);
                    //             Utils.incrProp(appMap, id.ref);
                    //         });
                    //     }
                    //     if (object.metadata.cellInfo.method) {
                    //         Object.keys(object.metadata.cellInfo.method).forEach((key) => {
                    //             // methods.push(parseMethodId(key));
                    //             let id = parseMethodId(key);
                    //             Utils.incrProp(methodMap, id.ref);
                    //         });
                    //     }
                    // }

                    // hmm, old narratives store app/method info in the "methods" property which is converted to
                    // "cellInfo" by objectInfoToObject
                    if (object.metadata.cellInfo) {
                        // console.log('OLD NARRATIVE', object.metadata.cellInfo, workspace, object);
                        cellTypes.code += Utils.getProp(object.metadata.cellInfo, 'ipython.code', 0);
                        cellTypes.markdown += Utils.getProp(object.metadata.cellInfo, 'ipython.markdown', 0);
                        // aps.push({
                        //     type: 'app',
                        //     key: keyParts[1],
                        //     id: parsedId,
                        //     count: parseInt(object.metadata[key]),
                        //     loading: ko.observable(),
                        //     tag: ko.observable(),
                        //     view: ko.observable(),
                        //     name: ko.observable(),
                        //     info: ko.observable()
                        // });
                    }

                    /* New narrative metadata is stored as a flat set of
                        * metdata: {
                        *    app.myapp: 1,
                        *    app.myotherapp: 1,
                        *    method.my_method: 1,
                        *    method.my_other_method: 1
                        * }
                        * Note that jupyter cell types are stored as
                        * jupyter.markdown: "n" and
                        * jupyter.code: "n"
                        */
                    let appOccurences = {};
                    let parsedId;
                    Object.keys(object.metadata).forEach((key) => {
                        let keyParts = key.split('.');
                        switch (keyParts[0]) {
                        case 'method':
                            // New style app cells have the metadata prefix set to
                            // "method." !!
                            parsedId = parseAppKey(keyParts[1]);
                            apps.push({
                                type: 'app',
                                key: keyParts[1],
                                id: parsedId,
                                count: parseInt(object.metadata[key]),
                                // loading: ko.observable(),
                                // tag: ko.observable(),
                                // view: ko.observable(),
                                // name: ko.observable(),
                                // info: ko.observable()
                            });
                            cellTypes['app'] += 1;
                            Utils.incrProp(appOccurences, parsedId.shortRef);
                            break;
                        case 'app':
                            // Old style kbase (markdown-app) cells used "app." as the
                            // metadata key prefix. We just treat them as regular apps
                            // now.
                            parsedId = parseAppKey(keyParts[1]);
                            apps.push({
                                type: 'method',
                                key: keyParts[1],
                                id: parsedId,
                                count: parseInt(object.metadata[key]),
                                // loading: ko.observable(),
                                // tag: ko.observable(),
                                // view: ko.observable(),
                                // name: ko.observable(),
                                // info: ko.observable()
                            });
                            cellTypes['app'] += 1;
                            Utils.incrProp(appOccurences, parsedId.shortRef);
                            break;
                        case 'ipython':
                        case 'jupyter':
                            var cellType = keyParts[1];
                            cellTypes[cellType] += parseInt(object.metadata[key]);
                            break;
                        default:
                        }
                    });

                    apps.forEach((app) => {
                        app.occurences = appOccurences[app.id.shortRef];
                    });
                }

                narratives[i] = {
                    workspace: workspace,
                    object: object,
                    appsMethods: apps,
                    // isPublic: ko.observable(workspace.globalread === 'r'),
                    isPublic: workspace.globalread === 'r',
                    cellTypes: cellTypes,
                    ui: {
                        // active: ko.observable(),
                        canView: true, // by definition!
                        canEdit: workspace.user_permission !== 'n',
                        canShare: workspace.user_permission === 'a',
                        canDelete: workspace.owner === username
                    }
                };
            }

            return narratives;
        }

        function getNarratives(method, type) {
            return Promise.try(() => {
                return this.rpc.call('NarrativeService', method, {
                    type: type
                })
                    .spread((narratives) => {
                        return processNarratives(narratives);
                    })
                    .then((narratives) => {
                        return getNarrativePermissions(narratives);
                    })
                    .then((narratives) => {
                        // sort by date
                        narratives.sort(function (a, b) {
                            return b.object.saveDate.getTime() - a.object.saveDate.getTime();
                        });
                        this.narratives(narratives);
                        this.loaded(true);
                    });
            });
        }

        function getNarratives2() {
            let timer = new Timer();
            timer.start('get workspaces');
            return rpc.call('Workspace', 'list_workspace_info', {
                excludeGlobal: 0,
                showDeleted: 0,
                meta: {
                    is_temporary: 'false'
                }
            })
                .spread((narrativeWorkspaces) => {
                    timer.start('process workspaces');
                    // Use preallocated arrays for efficiency, that's all.
                    let narratives = new Array(narrativeWorkspaces.length);
                    let objectIds = new Array(narrativeWorkspaces.length);
                    let skipped = 0;

                    // First loop through the workspaces is to collect the object ids so
                    // we can get the object info.
                    narrativeWorkspaces.forEach((info, index) => {
                        let workspaceInfo = APIUtils.workspaceInfoToObject(info);
                        let narrativeObjectId = parseInt(workspaceInfo.metadata.narrative, 10);
                        if (isNaN(narrativeObjectId)) {
                            skipped += 1;
                            return;
                        }
                        narratives[index - skipped] = {
                            workspace: workspaceInfo
                        };
                        objectIds[index - skipped] = {
                            wsid: workspaceInfo.id,
                            objid: narrativeObjectId
                        };
                    });

                    narratives = narratives.slice(0, narratives.length - skipped);
                    objectIds = objectIds.slice(0, objectIds.length - skipped);

                    timer.start('get object info');
                    // Now get the info for all objects.
                    return rpc.call('Workspace', 'get_object_info3', {
                        objects: objectIds,
                        includeMetadata: 1,
                        ignoreErrors: 1
                    })
                        .spread((result) => {
                            timer.start('process object info');
                            result.infos.forEach((info, index) => {
                                if (info !== null) {
                                    narratives[index].object = APIUtils.objectInfoToObject(info);
                                    narratives[index].path = result.paths[index];
                                }
                            });
                            return narratives.filter((narrative) => {
                                return narrative.workspace ? true : false;
                            });
                        });
                })
                .then((narratives) => {
                    timer.start('process metadata');
                    narratives.forEach((narrative) => {
                        // Now make sense of narrative metadata.
                        let cellTypes = {
                            app: 0,
                            markdown: 0,
                            code: 0
                        };
                        let apps = [];
                        let metadata = narrative.object.metadata;

                        // Convert some narrative-specific metadata properties.
                        if (metadata.job_info) {
                            metadata.jobInfo = JSON.parse(metadata.job_info);
                        }
                        if (metadata.methods) {
                            metadata.cellInfo = JSON.parse(metadata.methods);
                        }

                        /* Old narrative apps and method are stored in the cell info.
                            * metadata: {
                            *    methods: {
                            *       app: {
                            *          myapp: 1,
                            *          myapp2: 1
                            *       },
                            *       method: {
                            *          mymethod: 1,
                            *          mymethod2: 1
                            *       }
                            *    }
                            * }
                            */
                        if (metadata.cellInfo) {
                            cellTypes.code += Utils.getProp(metadata.cellInfo, 'ipython.code', 0);
                            cellTypes.markdown += Utils.getProp(metadata.cellInfo, 'ipython.markdown', 0);
                        }

                        /* New narrative metadata is stored as a flat set of
                            * metdata: {
                            *    app.myapp: 1,
                            *    app.myotherapp: 1,
                            *    method.my_method: 1,
                            *    method.my_other_method: 1
                            * }
                            * Note that jupyter cell types are stored as
                            * jupyter.markdown: "n" and
                            * jupyter.code: "n"
                            */
                        let appOccurences = {};
                        let parsedId;
                        Object.keys(metadata).forEach((key) => {
                            let keyParts = key.split('.');
                            switch (keyParts[0]) {
                            case 'method':
                                // New style app cells have the metadata prefix set to
                                // "method." !!
                                parsedId = parseAppKey(keyParts[1]);
                                apps.push({
                                    type: 'app',
                                    key: keyParts[1],
                                    id: parsedId,
                                    count: parseInt(metadata[key]),
                                });
                                cellTypes.app += 1;
                                Utils.incrProp(appOccurences, parsedId.shortRef);
                                break;
                            case 'app':
                                // Old style kbase (markdown-app) cells used "app." as the
                                // metadata key prefix. We just treat them as regular apps
                                // now.
                                parsedId = parseAppKey(keyParts[1]);
                                apps.push({
                                    type: 'method',
                                    key: keyParts[1],
                                    id: parsedId,
                                    count: parseInt(metadata[key]),
                                });
                                cellTypes.app += 1;
                                Utils.incrProp(appOccurences, parsedId.shortRef);
                                break;
                            case 'ipython':
                            case 'jupyter':
                                var cellType = keyParts[1];
                                // TODO: HMM, should check if it is one of the expected
                                // cell types.
                                cellTypes[cellType] += parseInt(metadata[key]);
                                break;
                            default:
                            }
                        });

                        apps.forEach((app) => {
                            app.occurences = appOccurences[app.id.shortRef];
                        });

                        narrative.appsMethods = apps;
                        narrative.cellTypes = cellTypes;
                    });
                    return narratives;
                })
                .then((narratives) => {
                    timer.start('get permissions');
                    let permParams = narratives
                        .map((narrative) => {
                            return {
                                id: narrative.workspace.id
                            };
                        });
                    let currentUsername = runtime.service('session').getUsername();
                    return rpc.call('Workspace', 'get_permissions_mass', {
                        workspaces: permParams
                    })
                        .spread(function (result) {
                            result.perms.forEach((permissions, index) => {
                                // The permission comes back as a map of username to permission.
                                let perms = Object.keys(permissions).reduce((perms, username) => {
                                    // Filter out owner, public user, and workspace owner.
                                    if (username === currentUsername ||
                                        username === '*' ||
                                        username === narratives[index].workspace.owner) {
                                        return perms;
                                    }
                                    perms.push({
                                        username: username,
                                        permission: permissions[username]
                                    });
                                    return perms;
                                }, []);

                                narratives[index].permissions = perms;
                            });
                            return narratives;
                        });
                })
                .then((narratives) => {
                    timer.start('get profiles for users with permissions');
                    // now, yuck, we need to get the user profile for all users with permissions.
                    // If this were super fast and slick we could just do this later...
                    let users = narratives.reduce((users, narrative) => {
                        narrative.permissions.forEach((permission) => {
                            users[permission.username] = true;
                        });
                        return users;
                    }, {});

                    let userList = Object.keys(users);
                    return rpc.call('UserProfile', 'get_user_profile', userList)
                        .spread((profiles) => {
                            let users = profiles.reduce((users, profile, index) => {
                                if (profile === null) {
                                    console.warn('user without profile', userList[index]);
                                    users[userList[index]] = {
                                        username: userList[index],
                                        realname: userList[index],
                                        gravatarDefault: null,
                                        avatarUrl: null
                                    };
                                } else {
                                    users[profile.user.username] = {
                                        username: profile.user.username,
                                        realname: profile.user.realname,
                                        gravatarDefault: Utils.getProp(profile, 'profile.userdata.gravatarDefault', null),
                                        avatarUrl: makeAvatar(profile)
                                    };
                                }
                                return users;
                            }, {});
                            narratives.forEach((narrative) => {
                                narrative.permissions.forEach((permission) => {
                                    permission.profile = users[permission.username];
                                });
                            });
                            return narratives;
                        });
                })
                .then((narratives) => {
                    timer.stop();
                    timer.log();
                    return narratives;
                });
        }


        return {
            // getOwnNarratives,
            // getSharedNarratives,
            // getPublicNarratives,
            // getTutorialNarratives,
            getNarratives,
            calcNarrativesHistogram,
            calcSharedNarrativesHistogram,
            calcUserSummary,
            getCollaborators,
            deleteNarrative,
            getApps,
            getNarrativePermissions,
            decorateNarrativeApps,
            userProfileSearch,
            setNarrativePublic,
            revokeNarrativePublic,
            shareNarrative,
            unShareNarrative,
            getNarratives2
            // getNarrativeApps
        };
    }

    return {
        make: factory
    };
});