define([
    'bluebird',
    'kb_lib/workspaceUtils',
    'kb_lib/props',
    './rpc'
], function (
    Promise,
    workspaceUtils,
    props,
    Rpc
) {
    'use strict';

    function objectToArray(obj, keyName, valueName) {
        var keys = Object.keys(obj);
        var arr = [];
        for (var i in keys) {
            var newObj = {};
            newObj[keyName] = keys[i];
            newObj[valueName] = obj[keys[i]];
            arr.push(newObj);
        }
        return arr;
    }

    function factory(config) {
        const runtime = config.runtime;

        var rpc = new Rpc({
            runtime: runtime
        });

        function makeAvatar(profile) {
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

        const narrativePerms = {};
        function getNarrativePermissions(narratives) {
            return Promise.try(function () {
                if (narratives.length === 0) {
                    return [];
                }
                const permParams = narratives
                    .filter((toGet) => {
                        return narrativePerms[toGet.id] ? false : true;
                    })
                    .map((narrative) => {
                        return {
                            id: narrative.workspace.id
                        };
                    });
                const username = runtime.service('session').getUsername();
                return rpc.call('Workspace', 'get_permissions_mass', {
                    workspaces: permParams
                })
                    .spread(function (result) {
                        result.perms.forEach((perm, index) => {
                            narrativePerms[permParams[index].id] = perm;
                        });

                        narratives.forEach((narrative) => {
                            narrative.permissions = objectToArray(narrativePerms[narrative.workspace.id], 'username', 'permission')
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

                        const users = narratives.reduce((users, narrative) => {
                            narrative.permissions.forEach((permission) => {
                                users[permission.username] = true;
                            });
                            return users;
                        }, {});

                        const userList = Object.keys(users);
                        return rpc.call('UserProfile', 'get_user_profile', userList)
                            .spread((profiles) => {
                                const users = profiles.reduce((users, profile, index) => {
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
                                            gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
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

        const appCache = {};
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

        function calcNarrativesHistogram(narrativeData, userValue) {
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
            var setup = bins.bins.map(function (col) {
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
            var setup = bins.bins.map(function (col) {
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
                    const narratives = results
                        .reduce(function (accum, result) {
                            return accum.concat(result[0].narratives);
                        }, [])
                        .map(function (narrative) {
                            narrative.object = workspaceUtils.objectInfoToObject(narrative.nar);
                            narrative.workspace = workspaceUtils.workspaceInfoToObject(narrative.ws);
                            return narrative;
                        });

                    return getNarrativePermissions(narratives);
                })
                .then(function (narratives) {
                    const collaborators = narratives.reduce((collaborators, narrative) => {
                        narrative.permissions.forEach((permission) => {
                            // omit the public user.
                            if (permission.username === '*') {
                                return;
                            }
                            props.incrProp(collaborators, permission.username);
                        });
                        return collaborators;
                    }, {});
                    const profilesToFetch = Object.keys(collaborators);
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
                    const usernames = users.map((user) => {
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
            const narratives = new Array(narrativeData.length);
            const username = runtime.service('session').getUsername();

            for (let i = 0; i < narrativeData.length; i += 1) {
                const narrative = narrativeData[i];
                const workspace = workspaceUtils.workspaceInfoToObject(narrative.ws);
                if (workspace.metadata.is_temporary === 'true') {
                    continue;
                }

                const object = workspaceUtils.objectInfoToObject(narrative.nar);
                const cellTypes = { app: 0, markdown: 0, code: 0 };
                const apps = [];

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
                        cellTypes.code += props.getProp(object.metadata.cellInfo, 'ipython.code', 0);
                        cellTypes.markdown += props.getProp(object.metadata.cellInfo, 'ipython.markdown', 0);
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
                    const appOccurences = {};
                    let parsedId;
                    Object.keys(object.metadata).forEach((key) => {
                        const keyParts = key.split('.');
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
                            props.incrProp(appOccurences, parsedId.shortRef);
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
                            props.incrProp(appOccurences, parsedId.shortRef);
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
            return rpc.call('Workspace', 'list_workspace_info', {
                excludeGlobal: 0,
                showDeleted: 0,
                meta: {
                    is_temporary: 'false'
                }
            })
                .spread((narrativeWorkspaces) => {
                    // Use preallocated arrays for efficiency, that's all.
                    let narratives = new Array(narrativeWorkspaces.length);
                    let objectIds = new Array(narrativeWorkspaces.length);
                    let skipped = 0;

                    // First loop through the workspaces is to collect the object ids so
                    // we can get the object info.
                    narrativeWorkspaces.forEach((info, index) => {
                        const workspaceInfo = workspaceUtils.workspaceInfoToObject(info);
                        const narrativeObjectId = parseInt(workspaceInfo.metadata.narrative, 10);
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

                    // Now get the info for all objects.
                    return rpc.call('Workspace', 'get_object_info3', {
                        objects: objectIds,
                        includeMetadata: 1,
                        ignoreErrors: 1
                    })
                        .spread((result) => {
                            result.infos.forEach((info, index) => {
                                if (info !== null) {
                                    narratives[index].object = workspaceUtils.objectInfoToObject(info);
                                    narratives[index].path = result.paths[index];
                                }
                            });
                            return narratives.filter((narrative) => {
                                return narrative.workspace ? true : false;
                            });
                        });
                })
                .then((narratives) => {
                    narratives.forEach((narrative) => {
                        // Now make sense of narrative metadata.
                        const cellTypes = {
                            app: 0,
                            markdown: 0,
                            code: 0
                        };
                        const apps = [];
                        const metadata = narrative.object.metadata;

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
                            cellTypes.code += props.getProp(metadata.cellInfo, 'ipython.code', 0);
                            cellTypes.markdown += props.getProp(metadata.cellInfo, 'ipython.markdown', 0);
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
                        const appOccurences = {};
                        let parsedId;
                        Object.keys(metadata).forEach((key) => {
                            const keyParts = key.split('.');
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
                                props.incrProp(appOccurences, parsedId.shortRef);
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
                                props.incrProp(appOccurences, parsedId.shortRef);
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
                    const permParams = narratives
                        .map((narrative) => {
                            return {
                                id: narrative.workspace.id
                            };
                        });
                    const currentUsername = runtime.service('session').getUsername();
                    return rpc.call('Workspace', 'get_permissions_mass', {
                        workspaces: permParams
                    })
                        .spread(function (result) {
                            result.perms.forEach((permissions, index) => {
                                // The permission comes back as a map of username to permission.
                                const perms = Object.keys(permissions).reduce((perms, username) => {
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
                    // now, yuck, we need to get the user profile for all users with permissions.
                    // If this were super fast and slick we could just do this later...
                    const users = narratives.reduce((users, narrative) => {
                        narrative.permissions.forEach((permission) => {
                            users[permission.username] = true;
                        });
                        return users;
                    }, {});

                    const userList = Object.keys(users);
                    return rpc.call('UserProfile', 'get_user_profile', userList)
                        .spread((profiles) => {
                            const users = profiles.reduce((users, profile, index) => {
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
                                        gravatarDefault: props.getProp(profile, 'profile.userdata.gravatarDefault', null),
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