define([
    'bluebird',
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/viewModelBase',
    'kb_ko/components/overlayPanelBootstrappish',
    'kb_service/utils',
    'kb_common/utils',
    '../lib/data',
    '../lib/rpc',
    '../lib/timer'
], function (
    Promise,
    ko,
    reg,
    ViewModelBase,
    OverlayPanelComponent,
    apiUtils,
    Utils,
    Data,
    Rpc,
    Timer
) {
    'use strict';

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

    class NarrativeCollection extends ViewModelBase {
        constructor(runtime, appTag, method, type) {
            super({});
            this.appTag = appTag;
            this.method = method;
            this.type = type;
            this.runtime = runtime;

            this.dataMethods = Data.make({
                runtime: runtime
            });

            this.loading = ko.observable(true);
            this.data = ko.observable();

            this.rpc = new Rpc({
                runtime: runtime
            });

            this.loaded = ko.observable(false);
            this.narratives = ko.observableArray();

            let args = ko.pureComputed(() => {
                if (this.loaded() && this.appTag()) {
                    return {
                        narratives: this.narratives(),
                        appTag: this.appTag()
                    };
                }
            });

            this.subscribe(args, (newArgs) => {
                if (!newArgs) {
                    return;
                }
                this.dataMethods.decorateNarrativeApps(newArgs.narratives, newArgs.appTag)
                    .finally(() => {
                        this.loading(false);
                    });
            });
        }

        load(reload) {
            let timer = new Timer();
            timer.start('load narratives');
            this.loaded(false);
            return Promise.try(() => {
                if (!reload && this.data()) {
                    return;
                }
                this.data(null);
                let arg = {};
                if (this.type) {
                    arg.type = this.type;
                }
                return Promise.try(() => {
                    return this.rpc.call('NarrativeService', this.method, arg)
                        .spread((result) => {
                            timer.start('process narratives');
                            return this.processNarratives(result.narratives || result.narratorials);
                        })
                        .then((narratives) => {
                            timer.start('get narrative permissions');
                            return this.dataMethods.getNarrativePermissions(narratives);
                        })
                        // .then((narratives) => {
                        //     return this.dataMethods.getNarrativeApps(narratives);
                        // })
                        .then((narratives) => {
                            timer.start('finalize');
                            // sort by date
                            narratives.sort(function (a, b) {
                                return b.object.saveDate.getTime() - a.object.saveDate.getTime();
                            });
                            this.narratives(narratives);
                            this.loaded(true);
                            timer.stop();
                            timer.log();
                        });
                });
            });
        }

        processNarratives(narrativeData) {
            let narratives = new Array(narrativeData.length);
            let username = this.runtime.service('session').getUsername();

            for (let i = 0; i < narrativeData.length; i += 1) {
                let narrative = narrativeData[i];
                let workspace = apiUtils.workspaceInfoToObject(narrative.ws);
                if (workspace.metadata.is_temporary === 'true') {
                    continue;
                }

                let object = apiUtils.object_info_to_object(narrative.nar);
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
                                loading: ko.observable(),
                                tag: ko.observable(),
                                view: ko.observable(),
                                name: ko.observable(),
                                info: ko.observable()
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
                                loading: ko.observable(),
                                tag: ko.observable(),
                                view: ko.observable(),
                                name: ko.observable(),
                                info: ko.observable()
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
                    appsMethods: ko.observableArray(apps),
                    isPublic: ko.observable(workspace.globalread === 'r'),
                    cellTypes: cellTypes,
                    ui: {
                        active: ko.observable(),
                        canView: true, // by definition!
                        canEdit: workspace.user_permission !== 'n',
                        canShare: workspace.user_permission === 'a',
                        canDelete: workspace.owner === username
                    }
                };
            }

            return narratives;
        }
    }

    return NarrativeCollection;
});