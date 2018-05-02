define([
    'knockout',
    'kb_knockout/lib/viewModelBase',
    '../../lib/data',
    '../userLink'
], function (
    ko,
    ViewModelBase,
    Data,
    UserLinkComponent
) {
    'use strict';

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.runtime = context['$root'].runtime;

            this.data = Data.make({
                runtime: this.runtime
            });

            this.loading = ko.observableArray();

            this.error = ko.observable();

            this.table = {
                style: {
                    maxHeight: '20em',
                    backgroundColor: '#FFF'
                },
                sort: {
                    column: ko.observable('count'),
                    direction: ko.observable('desc')
                },
                columns: [
                    {
                        name: 'realname',
                        label: 'Real name',
                        width: 45,
                        component: {
                            name: UserLinkComponent.name(),
                            // note params interpreted in the context
                            // of the row. So, username, realname are properties on the
                            // row, but true is the true value.
                            // params: {
                            //     username: 'username',
                            //     realname: 'realname',
                            //     newWindow: 'true'
                            // }
                            params: '{username: username, realname: realname, newWindow: true}'
                        },
                        sort: {
                            comparator: (a, b) => {
                                if (a < b) {
                                    return -1;
                                } else if (a > b) {
                                    return 1;
                                }
                                return 0;
                            }
                        }
                    },
                    {
                        name: 'username',
                        label: 'Username',
                        width: 35,
                        sort: {
                            comparator: (a, b) => {
                                if (a < b) {
                                    return -1;
                                } else if (a > b) {
                                    return 1;
                                }
                                return 0;
                            }
                        }
                    },
                    {
                        name: 'count',
                        label: 'Collaborations',
                        width: 20,
                        sort: {
                            comparator: (a, b) => {
                                if (a < b) {
                                    return -1;
                                } else if (a > b) {
                                    return 1;
                                }
                                return 0;
                            }
                        }
                    }
                ]
            };
            this.table.columnMap = this.table.columns.reduce((map, column) => {
                map[column.name] = column;
                return map;
            }, {});

            this._collaborators = ko.observableArray();

            let direction = ko.pureComputed(() => {
                return (this.table.sort.direction() === 'desc' ? -1 : 1);
            });


            this.collaborators = ko.pureComputed(() => {
                return this._collaborators.sorted((a, b) => {
                    let c = this.table.sort.column();
                    let x = direction() * this.table.columnMap[c].sort.comparator(a[c], b[c]);
                    return x;
                });
            });

            this.getCollaborators();
        }

        getCollaborators() {
            this.loading(true);
            this.data.getCollaborators()
                .then((result) => {
                    this._collaborators(result);
                })
                .catch((err) => {
                    console.error(err);
                    this.error(err);
                })
                .finally(() => {
                    this.loading(false);
                });
        }
    }

    return ViewModel;
});

