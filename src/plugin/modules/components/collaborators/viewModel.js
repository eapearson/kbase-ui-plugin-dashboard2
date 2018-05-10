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

            this.narratives = params.narratives;

            this.runtime = context['$root'].runtime;
            this.username = this.runtime.service('session').getUsername();

            this.data = Data.make({
                runtime: this.runtime
            });

            this.loading = params.narrativesLoading;

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

            let direction = ko.pureComputed(() => {
                return (this.table.sort.direction() === 'desc' ? -1 : 1);
            });

            this.collaborators = ko.pureComputed(() => {
                let n = this.narratives();
                if (n.length === 0) {
                    return [];
                }
                let collabs = this.narratives()
                    .filter((narrative) => {
                        return ((narrative.owner !== this.username &&
                                 !narrative.isPublic() &&
                                 narrative.permissions().some((permission) => {
                                     return permission.username === this.username;
                                 })) ||
                                (narrative.owner === this.username));
                    })
                    .reduce((collabs, narrative) => {
                        narrative.permissions().forEach((permission) => {
                            if (!collabs[permission.username]) {
                                collabs[permission.username] = {
                                    username: permission.username,
                                    count: 0,
                                    realname: permission.profile.realname,
                                    profile: permission.profile
                                };
                            }
                            collabs[permission.username].count += 1;
                        });
                        return collabs;
                    }, {});
                let collabs2 = Object.keys(collabs).map((username) => {
                    return collabs[username];
                });
                collabs2.sort((a, b) => {
                    let c = this.table.sort.column();
                    let x = direction() * this.table.columnMap[c].sort.comparator(a[c], b[c]);
                    return x;
                });
                return collabs2;
            });
        }
    }

    return ViewModel;
});

